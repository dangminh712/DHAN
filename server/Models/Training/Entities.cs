using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models.Training;

// 1. Role
[Table("roles")]
public class Role
{
    [Key]
    public ulong Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = "ACTIVE";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
    public ICollection<User> Users { get; set; } = new List<User>();
}

// 2. Permission
[Table("permissions")]
public class Permission
{
    [Key]
    public ulong Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Module { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}

// 3. RolePermission
[Table("role_permissions")]
public class RolePermission
{
    public ulong RoleId { get; set; }
    public Role? Role { get; set; }

    public ulong PermissionId { get; set; }
    public Permission? Permission { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

// 4. OrganizationalUnit
[Table("organizational_units")]
public class OrganizationalUnit
{
    [Key]
    public ulong Id { get; set; }
    public ulong? ParentId { get; set; }
    public OrganizationalUnit? Parent { get; set; }

    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string UnitType { get; set; } = "FACULTY";
    public string Status { get; set; } = "ACTIVE";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<OrganizationalUnit> Children { get; set; } = new List<OrganizationalUnit>();
    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<ClassRecord> Classes { get; set; } = new List<ClassRecord>();
    public ICollection<Subject> Subjects { get; set; } = new List<Subject>();
}

// 5. User
[Table("users")]
public class User
{
    [Key]
    public ulong Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }

    public ulong RoleId { get; set; }
    public Role? Role { get; set; }

    public ulong? OrganizationalUnitId { get; set; }
    public OrganizationalUnit? OrganizationalUnit { get; set; }

    public string Status { get; set; } = "ACTIVE";
    public DateTime? LastLoginAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeletedAt { get; set; }

    public ICollection<StudentClass> StudentClasses { get; set; } = new List<StudentClass>();
    public ICollection<TeacherSubject> TeacherSubjects { get; set; } = new List<TeacherSubject>();
    public ICollection<UserClearanceLevel> ClearanceLevels { get; set; } = new List<UserClearanceLevel>();
    public ICollection<UserSession> Sessions { get; set; } = new List<UserSession>();
    public ICollection<Lecture> Lectures { get; set; } = new List<Lecture>();
}

// 6. Class
[Table("classes")]
public class ClassRecord
{
    [Key]
    public ulong Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;

    public ulong? OrganizationalUnitId { get; set; }
    public OrganizationalUnit? OrganizationalUnit { get; set; }

    public string AcademicYear { get; set; } = string.Empty;
    public string? Semester { get; set; }
    public string Status { get; set; } = "ACTIVE";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<StudentClass> StudentClasses { get; set; } = new List<StudentClass>();
    public ICollection<LecturePermission> LecturePermissions { get; set; } = new List<LecturePermission>();
}

// 7. StudentClass
[Table("student_classes")]
public class StudentClass
{
    [Key]
    public ulong Id { get; set; }
    public ulong StudentId { get; set; }
    public User? Student { get; set; }

    public ulong ClassId { get; set; }
    public ClassRecord? Class { get; set; }

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = "ACTIVE";
}

// 8. Subject
[Table("subjects")]
public class Subject
{
    [Key]
    public ulong Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    public ulong? OrganizationalUnitId { get; set; }
    public OrganizationalUnit? OrganizationalUnit { get; set; }

    public decimal? Credits { get; set; }
    public string Status { get; set; } = "ACTIVE";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<TeacherSubject> TeacherSubjects { get; set; } = new List<TeacherSubject>();
    public ICollection<Lecture> Lectures { get; set; } = new List<Lecture>();
}

// 9. TeacherSubject
[Table("teacher_subjects")]
public class TeacherSubject
{
    [Key]
    public ulong Id { get; set; }
    public ulong TeacherId { get; set; }
    public User? Teacher { get; set; }

    public ulong SubjectId { get; set; }
    public Subject? Subject { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

// 10. ClassificationLevel
[Table("classification_levels")]
public class ClassificationLevel
{
    [Key]
    public ulong Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int LevelOrder { get; set; }
    public string? Description { get; set; }
    public string Status { get; set; } = "ACTIVE";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

// 11. UserClearanceLevel
[Table("user_clearance_levels")]
public class UserClearanceLevel
{
    [Key]
    public ulong Id { get; set; }
    public ulong UserId { get; set; }
    public User? User { get; set; }

    public ulong ClassificationLevelId { get; set; }
    public ClassificationLevel? ClassificationLevel { get; set; }

    public ulong GrantedBy { get; set; }
    public User? Granter { get; set; }

    public DateTime GrantedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }
    public string Status { get; set; } = "ACTIVE";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

// 12. Lecture
[Table("lectures")]
public class Lecture
{
    [Key]
    public ulong Id { get; set; }
    public ulong SubjectId { get; set; }
    public Subject? Subject { get; set; }

    public ulong TeacherId { get; set; }
    public User? Teacher { get; set; }

    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = "DRAFT"; // DRAFT, SCHEDULED, PUBLISHED, CLOSED, ARCHIVED
    public DateTime? PublishAt { get; set; }
    public DateTime? CloseAt { get; set; }
    public int Version { get; set; } = 1;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeletedAt { get; set; }

    public ICollection<LecturePermission> Permissions { get; set; } = new List<LecturePermission>();
    public ICollection<LectureFile> LectureFiles { get; set; } = new List<LectureFile>();
}

// 13. LecturePermission
[Table("lecture_permissions")]
public class LecturePermission
{
    [Key]
    public ulong Id { get; set; }
    public ulong LectureId { get; set; }
    public Lecture? Lecture { get; set; }

    public ulong ClassId { get; set; }
    public ClassRecord? Class { get; set; }

    public bool CanView { get; set; } = false;
    public DateTime? PublishAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

// 14. FileRecord
[Table("files")]
public class FileRecord
{
    [Key]
    public ulong Id { get; set; }
    public string OriginalName { get; set; } = string.Empty;
    public string StoredName { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public string? Extension { get; set; }
    public string FileType { get; set; } = "DOCUMENT"; // PDF, IMAGE, VIDEO, DOCUMENT, OTHER
    public ulong FileSize { get; set; }
    public string StoragePath { get; set; } = string.Empty;
    public string ChecksumSha256 { get; set; } = string.Empty;

    public ulong ClassificationLevelId { get; set; }
    public ClassificationLevel? ClassificationLevel { get; set; }

    public ulong UploadedBy { get; set; }
    public User? Uploader { get; set; }

    public string Status { get; set; } = "ACTIVE"; // DRAFT, ACTIVE, LOCKED, ARCHIVED, DELETED
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeletedAt { get; set; }

    public ICollection<FileVersion> Versions { get; set; } = new List<FileVersion>();
    public ICollection<LectureFile> LectureFiles { get; set; } = new List<LectureFile>();
    public ICollection<FilePermission> Permissions { get; set; } = new List<FilePermission>();
}

// 15. LectureFile
[Table("lecture_files")]
public class LectureFile
{
    [Key]
    public ulong Id { get; set; }
    public ulong LectureId { get; set; }
    public Lecture? Lecture { get; set; }

    public ulong FileId { get; set; }
    public FileRecord? File { get; set; }

    public int DisplayOrder { get; set; } = 0;
    public bool IsVisible { get; set; } = false;
    public bool IsDownloadable { get; set; } = false;
    public bool IsPrintable { get; set; } = false;
    public DateTime? PublishAt { get; set; }
    public DateTime? CloseAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

// 16. FilePermission
[Table("file_permissions")]
public class FilePermission
{
    [Key]
    public ulong Id { get; set; }
    public ulong FileId { get; set; }
    public FileRecord? File { get; set; }

    public ulong? UserId { get; set; }
    public User? User { get; set; }

    public ulong? ClassId { get; set; }
    public ClassRecord? Class { get; set; }

    public bool CanView { get; set; } = false;
    public bool CanDownload { get; set; } = false;
    public bool CanPrint { get; set; } = false;
    public string? AccessReason { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

// 17. FileVersion
[Table("file_versions")]
public class FileVersion
{
    [Key]
    public ulong Id { get; set; }
    public ulong FileId { get; set; }
    public FileRecord? File { get; set; }

    public int Version { get; set; }
    public string StoredName { get; set; } = string.Empty;
    public string StoragePath { get; set; } = string.Empty;
    public string ChecksumSha256 { get; set; } = string.Empty;

    public ulong UploadedBy { get; set; }
    public User? Uploader { get; set; }

    public string? ChangeNote { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

// 18. WatchHistory
[Table("watch_history")]
public class WatchHistory
{
    [Key]
    public ulong Id { get; set; }
    public ulong UserId { get; set; }
    public User? User { get; set; }

    public ulong FileId { get; set; }
    public FileRecord? File { get; set; }

    public ulong? LectureId { get; set; }
    public Lecture? Lecture { get; set; }

    public decimal LastPositionSeconds { get; set; } = 0;
    public decimal? DurationSeconds { get; set; }
    public bool Completed { get; set; } = false;
    public DateTime LastWatchedAt { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

// 19. LearningProgress
[Table("learning_progress")]
public class LearningProgress
{
    [Key]
    public ulong Id { get; set; }
    public ulong UserId { get; set; }
    public User? User { get; set; }

    public ulong LectureId { get; set; }
    public Lecture? Lecture { get; set; }

    public decimal ProgressPercent { get; set; } = 0;
    public bool Completed { get; set; } = false;
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

// 20. DownloadLog
[Table("download_logs")]
public class DownloadLog
{
    [Key]
    public ulong Id { get; set; }
    public ulong UserId { get; set; }
    public User? User { get; set; }

    public ulong FileId { get; set; }
    public FileRecord? File { get; set; }

    public ulong? LectureId { get; set; }
    public Lecture? Lecture { get; set; }

    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public ulong? FileSize { get; set; }
    public string Status { get; set; } = "SUCCESS"; // SUCCESS, DENIED, FAILED
    public string? DenialReason { get; set; }
    public DateTime DownloadedAt { get; set; } = DateTime.UtcNow;
}

// 21. AuditLog
[Table("audit_logs")]
public class AuditLog
{
    [Key]
    public ulong Id { get; set; }
    public ulong? UserId { get; set; }
    public User? User { get; set; }

    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public ulong? EntityId { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string? AccessReason { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

// 22. SecurityAlert
[Table("security_alerts")]
public class SecurityAlert
{
    [Key]
    public ulong Id { get; set; }
    public ulong? UserId { get; set; }
    public User? User { get; set; }

    public string AlertType { get; set; } = string.Empty;
    public string Severity { get; set; } = "MEDIUM"; // LOW, MEDIUM, HIGH, CRITICAL
    public string? Description { get; set; }
    public string? SourceIp { get; set; }
    public string Status { get; set; } = "OPEN"; // OPEN, INVESTIGATING, RESOLVED, FALSE_POSITIVE

    public ulong? ResolvedBy { get; set; }
    public User? Resolver { get; set; }

    public DateTime? ResolvedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

// 23. UserSession
[Table("user_sessions")]
public class UserSession
{
    [Key]
    public ulong Id { get; set; }
    public ulong UserId { get; set; }
    public User? User { get; set; }

    public string SessionTokenHash { get; set; } = string.Empty;
    public string DeviceId { get; set; } = string.Empty;
    public string? DeviceName { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public DateTime? LastActivityAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

// 24. UserMfa
[Table("user_mfa")]
public class UserMfa
{
    [Key]
    public ulong Id { get; set; }
    public ulong UserId { get; set; }
    public User? User { get; set; }

    public string Method { get; set; } = "TOTP"; // TOTP, EMAIL_OTP, SMS_OTP
    public string? SecretEncrypted { get; set; }
    public bool IsEnabled { get; set; } = false;
    public DateTime? EnabledAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

// 25. Notification
[Table("notifications")]
public class NotificationRecord
{
    [Key]
    public ulong Id { get; set; }
    public ulong UserId { get; set; }
    public User? User { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? Type { get; set; }
    public bool IsRead { get; set; } = false;
    public DateTime? ReadAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

// 26. RetentionPolicy
[Table("retention_policies")]
public class RetentionPolicy
{
    [Key]
    public ulong Id { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public int RetentionDays { get; set; }
    public int? ArchiveAfterDays { get; set; }
    public int? DeleteAfterDays { get; set; }
    public bool IsEnabled { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

// 27. SystemSetting
[Table("system_settings")]
public class SystemSetting
{
    [Key]
    public ulong Id { get; set; }
    public string SettingKey { get; set; } = string.Empty;
    public string? SettingValue { get; set; }
    public string SettingType { get; set; } = "STRING"; // STRING, INTEGER, BOOLEAN, JSON
    public string? Description { get; set; }
    public bool IsSensitive { get; set; } = false;

    public ulong? UpdatedBy { get; set; }
    public User? Updater { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
