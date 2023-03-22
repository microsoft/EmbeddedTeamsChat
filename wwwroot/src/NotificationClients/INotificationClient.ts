import { ChatMessage } from "../Models/ChatMessage";
import { Mapping } from "../Models/Mapping";
import { Person } from "../Models/Person";
import { Operation } from "../Models/Operation";
import { AuthUtil } from "../Utils/AuthUtil";

export interface INotificationClient {
    graphScopes: () => string[];
    extraScopesToConsent: () => string[];

    // creates the chat container with specified topic and participants and returns threadId
    createChatAsync: (mapping: Mapping, participants: Person[], authUtil: AuthUtil) => Promise<Mapping>;

    addParticipantsAsync: (mapping: Mapping, authUtil: AuthUtil, participantsToAdd: Person[], includeHistory: boolean) => Promise<void>;

    startNotificationsAsync: (mapping: Mapping, authUtil: AuthUtil) => Promise<void>;

    chatNotificationReceived: (listener: (chatMessage: ChatMessage, operation: Operation) => void)=>void;

    participantNotificationReceived: (listener: (person: Person, operation: Operation) => void)=>void;
}