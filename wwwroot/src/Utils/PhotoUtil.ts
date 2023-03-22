export class PhotoUtil {
    // keeps a record of already loaded profile photos
    pics: Record<string, string> = {};
  
    // empty image to default to
    emptyPic = "data:image/jpeg;base64, iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAA51JREFUWAnFV0tIlFEU/u4/5oDOjM1YECmJkloKPQzNpYGhlAXVqgwqpEUuI1xUtNDaSquCnJJKdz1AaF1LH2X2EnwsFEYNAh/zzwwUOLdz7jz4Z+b3/8cX/sPM3P+cc8/33XPvPfdcgSwfKWVuOBw+JeXqeQFRJSX2A5K+/Ih5ITAvIceFcAzk5+d/FEL8i+msf4W1GgiFQvsI9AEkWsnWY2cf1wch0E9kOl0u12+rPmsSoBE7Q6HgPSFxWwL5Vk7W0pHzsBTodrk8jygif83sTAmoUUej7ynE9Wad1i8Tg0LTLphFI4MAgR+BjH6gCBSvH2jtHhSBAIR2hkj8MFqlEOCRE/jIVoMnAOMkao2R0BJKnnNJYd8ucMZh33EMZwI3SYAX3NbNecK92b+sj2HFdGoKVOijq9MbXe1mMFYyAg1DcxzkqchhQ7XP17HVIpEw+l69xsiXz7TdBerqanGl9Sry8vKscJM6NVDOLUC7oHnJDenBP/SSVZIhe9y/fxdlZQdx6eJFyk8S7968xczMDDofPgQttCSQTSPocnv2apxeswVnh19HR+EQGtra2rDb64XX60PbzZuI0ufb2JgNZoraw9ga5/YUsc1LIBBAeWVlhlV5eQXm5uYy5FYCxtb4YLEyStcVFxdjamIiXYypyUkUFRVlyK0EjE0R4FMt++d4TQ0FW8Lv92N5aQmLi4vw9zyDQ9Nw9Nix7B2RJWMLPbiiU9u1np6RSAT9fX0YHhlWu+BkXR0ut7ZmvQsMWKENETA42GxTp0wo5jfrZeP9xUKOqmQkKqyc3Lh+jQsTK5MMXYHHA/+L3gy5UcDYOVxGkbDBqEhv+3w+3OnoQHVVdbrK9D0wF8Cjri5TnVHI2BrXcEahWbul5Rye9/gxSVvN7pmdncXj7m40NTfbmVLWdAxknYqHhofwsrcXXp8Xhw4dRsmBErgpzHS8Ynl5BQsL87QrhpC7y0ngTWhsPG1HQKVilbh1feUJbe1bdj2iBDY9NY1f4z/BGVEPBuFwOFQ6LtxTiJqaEygtLbVzE9MLPHW7C9oVgZ08jlVBwucyV6/ZUd+8VaxSjpXrKgLsko5ZZ0jXP21/VSQGXW53Q6JMT5ZkLODSWRWOmx+kqQf2HcdI3hGSBLiHqlaFdnY7SCifsbI85aaUQiBO4jvV77WUogdNh7EhIfkinzTAlDsBu0qugXS/ak3s1NXMSIa36I5cTo0kuM3F63Zcz/8DmbGCUuUyJvcAAAAASUVORK5CYII=";
  
    // gets a photo from microsoft graph for a specific user
    public getGraphPhotoAsync = async (token: string, id: string) => {
        if (this.pics[id]) {
            return this.pics[id];
        }
        else {
            // while fetching for the first time
            // set the image to empty
            this.pics[id] = this.emptyPic;
  
            const resp = await fetch(`https://graph.microsoft.com/v1.0/users/${id}/photos/48x48/$value`, {
                method: "GET",
                headers: new Headers({
                    Authorization: "Bearer " + token,
                    "Content-Type": "image/jpg",
                }),
            });
  
            if (resp.ok) {
                const blob = await resp.blob();
                const url = window.URL || window.webkitURL;
                const objectURL = url.createObjectURL(blob);
                this.pics[id] = objectURL;
            }
  
            return this.pics[id];
        }
    };
}