param appName string
param userId string
param clientId string
@secure()
param clientSecret string

module storageAccount 'storageAccount.bicep' = {
  name: 'dp${appName}-StorageAccount'
  params: {
    name: appName
  }
}

module uai 'uai.bicep' = {
  name: 'dp${appName}-uai'
  params: {
    name: appName
    userId: userId
  }
}

module applicationInsights 'applicationInsights.bicep' = {
  name: 'dp${appName}-AppInsights'
  params: {
    name: appName
  }
}

module keyVault 'keyVault.bicep' = {
  name: 'dp${appName}-kv'
  params: {
    name: appName
    clientId: clientId
    clientSecret: clientSecret
  }
  dependsOn: [
    storageAccount
  ]
}

module appService 'appService.bicep' = {
  name: 'dp${appName}-WebApp'
  params: {
    name: appName
  }
  dependsOn: [
    storageAccount
    applicationInsights
    keyVault
    uai
  ]
}

output clientId string = clientId
output appServiceHostName string = appService.outputs.hostname
output appServiceName string = appService.outputs.name
