@description('Storage Account type')
@allowed([
  'Standard_LRS'
  'Standard_GRS'
  'Standard_RAGRS'
])
param storageAccountType string = 'Standard_LRS'

param name string

resource storageAccount 'Microsoft.Storage/storageAccounts@2022-09-01' = {
  name: toLower('${name}sa')
  location: resourceGroup().location
  sku: {
    name: storageAccountType
  }
  kind: 'StorageV2'
}


output storageAccount object = storageAccount
