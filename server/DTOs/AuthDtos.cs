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
