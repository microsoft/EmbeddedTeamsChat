// <copyright file="ThreadInfo.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

namespace EmbeddedChat.Models
{
    using Newtonsoft.Json;

    /// <summary>
    /// Class for ThreadInfo.
    /// </summary>
    public class ThreadInfo
    {
        [JsonProperty("threadId")]
        public string? ThreadId { get; set; }

        [JsonProperty("topicName")]
        public string TopicName { get; set; }

        [JsonProperty("meetingId")]
        public string? MeetingId { get; set; }

        [JsonProperty("joinUrl")]
        public string? JoinUrl { get; set; }

        [JsonProperty("owner")]
        public Person Owner { get; set; }
    }
}