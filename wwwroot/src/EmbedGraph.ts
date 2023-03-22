import { Alert } from "./Components/Alert";
import { App } from "./Components/App";
import { EmbeddedChatConfig } from "./Models/EmbeddedChatConfig";
import { GraphNotificationClient } from "./NotificationClients/GraphNotificationClient";

export class teamsEmbeddedChat {
    public static renderEmbed(element: Element, config: EmbeddedChatConfig) {
        const alert = new Alert();
        const notificationClient: GraphNotificationClient = new GraphNotificationClient(alert);
        const app: App = new App(alert);
        app.renderEmbed(element, config, notificationClient);
    }
}