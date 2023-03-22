// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

using EmbeddedChat.Models;
using Microsoft.Graph;
using Microsoft.Graph.Models;

namespace EmbeddedChat.Services
{
    public interface IGraphService
    {
        GraphServiceClient GetUserGraphServiceClient(string userAssertion);

        Task<string> GetOnBehalfOfToken(string[] scopes, string userToken);
        Task<OnlineMeeting> CreateOnlineMeetingAsync(GraphServiceClient graphServiceClient, string entityId, bool disableAddParticipants, ThreadInfo threadInfo, List<Models.Person> participants);
    }
}
