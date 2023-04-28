import { ChatMessage } from "../Models/ChatMessage"
import { StatusIcon } from "./StatusIcon";
import * as AdaptiveCards from "adaptivecards";

const one_day_in_ms = 1000 * 60 * 60 * 24;
const template = document.createElement("template");
template.innerHTML = `
    <li class="teams-embed-chat-item">
        <div class="teams-embed-avatar-container">
            <div class="teams-embed-avatar">
                <img class="teams-embed-avatar-image" src="">
            </div>
        </div>
        <div class="teams-embed-chat-item-message">
            <div class="teams-embed-chat-message">
                <div class="teams-embed-chat-message-header">
                    <span class="teams-embed-chat-message-author"></span>
                    <span class="teams-embed-chat-message-timestamp"></span>
                </div>
                <div class="teams-embed-chat-message-content"></div>
            </div>
            <div class="teams-embed-chat-message-send-status">
            </div>
        </div>
    </li>`;

export class ChatItem extends HTMLElement {
    constructor(message: ChatMessage, isMe: boolean) {
        super();
        // get chat item html
        const dom = <HTMLElement>template.content.cloneNode(true);
        // update new node with message details
        (<HTMLElement>dom.querySelector(".teams-embed-chat-item")).classList.add(message.id);
        (<HTMLElement>dom.querySelector(".teams-embed-chat-item")).id = message.id;
        (<HTMLElement>dom.querySelector(".teams-embed-avatar")).classList.add(message.sender.id);
        (<HTMLImageElement>dom.querySelector(".teams-embed-avatar-image")).src = message.sender.photo;
        (<HTMLElement>dom.querySelector(".teams-embed-chat-message-author")).innerText = message.sender.displayName;

        if (message.deletedOn) {
            // if message has been deleted
            // update text only
            (<HTMLElement>dom.querySelector(".teams-embed-chat-message-content")).innerHTML = "<p style='font-style: italic'>This message has been deleted</p>";
        } else {
            if (message.attachment != null) {
                if (message.attachment?.type == "AdaptiveCard") {
                // create adaptive card Instance
                const adaptiveCard = new AdaptiveCards.AdaptiveCard();

                // parse the Card payload
                adaptiveCard.parse(message.attachment);

                // rendered the card to an HTML Element
                let renderedCard = adaptiveCard.render();

                // get the message content element
                let contentDom = (<HTMLElement>dom.querySelector(".teams-embed-chat-message-content"));
                if (contentDom != null && renderedCard != undefined)
                    // set the innerHtml of the message content to the HTML of the adaptive card
                    contentDom.innerHTML = renderedCard.outerHTML;
                } else {
                    // message has an attachment, but is not an adaptive card
                    (<HTMLElement>dom.querySelector(".teams-embed-chat-message-content")).innerHTML = "<p style='font-style: italic'>This message type is unsupported.</p>";
                }
            } else {
                // if it is a message, set the message text on the element
                (<HTMLElement>dom.querySelector(".teams-embed-chat-message-content")).innerHTML = message.message;
            }

            if (message.sendFailed) {
                // if send status is failed
                // add the failed class and failed message
                (<HTMLElement>dom.querySelector(".teams-embed-chat-message-timestamp")).innerText = "Failed to send";
                (<HTMLElement>dom.querySelector(".teams-embed-chat-message-timestamp")).classList.add("failed");
                // add the failed status icon
                (<HTMLElement>dom.querySelector(".teams-embed-chat-message-send-status")).appendChild(new StatusIcon(false));
                (<HTMLElement>dom.querySelector(".teams-embed-chat-message-send-status")).classList.add("failed");
                (<HTMLElement>dom.querySelector(".tooltiptext")).innerText = "Failed";
            } else {
                let messageTimestamp = this.getDateString(message.createdOn);
                if (message.createdOn.getTime() != message.modifiedOn.getTime())
                    messageTimestamp += " Edited";
                (<HTMLElement>dom.querySelector(".teams-embed-chat-message-timestamp")).innerText = messageTimestamp;
            }
        }

        if (isMe) {
            (<HTMLElement>dom.querySelector(".teams-embed-chat-item")).classList.add("right");
            (<HTMLElement>dom.querySelector(".teams-embed-avatar-container")).remove();
        }

        this.appendChild(dom);
    }

    private getDateString(date: Date): string {
        // if date is today only show time
        // if date is this week, show day name with time
        // if date is before this week and this year show date (no year) and time
        // if date is before current year show date and time
        const today = new Date();
        const locale = navigator.language;
        let options : Intl.DateTimeFormatOptions = { dateStyle: 'short', timeStyle: 'short' };
        if (date.getFullYear() === today.getFullYear() &&
            date.getMonth() === today.getMonth() &&
            date.getDay() === today.getDay()) {
            // date is today, show short time
            options = { hour: "numeric", minute: "numeric"};
            return date.toLocaleString(locale, options);
        }

        if ((Math.round(today.getTime() - date.getTime()) / (one_day_in_ms)) < 7) {
            // date is in last 7 days, show day name and time
            options = { weekday: 'long', hour: 'numeric', minute: 'numeric' };
            return date.toLocaleString(locale, options);
        }

        if (date.getFullYear() === today.getFullYear() &&
            (date.getMonth() !== today.getMonth() ||
            date.getDay() !== today.getDay())) {
            // Same year, but not same day. Show date and time
            options = {
                day: "numeric", month: "numeric", hour: "numeric", minute: "numeric"
            };
            return date.toLocaleString(locale, options);
        }
        return date.toLocaleString(locale, options);
    }
}

customElements.get("chat-item") || customElements.define("chat-item", ChatItem);