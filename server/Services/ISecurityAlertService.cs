namespace Server.Services;

public interface ISecurityAlertService
{
    Task CheckDownloadAbnormalityAsync(ulong userId, string? ipAddress);
    Task CreateAlertAsync(ulong? userId, string alertType, string severity, string description, string? sourceIp);
}
