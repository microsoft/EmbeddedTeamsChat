export class ConfigUtil {
    public static HostDomain: string = process.env.HostDomain ?? "";
    public static ClientId: string = process.env.ClientId ?? "";
    public static TenantId: string = process.env.TenantId ?? "";
    public static AcsEndpoint: string = process.env.AcsEndpoint ?? "";
    public static GnbEndpoint: string = process.env.GnbEndpoint ?? "";
    public static GnbPermissionScope: string = process.env.GnbPermissionScope ?? "";
    public static AcsGuestAccountName: string = process.env.AcsGuestAccountName ?? "";
    public static GnbSubscriptionDuration: number = process.env.GnbSubscriptionDuration ? parseInt(process.env.GnbSubscriptionDuration) : 30;
}