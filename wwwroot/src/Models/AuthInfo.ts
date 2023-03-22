export interface Account {
    name: string;
    username: string;
}

export interface AuthInfo {
    uniqueId: string;
    account: Account;
    idToken: string;
    accessToken: string;
    expiresOn: Date;
    tenantId: string;
    scopes: string[];
}