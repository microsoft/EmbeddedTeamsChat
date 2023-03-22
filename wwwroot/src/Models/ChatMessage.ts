import { Person } from "./Person";

export interface ChatMessage {
    id: string;
    message: string;
    sender: Person;
    threadId: string;
    type: string;
    createdOn: Date;
    editedOn?: Date;
    modifiedOn: Date;
    deletedOn?: Date;
    sendFailed?: boolean;
}