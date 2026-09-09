using System.Text.Json;
using Server.Data;
using Server.Models.Training;

namespace Server.Services;

public class AuditService : IAuditService
{
    private readonly TrainingDbContext _db;

    public AuditService(TrainingDbContext db)
    {
        _db = db;
    }

    public async Task LogAsync(ulong? userId, string action, string entityType, ulong? entityId, string? oldValue, string? newValue, string? ipAddress, string? accessReason = null)
    {
        try
        {
            var log = new AuditLog
            {
                UserId = userId,
                Action = action,
                EntityType = entityType,
                EntityId = entityId,
                OldValue = oldValue,
                NewValue = newValue,
                AccessReason = accessReason,
                IpAddress = ipAddress,
                CreatedAt = DateTime.UtcNow
            };

            _db.AuditLogs.Add(log);
            await _db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[AuditService] Ghi audit thất bại: {ex.Message}");
        }
    }
}
