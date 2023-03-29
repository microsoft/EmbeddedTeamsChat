import { AuthInfo } from "../Models/AuthInfo";
import { EmbeddedChatConfig } from "../Models/EmbeddedChatConfig";
import { INotificationClient } from "../NotificationClients/INotificationClient";
import { Mapping } from "../Models/Mapping";
import { Person } from "../Models/Person";
import { AuthUtil } from "../Utils/AuthUtil";
import { ConfigUtil } from "../Utils/ConfigUtil";
import { GraphUtil } from "../Utils/GraphUtil";
import { mappingUtil } from "../Utils/MappingUtil";
import { PhotoUtil } from "../Utils/PhotoUtil";
import { AddParticipantDialog } from "./AddParticipantDialog";
import { ButtonPage } from "./ButtonPage";
import { Waiting } from "./Waiting";
import { ChatMessage } from "../Models/ChatMessage";
import { Operation } from "../Models/Operation";
import { ChatContainer } from "./ChatContainer";
import { Alert } from "./Alert";
import { AlertAction, AlertHandler } from "../Models/AlertAction";

export class App {
    private waiting: Waiting;
    private graphAuthResult: AuthInfo;
    private photoUtil: PhotoUtil;
    private authUtil: AuthUtil;
    private appComponent: ChatContainer;
    private alert: Alert;

    constructor(alert: Alert) {
        this.waiting = new Waiting();
        this.photoUtil = new PhotoUtil();
        this.alert = alert;

        // add link to css
        // TODO: we might need to check if it already exists for SPAs
        const linkElement = document.createElement("link");
        linkElement.setAttribute("rel", "stylesheet");
        linkElement.setAttribute("type", "text/css");
        linkElement.setAttribute("href", `https://${ConfigUtil.HostDomain}/EmbeddedChat.css`);
        document.head.append(linkElement);
    }

    private onAlert: AlertHandler = (message: string, action?: AlertAction) => {
        this.alert.show(message, action);
    }

    public async renderEmbed(element: Element, config: EmbeddedChatConfig, notificationClient: INotificationClient) {
        // add alert component
        element.prepend(this.alert);
        // add waiting indicator to UI and display it while we authenticate and check for mapping
        element.appendChild(this.waiting);
        this.waiting.show();

        // initialize authUtil
        this.authUtil = new AuthUtil(element, this.waiting, this.alert);
        // initialize the auth iframe
        await this.authUtil.init();

        // log user in and get api access token
        const appAuthResult = await this.authUtil.acquireToken([`${ConfigUtil.ClientId}/.default`]);
        if (appAuthResult == null) throw new Error("Unable to get an access token for the user");

        // get graph access token
        this.graphAuthResult = await this.authUtil.acquireToken(notificationClient.graphScopes());
        if (this.graphAuthResult == null) throw new Error("Unable to graph token for the user");

        // get mapping
        // If it is a new chat a new mapping will be returned
        let mapping: Mapping = await mappingUtil.getMapping(config.entityId, appAuthResult.accessToken);

        // check if new mapping (ie - thread does not exists)
        if (!mapping.threadInfo) {
            // initialize threadInfo
            mapping.threadInfo = {
                topicName: config.topicName,
                owner: {
                    id: appAuthResult.uniqueId,
                    userPrincipalName: appAuthResult.account.username,
                    displayName: appAuthResult.account.name,
                    photo: this.photoUtil.emptyPic
                }
            };
            mapping.disableAddParticipants = config.disableAddParticipants ?? false;

            const startChatCallback = async (participants: Person[]) => {
                this.waiting.show();
                
                // create the chat using the notification source
                mapping = await notificationClient.createChatAsync(mapping, participants, this.authUtil);

                // update the mapping in the database with all the new thread info
                await mappingUtil.updateMapping(mapping, appAuthResult.accessToken);
                mapping.contextCard = config.contextCard;

                if (
                  mapping.threadInfo?.threadId != undefined &&
                  mapping.contextCard != undefined
                ) {
                  const {
                    adaptiveCardMessage,
                  } = require("../Utils/AdaptiveCardUtil");
                  const res = await GraphUtil.sendChatMessage(
                    this.graphAuthResult.accessToken,
                    mapping.threadInfo?.threadId,
                    adaptiveCardMessage(mapping.contextCard),
                    true //flag to send message with adaptive card
                  );
                }

                // remove the add participant dialog
                element.removeChild(dialog);
                
                // remove the button page
                element.removeChild(btn);
                await this.initializeChat(notificationClient, element, mapping, participants, true);
            }

            // create new chat...prompt for participants
            // default participants were not provided
            const dialog: AddParticipantDialog = new AddParticipantDialog(
                this.authUtil,
                this.photoUtil,
                notificationClient.graphScopes(),
                startChatCallback)
            const btn = new ButtonPage("Start Teams Chat", async () => {
                // if starting the chat with default users
                if (config.participants && config.participants.length >= 1) {
                    const participants: Person[] = await GraphUtil.getUsers(this.graphAuthResult.accessToken, config.participants);
                    if (participants.length != config.participants.length) {
                        // 1 or more participants were not found
                        let participantsNotFound = config.participants.filter(function(upn) {
                            return !participants.some(function(user) {
                                return upn == user.userPrincipalName;
                            });
                        });
                        this.alert.show(`Unable to find the following users: ${participantsNotFound.join(', ')}`);
                        if (participants.length == 0) {
                            // if no users were resolved from the userIds provided
                            // Open the add new participant dialog and add users to the chat
                            dialog.show(false);
                            return;
                        }
                    }
                    await startChatCallback(participants);
                }
                else
                    // No default users
                    // Open the add new participant dialog and add users to the chat
                    dialog.show(false);
            });
            this.waiting.hide();
            element.append(dialog);
            element.append(btn);
        } 
        else {
            // check if chat thread already exists for the Entity and requester is member of chat thread.
            if (!mapping.threadInfo.threadId) {
                console.error("ThreadInfo is missing a threadId");
                return;
            }
            const members: Person[] = await GraphUtil.getChatParticipants(this.graphAuthResult.accessToken, mapping.threadInfo.threadId);
            // if the user is not a member of the chat, they should request access
            if (members && !members.find(i => i.id === appAuthResult.uniqueId))
            {
                this.alert.show(`There is at least one other chat for this entity currently in progress.\n Please contact one of the exisiting chat owners: ${mapping.threadInfo.owner.displayName}`, {
                    content: "Refresh now",
                    callback: async () => {
                        window.location.reload();
                    },
                    dismissAlert: true
                });
                this.waiting.hide();
                return;
            }

            await this.initializeChat(notificationClient, element, mapping, members, false);
        }
    }

    private initializeChat = async (notificationClient: INotificationClient, element: Element, mapping: Mapping, participants: Person[], isNew: boolean) => {
        if (!mapping.threadInfo?.threadId) {
            console.error("There was an error in adding the initializeChat");
            return;
        }
        // start the notifications
        await notificationClient.startNotificationsAsync(mapping, this.authUtil);
        var contextCard = mapping.contextCard;
        var messages:ChatMessage[] = [];
        
        if (!isNew) {
            // Load existing messages
            let existingMessages = await GraphUtil.getChatMessages(this.graphAuthResult.accessToken, mapping.threadInfo.threadId);
            existingMessages.forEach((m: any, i: number) => {
                if (m.messageType == "message") {
                    var msg = {
                      id: m.id,
                      type: m.messageType,
                      threadId: m.chatId,
                      message: m.body.content,
                      createdOn: new Date(m.createdDateTime),
                      modifiedOn: new Date(m.lastModifiedDateTime),
                      editedOn: m.lastEditedDateTime
                        ? new Date(m.lastEditedDateTime)
                        : undefined,
                      deletedOn: m.deletedDateTime
                        ? new Date(m.deletedDateTime)
                        : undefined,
                      sender: {
                        id: m.from.user.id,
                        displayName: m.from.user.displayName,
                        photo: this.photoUtil.emptyPic, // we will get profile pics later
                      },
                      attachment:
                        m.attachments?.length > 0 ? m.attachments[0] : null,
                    };
                    // Pull adaptive card from chat history 
                    if (msg.attachment != null)
                      contextCard = JSON.parse(msg.attachment.content);
                    else messages.push(msg);
                }
            });
            
            // sort the messages in order of creation date
            messages = messages.sort((a, b) => a.createdOn.getTime() - b.createdOn.getTime());

            // populate user pics
            participants = await GraphUtil.getUserPics(this.graphAuthResult.accessToken, participants, this.photoUtil);

            // populate pics for existing chats
            for (var i = 0; i < messages.length; i++) {
                const photo = await this.photoUtil.getGraphPhotoAsync(this.graphAuthResult.accessToken, messages[i].sender.id);
                messages[i].sender.photo = photo
            }
        }
        else{
            if(mapping.contextCard !== undefined)
            contextCard = JSON.parse(mapping.contextCard);
        }

        // insert the appComponent
        this.appComponent = new ChatContainer(notificationClient, messages, mapping, participants, this.authUtil, this.photoUtil, this.waiting, this.onAlert, contextCard);
        element.appendChild(this.appComponent);

        // hide waiting indiator
        this.waiting.hide();

         // listen for notifications
         notificationClient.chatNotificationReceived((chatMessage:ChatMessage, operation:Operation) => {
            this.appComponent.messageReceived(chatMessage, operation);
        });
        notificationClient.participantNotificationReceived((participant:Person, operation:Operation) => {
            this.appComponent.participantsChanged(participant, operation);
        });
    };
}