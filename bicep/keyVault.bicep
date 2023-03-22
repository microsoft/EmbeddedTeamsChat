
param name string
param clientId string
@secure()
param clientSecret string

@description('Specifies whether Azure Virtual Machines are permitted to retrieve certificates stored as secrets from the key vault.')
param enabledForDeployment bool = false

@description('Specifies whether Azure Disk Encryption is permitted to retrieve secrets from the vault and unwrap keys.')
param enabledForDiskEncryption bool = false

@description('Specifies whether Azure Resource Manager is permitted to retrieve secrets from the key vault.')
param enabledForTemplateDeployment bool = false

@description('Specifies the Azure Active Directory tenant ID that should be used for authenticating requests to the key vault. Get it by using Get-AzSubscription cmdlet.')
param tenantId string = subscription().tenantId

@description('Specifies whether the key vault is a standard vault or a premium vault.')
@allowed([
  'standard'
  'premium'
])
param skuName string = 'standard'

resource storageAccount 'Microsoft.Storage/storageAccounts@2022-09-01' existing = {
  name: toLower('${name}sa')
}

resource kv 'Microsoft.KeyVault/vaults@2022-07-01' = {
  name: '${name}kv'
  location: resourceGroup().location
  properties: {
    enabledForDeployment: enabledForDeployment
    enabledForDiskEncryption: enabledForDiskEncryption
    enabledForTemplateDeployment: enabledForTemplateDeployment
    tenantId: tenantId
    enableRbacAuthorization: true
    sku: {
      name: skuName
      family: 'A'
    }
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
  }
}

resource tenant 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  parent: kv
  name: 'TenantId'
  properties: {
    value: tenantId
  }
}

resource appClientId 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  parent: kv
  name: 'ClientId'
  properties: {
    value: clientId
  }
}

resource appClientSecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  parent: kv
  name: 'ClientSecret'
  properties: {
    value: clientSecret
  }
}

resource storageConnectionString 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  parent: kv
  name: 'StorageConnectionString'
  properties: {
    value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=${environment().suffixes.storage};AccountKey=${storageAccount.listKeys().keys[0].value}'
  }
}

resource acsConnectionString 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  parent: kv
  name: 'AcsConnectionString'
  properties: {
    value: ''
  }
}
