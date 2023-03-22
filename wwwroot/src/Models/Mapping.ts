import { Person } from "./Person";

export interface Mapping {
    entityId: string;
    disableAddParticipants: boolean;
    threadInfo?: ThreadInfo; 
}

export interface ThreadInfo {
    threadId?: string;
    topicName?: string;
    meetingId?: string;
    joinUrl?: string;
    owner: Person;
}

export interface AcsInfo {
    acsUserId: string;
    acsToken: string;
    tokenExpiresOn: string;
    commIdentityToken: string;
}