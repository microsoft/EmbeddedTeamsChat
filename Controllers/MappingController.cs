using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace EmbeddedChat.Controllers;

[Authorize]
[ApiController]
public class MapingController : ControllerBase
{
    private Repositories.MappingRepository mappingRepository;
    private readonly ILogger<MapingController> logger;
    public MapingController(Repositories.MappingRepository mappingRepository,ILogger<MapingController> logger) 
    {
        this.mappingRepository = mappingRepository;
        this.logger = logger;
    }

    [HttpGet]
    [Route("/api/mapping/{entityId}")]
    public async Task<IActionResult> Initialize(string entityId)
    {
        logger.LogInformation("Run endpoint {endpoint} {verb}", "/api/mapping/", "GET");
        // ensure entity id passed in
        if (string.IsNullOrEmpty(entityId))
            return StatusCode((int)System.Net.HttpStatusCode.BadRequest, "entityId is required for initialization");

        var mapping = await this.mappingRepository.GetById(entityId);

        return Ok(mapping);
    }

    [HttpPatch]
    [Route("/api/mapping")]
    public async Task<IActionResult> Update([FromBody]Models.Mapping mapping)
    {
        logger.LogInformation("Run endpoint {endpoint} {verb}", "/api/mapping", "PATCH");
        // ensure mapping passed in
        if (mapping == null)
            return StatusCode((int)System.Net.HttpStatusCode.BadRequest, "mapping is required for update");

        if (string.IsNullOrEmpty(mapping.EntityId))
            return StatusCode((int)System.Net.HttpStatusCode.BadRequest, "entityId is required for update");

        // update the mapping record in storage
        await this.mappingRepository.UpdateMapping(mapping);

        return Ok();
    }
}
