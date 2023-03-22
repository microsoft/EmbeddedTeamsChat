# Prerequisites

1. Graph Notification Broker (GNB) : The GNB must be deployed in the same tenant and you will need to have access to it in order to perform configuration changes. Once GNB is deployed, take a note of URL of the GNB Backend Application and Client Id of the GNB Backend Application, we will need these details while running deployment script. Refer to the [Graph Notification Broker (GNB)](https://github.com/microsoft/GraphNotificationBroker) repo for installation instructions.

1. Microsoft Teams Policy: When using ACS as the notification source, these policies need to be set.
    - Navigate to [Teams Admin Center](https://admin.teams.microsoft.com)
    - Go to Meetings > Meeting policies
    - Click on the meeting policy that applies to all users (i.e. Global (Org-wide default)). This could also be a policy that applies to all of the users that will be using ACS as the notification source
    - Scroll down to 'Participants & guests'
    - Ensure the setting 'Automatically admit people' is set to 'Everyone'
    - For more information about this policy, refer to [Automatically admit people documentation](https://learn.microsoft.com/en-us/microsoftteams/meeting-policies-participants-and-guests#automatically-admit-people). This ensures that the web client users can initiate a Teams meeting chat.
    - For more informantion about meeting policies refer to [editing Microsoft teams meeting policy documentation](https://learn.microsoft.com/en-us/microsoftteams/meeting-policies-overview#edit-a-meeting-policy).

## Deployment

We recommend deploying this solution from a [devcontainer](https://code.visualstudio.com/docs/remote/create-dev-container)
or [GitHub CodeSpace](https://github.com/features/codespaces) for the easiest experience.

1. Open the repo in a GitHub CodeSpace or open it in a container with VSCode
    - All prerequisites will be installed automatically
1. Open up the terminal (ctrl + J) or click on the deploy.ps1 file
1. Embedded chat can be deployed with one notification source or with both sources. Copy one of the examples below and update with your values to deploy
    - Example (GNB only): `./deploy.ps1 -ApplicationName EmbeddedChat -ResourceGroupName EmbeddedChat -ResourceGroupLocation eastus -GnbClientId 6c3a5d23-xxxx-xxxx-xxxx-5bbc7fb12a6c -GnbFunctionUrl "https://<YourGnbFunctionName>.azurewebsites.net"`
    - Example (ACS only): `./deploy.ps1 -ApplicationName EmbeddedChat -ResourceGroupName EmbeddedChat -ResourceGroupLocation eastus -AcsDataLocation "United States"`
    - Example (GNB & ACS): `./deploy.ps1 -ApplicationName EmbeddedChat -ResourceGroupName EmbeddedChat -ResourceGroupLocation eastus -GnbClientId 6c3a5d23-xxxx-xxxx-xxxx-5bbc7fb12a6c -GnbFunctionUrl "https://<YourGnbFunctionName>.azurewebsites.net" -AcsDataLocation "United States"`
    - Optional Parameters: You can add any of these optional parameters when executing the deploy.ps1 script. TenantId and SubscriptionId are used during the sign in process to choose the correct tenant and subscription if you have access to multiple. SpaRedirectUris is to add a specific SPA Redirect Uri to the Azure AD Application during creation.
        - SpaRedirectUris
        - TenantId
        - SubscriptionId
<em>

 > **Note**
    > -GnbClientId and -GnbFunctionUrl passed in deployment script parameters are the Client Id of the GNB Backend Application ( apiClientId) and URL of the GNB Backend Application configured as part of Prerequisites. For the parameter -AcsDataLocation you specify a [geography](https://learn.microsoft.com/en-us/azure/communication-services/concepts/privacy#data-residency) (not an Azure data center location).
</em>

### What does the deployment do?

1. Azure PowerShell prompts you to login
1. Create the Resource Group if it doesn't already exist
1. [Script] Create the Azure AD Application Registration
    - Creates an App Registration
    - Adds all of the necessary permissions for both Notification Sources (ACS and GNB)
    - Creates a Client Secret which is used to interact with Microsoft Graph on-behalf of the user when using the ACS Notification Source
    - Creates a `main.parameter.json` file in the bicep folder needed for the deployment
    - Updates the GNB Azure AD Application to include the new embedded chat App Id in the `KnownClientApplications` property
1. [Bicep] Deploy the resources to Azure
    - Azure Storage Account
    - Azure Web App
    - Azure Key Vault
    - Azure Communication Services
1. Creates the following .env files which are used when the code is compiled and in local development
    - .env.development: used for local development
    - .env.production: used for compiling the code before deploying
1. Install the front end package dependencies
1. Clean the dotnet release folder
1. Build and Publish the dotnet app
1. Create a zip of the built dotnet app and frontend app
1. Deploy the code to the Azure Web App

## After Deployment Steps

The GNB and SignalR service are running on separate domains, which means that cross origin requests will be blocked if they are not added to the allow list. Follow these steps to add the CORS entry for the GNB and SignalR service.

1. Copy the URL to the newly deployed Embedded Chat App
1. Go to the GNB Azure Function
    - Scroll down to the CORS tab on the left side menu pane
    - Paste the Embedded Chat URL into the 'Allowed Origins' text box
    - Click Save
    - After it saves, refresh the browser to verify it was saved successfuly
1. Go to the GNB SignalR instance
    - Scroll down to the CORS tab on the left side menu pane
    - Paste the Embedded Chat URL into the 'Allowed Origins' text box
    - Click Save
    - After it saves, refresh the browser to verify it was saved successfuly

## Run Embedded Chat Locally

1. Open up the terminal (ctrl + J) and run the command `npm install` from the root directory to download all of the front end packages and dependencies.
1. Start the application in Visual Code by pressing F5 or Run -> Debug. The application will build the dotnet app and the frontend client. A browser will open with the sample application (see below). Enter an Entity Id, a Chat Topic, and click "Refresh Embed". The first time running the app, you will be asked to log in and grant consent the required permissions.

![Embedded Chat Sample](/images/embeddedchat_sample_app.png)

### HTTPS Certificate with Container

When running the application hosted on `https`, you will need to have a self-signed certificate for the localhost domain. Otherwise your browser will show that their is not a certificate for the site and is insecure. You can find detailed steps and documentation for [Developing ASP.NET Core Applications with Docker over HTTPS](https://github.com/dotnet/dotnet-docker/blob/main/samples/run-aspnetcore-https-development.md).

These are the high-level steps needed to host the site with a self-signed certificate:

1. Create a self-signed certificate on your local machine
1. Trust the self-signed certificate
1. Uncomment the mounts source in the [devcontainer.json](./.devcontainer/devcontainer.json) file. This will add a [local file mount](https://code.visualstudio.com/remote/advancedcontainers/add-local-file-mount) which allows the container to have access to the folder where the certificate is stored on the local machine
1. Uncomment the env variables in the [launch.json](./.vscode/launch.json) file to include:
    - "ASPNETCORE_Kestrel__Certificates__Default__Password": "CREDENTIAL_PLACEHOLDER", (placeholder password)
    - "ASPNETCORE_Kestrel__Certificates__Default__Path": "/https/aspnetapp.pfx" (default path)

## Redeploy Application

To redeploy the application, open the terminal and run following command. If the parametmers $ResourceGroupName and $ApplicationName are not loaded, you can copy the values from the resource group in Azure.

```powershell
    # Build and deploy the web app
    ./Scripts/DeployAppService.ps1 -ResourceGroupName $ResourceGroupName -WebAppName "$($ApplicationName)app"
```

## Embedding Chat in Multiple LOB Applications

If you foresee the need to have chats on the same entity from different LOB apps, consider a suffix on the entity ID (ex: PO123_Salesforce and PO123_ServiceNow). If you need multiple chats on the same entity in the same LOB app, you can again use a suffix strategy (ex: PO123a, PO123b, PO123c).

## CORS

In development scenarios, the frontend and backend application are hosted on the same domain and port. In a production scenario, the frontend app and the backend app will be hosted on separate domains. In order for the frontend to make requests to the backend, Cross-Origin Requests (CORS) needs to be configured. There are two different ways that you can configure CORS when the application is deployed to Azure App Service.

1. (RECOMMENDED) Updating the CORS configuration setting in the App Service with the frontend domain. [Enable CORS in Azure App Service Tutorial](https://learn.microsoft.com/en-us/azure/app-service/app-service-web-tutorial-rest-api)
1. Updating the code to create a CORS policy with the frontend domain
    - This requires a code deployment to enable the CORS policy, but gives you more control over the CORS policies

In local development (not using Azure App Service) and support for CORS is needed, you can add the following code to the Program.cs file. **NOTE** the CORS policy must be added before `var app = builder.Build();` and enabling CORS `app.UseCors()`, must be after the `builder.Build()` line.

```c#
// Add this
// CORS Policy
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(
        policy =>
        {
            policy.WithOrigins("http://example.com", "http://www.contoso.com"); // Replace with your domain(s)
        });
});
// CORS Policy

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Enable CORS
app.UseCors();
// Enable CORS
```
