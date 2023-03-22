#Requires -Module Microsoft.Graph.Applications
#Requires -Module Microsoft.Graph.Authentication
#Requires -Module Microsoft.Graph.Users

param (
    [Parameter(Mandatory = $true)]
    [string] $ApplicationName,
    [string] $AccessToken,
    [Parameter(Mandatory = $true)]
    [string] $GnbClientId
)
try {
    Write-Host "Updating App Registrations"
    if ($AccessToken) {
        $c = Connect-MgGraph -AccessToken $AccessToken
    }
    else {
        # If running as a user not in a container you can use this command
        $c = Connect-MgGraph -Scopes "Application.ReadWrite.All", "User.ReadBasic.All"
    }

    # Get the embedded chat Azure AD app
    $embeddedChatApplication = Get-MgApplication -Filter "DisplayName eq '$($ApplicationName)'"
    if (!$embeddedChatApplication) {
        throw "Unable to find the Application: $($ApplicationName)"
    }

    # Get the embedded chat Azure AD app
    $gnbApplication = Get-MgApplication -Filter "AppId eq '$($GnbClientId)'"

    # Add the GNB permission scope to the embedded chat application
    $embeddedChatRequiredScopes = $embeddedChatApplication.RequiredResourceAccess
    $hasGnbScope = $embeddedChatRequiredScopes | where { $_.ResourceAppId -eq $GnbClientId }
    if (!$hasGnbScope)
    {
        $gnbPermissionScope = $gnbApplication.Api.Oauth2PermissionScopes | Where-Object -FilterScript {$_.Value -EQ 'Chat.Read'}
        $gnbRequiredScope = @{
            resourceAppId = $GnbClientId # Graph Notification Broker
            resourceAccess = @(
                @{
                    id   = $gnbPermissionScope.id # Chat.Read
                    type = "Scope"
                }
            )
        }

        # Add the GNB required scope to the list of required scopes
        $embeddedChatRequiredScopes += $gnbRequiredScope
        $embeddedChatApplicationParams = @{
            RequiredResourceAccess = $embeddedChatRequiredScopes
        }

        Write-Host "Adding GNB Permission Scope to Embedded Chat"
        # Update embedded chat application to include the GNB scope
        Update-MgApplication -ApplicationId $embeddedChatApplication.Id @embeddedChatApplicationParams
    }

    # Update the GNB App to add the known client applications for the embedded chat application
    $gnbKnownClientApplications = $gnbApplication.Api.KnownClientApplications
    $hasKnownClientApp = $gnbKnownClientApplications | where { $_ -eq $embeddedChatApplication.AppId }
    if (!$hasKnownClientApp)
    {
        $gnbKnownClientApplications += $embeddedChatApplication.AppId
        $gnbKnownClientApplicationParams = @{
            Api = @{
                KnownClientApplications = @(
                    $gnbKnownClientApplications
                )
            }
        }

        Write-Host "Updating GNB App Registration to include Embedded Chat Known Application"
        # Update GNB to include the embedded chat as a known application
        # This allows us to consent one time, but consenting the embedded chat application and GNB
        Update-MgApplication -ApplicationId $gnbApplication.Id @gnbKnownClientApplicationParams
    }
}
catch {
    Write-Warning $_
    Write-Warning $_.exception
}