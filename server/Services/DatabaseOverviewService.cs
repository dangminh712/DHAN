using System.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.DTOs;

namespace Server.Services;

// Metadata and bounded aggregate queries; never loads file blobs or complete history tables.
public sealed class DatabaseOverviewService(TrainingDbContext db, IWebHostEnvironment environment)
{
    public async Task<SystemOverviewDto> ReadAsync(CancellationToken ct)
    {
        var watch = Stopwatch.StartNew();
        var result = new SystemOverviewDto { MeasuredAt = DateTime.UtcNow };
        await db.Database.OpenConnectionAsync(ct);
        try
        {
            var connection = db.Database.GetDbConnection();
            await using (var command = connection.CreateCommand())
            {
                command.CommandText = """
                    SELECT TABLE_NAME, COALESCE(TABLE_ROWS,0), DATA_LENGTH, INDEX_LENGTH
                    FROM information_schema.TABLES
                    WHERE TABLE_SCHEMA=DATABASE() AND TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME
                    """;
                await using var reader = await command.ExecuteReaderAsync(ct);
                while (await reader.ReadAsync(ct))
                {
                    var name = reader.GetString(0);
                    result.TableStats.Add(new TableStatDto { TableName = name, Module = ModuleFor(name),
                        RowCount = Convert.ToInt64(reader.GetValue(1)), RowCountIsEstimate = true,
                        DataBytes = Convert.ToInt64(reader.GetValue(2)), IndexBytes = Convert.ToInt64(reader.GetValue(3)),
                        Description = "Số dòng ước tính từ metadata InnoDB" });
                }
            }
            result.TotalTables = result.TableStats.Count;
            result.TotalRows = result.TableStats.Sum(t => t.RowCount);
            result.DatabaseDataBytes = result.TableStats.Sum(t => t.DataBytes);
            result.DatabaseIndexBytes = result.TableStats.Sum(t => t.IndexBytes);
            await using (var command = connection.CreateCommand())
            {
                command.CommandText = """
                    SELECT DATABASE(), VERSION(),
                    (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND CONSTRAINT_TYPE='FOREIGN KEY'),
                    (SELECT COUNT(*) FROM (SELECT TABLE_NAME,INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() GROUP BY TABLE_NAME,INDEX_NAME) indexes_found)
                    """;
                await using var reader = await command.ExecuteReaderAsync(ct);
                await reader.ReadAsync(ct);
                result.DatabaseName = reader.GetString(0);
                result.DatabaseEngine = $"MySQL {reader.GetString(1)}";
                result.ForeignKeyCount = Convert.ToInt32(reader.GetValue(2));
                result.IndexCount = Convert.ToInt32(reader.GetValue(3));
            }
            // Existing dashboard fields stay exact. One server round trip replaces the sequential CountAsync calls.
            await using (var command = connection.CreateCommand())
            {
                command.CommandText = """
                    SELECT (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL),
                    (SELECT COUNT(*) FROM roles), (SELECT COUNT(*) FROM permissions),
                    (SELECT COUNT(*) FROM organizational_units), (SELECT COUNT(*) FROM classes),
                    (SELECT COUNT(*) FROM subjects), (SELECT COUNT(*) FROM lectures WHERE deleted_at IS NULL),
                    (SELECT COUNT(*) FROM files WHERE deleted_at IS NULL), (SELECT COUNT(*) FROM audit_logs),
                    (SELECT COUNT(*) FROM download_logs), (SELECT COUNT(*) FROM security_alerts),
                    (SELECT COALESCE(SUM(file_size),0) FROM files WHERE deleted_at IS NULL AND status='ACTIVE')
                    """;
                await using var reader = await command.ExecuteReaderAsync(ct);
                await reader.ReadAsync(ct);
                result.TotalUsers = Convert.ToInt32(reader.GetValue(0));
                result.TotalRoles = Convert.ToInt32(reader.GetValue(1));
                result.TotalPermissions = Convert.ToInt32(reader.GetValue(2));
                result.TotalOrganizationalUnits = Convert.ToInt32(reader.GetValue(3));
                result.TotalClasses = Convert.ToInt32(reader.GetValue(4));
                result.TotalSubjects = Convert.ToInt32(reader.GetValue(5));
                result.TotalLectures = Convert.ToInt32(reader.GetValue(6));
                result.TotalFiles = Convert.ToInt32(reader.GetValue(7));
                result.TotalAuditLogs = Convert.ToInt32(reader.GetValue(8));
                result.TotalDownloadLogs = Convert.ToInt32(reader.GetValue(9));
                result.TotalSecurityAlerts = Convert.ToInt32(reader.GetValue(10));
                result.StorageBytes = Convert.ToInt64(reader.GetValue(11));
            }
            result.Settings = await db.SystemSettings.AsNoTracking().Select(s => new SystemSettingItemDto {
                Key = s.SettingKey, Value = s.SettingValue, Type = s.SettingType, Description = s.Description
            }).ToListAsync(ct);
            result.QueryDurationMs = Math.Round(watch.Elapsed.TotalMilliseconds, 2);
        }
        finally { await db.Database.CloseConnectionAsync(); }
        try
        {
            var disk = new DriveInfo(Path.GetPathRoot(environment.ContentRootPath)!);
            result.DiskTotalBytes = disk.TotalSize;
            result.DiskFreeBytes = disk.AvailableFreeSpace;
        }
        catch (IOException) { /* Disk metadata can be unavailable on mounted/network filesystems. */ }
        catch (UnauthorizedAccessException) { }
        return result;
    }

    private static string ModuleFor(string table) => table switch
    {
        "users" or "roles" or "permissions" or "role_permissions" or "user_sessions" or "user_mfa" => "Identity",
        "organizational_units" => "Organization",
        "classes" or "student_classes" or "subjects" or "teacher_subjects" => "Academic",
        "chapters" or "chapter_materials" => "Course",
        "files" or "file_versions" or "file_permissions" => "File",
        "classification_levels" or "user_clearance_levels" => "Security",
        "audit_logs" or "download_logs" or "security_alerts" => "Audit",
        "lectures" or "lecture_parts" or "lecture_files" or "lecture_permissions" or "quiz_questions" => "Lecture",
        "watch_history" or "learning_progress" or "pdf_notes" or "quiz_attempts" or "learning_part_progress" => "Learning",
        _ => "System"
    };
}
