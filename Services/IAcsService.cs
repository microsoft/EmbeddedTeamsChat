// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

using Azure.Communication.Identity;

namespace EmbeddedChat.Services
{
    public interface IAcsService
    {
        Task<(string userId, string accessToken, DateTimeOffset expiresOn)> CreateIdentityAndGetTokenAsync(CommunicationTokenScope[] scopes);

         Task<string> GetTokenForTeamsUserAsync(string teamsUserAccessToken, string userId);
    }
}
