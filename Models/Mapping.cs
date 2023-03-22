// <copyright file="Mapping.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

namespace EmbeddedChat.Models
{
    using Newtonsoft.Json;

    /// <summary>
    /// Class for Mapping.
    /// </summary>
    public class Mapping
    {
        [JsonProperty("entityId")]
        public string EntityId { get; set; }

        [JsonProperty("disableAddParticipants")]
        public bool DisableAddParticipants { get; set; }

        [JsonProperty("threadInfo")]
        public ThreadInfo ThreadInfo { get; set; }
    }
}
