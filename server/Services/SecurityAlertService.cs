using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models.Training;

namespace Server.Services;

public class SecurityAlertService : ISecurityAlertService
{
    private readonly TrainingDbContext _db;

    public SecurityAlertService(TrainingDbContext db)
    {
        _db = db;
    }

    public async Task CheckDownloadAbnormalityAsync(ulong userId, string? ipAddress)
    {
        var fiveMinutesAgo = DateTime.UtcNow.AddMinutes(-5);
        int deniedCount = await _db.DownloadLogs
            .Where(dl => dl.UserId == userId && dl.DownloadedAt >= fiveMinutesAgo && dl.Status == "DENIED")
            .CountAsync();

        if (deniedCount >= 3)
        {
            // Create security alert
            bool existsRecent = await _db.SecurityAlerts
                .AnyAsync(sa => sa.UserId == userId && sa.AlertType == "SUSPICIOUS_DOWNLOAD" && sa.CreatedAt >= fiveMinutesAgo);

            if (!existsRecent)
            {
                await CreateAlertAsync(
                    userId,
                    "SUSPICIOUS_DOWNLOAD",
                    "HIGH",
                    $"Người dùng phát sinh {deniedCount} yêu cầu tải bị từ chối liên tiếp trong vòng 5 phút.",
                    ipAddress
                );
            }
        }
    }

    public async Task CreateAlertAsync(ulong? userId, string alertType, string severity, string description, string? sourceIp)
    {
        try
        {
            var alert = new SecurityAlert
            {
                UserId = userId,
                AlertType = alertType,
                Severity = severity,
                Description = description,
                SourceIp = sourceIp,
                Status = "OPEN",
                CreatedAt = DateTime.UtcNow
            };

            _db.SecurityAlerts.Add(alert);
            await _db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[SecurityAlertService] Tạo cảnh báo an ninh thất bại: {ex.Message}");
        }
    }
}
