using System.Security.Cryptography;
using System.Text.RegularExpressions;
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
    public async Task<IActionResult> GetSampleUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] string? search = null)
    {
        var users = await _db.Users.AsNoTracking()
            .Where(u => search == null || u.Username.Contains(search) || u.FullName.Contains(search))
            .OrderBy(u => u.Id).Skip((Math.Clamp(page, 1, 100000) - 1) * Math.Clamp(pageSize, 1, 100)).Take(Math.Clamp(pageSize, 1, 100))
            .Include(u => u.Role)
                .ThenInclude(r => r!.RolePermissions)
                    .ThenInclude(rp => rp.Permission)
            .Include(u => u.OrganizationalUnit)
            .Include(u => u.StudentClasses)
                .ThenInclude(sc => sc.Class)
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
                MustChangePassword = u.MustChangePassword,
                IsProfileLocked = u.IsProfileLocked,
                StudentCode = u.StudentCode,
                ClassName = u.StudentClasses.Select(sc => sc.Class!.Code).FirstOrDefault(),
                AssignedClasses = u.StudentClasses.Where(sc => sc.Class != null).Select(sc => sc.Class!.Code).ToList(),
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
            .Include(u => u.StudentClasses)
                .ThenInclude(sc => sc.Class)
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
            MustChangePassword = user.MustChangePassword,
            IsProfileLocked = user.IsProfileLocked,
            StudentCode = user.StudentCode,
            ClassName = user.StudentClasses.Select(sc => sc.Class!.Code).FirstOrDefault(),
            Permissions = user.Role?.RolePermissions.Select(rp => rp.Permission!.Code).ToList() ?? new List<string>()
        };

        return Ok(new
        {
            token = rawToken,
            user = userDto
        });
    }

    [HttpPost("switch-persona")]
    [HttpPost("switch-user")]
    public async Task<IActionResult> SwitchPersona([FromBody] SwitchUserRequest req)
    {
        var user = await _db.Users
            .Include(u => u.Role)
                .ThenInclude(r => r!.RolePermissions)
                    .ThenInclude(rp => rp.Permission)
            .Include(u => u.OrganizationalUnit)
            .Include(u => u.StudentClasses)
                .ThenInclude(sc => sc.Class)
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
            MustChangePassword = user.MustChangePassword,
            IsProfileLocked = user.IsProfileLocked,
            StudentCode = user.StudentCode,
            ClassName = user.StudentClasses.Select(sc => sc.Class!.Code).FirstOrDefault(),
            AssignedClasses = user.StudentClasses.Where(sc => sc.Class != null).Select(sc => sc.Class!.Code).ToList(),
            Permissions = user.Role?.RolePermissions.Select(rp => rp.Permission!.Code).ToList() ?? new List<string>()
        };

        if (user.Status != "ACTIVE") return StatusCode(403, new { message = "Tài khoản đã ngưng hoạt động." });
        // Preserve the existing development persona workflow while giving learning APIs a scoped session.
        var token = Guid.NewGuid().ToString("N");
        _db.UserSessions.Add(new UserSession { UserId = user.Id,
            SessionTokenHash = Convert.ToHexString(SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(token))).ToLowerInvariant(),
            DeviceId = "DEV_PERSONA", ExpiresAt = DateTime.UtcNow.AddHours(12) });
        await _db.SaveChangesAsync();
        return Ok(new { user = userDto, token });
    }

    [HttpPost("users")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserDto dto, [FromQuery] ulong? adminUserId)
    {
        if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.FullName))
        {
            return BadRequest(new { message = "Tên đăng nhập và Họ tên là bắt buộc." });
        }

        var exists = await _db.Users.AnyAsync(u => u.Username == dto.Username);
        if (exists) return BadRequest(new { message = $"Tên đăng nhập '{dto.Username}' đã tồn tại trong hệ thống." });

        var role = await _db.Roles.FirstOrDefaultAsync(r => r.Code == dto.RoleCode)
                   ?? await _db.Roles.FirstOrDefaultAsync(r => r.Code == "STUDENT");

        if (role == null) return BadRequest(new { message = "Vai trò không hợp lệ." });

        using var trans = await _db.Database.BeginTransactionAsync();
        try
        {
            string passwordToHash = string.IsNullOrWhiteSpace(dto.Password) ? "T04@Security2026!" : dto.Password;
            string hashed = _hasher.HashPassword(passwordToHash);

            var newUser = new User
            {
                Username = dto.Username.Trim(),
                FullName = dto.FullName.Trim(),
                Email = dto.Email?.Trim(),
                PasswordHash = hashed,
                RoleId = role.Id,
                OrganizationalUnitId = dto.OrganizationalUnitId,
                Status = "ACTIVE",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _db.Users.Add(newUser);
            await _db.SaveChangesAsync();

            // Grant clearance level
            ulong levelId = dto.ClearanceLevelId > 0 ? dto.ClearanceLevelId : 2;
            _db.UserClearanceLevels.Add(new UserClearanceLevel
            {
                UserId = newUser.Id,
                ClassificationLevelId = levelId,
                GrantedBy = adminUserId ?? 1,
                GrantedAt = DateTime.UtcNow,
                Status = "ACTIVE",
                CreatedAt = DateTime.UtcNow
            });

            await _db.SaveChangesAsync();

            if (adminUserId.HasValue)
            {
                await _audit.LogAsync(adminUserId.Value, "CREATE_USER", "USER", newUser.Id, null, $"{{\"username\":\"{newUser.Username}\",\"role\":\"{role.Code}\"}}", HttpContext.Connection.RemoteIpAddress?.ToString());
            }

            await trans.CommitAsync();

            return Ok(new
            {
                message = "Tạo tài khoản cán bộ/học viên thành công!",
                user = new
                {
                    newUser.Id,
                    newUser.Username,
                    newUser.FullName,
                    Role = role.Code,
                    RoleName = role.Name
                }
            });
        }
        catch (Exception ex)
        {
            await trans.RollbackAsync();
            return StatusCode(500, new { message = "Lỗi khi tạo tài khoản: " + ex.Message });
        }
    }

    [HttpPut("users/{id}")]
    public async Task<IActionResult> UpdateUser(ulong id, [FromBody] UpdateUserDto dto, [FromQuery] ulong? adminUserId)
    {
        var user = await _db.Users
            .Include(u => u.ClearanceLevels)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null) return NotFound(new { message = "Không tìm thấy tài khoản người dùng." });

        using var trans = await _db.Database.BeginTransactionAsync();
        try
        {
            if (!string.IsNullOrWhiteSpace(dto.FullName)) user.FullName = dto.FullName.Trim();
            if (dto.Email != null) user.Email = dto.Email.Trim();
            if (!string.IsNullOrWhiteSpace(dto.Status)) user.Status = dto.Status;
            if (dto.OrganizationalUnitId.HasValue && dto.OrganizationalUnitId.Value > 0)
                user.OrganizationalUnitId = dto.OrganizationalUnitId.Value;

            if (!string.IsNullOrWhiteSpace(dto.RoleCode))
            {
                var role = await _db.Roles.FirstOrDefaultAsync(r => r.Code == dto.RoleCode);
                if (role != null) user.RoleId = role.Id;
            }

            if (!string.IsNullOrWhiteSpace(dto.Password))
            {
                user.PasswordHash = _hasher.HashPassword(dto.Password);
            }

            // Update clearance level
            if (dto.ClearanceLevelId > 0)
            {
                var existingClearance = user.ClearanceLevels.FirstOrDefault(c => c.Status == "ACTIVE");
                if (existingClearance != null)
                {
                    existingClearance.ClassificationLevelId = dto.ClearanceLevelId;
                }
                else
                {
                    _db.UserClearanceLevels.Add(new UserClearanceLevel
                    {
                        UserId = user.Id,
                        ClassificationLevelId = dto.ClearanceLevelId,
                        GrantedBy = adminUserId ?? 1,
                        GrantedAt = DateTime.UtcNow,
                        Status = "ACTIVE",
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }

            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            if (adminUserId.HasValue)
            {
                await _audit.LogAsync(adminUserId.Value, "UPDATE_USER", "USER", user.Id, null, $"{{\"username\":\"{user.Username}\"}}", HttpContext.Connection.RemoteIpAddress?.ToString());
            }

            await trans.CommitAsync();

            return Ok(new { message = "Cập nhật thông tin tài khoản thành công!", userId = user.Id });
        }
        catch (Exception ex)
        {
            await trans.RollbackAsync();
            return StatusCode(500, new { message = "Lỗi khi cập nhật tài khoản: " + ex.Message });
        }
    }

    [HttpDelete("users/{id}")]
    public async Task<IActionResult> DeleteUser(ulong id, [FromQuery] ulong? adminUserId)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user == null) return NotFound(new { message = "Không tìm thấy tài khoản người dùng." });

        if (user.Username == "admin" || user.Id == 1)
        {
            return BadRequest(new { message = "Không thể khóa hoặc xóa tài khoản Quản trị viên tối cao (SUPER_ADMIN)." });
        }

        user.Status = "SUSPENDED";
        user.DeletedAt = DateTime.UtcNow;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        if (adminUserId.HasValue)
        {
            await _audit.LogAsync(adminUserId.Value, "DELETE_USER", "USER", user.Id, null, $"{{\"username\":\"{user.Username}\"}}", HttpContext.Connection.RemoteIpAddress?.ToString());
        }

        return Ok(new { message = $"Đã ngưng hoạt động / vô hiệu hóa tài khoản {user.Username} thành công.", userId = id });
    }

    [HttpPost("provision-batch")]
    public async Task<IActionResult> ProvisionBatch([FromBody] BatchProvisionDto dto, [FromQuery] ulong? adminUserId)
    {
        int fromNum = dto.FromNumber;
        int toNum = dto.ToNumber;
        int padding = dto.Padding > 0 ? dto.Padding : 3;
        string prefix = dto.Prefix ?? "";
        string suffix = dto.Suffix ?? "";
        string classCode = dto.ClassCode?.Trim() ?? "";

        // Auto parse pattern if provided, e.g. "(001->055)_DT5B"
        if (!string.IsNullOrWhiteSpace(dto.Pattern))
        {
            var match = Regex.Match(dto.Pattern.Trim(), @"^(?<prefix>.*?)\((?<from>\d+)\s*->\s*(?<to>\d+)\)(?<suffix>.*)$");
            if (match.Success)
            {
                prefix = match.Groups["prefix"].Value;
                string fromStr = match.Groups["from"].Value;
                string toStr = match.Groups["to"].Value;
                suffix = match.Groups["suffix"].Value;

                if (int.TryParse(fromStr, out int parsedFrom) && int.TryParse(toStr, out int parsedTo))
                {
                    fromNum = parsedFrom;
                    toNum = parsedTo;
                    padding = fromStr.Length;
                }

                if (string.IsNullOrWhiteSpace(classCode))
                {
                    classCode = suffix.TrimStart('_', '-', ' ');
                }
            }
        }

        if (string.IsNullOrWhiteSpace(classCode))
        {
            classCode = "DT5B";
        }

        if (fromNum > toNum)
        {
            (fromNum, toNum) = (toNum, fromNum);
        }

        if (toNum - fromNum > 500)
        {
            return BadRequest(new { message = "Số lượng tài khoản tạo một lần không được vượt quá 500." });
        }

        var classRecord = await _db.Classes.FirstOrDefaultAsync(c => c.Code == classCode);
        if (classRecord == null)
        {
            classRecord = new ClassRecord
            {
                Code = classCode,
                Name = string.IsNullOrWhiteSpace(dto.ClassName) ? $"Lớp Đào tạo Nghiệp vụ {classCode}" : dto.ClassName,
                AcademicYear = "2025-2026",
                Semester = "Học kỳ 1",
                Status = "ACTIVE",
                OrganizationalUnitId = dto.OrganizationalUnitId ?? 2,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _db.Classes.Add(classRecord);
            await _db.SaveChangesAsync();
        }

        var studentRole = await _db.Roles.FirstOrDefaultAsync(r => r.Code == "STUDENT")
                          ?? await _db.Roles.FirstOrDefaultAsync();
        if (studentRole == null)
        {
            return BadRequest(new { message = "Không tìm thấy vai trò Sinh viên (STUDENT) trong hệ thống." });
        }

        ulong clearanceId = dto.ClearanceLevelId > 0 ? dto.ClearanceLevelId : 2;
        var results = new List<ProvisionedAccountResultDto>();
        int createdCount = 0;
        int skippedCount = 0;

        using var trans = await _db.Database.BeginTransactionAsync();
        try
        {
            for (int i = fromNum; i <= toNum; i++)
            {
                string numStr = i.ToString().PadLeft(padding, '0');
                string studentCode = $"{prefix}{numStr}{suffix}".Trim();
                string username = studentCode;

                var existingUser = await _db.Users
                    .Include(u => u.StudentClasses)
                    .FirstOrDefaultAsync(u => u.Username == username);

                if (existingUser != null)
                {
                    if (!existingUser.StudentClasses.Any(sc => sc.ClassId == classRecord.Id))
                    {
                        _db.StudentClasses.Add(new StudentClass
                        {
                            StudentId = existingUser.Id,
                            ClassId = classRecord.Id,
                            Status = "ACTIVE",
                            JoinedAt = DateTime.UtcNow
                        });
                    }
                    skippedCount++;
                    results.Add(new ProvisionedAccountResultDto
                    {
                        Id = existingUser.Id,
                        Username = existingUser.Username,
                        DefaultPassword = studentCode,
                        FullName = existingUser.FullName,
                        ClassCode = classCode,
                        MustChangePassword = existingUser.MustChangePassword,
                        IsProfileLocked = existingUser.IsProfileLocked
                    });
                    continue;
                }

                string passHash = _hasher.HashPassword(studentCode);
                var newUser = new User
                {
                    Username = username,
                    PasswordHash = passHash,
                    FullName = $"Học viên {studentCode}",
                    StudentCode = studentCode,
                    RoleId = studentRole.Id,
                    OrganizationalUnitId = classRecord.OrganizationalUnitId ?? 2,
                    Status = "ACTIVE",
                    MustChangePassword = true,
                    IsProfileLocked = false,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _db.Users.Add(newUser);
                await _db.SaveChangesAsync();

                _db.StudentClasses.Add(new StudentClass
                {
                    StudentId = newUser.Id,
                    ClassId = classRecord.Id,
                    Status = "ACTIVE",
                    JoinedAt = DateTime.UtcNow
                });

                _db.UserClearanceLevels.Add(new UserClearanceLevel
                {
                    UserId = newUser.Id,
                    ClassificationLevelId = clearanceId,
                    GrantedBy = adminUserId ?? 1,
                    GrantedAt = DateTime.UtcNow,
                    Status = "ACTIVE",
                    CreatedAt = DateTime.UtcNow
                });

                await _db.SaveChangesAsync();

                results.Add(new ProvisionedAccountResultDto
                {
                    Id = newUser.Id,
                    Username = newUser.Username,
                    DefaultPassword = studentCode,
                    FullName = newUser.FullName,
                    ClassCode = classCode,
                    MustChangePassword = true,
                    IsProfileLocked = false
                });

                createdCount++;
            }

            await _audit.LogAsync(adminUserId ?? 1, "PROVISION_BATCH", "USER", null, null, $"{{\"pattern\":\"{dto.Pattern}\",\"classCode\":\"{classCode}\",\"created\":{createdCount},\"skipped\":{skippedCount}}}", HttpContext.Connection.RemoteIpAddress?.ToString());

            await trans.CommitAsync();

            return Ok(new
            {
                message = $"Cấp tài khoản hàng loạt thành công! Tạo mới: {createdCount} tài khoản, Đã tồn tại: {skippedCount}.",
                createdCount,
                skippedCount,
                totalCount = results.Count,
                classCode,
                accounts = results
            });
        }
        catch (Exception ex)
        {
            await trans.RollbackAsync();
            return StatusCode(500, new { message = "Lỗi khi cấp tài khoản hàng loạt: " + ex.Message });
        }
    }

    [HttpPost("provision-single")]
    public async Task<IActionResult> ProvisionSingle([FromBody] SingleProvisionDto dto, [FromQuery] ulong? adminUserId)
    {
        if (string.IsNullOrWhiteSpace(dto.StudentCode))
        {
            return BadRequest(new { message = "Mã sinh viên là bắt buộc." });
        }

        string studentCode = dto.StudentCode.Trim();
        string username = studentCode;
        string defaultPass = string.IsNullOrWhiteSpace(dto.Password) ? studentCode : dto.Password.Trim();
        string classCode = string.IsNullOrWhiteSpace(dto.ClassCode) ? "DT5B" : dto.ClassCode.Trim();

        var existingUser = await _db.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (existingUser != null)
        {
            return BadRequest(new { message = $"Tài khoản có mã / tên '{username}' đã tồn tại trong hệ thống." });
        }

        var classRecord = await _db.Classes.FirstOrDefaultAsync(c => c.Code == classCode);
        if (classRecord == null)
        {
            classRecord = new ClassRecord
            {
                Code = classCode,
                Name = string.IsNullOrWhiteSpace(dto.ClassName) ? $"Lớp Đào tạo {classCode}" : dto.ClassName,
                AcademicYear = "2025-2026",
                Semester = "Học kỳ 1",
                Status = "ACTIVE",
                OrganizationalUnitId = dto.OrganizationalUnitId ?? 2,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _db.Classes.Add(classRecord);
            await _db.SaveChangesAsync();
        }

        var studentRole = await _db.Roles.FirstOrDefaultAsync(r => r.Code == "STUDENT")
                          ?? await _db.Roles.FirstOrDefaultAsync();

        if (studentRole == null)
        {
            return BadRequest(new { message = "Không tìm thấy vai trò Sinh viên." });
        }

        using var trans = await _db.Database.BeginTransactionAsync();
        try
        {
            string passHash = _hasher.HashPassword(defaultPass);
            var newUser = new User
            {
                Username = username,
                PasswordHash = passHash,
                FullName = string.IsNullOrWhiteSpace(dto.FullName) ? $"Học viên {studentCode}" : dto.FullName.Trim(),
                StudentCode = studentCode,
                RoleId = studentRole.Id,
                OrganizationalUnitId = classRecord.OrganizationalUnitId ?? 2,
                Status = "ACTIVE",
                MustChangePassword = true,
                IsProfileLocked = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _db.Users.Add(newUser);
            await _db.SaveChangesAsync();

            _db.StudentClasses.Add(new StudentClass
            {
                StudentId = newUser.Id,
                ClassId = classRecord.Id,
                Status = "ACTIVE",
                JoinedAt = DateTime.UtcNow
            });

            _db.UserClearanceLevels.Add(new UserClearanceLevel
            {
                UserId = newUser.Id,
                ClassificationLevelId = dto.ClearanceLevelId > 0 ? dto.ClearanceLevelId : 2,
                GrantedBy = adminUserId ?? 1,
                GrantedAt = DateTime.UtcNow,
                Status = "ACTIVE",
                CreatedAt = DateTime.UtcNow
            });

            await _db.SaveChangesAsync();
            await trans.CommitAsync();

            await _audit.LogAsync(adminUserId ?? 1, "PROVISION_SINGLE", "USER", newUser.Id, null, $"{{\"username\":\"{username}\",\"classCode\":\"{classCode}\"}}", HttpContext.Connection.RemoteIpAddress?.ToString());

            return Ok(new
            {
                message = $"Cấp tài khoản cho học viên {studentCode} thành công!",
                account = new ProvisionedAccountResultDto
                {
                    Id = newUser.Id,
                    Username = newUser.Username,
                    DefaultPassword = defaultPass,
                    FullName = newUser.FullName,
                    ClassCode = classCode,
                    MustChangePassword = true,
                    IsProfileLocked = false
                }
            });
        }
        catch (Exception ex)
        {
            await trans.RollbackAsync();
            return StatusCode(500, new { message = "Lỗi khi cấp tài khoản: " + ex.Message });
        }
    }

    [HttpPost("update-student-profile")]
    public async Task<IActionResult> UpdateStudentProfile([FromBody] UpdateStudentProfileDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Username))
        {
            return BadRequest(new { message = "Tên đăng nhập không được để trống." });
        }

        var user = await _db.Users
            .Include(u => u.Role)
            .Include(u => u.StudentClasses).ThenInclude(sc => sc.Class)
            .Include(u => u.ClearanceLevels).ThenInclude(c => c.ClassificationLevel)
            .FirstOrDefaultAsync(u => u.Username == dto.Username);

        if (user == null)
        {
            return NotFound(new { message = "Không tìm thấy thông tin tài khoản học viên." });
        }

        if (string.IsNullOrWhiteSpace(dto.NewPassword) || dto.NewPassword.Length < 4)
        {
            return BadRequest(new { message = "Mật khẩu mới phải có ít nhất 4 ký tự." });
        }

        user.PasswordHash = _hasher.HashPassword(dto.NewPassword);
        if (!string.IsNullOrWhiteSpace(dto.FullName))
        {
            user.FullName = dto.FullName.Trim();
        }
        if (!string.IsNullOrWhiteSpace(dto.Phone))
        {
            user.Phone = dto.Phone.Trim();
        }
        if (!string.IsNullOrWhiteSpace(dto.Email))
        {
            user.Email = dto.Email.Trim();
        }

        user.MustChangePassword = false;
        user.IsProfileLocked = true;
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        await _audit.LogAsync(user.Id, "UPDATE_PROFILE_FIRST_TIME", "USER", user.Id, null, $"{{\"username\":\"{user.Username}\"}}", HttpContext.Connection.RemoteIpAddress?.ToString());

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
            MustChangePassword = user.MustChangePassword,
            IsProfileLocked = user.IsProfileLocked,
            StudentCode = user.StudentCode,
            ClassName = user.StudentClasses.Select(sc => sc.Class!.Code).FirstOrDefault(),
            Permissions = user.Role?.RolePermissions.Select(rp => rp.Permission!.Code).ToList() ?? new List<string>()
        };

        return Ok(new
        {
            message = "Cập nhật mật khẩu và thông tin học viên thành công! Hồ sơ đã được khóa an toàn.",
            user = userDto
        });
    }

    [HttpGet("provisioned-students")]
    public async Task<IActionResult> GetProvisionedStudents(
        [FromQuery] string? classCode,
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] int? page,
        [FromQuery] int? pageSize)
    {
        var query = _db.Users
            .Include(u => u.StudentClasses).ThenInclude(sc => sc.Class)
            .Include(u => u.Role)
            .AsNoTracking()
            .Where(u => u.Role!.Code == "STUDENT" || u.StudentCode != null);

        if (!string.IsNullOrWhiteSpace(classCode))
        {
            query = query.Where(u => u.StudentClasses.Any(sc => sc.Class!.Code == classCode));
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(u => u.Status == status.Trim());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            string s = search.Trim().ToLower();
            query = query.Where(u =>
                (u.StudentCode != null && u.StudentCode.ToLower().Contains(s)) ||
                u.Username.ToLower().Contains(s) ||
                u.FullName.ToLower().Contains(s) ||
                (u.Phone != null && u.Phone.Contains(s)) ||
                (u.Email != null && u.Email.ToLower().Contains(s)));
        }

        var selectQuery = query
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new
            {
                u.Id,
                u.Username,
                u.FullName,
                u.Email,
                u.Phone,
                u.StudentCode,
                ClassId = u.StudentClasses.Select(sc => sc.ClassId).FirstOrDefault(),
                ClassCode = u.StudentClasses.Select(sc => sc.Class!.Code).FirstOrDefault() ?? "DT5B",
                ClassName = u.StudentClasses.Select(sc => sc.Class!.Name).FirstOrDefault() ?? "Lớp Đào tạo Nghiệp vụ",
                u.Status,
                u.MustChangePassword,
                u.IsProfileLocked,
                u.CreatedAt,
                u.LastLoginAt
            });

        if (page.HasValue && page.Value > 0)
        {
            int size = Math.Clamp(pageSize ?? 15, 1, 100);
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

        var list = await selectQuery.Take(100).ToListAsync();
        return Ok(list);
    }

    [HttpPost("enroll-student")]
    public async Task<IActionResult> EnrollStudent([FromBody] EnrollStudentRequest req, [FromQuery] ulong? adminUserId)
    {
        User? student = null;
        if (req.StudentId > 0)
        {
            student = await _db.Users.Include(u => u.StudentClasses).FirstOrDefaultAsync(u => u.Id == req.StudentId);
        }
        else if (!string.IsNullOrWhiteSpace(req.StudentCode))
        {
            string sc = req.StudentCode.Trim().ToLower();
            student = await _db.Users.Include(u => u.StudentClasses)
                .FirstOrDefaultAsync(u => (u.StudentCode != null && u.StudentCode.ToLower() == sc) || u.Username.ToLower() == sc);
        }

        if (student == null) return NotFound(new { message = "Không tìm thấy học viên với mã sinh viên (MSSV) hoặc ID này." });

        ClassRecord? targetClass = null;
        if (req.ClassId.HasValue && req.ClassId.Value > 0)
        {
            targetClass = await _db.Classes.FirstOrDefaultAsync(c => c.Id == req.ClassId.Value);
        }
        else if (!string.IsNullOrWhiteSpace(req.ClassCode))
        {
            targetClass = await _db.Classes.FirstOrDefaultAsync(c => c.Code == req.ClassCode.Trim());
        }

        if (targetClass == null)
            return NotFound(new { message = "Không tìm thấy lớp học vụ yêu cầu." });

        // Remove old classes if single class enrollment or update
        if (req.ReplaceExisting)
        {
            _db.StudentClasses.RemoveRange(student.StudentClasses);
        }

        if (!student.StudentClasses.Any(sc => sc.ClassId == targetClass.Id))
        {
            _db.StudentClasses.Add(new StudentClass
            {
                StudentId = student.Id,
                ClassId = targetClass.Id,
                Status = "ACTIVE",
                JoinedAt = DateTime.UtcNow
            });
        }

        await _db.SaveChangesAsync();

        await _audit.LogAsync(adminUserId ?? 1, "ENROLL_STUDENT", "STUDENT_CLASS", student.Id, null,
            $"{{\"student\":\"{student.Username}\",\"classCode\":\"{targetClass.Code}\"}}",
            HttpContext.Connection.RemoteIpAddress?.ToString());

        return Ok(new
        {
            message = $"Đã cập nhật học viên {student.FullName} vào lớp {targetClass.Name} ({targetClass.Code})!",
            studentId = student.Id,
            classId = targetClass.Id,
            classCode = targetClass.Code,
            className = targetClass.Name
        });
    }

    [HttpPost("reset-student-password/{id}")]
    public async Task<IActionResult> ResetStudentPassword(ulong id, [FromQuery] ulong? adminUserId)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user == null) return NotFound(new { message = "Không tìm thấy người dùng." });

        string resetPass = !string.IsNullOrWhiteSpace(user.StudentCode) ? user.StudentCode : user.Username;
        user.PasswordHash = _hasher.HashPassword(resetPass);
        user.MustChangePassword = true;
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        await _audit.LogAsync(adminUserId ?? 1, "RESET_PASSWORD", "USER", user.Id, null, $"{{\"username\":\"{user.Username}\"}}", HttpContext.Connection.RemoteIpAddress?.ToString());

        return Ok(new
        {
            message = $"Đã đặt lại mật khẩu cho tài khoản {user.Username} về mặc định ({resetPass}). Yêu cầu đổi pass khi đăng nhập.",
            defaultPassword = resetPass
        });
    }

    [HttpPost("provision-import")]
    public async Task<IActionResult> ProvisionImport([FromBody] ImportStudentsRequestDto req, [FromQuery] ulong? adminUserId)
    {
        if (req.Students == null || req.Students.Count == 0)
        {
            return BadRequest(new { message = "Danh sách học viên từ file trống." });
        }

        var studentRole = await _db.Roles.FirstOrDefaultAsync(r => r.Code == "STUDENT")
                          ?? await _db.Roles.FirstOrDefaultAsync();

        if (studentRole == null)
        {
            return BadRequest(new { message = "Không tìm thấy vai trò Sinh viên." });
        }

        ulong clearanceId = req.ClearanceLevelId > 0 ? req.ClearanceLevelId : 2;

        int createdCount = 0;
        int updatedCount = 0;
        int skippedCount = 0;
        var createdAccounts = new List<ProvisionedAccountResultDto>();

        using var trans = await _db.Database.BeginTransactionAsync();
        try
        {
            foreach (var row in req.Students)
            {
                if (string.IsNullOrWhiteSpace(row.StudentCode))
                {
                    skippedCount++;
                    continue;
                }

                string studentCode = row.StudentCode.Trim();
                string username = studentCode;
                string classCode = string.IsNullOrWhiteSpace(row.ClassCode) ? "DT5B" : row.ClassCode.Trim().ToUpper();
                string defaultPass = string.IsNullOrWhiteSpace(row.Password) ? studentCode : row.Password.Trim();

                // 1. Ensure class exists
                var classRecord = await _db.Classes.FirstOrDefaultAsync(c => c.Code == classCode);
                if (classRecord == null)
                {
                    classRecord = new ClassRecord
                    {
                        Code = classCode,
                        Name = $"Lớp Đào tạo {classCode}",
                        AcademicYear = "2025-2026",
                        Semester = "Học kỳ 1",
                        Status = "ACTIVE",
                        OrganizationalUnitId = 2,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _db.Classes.Add(classRecord);
                    await _db.SaveChangesAsync();
                }

                // 2. Check existing user
                var existingUser = await _db.Users
                    .Include(u => u.StudentClasses)
                    .FirstOrDefaultAsync(u => u.Username == username);

                if (existingUser != null)
                {
                    if (!string.IsNullOrWhiteSpace(row.FullName)) existingUser.FullName = row.FullName.Trim();
                    if (!string.IsNullOrWhiteSpace(row.Phone)) existingUser.Phone = row.Phone.Trim();
                    if (!string.IsNullOrWhiteSpace(row.Email)) existingUser.Email = row.Email.Trim();
                    existingUser.UpdatedAt = DateTime.UtcNow;

                    if (!existingUser.StudentClasses.Any(sc => sc.ClassId == classRecord.Id))
                    {
                        _db.StudentClasses.Add(new StudentClass
                        {
                            StudentId = existingUser.Id,
                            ClassId = classRecord.Id,
                            Status = "ACTIVE",
                            JoinedAt = DateTime.UtcNow
                        });
                    }

                    updatedCount++;
                    createdAccounts.Add(new ProvisionedAccountResultDto
                    {
                        Id = existingUser.Id,
                        Username = existingUser.Username,
                        DefaultPassword = studentCode,
                        FullName = existingUser.FullName,
                        ClassCode = classCode,
                        MustChangePassword = existingUser.MustChangePassword,
                        IsProfileLocked = existingUser.IsProfileLocked
                    });
                    continue;
                }

                // 3. Create new student user
                string passHash = _hasher.HashPassword(defaultPass);
                var newUser = new User
                {
                    Username = username,
                    PasswordHash = passHash,
                    FullName = string.IsNullOrWhiteSpace(row.FullName) ? $"Học viên {studentCode}" : row.FullName.Trim(),
                    StudentCode = studentCode,
                    Phone = row.Phone?.Trim(),
                    Email = row.Email?.Trim(),
                    RoleId = studentRole.Id,
                    OrganizationalUnitId = classRecord.OrganizationalUnitId ?? 2,
                    Status = "ACTIVE",
                    MustChangePassword = true,
                    IsProfileLocked = false,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _db.Users.Add(newUser);
                await _db.SaveChangesAsync();

                _db.StudentClasses.Add(new StudentClass
                {
                    StudentId = newUser.Id,
                    ClassId = classRecord.Id,
                    Status = "ACTIVE",
                    JoinedAt = DateTime.UtcNow
                });

                _db.UserClearanceLevels.Add(new UserClearanceLevel
                {
                    UserId = newUser.Id,
                    ClassificationLevelId = clearanceId,
                    GrantedBy = adminUserId ?? 1,
                    GrantedAt = DateTime.UtcNow,
                    Status = "ACTIVE",
                    CreatedAt = DateTime.UtcNow
                });

                await _db.SaveChangesAsync();

                createdCount++;
                createdAccounts.Add(new ProvisionedAccountResultDto
                {
                    Id = newUser.Id,
                    Username = newUser.Username,
                    DefaultPassword = defaultPass,
                    FullName = newUser.FullName,
                    ClassCode = classCode,
                    MustChangePassword = true,
                    IsProfileLocked = false
                });
            }

            await _audit.LogAsync(adminUserId ?? 1, "PROVISION_EXCEL_IMPORT", "USER", null, null, $"{{\"totalRows\":{req.Students.Count},\"created\":{createdCount},\"updated\":{updatedCount}}}", HttpContext.Connection.RemoteIpAddress?.ToString());

            await trans.CommitAsync();

            return Ok(new
            {
                message = $"Nhập liệu từ file Excel thành công! Tạo mới: {createdCount} học viên, Cập nhật: {updatedCount}, Bỏ qua: {skippedCount}.",
                createdCount,
                updatedCount,
                skippedCount,
                totalCount = createdAccounts.Count,
                accounts = createdAccounts
            });
        }
        catch (Exception ex)
        {
            await trans.RollbackAsync();
            return StatusCode(500, new { message = "Lỗi khi nhập liệu file Excel: " + ex.Message });
        }
    }

    [HttpGet("template/excel")]
    public IActionResult DownloadExcelTemplate()
    {
        string filePath = Path.Combine(Directory.GetCurrentDirectory(), "Storage", "Mau_Nhap_Lieu_Hoc_Vien_T04.xlsx");
        if (!System.IO.File.Exists(filePath))
        {
            filePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Storage", "Mau_Nhap_Lieu_Hoc_Vien_T04.xlsx");
        }
        if (!System.IO.File.Exists(filePath))
        {
            return NotFound(new { message = "Không tìm thấy file mẫu Excel trên máy chủ." });
        }
        var bytes = System.IO.File.ReadAllBytes(filePath);
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Mau_Nhap_Lieu_Hoc_Vien_T04.xlsx");
    }

    [HttpGet("template/csv")]
    public IActionResult DownloadCsvTemplate()
    {
        string filePath = Path.Combine(Directory.GetCurrentDirectory(), "Storage", "Mau_Nhap_Lieu_Hoc_Vien_T04.csv");
        if (!System.IO.File.Exists(filePath))
        {
            filePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Storage", "Mau_Nhap_Lieu_Hoc_Vien_T04.csv");
        }
        if (!System.IO.File.Exists(filePath))
        {
            return NotFound(new { message = "Không tìm thấy file mẫu CSV trên máy chủ." });
        }
        var bytes = System.IO.File.ReadAllBytes(filePath);
        return File(bytes, "text/csv; charset=utf-8", "Mau_Nhap_Lieu_Hoc_Vien_T04.csv");
    }

    [HttpGet("export/csv")]
    public async Task<IActionResult> ExportStudentsCsv([FromQuery] string? classCode)
    {
        var query = _db.Users
            .Include(u => u.StudentClasses).ThenInclude(sc => sc.Class)
            .Include(u => u.Role)
            .Where(u => u.Role!.Code == "STUDENT" || u.StudentCode != null);

        if (!string.IsNullOrWhiteSpace(classCode))
        {
            query = query.Where(u => u.StudentClasses.Any(sc => sc.Class!.Code == classCode));
        }

        var students = await query.OrderByDescending(u => u.CreatedAt).ToListAsync();

        var sb = new System.Text.StringBuilder();
        sb.Append('\uFEFF'); // UTF-8 BOM for Microsoft Excel Vietnamese support
        sb.AppendLine("STT,Tên đăng nhập,Mã sinh viên,Lớp học vụ,Họ và tên,Email,Số điện thoại,Trạng thái đổi pass,Khóa hồ sơ");

        int index = 1;
        foreach (var st in students)
        {
            string code = !string.IsNullOrWhiteSpace(st.StudentCode) ? st.StudentCode : st.Username;
            string cls = st.StudentClasses.Select(sc => sc.Class!.Code).FirstOrDefault() ?? "DT5B";
            string name = $"\"{st.FullName?.Replace("\"", "\"\"")}\"";
            string email = st.Email ?? "";
            string phone = st.Phone ?? "";
            string mustChange = st.MustChangePassword ? "Chưa đổi pass" : "Đã đổi pass";
            string locked = st.IsProfileLocked ? "Đã khóa hồ sơ" : "Chưa khóa";

            sb.AppendLine($"{index++},{st.Username},{code},{cls},{name},{email},{phone},{mustChange},{locked}");
        }

        var bytes = System.Text.Encoding.UTF8.GetBytes(sb.ToString());
        return File(bytes, "text/csv; charset=utf-8", $"Danh_sach_tai_khoan_hoc_vien_{DateTime.UtcNow:yyyyMMdd}.csv");
    }
}
