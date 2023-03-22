# Embedded Chat

|  [Architecture](/docs/architecture.md#overall-architecture) |  [Deployment Guide](/docs/deployment-guide.md#Deployment-Guide) |
| ---- | ---- |

Embedded Chat is a solution to embed a Microsoft Teams Chat into a web application. A new chat can be automatically created on behalf of the user or the user can access existing Teams chats that they are members of.

As an example use case, you may want to embed a Teams chat into your Support Desk Ticketing system where the team working with service desk tickets do not have to leave the application to chat with others about the ticket. When a help desk team member opens the ticket in the ticketing system, the embedded chat could automatically create a new Teams Chat with the Service Desk Ticket Number as the chat group name and add the user who opened the ticket as a participant of the chat. The help desk team member can not chat directly in the Service Desk Ticket system with the user needing support. The user who is requesting support will be able to chat and receive notifications all from the Teams client. Below is an example of a chat that shows the chat in Microsoft Teams on the right and the embedded chat in a web application on the left.

![sample chat](./images/embeddedchat%20example.png)

## Supported Features

1. Create a new chat
1. Show latest chat messages (the message count fetched is configurable)
1. Send a message to the chat
1. Add participants
1. Receive chats in near real time
1. Receive participant changes in near real time
1. Automatic subscription renewal for messages and participants

Embedded Chat can easily be embedded in any JavaScript enabled webpage by using this code sample.

```html
<div id="embed"></div>
<script src="/dist/graph/embeddedchat.min.js" />

<script>
teamsEmbeddedChat.renderEmbed(
    document.getElementById("embed"),
    {
        entityId: "987654",
        topicName: "Invoice 987654",
    }
);
</script>
```

## Resources Needed

Embedded Chat runs as SPA in an existing browser application and uses the following resources.

- Azure Storage Account (Table Storage)
- Azure Web App
- Azure Key Vault
- Azure Communication Services (ACS) instance or [Graph Notification Broker (GNB)](https://github.com/microsoft/GraphNotificationBroker) instance
- Microsoft Teams
<em>

> **Note**
> The above Azure resources will be created & configured by the deployment script as mentioned in Deployment section. The GNB will need to be deployed prior to deploying this Embedded Chat application.
</em>

## Getting Started

Embedded chat requires the user to log into the Embedded Chat Azure AD application and grant consent to the required permissions before being able to create or access an existing chat. Embedded chat will create a new chat in Teams, fetch existing chat messages on initial load and send new messages using the Microsoft Graph API. All near real time notifications will be delivered depending on which 'Notification Source' was chosen. Currently we support the following Notification Sources:

- Azure Communication  (ACS)
- [Graph Notification Broker (GNB)](https://github.com/microsoft/GraphNotificationBroker)

Embedded Chat contains a sample application for testing ./wwwroot/index.html. Before you can use the sample application, the application dependencies will need to be deployed. If you plan to use the GNB as your notification source, you will need an existing instance that you have access to or will need to deploy that first. Refer to the [Graph Notification Broker (GNB)](https://github.com/microsoft/GraphNotificationBroker) repo for installation instructions.
