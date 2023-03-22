using Azure.Identity;
using Microsoft.Graph;
using Microsoft.Identity.Client;
using EmbeddedChat.Models;
using Microsoft.Extensions.Options;
using Microsoft.Graph.Models;

namespace EmbeddedChat.Services
{
    public class GraphService : IGraphService
    {
        private readonly AppSettings _settings;
        private readonly IConfidentialClientApplication _app;
        private readonly ILogger<GraphService> _logger;
        private const string authority = "https://login.microsoftonline.com";
        
        /// <summary>
        /// Constructor: create graph service client 
        /// </summary>
        public GraphService(IOptions<AppSettings> options, ILogger<GraphService> logger)
        {
            _settings = options.Value;
            _logger = logger;

            _app = ConfidentialClientApplicationBuilder
                .Create(_settings.ClientId)
                .WithClientSecret(_settings.ClientSecret)
                .WithTenantId(_settings.TenantId)
                .WithAuthority(authority + "/" + _settings.TenantId)
                .Build();
        }

        public GraphServiceClient GetUserGraphServiceClient(string userAssertion)
        {
            var tenantId = _settings.TenantId;
            var clientId = _settings.ClientId;
            var clientSecret = _settings.ClientSecret;

            if (string.IsNullOrEmpty(tenantId) ||
                string.IsNullOrEmpty(clientId) ||
                string.IsNullOrEmpty(clientSecret))
            {
                _logger.LogError("Required settings missing: 'tenantId', 'apiClientId', and 'apiClientSecret'.");
                throw new ArgumentNullException("Required settings missing: 'tenantId', 'apiClientId', and 'apiClientSecret'.");
            }

            var onBehalfOfCredential = new OnBehalfOfCredential(
                tenantId, clientId, clientSecret, userAssertion);

            return new GraphServiceClient(onBehalfOfCredential);
        }

        /// <summary>
        /// Get the token for the Teams user through the Token Exchange flow
        /// </summary>
        /// <param name="scope"></param>
        /// <param name="userToken"></param>
        /// <returns></returns>
        /// <exception cref="ApplicationException"></exception>
        public async Task<string> GetOnBehalfOfToken(string[] scopes, string userToken)
        {
            try
            {
                // Use Microsoft.Identity.Client to retrieve token
                var assertion = new UserAssertion(userToken);
                var result = await _app.AcquireTokenOnBehalfOf(scopes, assertion).ExecuteAsync();
                string accessToken = result.AccessToken;
                if (accessToken == null)
                {
                    throw new Exception("Access Token could not be acquired.");
                }
                return result.AccessToken;
            }
            catch (MsalUiRequiredException e)
            {
                string failureReason = "Failed to receive the Azure AD user token for Teams User";
                if (e.Classification == UiRequiredExceptionClassification.ConsentRequired)
                {
                    failureReason = "The user or admin has not provided sufficient consent for the application";
                }
                _logger.LogError(failureReason);
                throw new ApplicationException(failureReason);
            }
        }

        /// <summary>
        /// Create a new Online Meeting
        /// </summary>
        /// <param name="requestData"></param>
        /// <returns></returns>
        public async Task<OnlineMeeting> CreateOnlineMeetingAsync(GraphServiceClient graphClient, string entityId, bool disableAddParticipants, ThreadInfo threadInfo, List<Models.Person> participants)
        {
            _logger.LogInformation($"Activity {nameof(CreateOnlineMeetingAsync)} has started.");
            // Assign the chat topic to the subject if it exists, otherwise, use the Thread Id as the subject
            var subject = threadInfo.TopicName ?? threadInfo.ThreadId;

            try
            {
                // Compile the participants list
                var attendees = new List<MeetingParticipantInfo>();

                foreach (var participant in participants)
                {
                    if (participant == null) continue;
                    var member = new MeetingParticipantInfo
                    {
                        Upn = participant.UserPrincipalName,
                        Role = OnlineMeetingRole.Attendee,
                    };
                    attendees.Add(member);
                }

                var onlineMeeting = new OnlineMeeting
                {
                    Subject = subject,
                    Participants = new MeetingParticipants
                    {
                        Attendees = attendees
                    }
                };

                // Create a new Online Meeting
                var meetingResponse = await graphClient.Users[threadInfo.Owner.Id].OnlineMeetings.PostAsync(onlineMeeting);
                _logger.LogInformation($"Successfully created online meeting: {meetingResponse.Id}");   

                return meetingResponse;
            }
            catch (Exception ex)
            {
                if (ex.InnerException != null)
                _logger.LogError(ex.InnerException.Message);
                throw;
            }
        }
    }
}