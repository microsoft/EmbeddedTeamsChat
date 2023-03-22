// <copyright file="MappingRepository.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

using Azure.Data.Tables;
using EmbeddedChat.Models;
using Newtonsoft.Json;

namespace EmbeddedChat.Repositories
{
    /// <summary>
    /// Class MappingRepository
    /// </summary>
    public class MappingRepository
    {
        private TableServiceClient tableServiceClient;
        public MappingRepository(TableServiceClient tableServiceClient) 
        {
            this.tableServiceClient = tableServiceClient;
        }

        public async Task<Mapping> GetById(string entityId)
        {
            // New instance of the TableClient class
            TableClient tableClient = this.tableServiceClient.GetTableClient(
                tableName: "mappings"
            );
            await tableClient.CreateIfNotExistsAsync();

            // initialize the mapping to return
            var mapping = new Models.Mapping() { EntityId = entityId };

            // try to retrieve existing mapping by entityId
            var results = tableClient.Query<Models.MappingRecord>(i => i.PartitionKey == entityId);
            var dbMapping = results?.FirstOrDefault();

            if (dbMapping != null)
                mapping = dbMapping.ToMapping(entityId);

            return mapping;
        }

        public async Task UpdateMapping(Models.Mapping mapping)
        {
            // New instance of the TableClient class
            TableClient tableClient = this.tableServiceClient.GetTableClient(
                tableName: "mappings"
            );
            await tableClient.CreateIfNotExistsAsync();

            // get the existing mapping from storage
            var results = tableClient.Query<Models.MappingRecord>(i => i.PartitionKey == mapping.EntityId);
            var dbMapping = results?.FirstOrDefault();

            // process based on storage
            if (dbMapping == null) {
                // create
                dbMapping = mapping.ToMappingRecord();
                tableClient.AddEntity<Models.MappingRecord>(dbMapping);
            }
            else {
                // update
                dbMapping = mapping.ToMappingRecord();
                tableClient.UpdateEntity<Models.MappingRecord>(dbMapping, Azure.ETag.All);
            }
        }
    }
}