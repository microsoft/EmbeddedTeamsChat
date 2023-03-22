
// <copyright file="AcsTokenController.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EmbeddedChat.Models;
using EmbeddedChat.Services;
using System.Net.Http.Headers;
using Microsoft.Graph;
using Microsoft.Graph.Models;

namespace EmbeddedChat.Controllers;

/// <summary>
/// /// Web API for getting the Acs token.
/// </summary>
[Authorize]
[ApiController]

public class GraphController : ControllerBase
{
    private readonly IGraphService _graphService;
    private readonly ILogger<GraphController> _logger;

    /// <summary>
    /// Initializes a new instance of the <see cref="GraphController"/> class.
    /// </summary>
    /// <param name="graphService">graphService.</param>
    /// <param name="logger">The logger.</param>
    public GraphController(IGraphService graphService, ILogger<GraphController> logger)
    {
        _graphService = graphService;
        _logger = logger;
    }

    [HttpPost]
    [Route("/api/createMeeting")]
    public async Task<IActionResult> CreateMeeting([FromBody] CreateMeetingRequest data, [FromHeader] string authorization)
    {
        try
        {
            _logger.LogInformation("Run endpoint {endpoint} {verb}", "/api/createMeeting", "POST");
            var hasValidTokenFormat = AuthenticationHeaderValue.TryParse(authorization, out AuthenticationHeaderValue authHeader);
            if (!hasValidTokenFormat || authHeader?.Parameter == null )
            {
                _logger.LogError("Access token is not valid");
                return BadRequest("Access token is not valid");
            }

            // Initialize the graph client
            _logger.LogInformation("Getting GraphService with accesstoken for Graph onbehalf of user");
            var graphServiceClient = _graphService.GetUserGraphServiceClient(authHeader.Parameter);

            // Create a new online meeting
            var onlineMeeting = await _graphService.CreateOnlineMeetingAsync(graphServiceClient, data.EntityId, data.DisableAddParticipants, data.ThreadInfo, data.Participants);

            // Return the custom Chat Info entity
            return Ok(new Models.ThreadInfo
            {
                MeetingId = onlineMeeting.Id,
                ThreadId = onlineMeeting.ChatInfo.ThreadId,
                JoinUrl = onlineMeeting.JoinWebUrl,
                TopicName = onlineMeeting.Subject
            });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, ex);
        }
    }
}

