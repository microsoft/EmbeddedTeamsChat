using Azure.Communication.Identity;
using EmbeddedChat.Models;
using Microsoft.Extensions.Options;

namespace EmbeddedChat.Services
{
    public class AcsService : IAcsService
    {
        private readonly CommunicationIdentityClient _acsIdentityClient;
        private readonly AppSettings _settings;
        private readonly ILogger _logger;

        /// <summary>
        /// Constructor 
        /// </summary>
        /// <param name="logger"></param>
        
        public AcsService(IOptions<AppSettings> settings, ILogger<AcsService> logger)
        {
            _settings = settings.Value;
            _logger = logger;
            _acsIdentityClient = new CommunicationIdentityClient(_settings.AcsConnectionString);
        }

        /// <summary>
        /// Creates ACS Identity User and the ACS Token
        /// </summary>
        /// <returns></returns>
        public async Task<(string userId, string accessToken, DateTimeOffset expiresOn)> CreateIdentityAndGetTokenAsync(CommunicationTokenScope[] scopes)
        {
            _logger.LogInformation("Run function {verb}", "CreateIdentityAndGetTokenAsync");

            // Create an identity
            var acsUserIdentityResponse = await _acsIdentityClient.CreateUserAsync();
            var acsUserIdentity = acsUserIdentityResponse.Value;
            _logger.LogInformation($"\nCreated an identity with ID: {acsUserIdentity.Id}");

            // Issue access tokens
            // Issue an access token with the "voip" and "chat" scope for an identity
            var tokenResponse = await _acsIdentityClient.GetTokenAsync(acsUserIdentity, scopes);

            // Get the token from the response
            var token = tokenResponse.Value.Token;
            var expiresOn = tokenResponse.Value.ExpiresOn;

            // Write the token details to the screen
            _logger.LogInformation($"\nIssued an access token with {scopes.ToString()} scope that expires at {expiresOn}:");
            
            return (acsUserIdentity.Id, token, expiresOn);
        }

        /// <summary>
        /// Use the GetTokenForTeamsUser method to issue an access token for the Teams user that can be used with the Azure Communication Services SDKs.
        /// </summary>
        /// <param name="teamsUserAccessToken"></param>
        /// <returns></returns>
        public async Task<string> GetTokenForTeamsUserAsync(string teamsUserAccessToken, string userId)
        {
            var options = new GetTokenForTeamsUserOptions(teamsUserAccessToken, _settings.ClientId, userId);
            var accessToken = await _acsIdentityClient.GetTokenForTeamsUserAsync(options);
            if (accessToken == null)
                throw new ApplicationException("Failed to obtain the access token for the Teams User");

            return accessToken.Value.Token;
        }
    }
}