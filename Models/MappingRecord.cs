// <copyright file="Mapping.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

namespace EmbeddedChat.Models
{
    using Azure;
    using Azure.Data.Tables;

    /// <summary>
    /// Class for Mapping.
    /// </summary>
    public class MappingRecord : ITableEntity
    {
        public string RowKey { get; set; }
        public string PartitionKey { get; set; }
        public ETag ETag { get; set; }
        public DateTimeOffset? Timestamp { get; set; }
        public string EntityId { get; set; }
        public bool DisableAddParticipants { get; set; }
        public string ThreadInfo { get; set; }
        public string? AcsInfo { get; set; }
        public string Participants { get; set; }
    }
}
