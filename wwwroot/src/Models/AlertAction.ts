export type AlertHandler = (message: string, action?: AlertAction) => void

export interface AlertAction {
    content: string;
    callback: () => Promise<void>;
    dismissAlert: boolean;
}