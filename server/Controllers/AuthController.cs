using System.Security.Cryptography;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.DTOs;
using Server.Models.Training;
using Server.Services;

namespace Server.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly TrainingDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly IAuditService _audit;

    public AuthController(TrainingDbContext db, IPasswordHasher hasher, IAuditService audit)
    {
        _db = db;
        _hasher = hasher;
        _audit = audit;
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetSampleUsers()
    {
        var users = await _db.Users
            .Include(u => u.Role)
                .ThenInclude(r => r!.RolePermissions)
                    .ThenInclude(rp => rp.Permission)
            .Include(u => u.OrganizationalUnit)
            .Include(u => u.ClearanceLevels)
                .ThenInclude(c => c.ClassificationLevel)
            .Select(u => new UserDto
            {
                Id = u.Id,
                Username = u.Username,
                FullName = u.FullName,
                Email = u.Email,
                Role = u.Role != null ? u.Role.Code : "STUDENT",
                RoleName = u.Role != null ? u.Role.Name : "Học viên",
                Department = u.OrganizationalUnit != null ? u.OrganizationalUnit.Name : "T04",
                MaxClearance = u.ClearanceLevels.Select(c => c.ClassificationLevel!.Name).FirstOrDefault() ?? "Công khai nội bộ",
                ClearanceLevelOrder = u.ClearanceLevels.Select(c => c.ClassificationLevel!.LevelOrder).FirstOrDefault(),
                Status = u.Status,
                Permissions = u.Role != null ? u.Role.RolePermissions.Select(rp => rp.Permission!.Code).ToList() : new List<string>()
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var user = await _db.Users
            .Include(u => u.Role)
                .ThenInclude(r => r!.RolePermissions)
                    .ThenInclude(rp => rp.Permission)
            .Include(u => u.OrganizationalUnit)
            .Include(u => u.ClearanceLevels)
                .ThenInclude(c => c.ClassificationLevel)
            .FirstOrDefaultAsync(u => u.Username == dto.Username);

        if (user == null || !_hasher.VerifyPassword(dto.Password, user.PasswordHash))
        {
            await _audit.LogAsync(null, "LOGIN_FAILED", "USER", null, null, $"{{\"username\": \"{dto.Username}\"}}", HttpContext.Connection.RemoteIpAddress?.ToString());
            return Unauthorized(new { message = "Tài khoản hoặc mật khẩu không chính xác." });
        }

        if (user.Status != "ACTIVE")
        {
            return StatusCode(403, new { message = "Tài khoản hiện đang bị khóa hoặc ngưng hoạt động." });
        }

        user.LastLoginAt = DateTime.UtcNow;

        // Create active session
        string rawToken = Guid.NewGuid().ToString("N");
        string tokenHash = Convert.ToHexString(SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(rawToken))).ToLower();

        var session = new UserSession
        {
            UserId = user.Id,
            SessionTokenHash = tokenHash,
            DeviceId = string.IsNullOrWhiteSpace(dto.DeviceId) ? "DEV_WORKSTATION_" + user.Username.ToUpper() : dto.DeviceId,
            DeviceName = dto.DeviceName ?? Request.Headers.UserAgent.ToString(),
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1",
            UserAgent = Request.Headers.UserAgent.ToString(),
            LastActivityAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddMinutes(60),
            CreatedAt = DateTime.UtcNow
        };

        _db.UserSessions.Add(session);
        await _db.SaveChangesAsync();

        await _audit.LogAsync(user.Id, "LOGIN_SUCCESS", "USER_SESSION", session.Id, null, $"{{\"deviceId\": \"{session.DeviceId}\"}}", session.IpAddress);

        var userDto = new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role?.Code ?? "STUDENT",
            RoleName = user.Role?.Name ?? "Học viên",
            Department = user.OrganizationalUnit?.Name ?? "T04",
            MaxClearance = user.ClearanceLevels.Select(c => c.ClassificationLevel!.Name).FirstOrDefault() ?? "Công khai nội bộ",
            ClearanceLevelOrder = user.ClearanceLevels.Select(c => c.ClassificationLevel!.LevelOrder).FirstOrDefault(),
            Status = user.Status,
            Permissions = user.Role?.RolePermissions.Select(rp => rp.Permission!.Code).ToList() ?? new List<string>()
        };

        return Ok(new
        {
            token = rawToken,
            user = userDto
        });
    }

    [HttpPost("switch-persona")]
    public async Task<IActionResult> SwitchPersona([FromBody] SwitchUserRequest req)
    {
        var user = await _db.Users
            .Include(u => u.Role)
                .ThenInclude(r => r!.RolePermissions)
                    .ThenInclude(rp => rp.Permission)
            .Include(u => u.OrganizationalUnit)
            .Include(u => u.ClearanceLevels)
                .ThenInclude(c => c.ClassificationLevel)
            .FirstOrDefaultAsync(u => u.Username == req.Username);

        if (user == null)
            return NotFound(new { message = "Không tìm thấy người dùng." });

        var userDto = new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role?.Code ?? "STUDENT",
            RoleName = user.Role?.Name ?? "Học viên",
            Department = user.OrganizationalUnit?.Name ?? "T04",
            MaxClearance = user.ClearanceLevels.Select(c => c.ClassificationLevel!.Name).FirstOrDefault() ?? "Công khai nội bộ",
            ClearanceLevelOrder = user.ClearanceLevels.Select(c => c.ClassificationLevel!.LevelOrder).FirstOrDefault(),
            Status = user.Status,
            Permissions = user.Role?.RolePermissions.Select(rp => rp.Permission!.Code).ToList() ?? new List<string>()
        };

        return Ok(userDto);
    }
}
