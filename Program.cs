using Azure.Data.Tables;
using EmbeddedChat.Models;
using EmbeddedChat.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;

string aspnetcoreEnv = DotNetEnv.Env.GetString("ASPNETCORE_ENVIRONMENT");
if (!String.IsNullOrEmpty(aspnetcoreEnv) && aspnetcoreEnv.ToLower() == "development")
{
    // only use DotNetEnv in development
    var envFileName = $".env.{aspnetcoreEnv.ToLower()}";
    DotNetEnv.Env.Load(envFileName);
}

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddApplicationInsightsTelemetry();

IConfigurationRoot config = new ConfigurationBuilder()
    .AddEnvironmentVariables() // add environment variables as a provider
    .Build();

AppSettings options = new(); // instantiate the AppSettings class
config.Bind(options); // Bind the environment variables to the class

builder.Services.AddOptions<AppSettings>()
    .Configure<IConfiguration>((settings, configuration) =>
    {
        config.Bind(settings);
    });

builder.Services.AddAuthentication(o => 
{
    o.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(o =>
{
    o.Authority = $"https://login.microsoftonline.com/{options.TenantId}/v2.0/";
    o.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
    {
        ValidateIssuer = false,
        // Both App ID URI and client id are valid audiences in the access token
        ValidAudiences = new List<string>
        {
            options.ClientId,
            $"api://{options.ClientId}"
        }
    };
});
builder.Services.AddAuthorization();

// Initialize Storage client
var tableServiceClient = new TableServiceClient(options.StorageConnectionString);
TableClient tableClient = tableServiceClient.GetTableClient(
    tableName: "mappings"
);
builder.Services.AddSingleton<TableServiceClient>(tableServiceClient);

// Initialize repositories
builder.Services.AddTransient<EmbeddedChat.Repositories.MappingRepository>();

// Initialize Services
builder.Services.AddTransient<IAcsService, AcsService>();
builder.Services.AddTransient<IGraphService, GraphService>();
var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseDefaultFiles();

app.UseStaticFiles();

app.UseHttpsRedirection();

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();
