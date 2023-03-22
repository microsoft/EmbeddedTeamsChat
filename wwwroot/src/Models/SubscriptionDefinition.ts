// properties are capital bc Signalr returns Pascal Casing
export interface SubscriptionDefinition {
    Resource: string;
    ResourceData: boolean;
    ExpirationTime: string;
    ChangeTypes: string[];
}