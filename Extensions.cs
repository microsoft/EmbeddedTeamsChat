namespace EmbeddedChat
{
    using EmbeddedChat.Models;
    using Newtonsoft.Json;

    /// <summary>
    /// Class for Extensions.
    /// </summary>
    public static class Extensions
    {
        public static MappingRecord ToMappingRecord(this Mapping mapping)
        {
            // Convert (serialize) the complex types into their JSON representation before writting into the storage
            var mappingRecord = new Models.MappingRecord
            {
                PartitionKey = mapping.EntityId,
                RowKey = mapping.ThreadInfo.Owner.Id,
                EntityId = mapping.EntityId,
                DisableAddParticipants = mapping.DisableAddParticipants,
                ThreadInfo = JsonConvert.SerializeObject(mapping.ThreadInfo)
            };
            return mappingRecord;
        }

        public static Mapping ToMapping(this MappingRecord mappingRecord, string entityId)
        {
            var mapping = new Mapping() { EntityId = entityId };
            mapping.DisableAddParticipants = mappingRecord.DisableAddParticipants;
            mapping.ThreadInfo = JsonConvert.DeserializeObject<Models.ThreadInfo>(mappingRecord.ThreadInfo);
            return mapping;
        }
    }
}