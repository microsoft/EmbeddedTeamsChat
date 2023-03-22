// <copyright file="Mapping.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

namespace EmbeddedChat.Models
{
    using Newtonsoft.Json;

    /// <summary>
    /// Class for Mapping.
    /// </summary>
    public class CreateMeetingRequest : Mapping
    {
        [JsonProperty("participants")]
        public List<Person> Participants { get; set; }
    }
}
