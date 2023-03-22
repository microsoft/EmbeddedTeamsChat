import { Mapping } from "../Models/Mapping";
import { ConfigUtil } from "./ConfigUtil";

export class mappingUtil {
    public static getMapping = async (entityId: string, appAccessToken: string): Promise<Mapping> => {
        var resp = await fetch(`https://${ConfigUtil.HostDomain}/api/mapping/${entityId}`, {
            method: "GET",
            headers: new Headers({
                "Authorization": "Bearer " + appAccessToken
            }),
        });

        return await resp.json();
    };

    public static updateMapping = async (mapping: Mapping, appAccessToken: string) => {
        var resp = await fetch(`https://${ConfigUtil.HostDomain}/api/mapping`, {
            method: "PATCH",
            body: JSON.stringify(mapping),
            headers: new Headers({
                "Authorization": "Bearer " + appAccessToken,
                "accept": "application/json",
                "content-type": "application/json"
            }),
        });

        return resp.ok;
    };
}