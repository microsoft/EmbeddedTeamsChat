import { ConfigUtil } from "./ConfigUtil";

export class acsUtil {
    
    // get ACS Token
    public static getAcsToken = async<T> (appAccessToken: string) => {
        var resp = await fetch(`https://${ConfigUtil.HostDomain}/api/acsToken`, {
            method: "GET",
            headers: new Headers({
                "Authorization": "Bearer " + appAccessToken
            }),
        });

        if (!resp.ok)
            return null;
        const body = await resp.json();
        return body;
    };
   
    
     // get Communicatoin Identity Access Token
    public static getCommIdentityAccessToken = async (appAccessToken: string) => {
        
        const payload = {
            id: "",
            entityId: "",
            threadId:"",
            acsUserId: "",
            acsUserToken: appAccessToken
        };

        var resp = await fetch(`https://${ConfigUtil.HostDomain}/api/getCommIdentityToken`, {
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
}