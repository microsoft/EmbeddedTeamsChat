@minLength(2)
param name string
param dataLocation string

resource kv 'Microsoft.KeyVault/vaults@2022-07-01' existing = {
  name: '${name}kv'
}

// create the ACS resource
resource acsService 'Microsoft.Communication/communicationServices@2022-07-01-preview' = {
  name: '${name}acs'
  location: 'global'
  properties: {
    dataLocation: dataLocation
  }
}

// set the ACS key in key vault
resource acsKey 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  parent: kv
  name: 'AcsConnectionString'
  properties: {
    value: acsService.listKeys().primaryConnectionString
  }
}

output acsName string = acsService.name
output acsHostName string = acsService.properties.hostName
