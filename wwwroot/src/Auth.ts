import { AccountInfo, AuthenticationResult, Configuration, EndSessionRequest, PublicClientApplication, RedirectRequest } from "@azure/msal-browser";
import { AuthMessage } from "./Models/AuthMessage";
import { Result } from "./Utils/AuthUtil";
import { ConfigUtil } from "./Utils/ConfigUtil";

class Auth {
    private MSAL_CONFIG: Configuration = {
        auth: {
            clientId: ConfigUtil.ClientId,
            redirectUri: `https://${ConfigUtil.HostDomain}/auth.html`,
            authority: `https://login.microsoftonline.com/organizations/`
        },
        cache: {
            cacheLocation: "localStorage",
            storeAuthStateInCookie: false // Set this to "true" if you are having issues on IE11 or Edge
        }
    };

    private myMSALObj: PublicClientApplication;
    public account: AccountInfo | undefined;

    constructor() {
        this.myMSALObj = new PublicClientApplication(this.MSAL_CONFIG);
        this.account = this.getAccount();
    }
    
    /**
     * Calls getAllAccounts and determines the correct account to sign into.
     */
    private getAccount(): AccountInfo | undefined {
        if (this.account != null)
            return this.account;

        const currentAccounts = this.myMSALObj.getAllAccounts();
        // Need to make sure we use the account that has the idTokenClaims for
        // our app (clientId) otherwise this token requests can fail
        const currentAccount = currentAccounts.find(x => x.idTokenClaims?.aud == ConfigUtil.ClientId);
        if (currentAccount) {
            return currentAccount;
        }
        return undefined;
    }

    /**
     * Handles the response from a popup. If response is null, will check if we have any accounts and attempt to sign in.
     * @param response 
     */
    handleResponse(response: AuthenticationResult | null) {
        if (response !== null && response.account) {
            this.account = response.account;
        } else {
            this.account = this.getAccount();
        }
    }

    public async acquireTokenSilent(request: any) : Promise<any> {
        request.account = this.getAccount();
        return await this.myMSALObj.acquireTokenSilent(request);
    };

    /**
     * Checks whether we are in the middle of a redirect and handles state accordingly. Only required for redirect flows.
     * 
     * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/initialization.md#redirect-apis
     */
    public async handleRedirectPromise(): Promise<AuthenticationResult|null> {
        return await this.myMSALObj.handleRedirectPromise().then((response) => response);
    }

    /**
     * Gets a token with an interactive redirect. We try to acquireTokenSilent in a prior request, 
     * and if that fails, we acquire Token with a Redirect.
     * @param interactiveRequest
     */
    public async acquireTokenRedirect(interactiveRequest: RedirectRequest): Promise<AuthenticationResult|void> {
        try {
            const authResult = await this.handleRedirectPromise();
            if (authResult) {
                return authResult;
            }
            await this.myMSALObj.acquireTokenRedirect(interactiveRequest).catch(console.error);
        } catch (error) {
            window.opener.postMessage(this.buildResult(error), "*");
        }
    }

    /**
     * Logs out of current account.
     */
    public async logout(): Promise<void> {
        const logOutRequest: EndSessionRequest = {
            account: this.account
        };

        await this.myMSALObj.logoutRedirect(logOutRequest);
    }

    // build the result to send back to the parent window
    public buildResult = (response: any): Result => {
        if (response instanceof Error) {
            return {
                error: {
                    name: response.name,
                    message: response.message
                }
            };
        }
        return {
            data: response
        };
    }
}

window.onload = async () => {
    const auth = new Auth();

    let scopes: string[] = [];
    let extraScopesToConsent: string[] = [];
    // requests initiated from AuthUtil (window.open) will have the scopes as
    // query string paramaters comma delimited
    // Interactive Auth
    if (window.location.search.length > 0) {
        // get the scopes from the query string
        let params = new URLSearchParams(window.location.search);
        const scopesString = params.get('scopes');
        if (scopesString && scopesString.length > 0) {
            scopes = scopesString.split(',');
        }
        const extraScopesString = params.get('extraScopesToConsent');
        if (extraScopesString && extraScopesString.length > 0) {
            extraScopesToConsent = extraScopesString.split(',');
        }

        // create the request object
        const request: RedirectRequest = {
            scopes: scopes,
            redirectStartPage: window.location.href,
            extraScopesToConsent: extraScopesToConsent
        }

        // if mode=logout, log the user out
        // otherwise all other requests will be interactive
        if (window.location.href.indexOf("?mode=logout") > -1) {
            await auth.logout();
            window.opener.postMessage(auth.buildResult(null), "*");
        } else {
            const authResult = await auth.acquireTokenRedirect(request);
            window.opener.postMessage(auth.buildResult(authResult), "*");
        }

        // 1. auth.html is loaded from a window.open popup with interactive query string params
        // 1. we call acquireTokenRedirect which will redirect to the login page
        // 1. auth.html will be reloaded with the auth code (#code hash)
        // 1. we need to call await this.myMSALObj.handleRedirectPromise().then((response) => response);
        // 1. page redirects in the popup back to the 'original' url with the interactive query string params
        // 1. call the await this.myMSALObj.handleRedirectPromise().then((response) => response); and will return the token
        // 1. postMessage to the window.opener with the token

    } else if (window.location.hash.indexOf('#') > -1) {
        // when interactive auth happens, the page will be redirected
        // with the auth code or if the user canceled consent
        // it will have the error message after the hash '#'

        // if we are in the middle of a redirect, call handle Redirect Promise
        await auth.handleRedirectPromise();
    }

    // listening for messages sent from parent to iframe
    // Silent Auth
    window.addEventListener("message", async (event) => {
        const data = event.data as AuthMessage;
        switch (data.signInType) {
            case "silent":
                auth.acquireTokenSilent(data.request)
                    .then((response) => { parent.postMessage(auth.buildResult(response), "*") })
                    .catch((error) => { 
                        // if we failed to aquire a token silently, set the account to undefined
                        // in the event the account was incorrect
                        auth.account = undefined;
                        parent.postMessage(auth.buildResult(error), "*") 
                    });
                break;
            default:
                parent.postMessage(auth.buildResult(new Error('Invalid signInType')), "*");
                break;
        }
    });
}