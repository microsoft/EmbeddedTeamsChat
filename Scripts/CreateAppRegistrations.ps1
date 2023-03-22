#Requires -Module Microsoft.Graph.Applications
#Requires -Module Microsoft.Graph.Authentication
#Requires -Module Microsoft.Graph.Users

param (
    [Parameter(Mandatory = $true)]
    [string] $ApplicationName,
    [string] $AccessToken,
    [string[]] $SpaRedirectUris
)
try {
    Write-Host "Creating Embedded Chat App Registration"
    if ($AccessToken) {
        $c = Connect-MgGraph -AccessToken $AccessToken
    }
    else {
        # If running as a user not in a container you can use this command
        $c = Connect-MgGraph -Scopes "Application.ReadWrite.All", "User.ReadBasic.All"
    }

    $redirectUri = "https://$($ApplicationName)app.azurewebsites.net/auth.html"
    $SpaRedirectUris += $redirectUri

    $embeddedChatApplication = Get-MgApplication -Filter "DisplayName eq '$($ApplicationName)'"
    if (!$embeddedChatApplication) {
        Write-Host -Message "Creating Application: $($ApplicationName)"
        # Create backnd application
        $embeddedChatApplicationParams = @{
            DisplayName            = $ApplicationName
            SignInAudience         = "AzureADMultipleOrgs"
            Spa                    = @{
                RedirectUris = $SpaRedirectUris
            }
            RequiredResourceAccess = 
            @(
                @{
                    ResourceAppId  = "00000003-0000-0000-c000-000000000000" # MS Graph Permissions
                    ResourceAccess = @(
                        @{
                            id   = "14dad69e-099b-42c9-810b-d002981feec1" # profile
                            type = "Scope"
                        },
                        @{
                            id   = "9ff7295e-131b-4d94-90e1-69fde507ac11" # Chat.ReadWrite
                            type = "Scope"
                        },
                        @{
                            id   = "7427e0e9-2fba-42fe-b0c0-848c9e6a8182" # offline_access
                            type = "Scope"
                        },
                        @{
                            id   = "e1fe6dd8-ba31-4d61-89e7-88639da4683d" # User.Read
                            type = "Scope"
                        },
                        @{
                            id   = "b340eb25-3456-403f-be2f-af7a0d370277" # User.ReadBasic.All
                            type = "Scope"
                        },
                        @{
                            id   = "37f7f235-527c-4136-accd-4a02d197296e" # openid
                            type = "Scope"
                        },
                        @{
                            id   = "64a6cdd6-aab1-4aaf-94b8-3cc8405e90d0" # email
                            type = "Scope"
                        },
                        @{
                            id   = "ba47897c-39ec-4d83-8086-ee8256fa737d" # People.Read
                            type = "Scope"
                        },
                        @{
                            id   = "a65f2972-a4f8-4f5e-afd7-69ccb046d5dc" # OnlineMeetings.ReadWrite
                            type = "Scope"
                        }
                    )
                }
                @{ 
                    resourceAppId  = "1fd5118e-2576-4263-8130-9503064c837a" # Azure Communication Services
                    resourceAccess = @(
                        @{
                            id   = "6290af7f-b407-49f9-92d5-bf584fdc4019" # Teams.ManageChats
                            type = "Scope"
                        }
                        @{
                            id   = "de8ec1df-066a-4817-bc5d-9a985b986262" # Teams.ManageCalls
                            type = "Scope"
                        }
                    )
                } 
            )
        }

        # Create a new appliation registration
        $embeddedChatApplication = New-MgApplication @embeddedChatApplicationParams

        # Update application to expose API
        # after inital creation
        $scopeId = New-Guid
        $scopeParams = @{
            IdentifierUris = @(
                "api://" + $embeddedChatApplication.AppId
            )
            Api = @{
                Oauth2PermissionScopes = @(
                    @{ 
                        Id                      = $scopeId; 
                        AdminConsentDescription = "Allows access as user";
                        AdminConsentDisplayName = "Allows access to the application as current user";
                        UserConsentDescription  = "Allows access to the application";
                        UserConsentDisplayName  = "Allows access as user";
                        Value                   = "access_as_user";
                        IsEnabled               = $true;
                        Type                    = "User"
                    }
                )
            }
        }
        # Update Embedded Chat Application with AppId URI and expose API
        Update-MgApplication -ApplicationId $embeddedChatApplication.Id @scopeParams
    }

    Write-Host -Message "Creating new client secret for: $($ApplicationName)"
    # Even if the App exists, we need to create a new secret
    # Create secret for backend application
    $secretParams = @{
        PasswordCredential = @{
            DisplayName = New-Guid
        }
    }
    $appSecret = Add-MgApplicationPassword -ApplicationId $embeddedChatApplication.Id @secretParams
  
    $paramsOutput = @{
        '$schema'        = 'https=//schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#'
        'contentVersion' = '1.0.0.0'
        'parameters'     = @{
            'appName'         = @{
                'value' = $ApplicationName
            }
            'ClientId'     = @{
                'value' = $embeddedChatApplication.AppId
            }
            'ClientSecret' = @{
                'value' = $appSecret.SecretText
            }
        }
    }

    $paramsOutput | ConvertTo-Json -Depth 5 | Set-Content './bicep/main.parameters.json'
}
catch {
    Write-Warning $_
    Write-Warning $_.exception
}