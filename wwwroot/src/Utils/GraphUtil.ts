import { Person } from "../Models/Person";
import { PhotoUtil } from "./PhotoUtil";
import { ConfigUtil } from "../Utils/ConfigUtil";
import { FormatterUtil } from "./FormatterUtil";
import { Mapping } from "../Models/Mapping";

export class GraphUtil {
    // search users...used in people pickers
    public static searchUsers = async (token: string, query: string) => {
        const queryFilter = `startswith(displayName,'${query}') or startswith(givenName,'${query}') or startswith(surname,'${query}') or startswith(mail,'${query}') or startswith(userPrincipalName,'${query}')`;
        const selectProperties = 'id,displayName,userPrincipalName';
        const resp = await fetch(`https://graph.microsoft.com/v1.0/users?$filter=${queryFilter}&$select=${selectProperties}`, {
            method: "GET",
            headers: new Headers({
                Authorization: "Bearer " + token,
            }),
        });

        if (!resp.ok) {
            return [];
        }
        const json = await resp.json();
        return json.value;
    };

    // get person...gets profile information on a specific person
    public static getPerson = async (token: string, userId: string) => {
        const selectProperties = 'id,displayName,userPrincipalName';
        const resp = await fetch(`https://graph.microsoft.com/v1.0/users/${userId}?$select=${selectProperties}`, {
            method: "GET",
            headers: new Headers({
                Authorization: "Bearer " + token,
            }),
        });

        if (!resp.ok) {
            return [];
        }
        const json = await resp.json();
        return json;
    };

    // creates group chat
    public static createChat = async (token: string, topic: string, participants: Person[]) => {
        const members: any[] = participants.map((p: Person) => {
            return {
                "@odata.type": "#microsoft.graph.aadUserConversationMember",
                "user@odata.bind": `https://graph.microsoft.com/v1.0/users('${p.id}')`,
                roles: this.isUserGuest(p.userPrincipalName) ? ["guest"] : ["owner"]
            };
        });
        
        const payload = {
            chatType: "group",
            topic: topic,
            members: members,
        };

        const resp = await fetch(`https://graph.microsoft.com/v1.0/chats`, {
            method: "POST",
            headers: new Headers({
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json",
                "Accept": "application/json",
            }),
            body: JSON.stringify(payload),
        });

        return resp.json();
    };

    // update chat
    public static addGroupChatParticipants = async (token: string, chatId: string, addedParticipants:Person[], includeHistory:boolean): Promise<void> => {
        addedParticipants.forEach(async (p:Person, index:number) => {
            const payload:any = {
                "@odata.type": "#microsoft.graph.aadUserConversationMember",
                "user@odata.bind": `https://graph.microsoft.com/v1.0/users/${p.id}`,
                roles: this.isUserGuest(p.userPrincipalName) ? ["guest"] : ["owner"],
            };

            if (includeHistory)
                payload.visibleHistoryStartDateTime = "0001-01-01T00:00:00Z";
    
            const resp = await fetch(`https://graph.microsoft.com/v1.0/chats/${chatId}/members`, {
                method: "POST",
                headers: new Headers({
                    "Authorization": "Bearer " + token,
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                }),
                body: JSON.stringify(payload),
            });

            if (!resp.ok) {
                throw Error(`Adding participants in GraphUtil.addGroupChatParticipants encountered an error`);
            }
            return;
        });
    };

    // gets online meeting
    public static getOnlineMeeting = async (token: string, meetingId: string, userId: string) => {
        const resp = await fetch(`https://graph.microsoft.com/v1.0/users/${userId}/onlineMeetings/${meetingId}`, {
            method: "GET",
            headers: new Headers({
                Authorization: "Bearer " + token,
            }),
        });

        if (!resp.ok) {
            return [];
        }
        const json = await resp.json();
        return json.value;
    };

    // updates online meeting
    public static updateOnlineMeeting = async (
        token: string,
        meetingId: string,
        userId: string,
        participants: Person[],
    ) => {
        const attendees: any[] = participants.map((p: Person) => {
            return {
                identity: {
                    "@odata.type": "#microsoft.graph.identitySet",
                },
                upn: p.userPrincipalName,
                role: "attendee",
            };
        });
        
        const payload = {
            participants: {
                attendees: attendees,
            },
        };
    
        const resp = await fetch(`https://graph.microsoft.com/v1.0/users/${userId}/onlineMeetings/${meetingId}`, {
            method: "PATCH",
            headers: new Headers({
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json",
                "Accept": "application/json",
            }),
            body: JSON.stringify(payload),
        });

        return resp.ok;
    };

    // sends a chat message
    public static sendChatMessage = async (token: string, chatId: string, message: string, isAdaptiveCard: boolean) => {
        var payload;
        if(!isAdaptiveCard)
            payload = FormatterUtil.formatMessageBody(message);
        else
            payload = JSON.parse(message);
        try {
            const resp = await fetch(`https://graph.microsoft.com/v1.0/chats/${chatId}/messages`, {
                method: "POST",
                headers: new Headers({
                    "Authorization": "Bearer " + token,
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                }),
                body: JSON.stringify(payload),
            });
            if (!resp.ok)
                return null;

            return await resp.json();
        } catch (e) {
            console.log(`Error posting message: ${e}`);
            return null;
        }
    };

    // gets chat messages
    public static getChatMessages = async (
        token: string,
        threadId: string
    ): Promise<any[]> => {
        const resp = await fetch(
            `https://graph.microsoft.com/v1.0/me/chats/${threadId}/messages?$top=40`,
            {
                method: "GET",
                headers: new Headers({
                    Authorization: "Bearer " + token,
                }),
            },
        );

        if (!resp.ok) {
            return [];
        }
        
        const json = await resp.json();
        return json.value;
    };

    public static getChatParticipants = async (
        token: string,
        threadId: string
    ): Promise<any[]> => {
        const resp = await fetch(
            `https://graph.microsoft.com/v1.0/me/chats/${threadId}/members`,
            {
                method: "GET",
                headers: new Headers({
                    Authorization: "Bearer " + token,
                }),
            },
        );

        if (!resp.ok) {
            return [];
        }
        
        const people:Person[] = [];
        const results = await resp.json();
        results.value.forEach((res:any, i:number) => {
            people.push({
                id: res.userId,
                displayName: res.displayName,
                userPrincipalName: res.email,
                photo: ""
            });
        })

        return people;
    };

    public static getUsers = async (
        token: string,
        users: string[]
    ): Promise<Person[]> => {
        const requests:any[] = [];
        users.forEach((user:string, index: number) => {
            requests.push({
                id: index+1,
                method: "GET",
                url: `/users/${user.replaceAll("#", "%23")}` // external UPNs have a #EXT# in path that fails in POST
            });
        });
        const payload = {
            requests: requests
        };
    
        const resp = await fetch("https://graph.microsoft.com/v1.0/$batch", {
            method: "POST",
            headers: new Headers({
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json",
                "Accept": "application/json",
            }),
            body: JSON.stringify(payload),
        });
        if (!resp.ok)
            return [];

        const people:Person[] = [];
        const results = await resp.json();
        results.responses.forEach((res: any, i: number) => {
            // Each user that we are searching for will have
            // their own response object and checking that the
            // response is ok means the user was found
            if (res.status === 200) {
                people.push({
                    id: res.body.id,
                    displayName: res.body.displayName,
                    userPrincipalName: res.body.userPrincipalName,
                    photo: ""
                });
            }
        })

        return people;
    }

    public static getUserPics = async (
        token: string,
        users: Person[],
        photoUtil: PhotoUtil
    ): Promise<Person[]> => {
        const requests:any[] = [];
        users.forEach((user:Person, index: number) => {
            requests.push({
                id: index+1,
                method: "GET",
                url: `/users/${user.id}/photos/48x48/$value`
            });
        });
        const payload = {
            requests: requests
        };
    
        const resp = await fetch("https://graph.microsoft.com/v1.0/$batch", {
            method: "POST",
            headers: new Headers({
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json",
                "Accept": "application/json",
            }),
            body: JSON.stringify(payload),
        });
        if (!resp.ok)
            return users;

        const json = await resp.json();
        
        json.responses.forEach((obj:any, index:number) => {
            if (obj.status == 200) {
                users[obj.id-1].photo = `data:image/jpeg;base64, ${obj.body}`;
                photoUtil.pics[users[obj.id-1].id] = users[obj.id-1].photo;
            }
            else {
                users[obj.id-1].photo = photoUtil.emptyPic;
                photoUtil.pics[users[obj.id-1].id] = users[obj.id-1].photo;
            }
        });

        return users;
    };

    // create online meeting
    public static createMeeting = async (appAccessToken: string, mapping: Mapping, participants: Person[]) => {
        const payload = {
            ...mapping,
            Participants: participants
        };
        var resp = await fetch(`https://${ConfigUtil.HostDomain}/api/createMeeting`, {
            method: "POST",
            headers: new Headers({
                "Authorization": "Bearer " + appAccessToken,
                "Content-Type": "application/json",
            }),
            body: JSON.stringify(payload),
        });

        if (!resp.ok)
            return null;
        const body = await resp.json();
        return body;
    };

    private static isUserGuest = (userPrincipalName?: string) => {
        return userPrincipalName?.indexOf("#EXT#") != -1;
    }
}