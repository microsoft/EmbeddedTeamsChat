param appName string
param acsDataLocation string

module communicationServices 'acs.bicep' = {
  name: 'dp${appName}-ACS'
  params: {
    name: appName
    dataLocation: acsDataLocation
  }
}

output acsHostName string = communicationServices.outputs.acsHostName
