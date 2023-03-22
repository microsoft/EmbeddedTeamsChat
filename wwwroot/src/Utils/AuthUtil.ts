import { ConfigUtil } from "./ConfigUtil";
import { AuthInfo } from "../Models/AuthInfo";
import { ButtonPage } from "../Components/ButtonPage";
import { Waiting } from "../Components/Waiting";
import { AuthMessage } from "../Models/AuthMessage";
import { Alert } from "../Components/Alert";

export type Result = {
    data?: AuthInfo
    error?: Error
}

export class AuthUtil {
    private element:Element;
    private waiting: Waiting;
    private alert: Alert;
    private iframe: HTMLIFrameElement;
    private interactiveAuthCount: number = 0

    constructor(element:Element, waiting: Waiting, alert: Alert) {
        this.element = element;
        this.waiting = waiting;
        this.alert = alert;
    };

    // initialize a hidden iframe that will be used for auth
    public async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            let iframe = document.createElement("iframe");
            iframe.setAttribute("src", `https://${ConfigUtil.HostDomain}/auth.html`);
            // this is needed if you plan to open a pop up from an iframe
            //iframe.setAttribute("sandbox", "allow-same-origin allow-scripts allow-popups allow-forms");
            iframe.id = "msalAuthFrame";
            iframe.style.display = "none";
            this.element.append(iframe);

            iframe.onload = () => {
                this.iframe = iframe;
                resolve();
            }
            iframe.onerror = function() {
                reject('Encountered an issue loading the auth iframe');
            }
        });
    }

    // log out the user
    public async logout(): Promise<void> {
        let popupRef = window.open(
            `https://${ConfigUtil.HostDomain}/auth.html?mode=logout`, 
            "Teams Embedded Chat Logout",
            "width=485,height=625,toolbar=yes"
        );
        return;
    }

    public async acquireToken(scopes: string[], extraScopesToConsent?: string[]): Promise<AuthInfo> {
        // first try silent auth
        return new Promise(async (resolve, reject) => {
            if (!scopes || scopes.length == 0) {
                reject('No scopes were requested');
            }

            if (this.iframe.contentWindow == null) return reject('Auth iframe not loaded');
            const authMessage: AuthMessage = {
                signInType: "silent",
                request: {
                    scopes: scopes
                }
            };

            // try silent auth in the iframe
            const tokenResponse = await this.sendAuthMessage(authMessage);
            if (tokenResponse.data) {
                return resolve(tokenResponse.data);
            }

            // if silent auth failed, use interactive auth
            if (tokenResponse.error) {
                return await this.handleInteractiveLogin(
                    tokenResponse.error,
                    scopes,
                    extraScopesToConsent).then(resolve).catch(reject);
            }
        });
    }

    // Handle the response from the interactive auth window
    private async handleInteractiveResponse(result: Result, scopes: string[]): Promise<any> {
        return new Promise(async (resolve, reject) => {
            if (result.data) {
                return resolve(result.data);
            } 

            if (result.error) {
                if (result.error.message.indexOf('AADSTS65004') > -1) {
                    // user cancelled consent
                    this.alert.show("User declined to consent to access the app.");
                    return resolve(null);
                }

                if (this.interactiveAuthCount < 2) {
                    // try interactive auth again
                    console.log('doing interactive auth again. Count: ' + this.interactiveAuthCount);
                    return await this.handleInteractiveLogin(result.error, scopes).then(resolve).catch(reject);
                }

                // if we tried interactive login twice, return null to reset login state
                return resolve(null)
            } 
            
            // unknown error
            return reject('Result does not have data or error info');
        });
    }

    // Interactive login only happens if silent auth fails
    private async handleInteractiveLogin(error: Error, scopes: string[], extraScopesToConsent?: string[]): Promise<AuthInfo> {
        return new Promise((resolve, reject) => {
            // InteractionRequiredAuthError: token may have expired or app needs consent
            // BrowserAuthError: user closed a window or account was undefined during silent auth
            // ServerError: can happen when service principal has not been provisioned in the tenant
            if (error.name == 'InteractionRequiredAuthError' ||
                error.name == 'BrowserAuthError' ||
                error.name == 'ServerError') {

                this.interactiveAuthCount++;

                // requires an interactive login
                this.waiting.hide();

                // create a new button for the user to click on to sign in
                const btn = new ButtonPage("Sign-in to Microsoft Teams", () => { // launch interactive login popup
                    // if we have an alert from a previous sign-in attempt, remove it
                    this.alert.dismiss();
                    this.waiting.show();
        
                    let extraScopes: string[] = []
                    if (extraScopesToConsent && extraScopesToConsent.length > 0) {
                        extraScopes = extraScopesToConsent;
                    }
        
                    const scopesParams = new URLSearchParams({ 
                        scopes: scopes.join(','),
                        extraScopesToConsent: extraScopes.join(',')
                    });

                    let popupRef = window.open(
                        `https://${ConfigUtil.HostDomain}/auth.html?mode=interactive&${scopesParams}`, 
                        "Teams Embedded Chat", 
                        "width=485,height=625,toolbar=yes"
                    );

                    // listen for response
                    const loginPopUpListener = async (event: any) => {
                        if (this.element.contains(btn)) {
                            this.element.removeChild(btn);
                        }

                        if (popupRef) {
                            (popupRef as Window).close();
                            popupRef = null;
                        }

                        window.removeEventListener("message", loginPopUpListener, false);
                        
                        await this.handleInteractiveResponse(event.data, scopes).then(async response => {
                            if (response) {
                                // if we got an auth result successfully, return it
                                resolve(response);
                            } else {
                                // response is null, unable to get a token
                                // reset the login button
                                this.interactiveAuthCount = 0;
                                return await this.handleInteractiveLogin(event.data.error, scopes).then(resolve).catch(reject);
                            }
                        }).catch(reject);
                    }

                    // add the event listener for the login pop up
                    window.addEventListener("message", loginPopUpListener)

                    const timer = setInterval(() => {
                        if ((popupRef && popupRef.closed)) {
                            clearInterval(timer);
                            this.waiting.hide();
                            window.removeEventListener("message", loginPopUpListener, false);
                            if (this.element.contains(btn)) {
                                this.element.removeChild(btn);
                            }
                            this.alert.show("Interactive login was cancelled or failed to load. Please refresh.");
                            reject('The authentication popUp was closed');
                        }
                    }, 500);
                });

                this.element.append(btn);
            } else {
                // if another error happened, reject
                return reject(error);
            }
        });
    }

    // send a message to the auth iframe to aquire token silently
    private async sendAuthMessage(authMessage: AuthMessage): Promise<Result> {
        return new Promise((resolve, reject) => {
            // if no iframe found reject
            if (this.iframe.contentWindow == null) return reject();

            const frameListener = (event: any) => {                
                // remove the window listener
                window.removeEventListener("message", frameListener, false);
                return resolve(event.data);
            };

            // add the window listener
            window.addEventListener("message", frameListener);

            this.iframe.contentWindow?.postMessage(authMessage, "*");
        });
    }
}