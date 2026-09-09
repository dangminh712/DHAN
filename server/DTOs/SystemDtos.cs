namespace Server.DTOs;

public class SystemOverviewDto
{
    public string DatabaseName { get; set; } = "training_management";
    public string DatabaseEngine { get; set; } = "MySQL 8.0 (InnoDB, utf8mb4_0900_ai_ci)";
    public int TotalUsers { get; set; }
    public int TotalRoles { get; set; }
    public int TotalPermissions { get; set; }
    public int TotalOrganizationalUnits { get; set; }
    public int TotalClasses { get; set; }
    public int TotalSubjects { get; set; }
    public int TotalLectures { get; set; }
    public int TotalFiles { get; set; }
    public int TotalAuditLogs { get; set; }
    public int TotalDownloadLogs { get; set; }
    public int TotalSecurityAlerts { get; set; }
    public List<SystemSettingItemDto> Settings { get; set; } = new();
    public List<TableStatDto> TableStats { get; set; } = new();
}

public class SystemSettingItemDto
{
    public string Key { get; set; } = string.Empty;
    public string? Value { get; set; }
    public string Type { get; set; } = "STRING";
    public string? Description { get; set; }
}

public class TableStatDto
{
    public string TableName { get; set; } = string.Empty;
    public string Module { get; set; } = string.Empty;
    public int RowCount { get; set; }
    public string Description { get; set; } = string.Empty;
}

public class AuditLogItemDto
{
    public ulong Id { get; set; }
    public string? Username { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public ulong? EntityId { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string? AccessReason { get; set; }
    public string? IpAddress { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class SecurityAlertItemDto
{
    public ulong Id { get; set; }
    public string? Username { get; set; }
    public string AlertType { get; set; } = string.Empty;
    public string Severity { get; set; } = "MEDIUM";
    public string? Description { get; set; }
    public string? SourceIp { get; set; }
    public string Status { get; set; } = "OPEN";
    public string? ResolverName { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
