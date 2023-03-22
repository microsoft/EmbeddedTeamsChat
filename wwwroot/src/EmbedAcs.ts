import { Alert } from "./Components/Alert";
import { App } from "./Components/App";
import { EmbeddedChatConfig } from "./Models/EmbeddedChatConfig";
import { AcsMeetingNotificationClient } from "./NotificationClients/AcsMeetingNotificationClient";

export class teamsEmbeddedChat {
    public static renderEmbed(element: Element, config: EmbeddedChatConfig) {
        const alert = new Alert();
        const notificationClient: AcsMeetingNotificationClient = new AcsMeetingNotificationClient(alert);
        const app: App = new App(alert);
        app.renderEmbed(element, config, notificationClient);
    }
}