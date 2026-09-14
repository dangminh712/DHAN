namespace Server.DTOs;

public class LoginDto
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? DeviceId { get; set; }
    public string? DeviceName { get; set; }
}

public class UserDto
{
    public ulong Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string Role { get; set; } = string.Empty;
    public string RoleName { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string MaxClearance { get; set; } = string.Empty;
    public int ClearanceLevelOrder { get; set; } = 1;
    public string Status { get; set; } = "ACTIVE";
    public bool MustChangePassword { get; set; } = false;
    public bool IsProfileLocked { get; set; } = false;
    public string? StudentCode { get; set; }
    public string? ClassName { get; set; }
    public List<string> AssignedClasses { get; set; } = new();
    public List<string> Permissions { get; set; } = new();
}

public class SwitchUserRequest
{
    public string Username { get; set; } = string.Empty;
}

public class UserSessionDto
{
    public ulong Id { get; set; }
    public ulong UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string DeviceId { get; set; } = string.Empty;
    public string? DeviceName { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public DateTime? LastActivityAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public bool IsActive => RevokedAt == null && (ExpiresAt == null || ExpiresAt > DateTime.UtcNow);
}

public class CreateUserDto
{
    public string Username { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string Password { get; set; } = "T04@Security2026!";
    public string RoleCode { get; set; } = "STUDENT";
    public ulong? OrganizationalUnitId { get; set; }
    public ulong ClearanceLevelId { get; set; } = 2; // Default INTERNAL
}

public class UpdateUserDto
{
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Password { get; set; }
    public string RoleCode { get; set; } = "STUDENT";
    public ulong? OrganizationalUnitId { get; set; }
    public ulong ClearanceLevelId { get; set; } = 2;
    public string Status { get; set; } = "ACTIVE";
}

public class BatchProvisionDto
{
    public string Pattern { get; set; } = "(001->055)_DT5B";
    public int FromNumber { get; set; } = 1;
    public int ToNumber { get; set; } = 55;
    public int Padding { get; set; } = 3;
    public string Prefix { get; set; } = "";
    public string Suffix { get; set; } = "_DT5B";
    public string ClassCode { get; set; } = "DT5B";
    public string ClassName { get; set; } = "Lớp Đào tạo Nghiệp vụ DT5B";
    public ulong? OrganizationalUnitId { get; set; } = 2;
    public ulong ClearanceLevelId { get; set; } = 2;
    public bool MustChangePassword { get; set; } = true;
    public bool IsProfileLocked { get; set; } = true;
}

public class SingleProvisionDto
{
    public string StudentCode { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public string? Password { get; set; }
    public string ClassCode { get; set; } = "DT5B";
    public string? ClassName { get; set; }
    public ulong? OrganizationalUnitId { get; set; }
    public ulong ClearanceLevelId { get; set; } = 2;
    public bool MustChangePassword { get; set; } = true;
    public bool IsProfileLocked { get; set; } = true;
}

public class UpdateStudentProfileDto
{
    public string Username { get; set; } = string.Empty;
    public string? CurrentPassword { get; set; }
    public string NewPassword { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
}

public class ProvisionedAccountResultDto
{
    public ulong Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string DefaultPassword { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string ClassCode { get; set; } = string.Empty;
    public bool MustChangePassword { get; set; } = true;
    public bool IsProfileLocked { get; set; } = true;
}

public class ImportStudentRowDto
{
    public string StudentCode { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public string? ClassCode { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Password { get; set; }
}

public class ImportStudentsRequestDto
{
    public List<ImportStudentRowDto> Students { get; set; } = new();
    public ulong ClearanceLevelId { get; set; } = 2;
}

public class EnrollStudentRequest
{
    public ulong StudentId { get; set; }
    public string? StudentCode { get; set; }
    public ulong? ClassId { get; set; }
    public string? ClassCode { get; set; }
    public bool ReplaceExisting { get; set; } = true;
}

