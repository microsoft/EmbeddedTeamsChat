import * as signalR from "@microsoft/signalr";
import { ChatMessage } from "../Models/ChatMessage";
import { Mapping } from "../Models/Mapping";
import { Person } from "../Models/Person";
import { Operation } from "../Models/Operation";
import { AuthUtil } from "../Utils/AuthUtil";
import { ConfigUtil } from "../Utils/ConfigUtil";
import { INotificationClient } from "./INotificationClient";
import { GraphUtil } from "../Utils/GraphUtil";
import { SubscriptionDefinition } from "../Models/SubscriptionDefinition";
import { Alert } from "../Components/Alert";
import { AuthInfo } from "../Models/AuthInfo";

export class GraphNotificationClient implements INotificationClient {
    private chatListener: (chatMessage: ChatMessage, operation: Operation) => void;
    private participantListener: (person: Person, operation: Operation) => void;
    private connection:signalR.HubConnection;
    private ReturnMethods:any = {
        NewMessage: "newMessage",
        SubscriptionCreated: "SubscriptionCreated",
        SubscriptionCreationFailed: "SubscriptionCreationFailed",
        Unauthorized: "Unauthorized"
    };
    
    private authUtil: AuthUtil;
    private alert: Alert;

    private subscriptionsSessionStorageKey: string = "graph-subscriptions";
    private oneSecondInMs = 1000;
    private oneMinuteInMs = 60 * this.oneSecondInMs;
    private renewalInterval: number = -1;

    constructor(alert: Alert) {
        this.alert = alert;
    }

    graphScopes(): string[] {
        return [
            'Chat.ReadWrite',
            'People.Read',
            'User.Read',
            'User.ReadBasic.All'
        ];
    };

    extraScopesToConsent(): string[] {
        return [
            ConfigUtil.GnbPermissionScope
        ];
    };

    async createChatAsync(mapping: Mapping, participants: Person[], authUtil: AuthUtil): Promise<Mapping> {
        // get graph token
        var graphToken = await authUtil.acquireToken(this.graphScopes());

        if (!participants) {
            throw new Error("No participants have been added");
        }

        if (!mapping.threadInfo || !mapping.threadInfo.owner || !mapping.threadInfo.topicName) {
            throw new Error("ThreadInfo is incorrect");
        }
        
        // group creation requires current user to be in group...add if not in participants list
        if (!participants.find(i => i.id == graphToken.uniqueId)) {
            participants.unshift(mapping.threadInfo.owner);
        }

        // create the group chat
        var resp = await GraphUtil.createChat(graphToken.accessToken, mapping.threadInfo.topicName, participants);
        
        if (!resp.id) {
            throw new Error("Encountered an issue creating the chat");
        }
        // update threadId and return the mapping
        mapping.threadInfo.threadId = resp.id;
        return mapping;
    };

    async addParticipantsAsync(mapping: Mapping, authUtil: AuthUtil, addedParticipants: Person[], includeHistory: boolean): Promise<void> {
        // get graph token
        const graphToken = await authUtil.acquireToken(this.graphScopes());

        if (!mapping.threadInfo?.threadId) {
            console.error("Missing threadId");
            return;
        }

        // add the participants via Graph
        await GraphUtil.addGroupChatParticipants(graphToken.accessToken, mapping.threadInfo.threadId, addedParticipants, includeHistory);
    };

    async startNotificationsAsync(mapping: Mapping, authUtil: AuthUtil) {
        let threadId: string = "";
        if (!mapping.threadInfo?.threadId) {
            throw new Error("ThreadId is not set")
        } else {
            threadId = mapping.threadInfo.threadId;
        }

        // get GNB token
        this.authUtil = authUtil;
        var gnbToken = await this.authUtil.acquireToken([ConfigUtil.GnbPermissionScope]);

        // setup the connection to SignalR service
        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(ConfigUtil.GnbEndpoint + "/api", {
                accessTokenFactory: async () => { return gnbToken.accessToken; }
            })
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Information)
            .build();

        // handle reconnects
        this.connection.onreconnected(connectionId => {
            console.log(`Reconnected. ConnectionId: ${this.connection.connectionId}`);
            // TODO: reconnect
        });

        // message received
        this.connection.on(this.ReturnMethods.NewMessage, async (notification) => {

            // decrypt the content
            const response = await fetch(ConfigUtil.GnbEndpoint + "/api/GetChatMessageFromNotification", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${gnbToken.accessToken}`
                },
                body: JSON.stringify(notification.encryptedContent)
            });
            var decryptedResourceData:any = await response.json();

            // get the operation type
            const op:Operation = (notification.changeType == "created") ? Operation.Created 
                : ((notification.changeType == "deleted") ? Operation.Deleted : Operation.Updated);

            // check resource for type
            if (notification.resource.indexOf("members") != -1) {
                // this is a member added/removed event
                const person:Person = {
                    id: decryptedResourceData.userId,
                    displayName: "",
                    photo: ""
                };

                // for added participants, go to Microsoft Graph to get their details
                if (op == Operation.Created) {
                    var graphToken = await this.authUtil.acquireToken(this.graphScopes());
                    const user = await GraphUtil.getPerson(graphToken.accessToken, decryptedResourceData.userId);
                    person.displayName = user.displayName;
                    person.userPrincipalName = user.userPrincipalName;
                }

                // call the participantListener
                if (this.participantListener)
                    this.participantListener(person, op);
            }
            else {
                if (decryptedResourceData.from) {
                    // this is a chat message event
                    var msg:ChatMessage = {
                        id: decryptedResourceData.id,
                        message: decryptedResourceData.body.content,
                        sender: {
                            id: decryptedResourceData.from.user.id,
                            displayName: decryptedResourceData.from.user.displayName,
                            photo: ""
                        },
                        threadId: decryptedResourceData.chatId,
                        type: decryptedResourceData.messageType,
                        //version: "",
                        createdOn: new Date(decryptedResourceData.createdDateTime),
                        modifiedOn: new Date(decryptedResourceData.lastModifiedDateTime),
                        editedOn: (decryptedResourceData.lastEditedDateTime) ?
                            new Date(decryptedResourceData.lastEditedDateTime) : undefined,
                        attachment: (decryptedResourceData.attachments) ?.length > 0 ? 
                            JSON.parse(decryptedResourceData.attachments[0].content) : null
                    }

                    // call the chatListener
                    if (this.chatListener) {
                        this.chatListener(msg, op);
                    }
                }
            }
        });

        // subscription created confirmation
        this.connection.on(this.ReturnMethods.SubscriptionCreated, async (subscriptionRecord: SubscriptionDefinition) => {
            console.log("subscription created");
            this.processSubscription(subscriptionRecord);
        });
        
        // subscription creation failed confirmation
        this.connection.on(this.ReturnMethods.SubscriptionCreationFailed, async (subscriptionDefinition)=> {
            //Something failed when creation the subscription.
            console.log("Creation of subscription failed.");
            console.log(subscriptionDefinition);

            this.alert.show("There was an issue subscribing to notifications... ", {
                content: 'Refresh now',
                callback: async () => {
                    await this.createGraphSubscriptions(threadId, gnbToken);
                },
                dismissAlert: true
            });
        });

        // unauthorized request
        this.connection.on(this.ReturnMethods.Unauthorized, async (message) => {
            // there was an authorized request sent to SignalR
            console.log(message);
        });

        // start the connection
        await this.connection.start();

        // reset session storage
        sessionStorage.setItem(this.subscriptionsSessionStorageKey, JSON.stringify([]));

        await this.createGraphSubscriptions(threadId, gnbToken);
    };

    // This is called to create the graph subscriptions
    // If it fails to create, we will give the user the option to try to create it again
    // It will look to see if both haven't been successfully added to the session
    // storage before creating
    createGraphSubscriptions = async (threadId: string, gnbToken: AuthInfo) => {
        // set subscription definitions
        const messageSubscriptionDefinition = {
            resource: `chats/${threadId}/messages`,
            resourceData: true,
            expirationTime: this.getSubscriptionExpirationTime(),
            changeTypes: ["created", "updated", "deleted"]
        }

        const participantsSubscriptionDefinition = {
            resource: `chats/${threadId}/members`,
            resourceData: true,
            expirationTime: this.getSubscriptionExpirationTime(),
            changeTypes: ["created", "deleted"]
        }

        // get all subscriptions from session storage
        let subscriptionSessions = sessionStorage.getItem(this.subscriptionsSessionStorageKey);
        if (!subscriptionSessions) {
            subscriptionSessions = "[]";
        }
        const sessionSubscriptions: SubscriptionDefinition[] = JSON.parse(subscriptionSessions);

        // find if the new / updated subscription already exists in the session storage
        if (sessionSubscriptions.findIndex((sub) => sub.Resource == messageSubscriptionDefinition.resource) == -1) {
            await this.connection.send("CreateSubscription", messageSubscriptionDefinition, gnbToken.accessToken);
        }

        // Create subscription to chats and participants
        if (sessionSubscriptions.findIndex((sub) => sub.Resource == participantsSubscriptionDefinition.resource) == -1) {
            await this.connection.send("CreateSubscription", participantsSubscriptionDefinition, gnbToken.accessToken);
        }
    }
    
    chatNotificationReceived(listener: (chatMessage: ChatMessage, operation: Operation) => void) {
        this.chatListener = listener;
    };

    participantNotificationReceived(listener: (person: Person, operation: Operation) => void) {
        this.participantListener = listener;
    };

    getSubscriptionExpirationTime = () => {
        // Get the UTC now date
        let expirationDate = new Date();
        // Add Subscription Duration to time in ms
        expirationDate.setTime(expirationDate.getTime() + (ConfigUtil.GnbSubscriptionDuration * this.oneMinuteInMs));
        const time = expirationDate.toISOString();
        console.log("Expiration Time: " + time);
        return time;
    };

    startRenewalTimer = () => {
        // start the renewal timer to check every minute
        this.renewalInterval = setInterval(this.renewalTimer, this.oneMinuteInMs, {});
        console.log(`Start renewal timer. Id: ${this.renewalInterval}`);
    };

    processSubscription = (subscription: SubscriptionDefinition) => {
        // get all subscriptions from session storage
        let subscriptionSessions = sessionStorage.getItem(this.subscriptionsSessionStorageKey);
        if (!subscriptionSessions) {
            subscriptionSessions = "[]";
        }
        const sessionSubscriptions: SubscriptionDefinition[] = JSON.parse(subscriptionSessions);

        // find if the new / updated subscription already exists in the session storage
        const existingSubscriptionIndex = sessionSubscriptions.findIndex((sub) => sub.Resource == subscription.Resource);

        if (existingSubscriptionIndex !== -1) {
            // if it exists, overwrite it.
            sessionSubscriptions[existingSubscriptionIndex] = subscription;
        } else {
            // if it doesn't exist, add it to then end of the array
            sessionSubscriptions.push(subscription);
        }

        // save the subscriptions in session storage
        sessionStorage.setItem(this.subscriptionsSessionStorageKey, JSON.stringify(sessionSubscriptions));
    
        // only start timer once
        if (this.renewalInterval == -1)
            this.startRenewalTimer();
    }

    renewalTimer = async () => {
        console.log("Subscription renewal timer tick");
        // get subscriptions from session storage
        let subscriptionSessions = sessionStorage.getItem(this.subscriptionsSessionStorageKey);
        if (!subscriptionSessions) {
            subscriptionSessions = "[]";
        }
        const subscriptions: SubscriptionDefinition[] = JSON.parse(subscriptionSessions);

        // ensure subscriptions exist
        if (!subscriptions) {
            console.log(`No subscriptions found in session state. Stop renewal timer ${this.renewalInterval}.`);
            clearInterval(this.renewalInterval);
            return;
        }

        // loop through and process subscriptions
        for (const subscription of subscriptions) {
            // get seconds away from subscription expiring
            // Dates are in UTC
            const expirationTime = new Date(subscription.ExpirationTime);
            // create a new date now in UTC
            const now = new Date(new Date().toISOString());
            
            // get difference in seconds
            var diff = Math.round((expirationTime.getTime() - now.getTime()) / this.oneSecondInMs);

            // renew subscription if expiration within 60 seconds
            if (diff <= 60)
            {
                console.log(`Subscription for ${subscription.Resource} is about to expire.`);
                const gnbToken = await this.authUtil.acquireToken([ConfigUtil.GnbPermissionScope]);
                subscription.ExpirationTime = this.getSubscriptionExpirationTime();
                await this.connection.send("CreateSubscription", subscription, gnbToken.accessToken);
            }
        }
    }
}