using System.Net.Sockets;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Services;

var builder = WebApplication.CreateBuilder(args);

// Ensure telemetry is turned off for offline intranet environment
Environment.SetEnvironmentVariable("DOTNET_CLI_TELEMETRY_OPTOUT", "1");

// Listen on 0.0.0.0:5000 to allow LAN access
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.ListenAnyIP(5000);
});

// Configure CORS for Local Intranet
builder.Services.AddCors(options =>
{
    options.AddPolicy("IntranetCorsPolicy", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Parse MySQL configuration
var rawConnectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Server=localhost;Port=3306;Database=media_intranet_db;User=root;Password=;";

// Check if MySQL server is physically reachable before configuring or querying
bool isMySqlAvailable = CheckPortReachable("localhost", 3306, 800);

if (isMySqlAvailable)
{
    builder.Services.AddDbContext<AppDbContext>(options =>
    {
        options.UseMySql(rawConnectionString, new MySqlServerVersion(new Version(8, 0, 36)), mySqlOptions =>
        {
            mySqlOptions.EnableRetryOnFailure(maxRetryCount: 2, maxRetryDelay: TimeSpan.FromSeconds(2), errorNumbersToAdd: null);
        });
    });

    builder.Services.AddSingleton<IMediaService, MySqlMediaService>();
}
else
{
    // Fallback: Local JSON storage mode (100% offline, zero error logs, no external download needed)
    builder.Services.AddSingleton<IMediaService, JsonMediaService>();
}

builder.Services.AddControllers();

var app = builder.Build();

// Display friendly startup status
using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    if (isMySqlAvailable)
    {
        try
        {
            var dbContext = scope.ServiceProvider.GetService<AppDbContext>();
            dbContext?.Database.EnsureCreated();
            logger.LogInformation("==================================================================");
            logger.LogInformation(">>> [CSDL]: Đã kết nối MySQL Server (localhost:3306) thành công.");
            logger.LogInformation("==================================================================");
        }
        catch (Exception ex)
        {
            logger.LogWarning($">>> Không thể khởi tạo bảng MySQL: {ex.Message}");
        }
    }
    else
    {
        logger.LogInformation("==================================================================");
        logger.LogInformation(">>> [THÔNG BÁO]: MySQL Server chưa được bật trên cổng 3306.");
        logger.LogInformation(">>> [TỰ ĐỘNG CHUYỂN]: Kích hoạt Chế độ Lưu trữ Cục bộ (metadata.json).");
        logger.LogInformation(">>> Mọi tính năng: Upload, Xem, Tua Video HTTP 206, Tải xuống hoạt động 100%!");
        logger.LogInformation("==================================================================");
    }
}

app.UseCors("IntranetCorsPolicy");

app.UseRouting();

app.MapControllers();

// Health check endpoint
app.MapGet("/", (IMediaService mediaService) => Results.Ok(new
{
    status = "Online",
    mode = "Intranet/Offline",
    database = mediaService.StorageMode,
    serverTime = DateTime.UtcNow,
    message = "Hệ thống Backend .NET 8 đang chạy ổn định."
}));

app.Run();

// Fast TCP connectivity check helper (avoiding EF Core retry spam)
static bool CheckPortReachable(string host, int port, int timeoutMs)
{
    try
    {
        using var client = new TcpClient();
        var result = client.BeginConnect(host, port, null, null);
        var success = result.AsyncWaitHandle.WaitOne(timeoutMs);
        if (!success) return false;
        client.EndConnect(result);
        return true;
    }
    catch
    {
        return false;
    }
}
