// <copyright file="Person.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

namespace EmbeddedChat.Models
{
    using Newtonsoft.Json;

    /// <summary>
    /// Class for Person.
    /// </summary>
    public class Person
    {
        [JsonProperty("id")]
        public string Id { get; set; }

        [JsonProperty("userPrincipalName")]
        public string UserPrincipalName { get; set; }

        [JsonProperty("displayName")]
        public string DisplayName { get; set; }
    }
}