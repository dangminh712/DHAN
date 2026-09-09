namespace Server.Services;

public interface IAuditService
{
    Task LogAsync(ulong? userId, string action, string entityType, ulong? entityId, string? oldValue, string? newValue, string? ipAddress, string? accessReason = null);
}
