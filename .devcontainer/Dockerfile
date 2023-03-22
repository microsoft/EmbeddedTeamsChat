# See here for image contents: https://github.com/microsoft/vscode-dev-containers/tree/v0.177.0/containers/ubuntu/.devcontainer/base.Dockerfile

ARG VARIANT="6.0"
FROM --platform=linux/amd64 mcr.microsoft.com/vscode/devcontainers/dotnet:${VARIANT} AS build-env

# Install Microsoft.Graph PowerShell Module
RUN /usr/bin/pwsh -c "install-module az, Microsoft.Graph -Force -Scope AllUsers"

# Install bicep
# Fetch the latest Bicep CLI binary
RUN curl -Lo bicep https://github.com/Azure/bicep/releases/latest/download/bicep-linux-x64

# Mark it as executable
RUN chmod +x ./bicep
# Add bicep to your PATH (requires admin)
RUN sudo mv ./bicep /usr/local/bin/bicep