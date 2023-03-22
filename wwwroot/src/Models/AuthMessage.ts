export interface AuthRequest {
    scopes: string[];
    extraScopesToConsent?: string[];
}

export interface AuthMessage {
    signInType: string;
    request: AuthRequest;
}