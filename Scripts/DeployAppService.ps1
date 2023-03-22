# Requires -Module Az.Resources
param (
    [Parameter(Mandatory = $true)]
    [string] $ResourceGroupName,
    [Parameter(Mandatory = $true)]
    [string] $WebAppName
)
try {
    # Build and publish the app
    Write-Host "Building Frontend App"
    npm install
    npm run build
    Write-Host "Building Backend App"
    dotnet clean -c Release
    dotnet publish -c Release
    $publishPath = Join-Path -Path "." -ChildPath "bin" "Release" "net7.0" "publish"
    $deployZipPath = Join-Path -Path $publishPath -ChildPath "deploy.zip"
    $compressPath = Join-Path -Path $publishPath -ChildPath "*"

    Write-Host "Building a zip package of compiled code"
    Compress-Archive -Path $compressPath -DestinationPath $deployZipPath -Update
    Write-Host "Deploying to Azure"
    Publish-AzWebApp -ResourceGroupName $ResourceGroupName -Name $WebAppName -ArchivePath (Get-Item $deployZipPath).FullName -Force
}
catch {
    Write-Warning $_
    Write-Warning $_.exception
}