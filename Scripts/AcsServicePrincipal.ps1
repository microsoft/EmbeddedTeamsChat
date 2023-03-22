#Requires -Module Az.Resources

try {
    Write-Host "Verifying ACS Service Principal exists"
    $AcsAppId = "1fd5118e-2576-4263-8130-9503064c837a"
    $ServicePrincipalId = (Get-AzADServicePrincipal -Filter "AppId eq '$($AcsAppId)'").Id
    
    if ($ServicePrincipalId) {
        Write-Host "ACS Service Principal is registered for the Tenant"
    }
    else {
        Write-Host "Creating ACS Service Principal"
        New-AzADServicePrincipal -AppId $AcsAppId
    }
}
catch {
    Write-Warning $_
    Write-Warning $_.exception
}