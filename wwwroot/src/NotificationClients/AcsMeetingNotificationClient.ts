import { ChatClient } from "@azure/communication-chat";
import { AzureCommunicationTokenCredential } from "@azure/communication-common";
import { CallClient } from "@azure/communication-calling";
import { ConfigUtil } from "../Utils/ConfigUtil";
import { ChatMessage } from "../Models/ChatMessage";
import { Person } from "../Models/Person";
import { INotificationClient } from "./INotificationClient";
import { AcsInfo, Mapping } from "../Models/Mapping";
import { AuthUtil } from "../Utils/AuthUtil";
import { acsUtil } from "../Utils/AcsUtil";
import { Operation } from "../Models/Operation";
import { AuthInfo } from "../Models/AuthInfo";
import { GraphUtil } from "../Utils/GraphUtil";
import { mappingUtil } from "../Utils/MappingUtil";
import { Alert } from "../Components/Alert";

export class AcsMeetingNotificationClient implements INotificationClient {
  private chatListener: (
    chatMessage: ChatMessage,
    operation: Operation
  ) => void;
  private participantListener: (person: Person, operation: Operation) => void;
  private creds?: AzureCommunicationTokenCredential;
  private chatClient?: ChatClient;
  private appAuthResult?: AuthInfo;
  private authUtil: AuthUtil;
  private alert: Alert;

  constructor(alert: Alert) {
    this.alert = alert;
  }

  graphScopes(): string[] {
    return [
      'Chat.ReadWrite',
      'People.Read',
      'User.Read',
      'User.ReadBasic.All',
      'OnlineMeetings.ReadWrite'
    ];
  }

  extraScopesToConsent(): string[] {
    return [
        'https://auth.msft.communication.azure.com/Teams.ManageCalls',
        'https://auth.msft.communication.azure.com/Teams.ManageChats'
    ];
  };

  async createChatAsync(mapping: Mapping, participants: Person[], authUtil: AuthUtil): Promise<Mapping> {
    var graphToken = await authUtil.acquireToken(this.graphScopes());

    if (!participants) {
      throw new Error("No participants have been added");
    }

    if (
      !mapping.threadInfo ||
      !mapping.threadInfo.owner ||
      !mapping.threadInfo.topicName
    ) {
      throw new Error("ThreadInfo is incorrect");
    }

    // group creation requires current user to be in group...add if not in participants list
    if (!participants.find((i) => i.id === graphToken.uniqueId))
      participants.unshift(mapping.threadInfo.owner);

    this.appAuthResult = await authUtil.acquireToken(
      [`api://${ConfigUtil.ClientId}/access_as_user`]
    );

    // create online meeting
    console.log("Creating Online Meeting in Backend");
    var resp = await GraphUtil.createMeeting(
      this.appAuthResult.accessToken,
      mapping,
      participants
    );

    // update threadId and return the mapping
    mapping.threadInfo.joinUrl = resp.joinUrl;
    mapping.threadInfo.meetingId = resp.meetingId;
    mapping.threadInfo.threadId = resp.threadId;
    return mapping;
  }

  async startNotificationsAsync(mapping: Mapping, authUtil: AuthUtil) {
    // Joining the meeting from the client
    console.log("Joining the Teams meeting...");

    // initialize authUtil
    this.authUtil = authUtil;
    this.appAuthResult = await authUtil.acquireToken(
      [`api://${ConfigUtil.ClientId}/access_as_user`]
    );
    const acsUserInfo: AcsInfo = await acsUtil.getAcsToken(this.appAuthResult.accessToken);

    //Update mapping
    await mappingUtil.updateMapping(mapping, this.appAuthResult.accessToken);
    const ccreds = new AzureCommunicationTokenCredential(
      acsUserInfo.commIdentityToken
    );
    const callTeamsClient = new CallClient({});
    const callTeamsAgent = await callTeamsClient.createCallAgent(ccreds);

    if (!mapping.threadInfo?.joinUrl) {
      throw new Error("joinUrl is incorrect");
    }

    const locator = { meetingLink: mapping.threadInfo.joinUrl };

    const teamsMeetingCall = callTeamsAgent.join(locator);
    console.log(
      `User is joining teams Meeting call Id: ${teamsMeetingCall.id}`
    );
    // Create a device manager to set up video and audio settings
    const userDeviceManager = await callTeamsClient.getDeviceManager();
    //Prompt a user to grant camera and/or microphone permissions, more info can be found
    //https://docs.microsoft.com/en-us/azure/communication-services/how-tos/calling-sdk/manage-video?pivots=platform-web
    const deviceResult = await userDeviceManager.askDevicePermission({
      audio: false,
      video: true,
    });
    //This resolves with an object that indicates whether audio and video permissions were granted
    console.log(`Audio Enabled: ${deviceResult.audio}`);
    console.log(`Video Enabled: ${deviceResult.video}`);

    // initialize the ACS Client
    console.log("Initializing ACS Client...");
    this.creds = new AzureCommunicationTokenCredential(
      acsUserInfo.acsToken
    );
    this.chatClient = new ChatClient(ConfigUtil.AcsEndpoint, this.creds);
    //this.chatClient = new ChatClient(ConfigUtil.ACS_ENDPOINT, ccreds);

    // Create a call client
    const callClient = new CallClient({});

    // establish the call
    const callAgent = await callClient.createCallAgent(this.creds, {
      displayName: ConfigUtil.AcsGuestAccountName,
    });
    const meetingCall = callAgent.join(locator);

    // start the realtime notifications
    console.log("Start listening to realtime ACS Notifications");
    await this.chatClient.startRealtimeNotifications();

    // listen for events
    this.chatClient.on("chatMessageReceived", async (e: any) => {
        var msg: ChatMessage = {
        id: e.id,
        message: e.message,
        sender: {
          id: e.sender.microsoftTeamsUserId,
          displayName: e.senderDisplayName,
          photo: "",
        },
        threadId: e.threadId,
        type: e.type,
        //version: "",
        createdOn: e.createdOn,
        modifiedOn: e.createdOn,
        attachment: e.attachments?.length > 0 ? JSON.parse(e.attachments[0].content) : null
      };
      if (this.chatListener) this.chatListener(msg, Operation.Created);
    });

    this.chatClient.on("chatMessageEdited", async (e: any) => {
      if (this.chatListener) this.chatListener(e, Operation.Updated);
    });

    this.chatClient.on("chatMessageDeleted", async (e: any) => {
      if (this.chatListener) this.chatListener(e, Operation.Deleted);
    });

    this.chatClient.on("participantsAdded", async (e: any) => {
      console.log(`participantAdded event received.`);

      if (e.participantsAdded[0].id.kind == "microsoftTeamsUser") {
        var graphToken = await this.authUtil.acquireToken(
          this.graphScopes()
        );
        const user = await GraphUtil.getPerson(
          graphToken.accessToken,
          e.participantsAdded[0].id.microsoftTeamsUserId
        );

        const person: Person = {
          id: e.participantsAdded[0].id.microsoftTeamsUserId,
          displayName: user.displayName,
          photo: "",
        };
        if (this.participantListener)
          this.participantListener(person, Operation.Created);
      }
      console.log(`participantAdded successfully.`);
    });

    this.chatClient.on("participantsRemoved", async (e: any) => {
      console.log("participantsRemoved  event received.");

      if (e.participantsRemoved[0].id.kind == "microsoftTeamsUser") {
        var graphToken = await this.authUtil.acquireToken(
          this.graphScopes()
        );
        const user = await GraphUtil.getPerson(
          graphToken.accessToken,
          e.participantsRemoved[0].id.microsoftTeamsUserId
        );

        const person: Person = {
          id: e.participantsRemoved[0].id.microsoftTeamsUserId,
          displayName: user.displayName,
          photo: "",
        };
        if (this.participantListener)
          this.participantListener(person, Operation.Deleted);
      }
      console.log(`participantsRemoved successfully.`);
    });
  }

  chatNotificationReceived(
    listener: (chatMessage: ChatMessage, operation: Operation) => void
  ) {
    this.chatListener = listener;
  }

  participantNotificationReceived(
    listener: (person: Person, operation: Operation) => void
  ) {
    this.participantListener = listener;
  }

  async addParticipantsAsync(
    mapping: Mapping,
    authUtil: AuthUtil,
    addedParticipants: Person[],
    includeHistory: boolean
  ) {
    // get graph token
    const graphToken = await authUtil.acquireToken(this.graphScopes());

    //ToDo: Update mapping for participant added from teams clent
    if (!mapping.threadInfo?.threadId) {
      throw new Error("ThreadInfo is incorrect");
    }

    // add the participants via Graph
    await GraphUtil.addGroupChatParticipants(
      graphToken.accessToken,
      mapping.threadInfo.threadId,
      addedParticipants,
      includeHistory
    );
  }
}
