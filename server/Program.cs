using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;
using Server.Data;
using Server.Services;
using Server.Infrastructure;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.ConfigureKestrel(o => o.ListenAnyIP(builder.Configuration.GetValue("HttpPort", 5000)));
builder.Services.AddCors(o => o.AddPolicy("IntranetCorsPolicy", p => p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()
    .WithExposedHeaders("Accept-Ranges", "Content-Range", "Content-Length")));
var connection = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Thiếu cấu hình kết nối MySQL DefaultConnection.");
builder.Services.AddDbContext<AppDbContext>(o => o.UseMySql(connection, new MySqlServerVersion(new Version(8, 0, 36))));
builder.Services.AddDbContext<TrainingDbContext>(o => o.UseMySql(connection, new MySqlServerVersion(new Version(8, 0, 36))));
builder.Services.AddSingleton<IMediaService, MySqlMediaService>();
builder.Services.AddSingleton<IPasswordHasher, Pbkdf2PasswordHasher>();
builder.Services.AddScoped<IAccessDecisionService, AccessDecisionService>();
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddScoped<ISecurityAlertService, SecurityAlertService>();
builder.Services.AddSingleton<IFileStorageService, FileStorageService>();
builder.Services.AddMemoryCache();
builder.Services.Configure<FormOptions>(o => { o.MemoryBufferThreshold = 65536; o.MultipartBodyLengthLimit = 1073741824; });
builder.Services.AddControllers(o => o.Filters.Add<ApiErrorFilter>()).AddJsonOptions(o =>
{
    o.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});
builder.Services.Configure<ApiBehaviorOptions>(o => o.InvalidModelStateResponseFactory = c =>
    new BadRequestObjectResult(new { success = false, code = "VALIDATION_ERROR", message = "Dữ liệu nhập không hợp lệ.",
        errors = c.ModelState.Where(x => x.Value?.Errors.Count > 0).ToDictionary(x => x.Key, x => x.Value!.Errors.Select(e => e.ErrorMessage)) }));
var app = builder.Build();
app.UseCors("IntranetCorsPolicy");
app.UseMiddleware<ApiExceptionMiddleware>();
app.MapControllers();
app.MapGet("/", async (TrainingDbContext db, CancellationToken ct) =>
    await db.Database.CanConnectAsync(ct)
        ? Results.Ok(new { success = true, database = "MySQL", status = "Online" })
        : Results.Json(new { success = false, code = "DATABASE_UNAVAILABLE", message = "Không kết nối được MySQL." }, statusCode: 503));
// Apply migrations explicitly with dotnet ef database update, never during web startup.
app.Run();
public partial class Program { }
