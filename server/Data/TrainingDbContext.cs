using Microsoft.EntityFrameworkCore;
using Server.Models.Training;

namespace Server.Data;

public class TrainingDbContext : DbContext
{
    public TrainingDbContext(DbContextOptions<TrainingDbContext> options) : base(options)
    {
    }

    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<OrganizationalUnit> OrganizationalUnits => Set<OrganizationalUnit>();
    public DbSet<User> Users => Set<User>();
    public DbSet<ClassRecord> Classes => Set<ClassRecord>();
    public DbSet<StudentClass> StudentClasses => Set<StudentClass>();
    public DbSet<Subject> Subjects => Set<Subject>();
    public DbSet<TeacherSubject> TeacherSubjects => Set<TeacherSubject>();
    public DbSet<ClassificationLevel> ClassificationLevels => Set<ClassificationLevel>();
    public DbSet<UserClearanceLevel> UserClearanceLevels => Set<UserClearanceLevel>();
    public DbSet<Lecture> Lectures => Set<Lecture>();
    public DbSet<LecturePermission> LecturePermissions => Set<LecturePermission>();
    public DbSet<FileRecord> Files => Set<FileRecord>();
    public DbSet<LectureFile> LectureFiles => Set<LectureFile>();
    public DbSet<FilePermission> FilePermissions => Set<FilePermission>();
    public DbSet<FileVersion> FileVersions => Set<FileVersion>();
    public DbSet<WatchHistory> WatchHistories => Set<WatchHistory>();
    public DbSet<LearningProgress> LearningProgresses => Set<LearningProgress>();
    public DbSet<DownloadLog> DownloadLogs => Set<DownloadLog>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<SecurityAlert> SecurityAlerts => Set<SecurityAlert>();
    public DbSet<UserSession> UserSessions => Set<UserSession>();
    public DbSet<UserMfa> UserMfas => Set<UserMfa>();
    public DbSet<NotificationRecord> Notifications => Set<NotificationRecord>();
    public DbSet<RetentionPolicy> RetentionPolicies => Set<RetentionPolicy>();
    public DbSet<SystemSetting> SystemSettings => Set<SystemSetting>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 1. RolePermission Composite Key
        modelBuilder.Entity<RolePermission>()
            .HasKey(rp => new { rp.RoleId, rp.PermissionId });

        // 2. Soft Delete Global Query Filters
        modelBuilder.Entity<User>().HasQueryFilter(u => u.DeletedAt == null);
        modelBuilder.Entity<Lecture>().HasQueryFilter(l => l.DeletedAt == null);
        modelBuilder.Entity<FileRecord>().HasQueryFilter(f => f.DeletedAt == null);

        // 3. Unique constraints & Composite unique keys
        modelBuilder.Entity<StudentClass>()
            .HasIndex(sc => new { sc.StudentId, sc.ClassId }).IsUnique();

        modelBuilder.Entity<TeacherSubject>()
            .HasIndex(ts => new { ts.TeacherId, ts.SubjectId }).IsUnique();

        modelBuilder.Entity<LecturePermission>()
            .HasIndex(lp => new { lp.LectureId, lp.ClassId }).IsUnique();

        modelBuilder.Entity<LectureFile>()
            .HasIndex(lf => new { lf.LectureId, lf.FileId }).IsUnique();

        modelBuilder.Entity<FileVersion>()
            .HasIndex(fv => new { fv.FileId, fv.Version }).IsUnique();

        modelBuilder.Entity<WatchHistory>()
            .HasIndex(wh => new { wh.UserId, wh.FileId }).IsUnique();

        modelBuilder.Entity<LearningProgress>()
            .HasIndex(lp => new { lp.UserId, lp.LectureId }).IsUnique();

        // 4. Important Composite Indexes (Section 50)
        modelBuilder.Entity<DownloadLog>()
            .HasIndex(dl => new { dl.UserId, dl.DownloadedAt });

        // 5. Restrict/SetNull deletes on Audit & Download logs (Section 42)
        modelBuilder.Entity<AuditLog>()
            .HasOne(a => a.User)
            .WithMany()
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<DownloadLog>()
            .HasOne(d => d.User)
            .WithMany()
            .HasForeignKey(d => d.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<SecurityAlert>()
            .HasOne(s => s.User)
            .WithMany()
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<SecurityAlert>()
            .HasOne(s => s.Resolver)
            .WithMany()
            .HasForeignKey(s => s.ResolvedBy)
            .OnDelete(DeleteBehavior.SetNull);

        // 6. Explicit navigation disambiguation
        modelBuilder.Entity<UserClearanceLevel>()
            .HasOne(c => c.User)
            .WithMany(u => u.ClearanceLevels)
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<UserClearanceLevel>()
            .HasOne(c => c.Granter)
            .WithMany()
            .HasForeignKey(c => c.GrantedBy)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<OrganizationalUnit>()
            .HasOne(o => o.Parent)
            .WithMany(p => p.Children)
            .HasForeignKey(o => o.ParentId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Lecture>()
            .HasOne(l => l.Teacher)
            .WithMany(u => u.Lectures)
            .HasForeignKey(l => l.TeacherId);

        modelBuilder.Entity<FileRecord>()
            .HasOne(f => f.Uploader)
            .WithMany()
            .HasForeignKey(f => f.UploadedBy);

        modelBuilder.Entity<FileVersion>()
            .HasOne(fv => fv.Uploader)
            .WithMany()
            .HasForeignKey(fv => fv.UploadedBy);

        modelBuilder.Entity<SystemSetting>()
            .HasOne(s => s.Updater)
            .WithMany()
            .HasForeignKey(s => s.UpdatedBy)
            .OnDelete(DeleteBehavior.SetNull);

        // 7. Global snake_case column mapping convention for MySQL 8.x schema
        foreach (var entity in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entity.GetProperties())
            {
                property.SetColumnName(ToSnakeCase(property.Name));
            }
        }
    }

    private static string ToSnakeCase(string input)
    {
        if (string.IsNullOrEmpty(input)) return input;
        var startUnderscores = System.Text.RegularExpressions.Regex.Match(input, @"^_+");
        return startUnderscores + System.Text.RegularExpressions.Regex.Replace(input, @"([a-z0-9])([A-Z])", "$1_$2").ToLower();
    }
}
