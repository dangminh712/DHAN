using Server.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.DTOs;
using Server.Services;

namespace Server.Controllers;

[ApiController]
[Route("api/training/system")]
public class SystemController : ControllerBase
{
    private readonly TrainingDbContext _db;
    private readonly IAuditService _audit;
    private readonly DatabaseOverviewService _overview;

    public SystemController(TrainingDbContext db, IAuditService audit, DatabaseOverviewService overview)
    {
        _db = db;
        _audit = audit;
        _overview = overview;
    }

    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview(CancellationToken ct) => Ok(await _overview.ReadAsync(ct));
    [HttpGet("audit-logs")]
    public async Task<IActionResult> GetAuditLogs(
        [FromQuery] string? search,
        [FromQuery] string? action,
        [FromQuery] string? entityType,
        [FromQuery] int? page,
        [FromQuery] int? pageSize,
        [FromQuery] int limit = 50, [FromQuery] string? sortBy = null, [FromQuery] string? sortDir = null)
    {
        var query = _db.AuditLogs
            .Include(a => a.User)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(action))
        {
            query = query.Where(a => a.Action == action.Trim());
        }

        if (!string.IsNullOrWhiteSpace(entityType))
        {
            query = query.Where(a => a.EntityType == entityType.Trim());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            string s = search.Trim().ToLower();
            query = query.Where(a =>
                a.Action.ToLower().Contains(s) ||
                (a.EntityType != null && a.EntityType.ToLower().Contains(s)) ||
                (a.IpAddress != null && a.IpAddress.Contains(s)) ||
                (a.User != null && a.User.Username.ToLower().Contains(s)) ||
                (a.NewValue != null && a.NewValue.ToLower().Contains(s)));
        }

        var selectQuery = query
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new AuditLogItemDto
            {
                Id = a.Id,
                Username = a.User != null ? a.User.Username : "Hệ thống",
                Action = a.Action,
                EntityType = a.EntityType,
                EntityId = a.EntityId,
                OldValue = a.OldValue,
                NewValue = a.NewValue,
                AccessReason = a.AccessReason,
                IpAddress = a.IpAddress,
                CreatedAt = a.CreatedAt
            });

        return Ok(await selectQuery.Sort(sortBy, sortDir ?? "asc", "CreatedAt", "Id,Username,Action,EntityType,EntityId,IpAddress,CreatedAt").ResultAsync(page, pageSize));
    }

    [HttpGet("security-alerts")]
    public async Task<IActionResult> GetSecurityAlerts([FromQuery] int? page = null, [FromQuery] int? pageSize = null, [FromQuery] string? search = null, [FromQuery] string? sortBy = null, [FromQuery] string? sortDir = null)
    {
        var selected = _db.SecurityAlerts
            .Include(s => s.User)
            .Include(s => s.Resolver)
            .Select(s => new SecurityAlertItemDto
            {
                Id = s.Id,
                Username = s.User != null ? s.User.Username : "N/A",
                AlertType = s.AlertType,
                Severity = s.Severity,
                Description = s.Description,
                SourceIp = s.SourceIp,
                Status = s.Status,
                ResolverName = s.Resolver != null ? s.Resolver.FullName : null,
                ResolvedAt = s.ResolvedAt,
                CreatedAt = s.CreatedAt
            });

        if (!string.IsNullOrWhiteSpace(search)) selected = selected.Where(s => s.Username.Contains(search));
        return Ok(await selected.Sort(sortBy, sortDir ?? "desc", "CreatedAt", "Id,Username,AlertType,Severity,Description,SourceIp,Status,ResolverName,ResolvedAt,CreatedAt").ResultAsync(page, pageSize));
    }

    [HttpGet("sessions")]
    public async Task<IActionResult> GetUserSessions([FromQuery] ulong? userId, [FromQuery] int? page = null, [FromQuery] int? pageSize = null, [FromQuery] string? search = null, [FromQuery] string? sortBy = null, [FromQuery] string? sortDir = null)
    {
        var query = _db.UserSessions.Include(s => s.User).AsQueryable();
        if (userId.HasValue)
        {
            query = query.Where(s => s.UserId == userId.Value);
        }

        var selected = query
            .Select(s => new UserSessionDto
            {
                Id = s.Id,
                UserId = s.UserId,
                Username = s.User != null ? s.User.Username : "N/A",
                DeviceId = s.DeviceId,
                DeviceName = s.DeviceName,
                IpAddress = s.IpAddress,
                UserAgent = s.UserAgent,
                LastActivityAt = s.LastActivityAt,
                ExpiresAt = s.ExpiresAt,
                RevokedAt = s.RevokedAt
            });

        if (!string.IsNullOrWhiteSpace(search)) selected = selected.Where(s => s.Username.Contains(search));
        return Ok(await selected.Sort(sortBy, sortDir ?? "desc", "LastActivityAt", "Id,UserId,Username,DeviceId,DeviceName,IpAddress,LastActivityAt,lastSeenAt:LastActivityAt,ExpiresAt,RevokedAt").ResultAsync(page, pageSize));
    }

    [HttpPost("sessions/{id}/revoke")]
    public async Task<IActionResult> RevokeSession(ulong id, [FromQuery] ulong adminUserId)
    {
        var session = await _db.UserSessions.FirstOrDefaultAsync(s => s.Id == id);
        if (session == null) return NotFound();

        session.RevokedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        await _audit.LogAsync(adminUserId, "REVOKE_DEVICE_SESSION", "USER_SESSION", id, null, $"{{\"deviceId\":\"{session.DeviceId}\"}}", HttpContext.Connection.RemoteIpAddress?.ToString());

        return Ok(new { message = $"Đã thu hồi phiên thiết bị {session.DeviceId} thành công." });
    }

    [HttpGet("notifications")]
    public async Task<IActionResult> GetNotifications([FromQuery] ulong userId, [FromQuery] int? page = null, [FromQuery] int? pageSize = null, [FromQuery] string? search = null, [FromQuery] string? sortBy = null, [FromQuery] string? sortDir = null)
    {
        var query = _db.Notifications.AsNoTracking().Where(n => n.UserId == userId);
        if (!string.IsNullOrWhiteSpace(search)) query = query.Where(n => n.Title.Contains(search));
        return Ok(await query.Sort(sortBy, sortDir ?? "desc", "CreatedAt", "Id,Title,CreatedAt").ResultAsync(page, pageSize));
    }
}
