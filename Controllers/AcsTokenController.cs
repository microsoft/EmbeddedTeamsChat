
// <copyright file="AcsTokenController.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using EmbeddedChat.Models;
using Azure.Communication.Identity;
using EmbeddedChat.Services;
using System.Net.Http.Headers;

namespace EmbeddedChat.Controllers;

/// <summary>
/// /// Web API for getting the Acs token.
/// </summary>
[Authorize]
[ApiController]

public class AcsTokenController : ControllerBase
{
    private readonly IGraphService _graphService;
    private readonly IAcsService _acsService;
    private readonly AppSettings _settings;
    private readonly ILogger _logger;
    private const string _acsTeamsManageCallsScope = "https://auth.msft.communication.azure.com/Teams.ManageCalls";

    /// <summary>
    /// Initializes a new instance of the <see cref="AcsTokenController"/> class.
    /// </summary>
    /// <param name="graphService">graphservice.</param>
    /// <param name="acsService">acsService.</param>
    /// <param name="logger">The logger.</param>
    public AcsTokenController(IGraphService graphService, IAcsService acsService, IOptions<AppSettings> options, ILogger<AcsTokenController> logger)
    {
        _graphService = graphService;
        _acsService = acsService;
        _settings = options.Value;
        _logger = logger;
    }

    [HttpGet]
    [Route("/api/acsToken")]
    public async Task<IActionResult> GetToken([FromHeader] string authorization)
    {
        _logger.LogInformation("Run endpoint {endpoint} {verb}", "/api/acsToken", "GET");
        //to exchange token
        var hasValidTokenFormat = AuthenticationHeaderValue.TryParse(authorization, out AuthenticationHeaderValue authHeader);
        if (!hasValidTokenFormat || authHeader?.Parameter == null )
        {
            _logger.LogError("Access token is not valid");
            return BadRequest("Access token is not valid");
        }

        var userId = User.FindFirst("http://schemas.microsoft.com/identity/claims/objectidentifier")?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            _logger.LogError("User Id is not valid");
            return BadRequest("User Id is not valid");
        }

        // Create user Id and ACS token
        var acsInfoBasic = await _acsService.CreateIdentityAndGetTokenAsync(new[] { CommunicationTokenScope.Chat, CommunicationTokenScope.VoIP });

        // Exchange the user Azure AD Access token of the Teams User for a Communication Identity access token
        // Step 1: In the token exchange flow get a token for the Teams user by using Graph Service.
        string userAccessToken = await _graphService.GetOnBehalfOfToken(new[] { _acsTeamsManageCallsScope }, authHeader.Parameter);
        
        // Step 2: Exchange the Azure AD access token of the Teams User for a Communication Identity access token
        var acsTokenForTeamsUser = await _acsService.GetTokenForTeamsUserAsync(userAccessToken, userId);

        return Ok(new AcsInfo()
        {
            AcsToken = acsInfoBasic.accessToken,
            AcsUserId = acsInfoBasic.userId,
            TokenExpiresOn = acsInfoBasic.expiresOn.ToString("F"),
            CommIdentityToken = acsTokenForTeamsUser
        });
    }
}
