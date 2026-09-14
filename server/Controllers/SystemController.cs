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

    public SystemController(TrainingDbContext db, IAuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview()
    {
        var usersCount = await _db.Users.CountAsync();
        var rolesCount = await _db.Roles.CountAsync();
        var permsCount = await _db.Permissions.CountAsync();
        var unitsCount = await _db.OrganizationalUnits.CountAsync();
        var classesCount = await _db.Classes.CountAsync();
        var subjectsCount = await _db.Subjects.CountAsync();
        var lecturesCount = await _db.Lectures.CountAsync();
        var filesCount = await _db.Files.CountAsync();
        var auditCount = await _db.AuditLogs.CountAsync();
        var downloadCount = await _db.DownloadLogs.CountAsync();
        var alertsCount = await _db.SecurityAlerts.CountAsync();

        var settings = await _db.SystemSettings
            .Select(s => new SystemSettingItemDto
            {
                Key = s.SettingKey,
                Value = s.SettingValue,
                Type = s.SettingType,
                Description = s.Description
            })
            .ToListAsync();

        var tableStats = new List<TableStatDto>
        {
            new() { TableName = "roles", Module = "Identity", RowCount = rolesCount, Description = "4 vai trò RBAC chuẩn" },
            new() { TableName = "permissions", Module = "Identity", RowCount = permsCount, Description = "31 quyền hạn hệ thống" },
            new() { TableName = "role_permissions", Module = "Identity", RowCount = await _db.RolePermissions.CountAsync(), Description = "Ma trận phân quyền vai trò" },
            new() { TableName = "users", Module = "Identity", RowCount = usersCount, Description = "Tài khoản cán bộ, giảng viên, học viên" },
            new() { TableName = "user_sessions", Module = "Identity", RowCount = await _db.UserSessions.CountAsync(), Description = "Phiên đăng nhập & thiết bị" },
            new() { TableName = "user_mfa", Module = "Identity", RowCount = await _db.UserMfas.CountAsync(), Description = "Xác thực 2 yếu tố TOTP/Email" },
            new() { TableName = "organizational_units", Module = "Organization", RowCount = unitsCount, Description = "Cây tổ chức T04 & Khoa/Bộ môn" },
            new() { TableName = "classes", Module = "Academic", RowCount = classesCount, Description = "Lớp học vụ theo niên khóa" },
            new() { TableName = "student_classes", Module = "Academic", RowCount = await _db.StudentClasses.CountAsync(), Description = "Danh sách học viên theo lớp" },
            new() { TableName = "subjects", Module = "Academic", RowCount = subjectsCount, Description = "Môn học đào tạo nghiệp vụ" },
            new() { TableName = "teacher_subjects", Module = "Academic", RowCount = await _db.TeacherSubjects.CountAsync(), Description = "Phân công giảng dạy" },
            new() { TableName = "classification_levels", Module = "Security", RowCount = await _db.ClassificationLevels.CountAsync(), Description = "4 Cấp độ mật (Normal->Secret)" },
            new() { TableName = "user_clearance_levels", Module = "Security", RowCount = await _db.UserClearanceLevels.CountAsync(), Description = "Clearance phân loại của người dùng" },
            new() { TableName = "lectures", Module = "Lecture", RowCount = lecturesCount, Description = "Bài giảng điện tử nghiệp vụ" },
            new() { TableName = "lecture_permissions", Module = "Lecture", RowCount = await _db.LecturePermissions.CountAsync(), Description = "Phân quyền bài giảng theo lớp" },
            new() { TableName = "lecture_files", Module = "Lecture", RowCount = await _db.LectureFiles.CountAsync(), Description = "Đính kèm học liệu vào bài giảng" },
            new() { TableName = "files", Module = "File", RowCount = filesCount, Description = "Metadata kho lưu trữ số hóa" },
            new() { TableName = "file_versions", Module = "File", RowCount = await _db.FileVersions.CountAsync(), Description = "Lịch sử phiên bản tập tin v1, v2" },
            new() { TableName = "file_permissions", Module = "File", RowCount = await _db.FilePermissions.CountAsync(), Description = "Ngoại lệ phân quyền theo user/lớp" },
            new() { TableName = "watch_history", Module = "Learning", RowCount = await _db.WatchHistories.CountAsync(), Description = "Lịch sử xem & vị trí phát video" },
            new() { TableName = "learning_progress", Module = "Learning", RowCount = await _db.LearningProgresses.CountAsync(), Description = "Tiến độ học tập % hoàn thành" },
            new() { TableName = "download_logs", Module = "Audit", RowCount = downloadCount, Description = "Nhật ký tải học liệu & kiểm soát" },
            new() { TableName = "audit_logs", Module = "Audit", RowCount = auditCount, Description = "Audit trail bất biến hệ thống" },
            new() { TableName = "security_alerts", Module = "Audit", RowCount = alertsCount, Description = "Cảnh báo an ninh & tải bất thường" },
            new() { TableName = "notifications", Module = "Notification", RowCount = await _db.Notifications.CountAsync(), Description = "Thông báo gửi đến người dùng" },
            new() { TableName = "retention_policies", Module = "System", RowCount = await _db.RetentionPolicies.CountAsync(), Description = "Chính sách lưu trữ & tiêu hủy" },
            new() { TableName = "system_settings", Module = "System", RowCount = settings.Count, Description = "Tham số cấu hình động toàn hệ thống" }
        };

        return Ok(new SystemOverviewDto
        {
            TotalUsers = usersCount,
            TotalRoles = rolesCount,
            TotalPermissions = permsCount,
            TotalOrganizationalUnits = unitsCount,
            TotalClasses = classesCount,
            TotalSubjects = subjectsCount,
            TotalLectures = lecturesCount,
            TotalFiles = filesCount,
            TotalAuditLogs = auditCount,
            TotalDownloadLogs = downloadCount,
            TotalSecurityAlerts = alertsCount,
            Settings = settings,
            TableStats = tableStats
        });
    }

    [HttpGet("audit-logs")]
    public async Task<IActionResult> GetAuditLogs(
        [FromQuery] string? search,
        [FromQuery] string? action,
        [FromQuery] string? entityType,
        [FromQuery] int? page,
        [FromQuery] int? pageSize,
        [FromQuery] int limit = 50)
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

        if (page.HasValue && page.Value > 0)
        {
            int size = Math.Clamp(pageSize ?? 20, 1, 100);
            int total = await query.CountAsync();
            var items = await selectQuery.Skip((page.Value - 1) * size).Take(size).ToListAsync();
            return Ok(new
            {
                items,
                totalCount = total,
                page = page.Value,
                pageSize = size,
                totalPages = (int)Math.Ceiling((double)total / size)
            });
        }

        var logs = await selectQuery.Take(Math.Clamp(limit, 1, 100)).ToListAsync();
        return Ok(logs);
    }

    [HttpGet("security-alerts")]
    public async Task<IActionResult> GetSecurityAlerts([FromQuery] int page = 1)
    {
        var alerts = await _db.SecurityAlerts
            .Include(s => s.User)
            .Include(s => s.Resolver)
            .OrderByDescending(s => s.CreatedAt).ThenByDescending(s => s.Id).Skip((Math.Clamp(page, 1, 100000) - 1) * 50).Take(50)
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
            })
            .ToListAsync();

        return Ok(alerts);
    }

    [HttpGet("sessions")]
    public async Task<IActionResult> GetUserSessions([FromQuery] ulong? userId, [FromQuery] int page = 1)
    {
        var query = _db.UserSessions.Include(s => s.User).AsQueryable();
        if (userId.HasValue)
        {
            query = query.Where(s => s.UserId == userId.Value);
        }

        var list = await query
            .OrderByDescending(s => s.CreatedAt)
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
            })
            .ToListAsync();

        return Ok(list);
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
    public async Task<IActionResult> GetNotifications([FromQuery] ulong userId, [FromQuery] int page = 1)
    {
        var notifications = await _db.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt).ThenByDescending(n => n.Id).Skip((Math.Clamp(page, 1, 100000) - 1) * 50).Take(50)
            .ToListAsync();

        return Ok(notifications);
    }
}
