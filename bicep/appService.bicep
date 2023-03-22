@description('The name of the web app that you wish to create.')
param name string

resource applicationInsights 'Microsoft.Insights/components@2020-02-02' existing = {
  name: '${name}ai'
}

resource uai 'Microsoft.ManagedIdentity/userAssignedIdentities@2022-01-31-preview' existing = {
  name: toLower('${name}uai')
}

resource appServicePlan 'Microsoft.Web/serverfarms@2022-03-01' = {
  name: '${name}asp'
  location: resourceGroup().location
  sku: {
    name: 'S1'
  }
}

resource appService 'Microsoft.Web/sites@2022-03-01' = {
  name: toLower('${name}app')
  location: resourceGroup().location
  kind: 'app'
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${resourceId('Microsoft.ManagedIdentity/userAssignedIdentities/', uai.name )}': {}
    }
  }
  properties: {
    keyVaultReferenceIdentity: uai.id
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      appSettings: [
        {
          name: 'APPINSIGHTS_INSTRUMENTATIONKEY'
          value: applicationInsights.properties.InstrumentationKey
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: applicationInsights.properties.ConnectionString
        }
        {
          name: 'ClientId'
          value: '@Microsoft.KeyVault(VaultName=${name}kv;SecretName=ClientId)'
        }
        {
          name: 'ClientSecret'
          value: '@Microsoft.KeyVault(VaultName=${name}kv;SecretName=ClientSecret)'
        }
        {
          name: 'TenantId'
          value: '@Microsoft.KeyVault(VaultName=${name}kv;SecretName=TenantId)'
        }
        {
          name: 'AcsConnectionString'
          value: '@Microsoft.KeyVault(VaultName=${name}kv;SecretName=AcsConnectionString)'
        }
        {
          name: 'StorageConnectionString'
          value: '@Microsoft.KeyVault(VaultName=${name}kv;SecretName=StorageConnectionString)'
        }
      ]
      ftpsState: 'FtpsOnly'
      minTlsVersion: '1.2'
    }
  }
}

output hostname string = appService.properties.defaultHostName
output name string = appService.name
