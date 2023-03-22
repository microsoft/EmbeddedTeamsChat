[CmdletBinding(DefaultParameterSetName = 'ACS')]
param (    
    [Parameter(Mandatory=$true, 
    HelpMessage="Enter a name for the Embedded Chat Application")]
    [ValidateLength(3,14)]
    [string]$ApplicationName,

    [Parameter(Mandatory=$true,
    HelpMessage="Enter a name for the Resource Group")]
    [string]$ResourceGroupName,

    [Parameter(Mandatory=$true,
    HelpMessage="Enter the Azure Resource Group Region")]
    [string]$ResourceGroupLocation,

    [Parameter(HelpMessage="Enter one or more SPA Redirect URLs separated by commas")]
    # If you plan to host the application at a different URL, you can add it here
    # Or update it in Azure AD
    [string[]] $SpaRedirectUris,

    [Parameter(HelpMessage="Enter the Tenant Id")]
    # This is used during sign in 
    [string] $TenantId,

    [Parameter(HelpMessage="Enter Subscription Id")]
    # This is used during sign in
    [string] $SubscriptionId,

    [Parameter(ParameterSetName='GNB',
        Mandatory=$true,
        HelpMessage="Enter the existing GNB Azure AD Application (client) Id")]
    # You can find this in Azure Active Directory. The GNB app registration will be 
    # the application name it was given + " Backend"
    [string] $GnbClientId,

    [Parameter(ParameterSetName='GNB',
        Mandatory=$true,
        HelpMessage="Enter the existing GNB Azure Function URL")]
    # In the GNB resource group, open the Azure Function and copy the Function URL from the Overview tab
    [string] $GnbFunctionUrl,

    [Parameter(ParameterSetName='GNB', Mandatory=$False)]
    [Parameter(ParameterSetName='ACS',
        Mandatory=$true,
        HelpMessage="Enter the ACS Data Location where the data will be stored (Africa, Asia Pacific, Australia, 
Brazil, Canada, Europe, France, Germany, India, Japan, Korea, Norway, Switzerland, United Arab Emirates, United Kingdom, United States)")]
    [ValidateSet( 
        'Africa', 'Asia Pacific', 'Australia', 'Brazil', 'Canada', 'Europe', 'France', 'Germany', 'India',
        'Japan', 'Korea', 'Norway', 'Switzerland', 'United Arab Emirates', 'United Kingdom', 'United States')]
    [string] $AcsDataLocation = 'United States'
)
try
{
    # if SpaRedirectUris is not provided, use the default
    if (!$SpaRedirectUris) {
        $SpaRedirectUris = @(
            "https://localhost:8080/auth.html"
        )
    }
    # Remove non alphanumeric characters from Application Name
    $ApplicationName = $ApplicationName -replace '[^a-zA-Z0-9]', ''
    Write-Host "Starting Deployment for ${ApplicationName}"
    $c = Get-AzContext

    if (!$c) {
        # We must connect using the Device Authentication flow if running
        # from a devcontainer
        # If running from a local machine, you can remove -UseDeviceAuthentication flag
        $TenantParams = @{ }
        if ($TenantId)
        {
            $TenantParams = @{
                Tenant = $TenantId
            }
        }

        $SubscriptionParams = @{ }
        if ($SubscriptionId)
        {
            $SubscriptionParams = @{
                SubscriptionId = $SubscriptionId
            }
        }

        Write-Host @TenantParams @SubscriptionParams
        $c = Connect-AzAccount @TenantParams @SubscriptionParams -UseDeviceAuthentication | ForEach-Object Context
    }

    if ($c)
    {      
        # Set the context to the subscription
        Write-Host "`nContext is: "
        $c | Select-Object Account, Subscription, Tenant, Environment | Format-List | Out-String
        if (!$TenantId)
        {
            $TenantId = $c.Tenant.Id
        }

        # Create the Resource Group
        if (!(Get-AzResourceGroup -Name $ResourceGroupName -ErrorAction SilentlyContinue)) {
            Write-Host "Creating Resource Group"
            New-AzResourceGroup -Name $ResourceGroupName -Location $ResourceGroupLocation -ErrorAction stop
        }

        # Get the access token
        $token = (Get-AzAccessToken -ResourceTypeName MSGraph).token

        Write-Host "Creating App Registration"
        # Create the App Registration and update GNB Azure AD App
        ./Scripts/CreateAppRegistrations.ps1 `
            -ApplicationName $ApplicationName `
            -AccessToken $token `
            -SpaRedirectUris $SpaRedirectUris `

        Write-Host "Deploying resources to $($ResourceGroupName)"
        # Deploy the resources
        New-AzResourceGroupDeployment -TemplateFile ./bicep/main.bicep -TemplateParameterFile ./bicep/main.parameters.json -ResourceGroupName $ResourceGroupName

        # Create .env file
        Write-Host "Writing .env files locally"

        $envDevelopmentFilePath = "./.env.development"
        $envProductionFilePath = "./.env.production"
        # Overwrite the .env file
        Set-Content -Path $envDevelopmentFilePath -Value "TenantId=$($TenantId)"
        if ($pscmdlet.ParameterSetName -eq "GNB")
        {
            # GNB was set as the notification source
            ./Scripts/UpdateAppRegistrationsGnb.ps1 `
                -ApplicationName $ApplicationName `
                -AccessToken $token `
                -GnbClientId $GnbClientId `

            # set the GNB environment variables
            Add-Content -Path $envDevelopmentFilePath -Value "GnbEndpoint=$($GnbFunctionUrl)"
            Add-Content -Path $envDevelopmentFilePath -Value "GnbPermissionScope=api://$($GnbClientId)/Chat.Read"
            Add-Content -Path $envDevelopmentFilePath -Value "GnbSubscriptionDuration=60" # https://learn.microsoft.com/en-us/graph/api/resources/subscription?view=graph-rest-1.0#maximum-length-of-subscription-per-resource-type
            # Teams chat messsage and conversationMember maximum duration is 60 minutes
        }

        if ($pscmdlet.ParameterSetName -eq "ACS" -or $PSBoundParameters.ContainsKey("AcsDataLocation"))
        {
            # ACS was set as the notification source

            # Ensure ACS Service Principal exists in the tenant
            ./Scripts/AcsServicePrincipal.ps1

            # Deploy the ACS resource
            New-AzResourceGroupDeployment -TemplateFile ./bicep/mainAcs.bicep -ResourceGroupName $ResourceGroupName -AppName $ApplicationName -AcsDataLocation $AcsDataLocation
            $acsOutputs = (Get-AzResourceGroupDeployment -ResourceGroupName $ResourceGroupName -Name "mainAcs").Outputs

            # set the ACS environment variables
            Add-Content -Path $envDevelopmentFilePath -Value "AcsEndpoint=https://$($acsOutputs.acsHostName.value)"
            Add-Content -Path $envDevelopmentFilePath -Value "AcsGuestAccountName='Embedded Chat User'"
            Add-Content -Path $envDevelopmentFilePath -Value "AcsConnectionString=$(Get-AzKeyVaultSecret -VaultName "$($ApplicationName)kv" -Name 'AcsConnectionString' -AsPlainText)"
        }

        $outputs = (Get-AzResourceGroupDeployment -ResourceGroupName $ResourceGroupName -Name "main").Outputs

        Add-Content -Path $envDevelopmentFilePath -Value "ClientId=$($outputs.clientId.value)"
        Add-Content -Path $envDevelopmentFilePath -Value "ClientSecret=$(Get-AzKeyVaultSecret -VaultName "$($ApplicationName)kv" -Name 'ClientSecret' -AsPlainText)"
        Add-Content -Path $envDevelopmentFilePath -Value "StorageConnectionString=$(Get-AzKeyVaultSecret -VaultName "$($ApplicationName)kv" -Name 'StorageConnectionString' -AsPlainText)"
        
        # Copy the contents to the .env.production file
        Get-Content $envDevelopmentFilePath | Set-Content -Path $envProductionFilePath
        Add-Content -Path $envDevelopmentFilePath -Value "HostDomain=localhost:8080"
        Add-Content -Path $envProductionFilePath -Value "HostDomain=$($outputs.appServiceHostName.value)"

        # Build and deploy the web app
        ./Scripts/DeployAppService.ps1 -ResourceGroupName $ResourceGroupName -WebAppName $outputs.appServiceName.value

        Write-Host "Deployment complete"
        Write-Host "Your EmbeddedChat sample is available at https://$($outputs.appServiceHostName.value)"
        if ($pscmdlet.ParameterSetName -eq "GNB")
        {
            Write-Host "---NEXT STEPS---"
            Write-Host "Go to the GNB Function App and update the CORS URLs with your new Embedded Chat URL"
            Write-Host "Go to the SignalR Service and update the CORS URLs with your new Embedded Chat URL"
        }
    }
    else {
        throw 'Cannot get a context. Run `Connect-AzAccount -UseDeviceAuthentication`'
    }
}
catch {
    Write-Warning $_
    Write-Warning $_.exception
    Write-Warning -Message "Logging Out user"
    Logout-AzAccount
}
