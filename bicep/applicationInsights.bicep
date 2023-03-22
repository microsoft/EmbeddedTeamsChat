param name string

resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${name}ai'
  location: resourceGroup().location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

output applicationInsights object = applicationInsights
