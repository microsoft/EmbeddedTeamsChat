// <copyright file="AcsInfo.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

namespace EmbeddedChat.Models
{
    using Newtonsoft.Json;

    /// <summary>
    /// Class for AcsInfo.
    /// </summary>
    public class AcsInfo
    {
        [JsonProperty("acsUserId")]
        public string AcsUserId { get; set; }

        [JsonProperty("acsToken")]
        public string AcsToken { get; set; }

        [JsonProperty("tokenExpiresOn")]
        public string TokenExpiresOn { get; set; }

        [JsonProperty("commIdentityToken")]
        public string CommIdentityToken { get; set; }
    }
}