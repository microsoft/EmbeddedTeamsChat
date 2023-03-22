import { PhotoUtil } from "../Utils/PhotoUtil";
import { AuthInfo } from "../Models/AuthInfo";
import { AddParticipantDialog } from "./AddParticipantDialog";
import { Person } from "../Models/Person";
import { ParticipantList } from "./ParticipantList";
import { ChatMessage } from "../Models/ChatMessage";
import { ChatItem } from "./ChatItem";
import { PeopleItem } from "./PeopleItem";
import { GraphUtil } from "../Utils/GraphUtil";
import { Mapping } from "../Models/Mapping";
import { Operation } from "../Models/Operation";
import { AuthUtil } from "../Utils/AuthUtil";
import { INotificationClient } from "../NotificationClients/INotificationClient";
import { Waiting } from "./Waiting";
import { StatusIcon } from "./StatusIcon";
import { AlertHandler } from "../Models/AlertAction";

const template = document.createElement("template");
template.innerHTML = `
    <div class="teams-embed-container">
        <div class="teams-embed-header">
            <div class="teams-embed-header-text">
                <h2></h2>
            </div>
            <div class="teams-embed-header-participants">
                <button class="teams-embed-header-participants-button">
                    <div class="teams-embed-header-participants-icon">
                        <svg viewBox="-6 -6 32 32" role="presentation" class="app-svg icons-team-operation icons-team-create" focusable="false">
                            <g class="icons-default-fill icons-filled"><path d="M11 10C11.1035 10 11.2052 10.0079 11.3045 10.023C9.90933 11.0206 9 12.6541 9 14.5C9 15.3244 9.1814 16.1065 9.50646 16.8085C8.90367 16.9334 8.23233 17 7.5 17C4.08805 17 2 15.5544 2 13.5V12C2 10.8954 2.89543 10 4 10H11Z"></path><path d="M17 6.5C17 7.88071 15.8807 9 14.5 9C13.1193 9 12 7.88071 12 6.5C12 5.11929 13.1193 4 14.5 4C15.8807 4 17 5.11929 17 6.5Z"></path><path d="M7.5 2C9.433 2 11 3.567 11 5.5C11 7.433 9.433 9 7.5 9C5.567 9 4 7.433 4 5.5C4 3.567 5.567 2 7.5 2Z"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M19 14.5C19 16.9853 16.9853 19 14.5 19C12.0147 19 10 16.9853 10 14.5C10 12.0147 12.0147 10 14.5 10C16.9853 10 19 12.0147 19 14.5ZM15 12.5C15 12.2239 14.7761 12 14.5 12C14.2239 12 14 12.2239 14 12.5V14H12.5C12.2239 14 12 14.2239 12 14.5C12 14.7761 12.2239 15 12.5 15H14V16.5C14 16.7761 14.2239 17 14.5 17C14.7761 17 15 16.7761 15 16.5V15H16.5C16.7761 15 17 14.7761 17 14.5C17 14.2239 16.7761 14 16.5 14H15V12.5Z"></path></g>
                            <g class="icons-default-fill icons-unfilled"><path d="M11 10C11.1035 10 11.2052 10.0079 11.3045 10.023C10.9143 10.302 10.5621 10.6308 10.2572 11H4C3.44772 11 3 11.4477 3 12V13.5C3 14.9071 4.57862 16 7.5 16C8.11725 16 8.67455 15.9512 9.16969 15.861C9.25335 16.1896 9.36661 16.5065 9.50646 16.8085C8.90367 16.9334 8.23233 17 7.5 17C4.08805 17 2 15.5544 2 13.5V12C2 10.8954 2.89543 10 4 10H11Z"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M17 6.5C17 7.88071 15.8807 9 14.5 9C13.1193 9 12 7.88071 12 6.5C12 5.11929 13.1193 4 14.5 4C15.8807 4 17 5.11929 17 6.5ZM14.5 5C13.6716 5 13 5.67157 13 6.5C13 7.32843 13.6716 8 14.5 8C15.3284 8 16 7.32843 16 6.5C16 5.67157 15.3284 5 14.5 5Z"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M7.5 2C9.433 2 11 3.567 11 5.5C11 7.433 9.433 9 7.5 9C5.567 9 4 7.433 4 5.5C4 3.567 5.567 2 7.5 2ZM7.5 3C6.11929 3 5 4.11929 5 5.5C5 6.88071 6.11929 8 7.5 8C8.88071 8 10 6.88071 10 5.5C10 4.11929 8.88071 3 7.5 3Z"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M19 14.5C19 16.9853 16.9853 19 14.5 19C12.0147 19 10 16.9853 10 14.5C10 12.0147 12.0147 10 14.5 10C16.9853 10 19 12.0147 19 14.5ZM15 12.5C15 12.2239 14.7761 12 14.5 12C14.2239 12 14 12.2239 14 12.5V14H12.5C12.2239 14 12 14.2239 12 14.5C12 14.7761 12.2239 15 12.5 15H14V16.5C14 16.7761 14.2239 17 14.5 17C14.7761 17 15 16.7761 15 16.5V15H16.5C16.7761 15 17 14.7761 17 14.5C17 14.2239 16.7761 14 16.5 14H15V12.5Z"></path></g>
                        </svg>
                    </div>
                    <span class="teams-embed-header-participants-count"></span>
                </button>
            </div>
        </div>
        <div class="teams-embed-chat">
            <div class="teams-embed-chat-container">
                <ul class="teams-embed-chat-items">
                </ul>
            </div>
        </div>
        <div class="teams-embed-footer">
            <div class="teams-embed-input-mention-container" style="display: none">
            </div>
            <div class="teams-embed-footer-container">
                <div class="teams-embed-footer-error"></div>
                <div class="teams-embed-footer-input" contentEditable="true"></div>
                <div class="teams-embed-footer-actions">
                    <button class="teams-embed-footer-send-message-button">
                        <div>
                            <span>
                                <svg focusable="false" viewBox="2 2 16 16" class="teams-embed-send-icon">
                                    <g>
                                        <path class="icons-unfilled"
                                            d="M2.72113 2.05149L18.0756 9.61746C18.3233 9.73952 18.4252 10.0393 18.3031 10.287C18.2544 10.3858 18.1744 10.4658 18.0756 10.5145L2.72144 18.0803C2.47374 18.2023 2.17399 18.1005 2.05193 17.8528C1.99856 17.7445 1.98619 17.6205 2.0171 17.5038L3.9858 10.0701L2.01676 2.62789C1.94612 2.36093 2.10528 2.08726 2.37224 2.01663C2.48893 1.98576 2.61285 1.99814 2.72113 2.05149ZM3.26445 3.43403L4.87357 9.51612L4.93555 9.50412L5 9.5H12C12.2761 9.5 12.5 9.72386 12.5 10C12.5 10.2455 12.3231 10.4496 12.0899 10.4919L12 10.5H5C4.9686 10.5 4.93787 10.4971 4.90807 10.4916L3.26508 16.6976L16.7234 10.066L3.26445 3.43403Z">
                                        </path>
                                        <path class="icons-filled"
                                            d="M2.72113 2.05149L18.0756 9.61746C18.3233 9.73952 18.4252 10.0393 18.3031 10.287C18.2544 10.3858 18.1744 10.4658 18.0756 10.5145L2.72144 18.0803C2.47374 18.2023 2.17399 18.1005 2.05193 17.8528C1.99856 17.7445 1.98619 17.6205 2.0171 17.5038L3.53835 11.7591C3.58866 11.5691 3.7456 11.4262 3.93946 11.3939L10.8204 10.2466C10.9047 10.2325 10.9744 10.1769 11.0079 10.1012L11.0259 10.0411C11.0454 9.92436 10.9805 9.81305 10.8759 9.76934L10.8204 9.7534L3.90061 8.6001C3.70668 8.56778 3.54969 8.4248 3.49942 8.23473L2.01676 2.62789C1.94612 2.36093 2.10528 2.08726 2.37224 2.01663C2.48893 1.98576 2.61285 1.99814 2.72113 2.05149Z">
                                        </path>
                                    </g>
                                </svg>
                            </span>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    </div>`;

export class ChatContainer extends HTMLElement {
    private waiting: Waiting
    private chatTitle: string;
    private authUtil: AuthUtil;
    private photoUtil: PhotoUtil;
    private dialog: AddParticipantDialog;
    private messages: ChatMessage[];
    private mentionResults: Person[];
    private participants: Person[];
    private participantList?: ParticipantList;
    private mentionInput: string;
    private mapping: Mapping;
    private notificationClient:INotificationClient;
    private alertHandler: AlertHandler;

    constructor(notificationClient: INotificationClient, messages: ChatMessage[], mapping: Mapping, participants: Person[], authUtil: AuthUtil, photoUtil: PhotoUtil, waiting:Waiting, alertHandler: AlertHandler) {
        super();
        this.waiting = waiting;
        this.chatTitle = mapping.threadInfo?.topicName ?? "";
        this.authUtil = authUtil;
        this.photoUtil = photoUtil;
        this.dialog = new AddParticipantDialog(this.authUtil, this.photoUtil, notificationClient.graphScopes(), this.participantsAdded);
        this.messages = messages;
        this.mentionResults = [];
        this.mentionInput = "";
        this.participants = participants;
        this.mapping = mapping;
        this.notificationClient = notificationClient;
        this.alertHandler = alertHandler;
        this.render();
    }

    participantsAdded = async (participantsToAdd: Person[], includeHistory: boolean) => {
        this.waiting.show();

        if (!this.participantList) {
            throw new Error("Missing participantList");
        }
        
        try {
            // add the participant(s) to chat using the notificationClient
            await this.notificationClient.addParticipantsAsync(this.mapping, this.authUtil, participantsToAdd, includeHistory);
            // we update the UI once we receive the notification that the user was added from the notification source

            for (let i = 0; i < participantsToAdd.length; i++) {
                const participant = participantsToAdd[i];
                await this.participantsChanged(participant, Operation.Created);
            }
            this.waiting.hide();
        } catch (error) {
            console.error(error);
        }
    };

    messageReceived = async (message: ChatMessage, operation: Operation) => {
        // Get the auth token for the graph api
        const authInfo = await this.authUtil.acquireToken(this.notificationClient.graphScopes());

        // determine if the message is new or not, then process accordingly
        var existing = this.messages.find(i => i.id == message.id);
        if (!existing) {
            // incoming message is new
            // find message that is newer then incoming message
            const insertBeforeIndex = this.messages.findIndex(i => i.createdOn > message.createdOn);
            if (insertBeforeIndex > -1) {
                // a newer message exist, render the incoming message just before newer message in chat list
                this.renderMessage(message, authInfo, this.messages[insertBeforeIndex]);
                // splice incoming message just before newer message in message list
                this.messages.splice(insertBeforeIndex, 0, message);
            } else {
                // incoming message is newest. Render at end of chat list
                this.renderMessage(message, authInfo);

                if (message.sender.id == authInfo.uniqueId && !message.sendFailed) {
                    // a new message was added at the bottom for the current user
                    // find all current user's messages that haven't been deleted and haven't failed
                    const currentUserMessages = this.messages.filter(i => i.sender.id === authInfo.uniqueId && !i.deletedOn && !i.sendFailed);
                    // get the last sent message for the user
                    const lastCurrentUserMessage = currentUserMessages.at(-1);
                    this.renderUserSentIcon(message.id, lastCurrentUserMessage?.id);
                }

                // incoming message is newest. Push it to end of message list
                this.messages.push(message);
            }
            await this.renderUserImage(message.sender.id, authInfo);
        }
        if (existing && operation == Operation.Updated) {
            // Update message
            const chatItems = <HTMLElement>this.querySelector(".teams-embed-chat-items");
            const updateItem = (<ChatItem>chatItems.querySelector(`[id="${message.id}"]`));
            (<HTMLElement>updateItem.querySelector(".teams-embed-chat-message-content")).innerHTML = message.message;
            (<HTMLElement>updateItem.querySelector(".teams-embed-chat-message-timestamp")).innerText = 
                `${message.createdOn.toLocaleString()} ${(!message.deletedOn && message.editedOn) ? "Edited" : ""}`;
            // TODO do we need to update the message list?
        }
        else if (existing && operation == Operation.Deleted) {
            // Delete the message...update to show "message deleted"
            const chatItems = <HTMLElement>this.querySelector(".teams-embed-chat-items");
            const deleteItem = (<ChatItem>chatItems.querySelector(`[id="${message.id}"]`));
            (<HTMLElement>deleteItem.querySelector(".teams-embed-chat-message-timestamp")).innerText = '';
            (<HTMLElement>deleteItem.querySelector(".teams-embed-chat-message-content")).innerHTML = "<p style='font-style: italic'>This message has been deleted</p>";
            (<HTMLElement>deleteItem.querySelector(".teams-embed-chat-message-send-status")).classList.remove("show");
            
            // delete the message from the internal array
            const messageIdx = this.messages.findIndex(i => i.id == message.id);
            if (messageIdx) {
                this.messages.splice(messageIdx, 1);
            }

            if (message.sender.id == authInfo.uniqueId) {
                // the user deleted their message

                // find all current user's messages that haven't been deleted
                const currentUserMessages = this.messages.filter(i => i.sender.id === authInfo.uniqueId && !i.deletedOn && !i.sendFailed);
                // get the last sent message for the user
                const lastCurrentUserMessage = currentUserMessages.at(-1);
                if (lastCurrentUserMessage) {
                    this.renderUserSentIcon(lastCurrentUserMessage.id, message.id);
                }
            }
        }
    };

    participantsChanged = async (person: Person, operation: Operation) => {
        if (!this.participantList) {
            throw new Error("Missing participantList");
        }

        if (operation == Operation.Created) {
            // add participant to appropriate lists if it hasn't already been added
            const index = this.participants.findIndex(i => i.id == person.id);
            if (index == -1) {
                // add person to participant list
                const authInfo = await this.authUtil.acquireToken(this.notificationClient.graphScopes());
                person.photo = this.photoUtil.emptyPic;
                person.photo = await this.photoUtil.getGraphPhotoAsync(authInfo.accessToken, person.id);
            
                // add to lists
                this.participants.push(person);
                this.participantList.addPerson(person);
            }
        }
        else if (operation == Operation.Deleted) {
            // remove person from participant list
            const index = this.participants.findIndex(i => i.id == person.id);
            if (index != -1) {
                this.participants.splice(index, 1);
            }

            // call the personDeleted on participantList
            this.participantList.removePerson(person);
        }

        // set participant count in header
        (<HTMLElement>this.querySelector(".teams-embed-header-participants-count")).innerHTML =
            this.participants.length.toString();
    };

    renderMessage = (message: ChatMessage, authInfo:AuthInfo, insertBeforeMessage?: ChatMessage) => {
        const chatItems = <HTMLElement>this.querySelector(".teams-embed-chat-items");

        // Create new chat item
        const incomingChatItem: ChatItem = new ChatItem(message, message.sender.id === authInfo.uniqueId);

        if (!insertBeforeMessage) {
            // Incoming message is newest message. Add at end of chats
            chatItems.appendChild(incomingChatItem);
        } else {
            // The insertBeforeMessage is first newer message. Add incoming message before it.
            const newerChatItem = document.getElementById(insertBeforeMessage.id);
            if (newerChatItem) {
                // Insert incoming message at correct location. Because a incoming message is inserted
                // before first newer message, messages can come in in any order
                chatItems.insertBefore(incomingChatItem, newerChatItem.parentNode);
            } else {
                // The insertBeforeMessage was not found. Add incoming Message at the end
                chatItems.appendChild(incomingChatItem);
            }
        }

        const chatContainer = <HTMLElement>this.querySelector(".teams-embed-chat");
        // scroll to bottom of chat
        chatContainer.scrollTop = chatContainer.scrollHeight;
    };

    renderUserSentIcon = (messageIdToAddIcon: string, messageIdToRemoveIcon?: string) => {
        const chatItems = <HTMLElement>this.querySelector(".teams-embed-chat-items");
        const updateItem = (<ChatItem>chatItems.querySelector(`[id="${messageIdToAddIcon}"]`));
        (<HTMLElement>updateItem.querySelector(".teams-embed-chat-message-send-status")).appendChild(new StatusIcon(true));
        (<HTMLElement>updateItem.querySelector(".teams-embed-chat-message-send-status")).classList.add("show");
        (<HTMLElement>updateItem.querySelector(".tooltiptext")).innerText = "Sent";

        if (messageIdToRemoveIcon) {
            const deleteItem = (<ChatItem>chatItems.querySelector(`[id="${messageIdToRemoveIcon}"]`));
            (<HTMLElement>deleteItem.querySelector(".teams-embed-chat-message-send-status")).classList.remove("show");
        }
    }

    renderUserImage = async (id: string, authInfo:AuthInfo) => {
        if (authInfo.uniqueId == id) return;
        await this.photoUtil.getGraphPhotoAsync(authInfo.accessToken, id).then((pic: string) => {
            const userMessages = document.getElementsByClassName(id);
            for (let i = 0; i < userMessages.length; i++) {
                const element = userMessages[i];
                (<HTMLImageElement>element.querySelector(".teams-embed-avatar-image")).src = pic;
            }
        });
    };

    mentionSelected = (selectedIndex: number) => {
        const selectedUser = this.mentionResults[selectedIndex];
        const input = <HTMLElement>document.querySelector(".teams-embed-footer-input");
        const atMentionHtml = `<readonly class="teams-embed-mention-user" contenteditable="false" userId="${selectedUser.id}">${selectedUser.displayName}</readonly>&ZeroWidthSpace;`;
        
        const lastIndexofMention = input.innerHTML.lastIndexOf("@" + this.mentionInput);
        const mentionName = input.innerHTML.substring(lastIndexofMention,lastIndexofMention + this.mentionInput.length + 2);
        input.innerHTML = input.innerHTML.replace(mentionName, atMentionHtml);

        // close mention dialog and clear results
        const mentionContainer = <HTMLElement>document.querySelector(".teams-embed-input-mention-container");
        mentionContainer.style.display = "none";
        this.mentionResults = [];

        //Get focus back on input area
        input.focus();
        window.getSelection()?.selectAllChildren(input);
        window.getSelection()?.collapseToEnd();
    };

    populateMentionContainer = (results: Person[]) => {
        const mentionContainer = <HTMLElement>document.querySelector(".teams-embed-input-mention-container");
        mentionContainer.innerHTML = "";
        this.mentionResults = [];
        results.forEach((person: Person, i: number) => {
            this.mentionResults.push(person);
            const peopleItem = new PeopleItem(person, i, this.mentionSelected.bind(this, i));
            mentionContainer.appendChild(peopleItem);
        });

        mentionContainer.style.display = "block";
    };

    clearMentionContainer = () => {
        this.mentionResults = [];
        (<HTMLElement>document.querySelector(".teams-embed-input-mention-container")).style.display = "none";
    };

    createAtMention = (evt: KeyboardEvent, currentUserId : string) => {
        // close mention results window if hit escape
        if (evt.key == "Escape") {
            this.clearMentionContainer();
            return;
        }

        const sel: any = window.getSelection();
        // if not input return
        if (sel.anchorNode.nodeValue == null) {
            this.clearMentionContainer();
            return;
        }

        let results: Person[] = [];

        // if the last character is '@', load the full participant list
        if (sel.anchorNode.nodeValue[sel.focusOffset - 1] === "@") {
            results = this.participants.filter((x) => x.id !== currentUserId);
            this.populateMentionContainer(results);
        } else {
            // get the text from the start of the node up to the cursor focus
            const inputToFocus = sel.anchorNode.nodeValue.substring(0, sel.focusOffset);
            // get the last index of '@', there could be multiple @
            const atIndex = inputToFocus.lastIndexOf("@") + 1;
            if (atIndex == 0) {
                this.clearMentionContainer();
                return;
            }

            this.mentionInput = inputToFocus.substring(atIndex, sel.focusOffset).toLowerCase().trimEnd();

            const results: Person[] = [];
            // filter
            for (let i = 0; i < this.participants.length; i++) {
                const participant: Person = this.participants[i];
                if (this.participants[i].displayName.toLowerCase().indexOf(this.mentionInput) > -1
                    && participant.id !== currentUserId) {
                    results.push(this.participants[i]);
                }
            }

            if (results.length == 0) {
                this.clearMentionContainer();
                return;
            }
            this.populateMentionContainer(results);
        }
    };

    sendMessage = async (messageHtml: string) => {
        if (messageHtml.trim() === "") return;

        if (!this.mapping.threadInfo?.threadId) {
            throw new Error("Missing threadId");
        }

        // call graph to get matches
        const authInfo = await this.authUtil.acquireToken(this.notificationClient.graphScopes());
        const res = await GraphUtil.sendChatMessage(
            authInfo.accessToken,
            this.mapping.threadInfo.threadId,
            messageHtml
        );

        if (!res) {
            // Add failed message to the chat with error message and random id
            console.error("Failed to send Chat Message");
            const msg: ChatMessage = {
            id: Math.random().toString().substring(2,8),
            message: messageHtml,
            sender: {
                id: authInfo.uniqueId,
                displayName: "",
                photo: this.photoUtil.emptyPic
            },
            threadId: this.mapping.threadInfo.threadId,
            type: "message",
            createdOn: new Date(),
            modifiedOn: new Date(),
            sendFailed: true
            };
            await this.messageReceived(msg, Operation.Created);
        } else {
            // add the chat message to the messages list
            const msg: ChatMessage = {
            id: res.id,
            message: res.body.content,
            sender: {
                id: res.from.user.id,
                displayName: res.from.user.displayName,
                photo: this.photoUtil.emptyPic
            },
            threadId: this.mapping.threadInfo.threadId,
            type: res.messageType,
            createdOn: new Date(res.createdDateTime),
            modifiedOn: new Date(res.lastModifiedDateTime)
            };
            await this.messageReceived(msg, Operation.Created);
        }
    };

    render = async () => {
        // get the template
        const dom = <HTMLElement>template.content.cloneNode(true);

        // set chat title
        (<HTMLElement>dom.querySelector(".teams-embed-header-text")).innerHTML = `<h2>${this.chatTitle}</h2>`;

        if (!this.participants) {
            throw new Error("participants missing");
        }

        // set participant count in header
        (<HTMLElement>dom.querySelector(".teams-embed-header-participants-count")).innerHTML =
            this.participants.length.toString();

        // List of participants shown in the top right of the control
        this.participantList = new ParticipantList(this.participants, this.mapping.disableAddParticipants, () => {
            if (this.participantList) {
                this.participantList.hide();
            }
            this.dialog.show(true);
        });
        (<HTMLElement>dom.querySelector(".teams-embed-container")).appendChild(this.participantList);

        // add the add participant dialog
        (<HTMLElement>dom.querySelector(".teams-embed-container")).appendChild(this.dialog);

        // wire even to toggle participant list
        (<HTMLElement>dom.querySelector(".teams-embed-header-participants-button")).addEventListener("click", () => {
            if (this.participantList) this.participantList.toggle();
        });

        // wire event to sent message
        (<HTMLElement>dom.querySelector(".teams-embed-footer-send-message-button")).addEventListener("click", () => {
            var input = <HTMLElement>document.querySelector(".teams-embed-footer-input");
            const messageHtml = input.innerHTML;
            // make sure there is text and not empty html tags
            if (input.textContent?.trim() === "") return;
            // set the input back to empty
            input.innerHTML = "";
            this.sendMessage(messageHtml);
        });

        // wire event to send message on ENTER
        (<HTMLElement>dom.querySelector(".teams-embed-footer-input")).addEventListener("keydown", (e) => {
            if (e.key == "Enter" && !e.shiftKey) {
                // the Enter button was pressed to send the message
                // get the message before preventDefault
                const input = <HTMLElement>document.querySelector(".teams-embed-footer-input");
                const messageHtml = input.innerHTML;
                e.preventDefault();
                e.stopPropagation();
                // make sure there is text and not empty html tags
                if (input.textContent?.trim() === "") return;
                // set the input back to empty
                input.innerHTML = "";
                this.sendMessage(messageHtml);
                return;
            }

            // handle at mention
            this.createAtMention(e, authInfo.uniqueId);
        });

        this.appendChild(dom);

        // render all messages
        const authInfo = await this.authUtil.acquireToken(this.notificationClient.graphScopes());
        this.messages.map((message) => {
            this.renderMessage(message, authInfo);
        });

        // find all current user's messages that haven't been deleted
        const currentUserMessages = this.messages.filter(i => i.sender.id === authInfo.uniqueId && !i.deletedOn);
        // update last sent message to have icon
        const lastCurrentUserMessage = currentUserMessages.at(-1);
        if (lastCurrentUserMessage) {
            this.renderUserSentIcon(lastCurrentUserMessage.id);
        }

        // hides the add participant dialog and the participant list 
        // if either one is open and the user presses the escape button
        document.onkeydown = (e) => {
            if (e.key == "Escape") {
                if ((<HTMLElement>this.querySelector(".teams-embed-peoplepicker-suggestions")).style.display == "block") {
                    return;
                }

                if ((<HTMLElement>this.querySelector(".teams-embed-add-participant-dialog")).style.display == "block")
                    this.dialog.hide();

                if ((<HTMLElement>this.querySelector(".teams-embed-participant-container")).style.display == "flex")
                    this.participantList?.hide();
            }
        };
    };
}

customElements.get("chat-container") || customElements.define("chat-container", ChatContainer);