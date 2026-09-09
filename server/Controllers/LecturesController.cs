using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.DTOs;
using Server.Models.Training;
using Server.Services;

namespace Server.Controllers;

[ApiController]
[Route("api/training/lectures")]
public class LecturesController : ControllerBase
{
    private readonly TrainingDbContext _db;
    private readonly IAuditService _audit;
    private readonly IAccessDecisionService _access;

    public LecturesController(TrainingDbContext db, IAuditService audit, IAccessDecisionService access)
    {
        _db = db;
        _audit = audit;
        _access = access;
    }

    [HttpGet]
    public async Task<IActionResult> GetLectures([FromQuery] ulong? userId, [FromQuery] string? status)
    {
        var query = _db.Lectures
            .Include(l => l.Subject)
            .Include(l => l.Teacher)
            .Include(l => l.Permissions)
                .ThenInclude(lp => lp.Class)
            .Include(l => l.LectureFiles)
                .ThenInclude(lf => lf.File)
                    .ThenInclude(f => f.ClassificationLevel)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && status != "ALL")
        {
            query = query.Where(l => l.Status == status);
        }

        if (userId.HasValue)
        {
            var user = await _db.Users
                .Include(u => u.Role)
                .Include(u => u.StudentClasses)
                .FirstOrDefaultAsync(u => u.Id == userId.Value);

            if (user != null && user.Role?.Code == "STUDENT")
            {
                var studentClassIds = user.StudentClasses.Where(sc => sc.Status == "ACTIVE").Select(sc => sc.ClassId).ToList();
                // Student sees lectures published for their class
                query = query.Where(l => l.Permissions.Any(lp => studentClassIds.Contains(lp.ClassId) && lp.CanView));
            }
            else if (user != null && user.Role?.Code == "TEACHER")
            {
                // Teacher sees authored lectures or all in department
                query = query.Where(l => l.TeacherId == user.Id || l.Status == "PUBLISHED");
            }
        }

        var list = await query
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => new LectureSummaryDto
            {
                Id = l.Id,
                Title = l.Title,
                Description = l.Description,
                Status = l.Status,
                Version = l.Version,
                Subject = l.Subject != null ? l.Subject.Name : "N/A",
                SubjectCode = l.Subject != null ? l.Subject.Code : "N/A",
                TeacherName = l.Teacher != null ? l.Teacher.FullName : "N/A",
                TeacherId = l.TeacherId,
                PublishAt = l.PublishAt,
                CloseAt = l.CloseAt,
                CreatedAt = l.CreatedAt,
                AssignedClasses = l.Permissions.Select(lp => lp.Class.Name).ToList(),
                FileCount = l.LectureFiles.Count(lf => lf.IsVisible),
                Files = l.LectureFiles
                    .OrderBy(lf => lf.DisplayOrder)
                    .Select(lf => new LectureFileItemDto
                    {
                        FileId = lf.FileId,
                        OriginalName = lf.File.OriginalName,
                        FileType = lf.File.FileType,
                        FileSize = lf.File.FileSize,
                        Classification = lf.File.ClassificationLevel != null ? lf.File.ClassificationLevel.Name : "Công khai",
                        ClassificationOrder = lf.File.ClassificationLevel != null ? lf.File.ClassificationLevel.LevelOrder : 1,
                        DisplayOrder = lf.DisplayOrder,
                        IsVisible = lf.IsVisible,
                        IsDownloadable = lf.IsDownloadable,
                        IsPrintable = lf.IsPrintable
                    }).ToList()
            })
            .ToListAsync();

        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetLectureDetail(ulong id, [FromQuery] ulong? userId)
    {
        var lecture = await _db.Lectures
            .Include(l => l.Subject)
            .Include(l => l.Teacher)
            .Include(l => l.Permissions)
                .ThenInclude(lp => lp.Class)
            .Include(l => l.LectureFiles)
                .ThenInclude(lf => lf.File)
                    .ThenInclude(f => f.ClassificationLevel)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (lecture == null)
            return NotFound(new { message = "Không tìm thấy bài giảng." });

        var dto = new LectureSummaryDto
        {
            Id = lecture.Id,
            Title = lecture.Title,
            Description = lecture.Description,
            Status = lecture.Status,
            Version = lecture.Version,
            Subject = lecture.Subject?.Name ?? "N/A",
            SubjectCode = lecture.Subject?.Code ?? "N/A",
            TeacherName = lecture.Teacher?.FullName ?? "N/A",
            TeacherId = lecture.TeacherId,
            PublishAt = lecture.PublishAt,
            CloseAt = lecture.CloseAt,
            CreatedAt = lecture.CreatedAt,
            AssignedClasses = lecture.Permissions.Select(lp => lp.Class.Name).ToList(),
            FileCount = lecture.LectureFiles.Count(lf => lf.IsVisible),
            Files = lecture.LectureFiles
                .OrderBy(lf => lf.DisplayOrder)
                .Select(lf => new LectureFileItemDto
                {
                    FileId = lf.FileId,
                    OriginalName = lf.File.OriginalName,
                    FileType = lf.File.FileType,
                    FileSize = lf.File.FileSize,
                    Classification = lf.File.ClassificationLevel?.Name ?? "Công khai",
                    ClassificationOrder = lf.File.ClassificationLevel?.LevelOrder ?? 1,
                    DisplayOrder = lf.DisplayOrder,
                    IsVisible = lf.IsVisible,
                    IsDownloadable = lf.IsDownloadable,
                    IsPrintable = lf.IsPrintable
                }).ToList()
        };

        return Ok(dto);
    }

    [HttpPost]
    public async Task<IActionResult> CreateLecture([FromBody] CreateLectureDto dto, [FromQuery] ulong userId)
    {
        var teacher = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (teacher == null) return Unauthorized(new { message = "Người dùng không hợp lệ." });

        using var trans = await _db.Database.BeginTransactionAsync();
        try
        {
            var lecture = new Lecture
            {
                SubjectId = dto.SubjectId,
                TeacherId = userId,
                Title = dto.Title,
                Description = dto.Description,
                Status = "PUBLISHED",
                PublishAt = DateTime.UtcNow,
                Version = 1,
                CreatedAt = DateTime.UtcNow
            };

            _db.Lectures.Add(lecture);
            await _db.SaveChangesAsync();

            // Assign classes
            foreach (var classId in dto.ClassIds)
            {
                _db.LecturePermissions.Add(new LecturePermission
                {
                    LectureId = lecture.Id,
                    ClassId = classId,
                    CanView = true,
                    PublishAt = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow
                });
            }

            // Attach files
            int order = 1;
            foreach (var fileId in dto.FileIds)
            {
                var fileRec = await _db.Files.FirstOrDefaultAsync(f => f.Id == fileId);
                bool canDownload = fileRec?.FileType != "VIDEO"; // Videos default stream only
                _db.LectureFiles.Add(new LectureFile
                {
                    LectureId = lecture.Id,
                    FileId = fileId,
                    DisplayOrder = order++,
                    IsVisible = true,
                    IsDownloadable = canDownload,
                    IsPrintable = fileRec?.FileType == "PDF",
                    CreatedAt = DateTime.UtcNow
                });
            }

            await _db.SaveChangesAsync();
            await _audit.LogAsync(userId, "CREATE_LECTURE", "LECTURE", lecture.Id, null, $"{{\"title\":\"{lecture.Title}\"}}", HttpContext.Connection.RemoteIpAddress?.ToString());
            await trans.CommitAsync();

            return CreatedAtAction(nameof(GetLectureDetail), new { id = lecture.Id }, lecture);
        }
        catch (Exception ex)
        {
            await trans.RollbackAsync();
            return StatusCode(500, new { message = "Lỗi tạo bài giảng: " + ex.Message });
        }
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(ulong id, [FromBody] UpdateLectureStatusDto dto, [FromQuery] ulong userId)
    {
        var perm = await _access.CanManageLectureAsync(userId, id);
        if (!perm.Allowed) return StatusCode(perm.StatusCode, new { message = perm.Reason });

        var lecture = await _db.Lectures.FirstOrDefaultAsync(l => l.Id == id);
        if (lecture == null) return NotFound();

        string oldStatus = lecture.Status;
        lecture.Status = dto.Status;
        if (dto.Status == "PUBLISHED" && lecture.PublishAt == null)
        {
            lecture.PublishAt = DateTime.UtcNow;
        }
        else if (dto.Status == "CLOSED")
        {
            lecture.CloseAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        await _audit.LogAsync(userId, "UPDATE_LECTURE_STATUS", "LECTURE", id, $"{{\"status\":\"{oldStatus}\"}}", $"{{\"status\":\"{dto.Status}\"}}", HttpContext.Connection.RemoteIpAddress?.ToString());

        return Ok(new { message = $"Đã cập nhật trạng thái bài giảng thành {dto.Status}", lectureId = id, status = dto.Status });
    }
}
