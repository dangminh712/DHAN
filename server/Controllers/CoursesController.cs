using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.DTOs;
using Server.Models.Training;
using Server.Services;

namespace Server.Controllers;

[ApiController]
[Route("api/courses")]
public class CoursesController : ControllerBase
{
    private static readonly HashSet<string> AllowedGroups = new(StringComparer.OrdinalIgnoreCase)
        { "LECTURE", "LESSON_PLAN", "EXERCISE", "QA", "REFERENCE", "OTHER" };

    private readonly TrainingDbContext _db;
    private readonly IAuditService _audit;

    public CoursesController(TrainingDbContext db, IAuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    [HttpGet]
    public async Task<IActionResult> GetCourses([FromQuery] ulong? userId, [FromQuery] string? search)
    {
        var (maxClearance, isStaff) = await GetViewerAsync(userId);
        var query = _db.Subjects.AsNoTracking().Where(s => s.Status == "ACTIVE");
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(s =>
                EF.Functions.Like(EF.Functions.Collate(s.Name, "utf8mb4_0900_ai_ci"), $"%{term}%") ||
                EF.Functions.Like(EF.Functions.Collate(s.Code, "utf8mb4_0900_ai_ci"), $"%{term}%"));
        }

        var courses = await query.OrderBy(s => s.Code).Select(s => new CourseSummaryDto
        {
            Id = s.Id,
            Code = s.Code,
            Name = s.Name,
            Description = s.Description,
            ChapterCount = s.Chapters.Count(c => c.Status == "PUBLISHED"),
            MaterialCount = s.Chapters.SelectMany(c => c.Materials).Count(m => m.IsVisible && m.File != null && m.File.Status == "ACTIVE" && (isStaff || m.File.ClassificationLevel.LevelOrder <= maxClearance)),
            Formats = s.Chapters.SelectMany(c => c.Materials)
                .Where(m => m.IsVisible && m.File != null && m.File.Status == "ACTIVE" && (isStaff || m.File.ClassificationLevel.LevelOrder <= maxClearance))
                .Select(m => m.File!.FileType).Distinct().ToList()
        }).ToListAsync();
        return Ok(courses);
    }

    [HttpGet("{courseId:long}")]
    public async Task<IActionResult> GetCourse(ulong courseId, [FromQuery] ulong? userId)
    {
        var (maxClearance, isStaff) = await GetViewerAsync(userId);
        var course = await _db.Subjects.AsNoTracking().Where(s => s.Id == courseId && s.Status == "ACTIVE")
            .Select(s => new CourseDetailDto
            {
                Id = s.Id,
                Code = s.Code,
                Name = s.Name,
                Description = s.Description,
                ChapterCount = s.Chapters.Count(c => c.Status == "PUBLISHED"),
                MaterialCount = s.Chapters.SelectMany(c => c.Materials).Count(m => m.IsVisible && m.File != null && m.File.Status == "ACTIVE" && (isStaff || m.File.ClassificationLevel.LevelOrder <= maxClearance)),
                Formats = s.Chapters.SelectMany(c => c.Materials).Where(m => m.IsVisible && m.File != null && (isStaff || m.File.ClassificationLevel.LevelOrder <= maxClearance)).Select(m => m.File!.FileType).Distinct().ToList(),
                Chapters = s.Chapters.Where(c => c.Status == "PUBLISHED").OrderBy(c => c.DisplayOrder).ThenBy(c => c.ChapterNumber)
                    .Select(c => new ChapterSummaryDto
                    {
                        Id = c.Id,
                        ChapterNumber = c.ChapterNumber,
                        Title = c.Title,
                        Description = c.Description,
                        MaterialCount = c.Materials.Count(m => m.IsVisible && m.File != null && m.File.Status == "ACTIVE" && (isStaff || m.File.ClassificationLevel.LevelOrder <= maxClearance)),
                        Formats = c.Materials.Where(m => m.IsVisible && m.File != null && m.File.Status == "ACTIVE" && (isStaff || m.File.ClassificationLevel.LevelOrder <= maxClearance)).Select(m => m.File!.FileType).Distinct().ToList()
                    }).ToList()
            }).FirstOrDefaultAsync();
        return course == null ? NotFound(new { message = "Không tìm thấy môn học." }) : Ok(course);
    }

    [HttpGet("{courseId:long}/chapters/{chapterId:long}")]
    public async Task<IActionResult> GetChapter(ulong courseId, ulong chapterId, [FromQuery] ulong? userId, [FromQuery] string? format, [FromQuery] string? search)
    {
        var (maxClearance, isStaff) = await GetViewerAsync(userId);
        var chapter = await _db.Chapters.AsNoTracking()
            .Include(c => c.Subject)
            .Include(c => c.Materials).ThenInclude(m => m.File).ThenInclude(f => f!.ClassificationLevel)
            .FirstOrDefaultAsync(c => c.Id == chapterId && c.SubjectId == courseId && c.Status == "PUBLISHED");
        if (chapter == null) return NotFound(new { message = "Không tìm thấy chương trong môn học." });

        IEnumerable<ChapterMaterial> materialQuery = chapter.Materials.Where(m => m.IsVisible && m.File?.Status == "ACTIVE" &&
            (isStaff || (m.File.ClassificationLevel?.LevelOrder ?? 1) <= maxClearance));
        if (!string.IsNullOrWhiteSpace(format)) materialQuery = ApplyFormat(materialQuery.AsQueryable(), format);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = VietnameseSearchNormalizer.Normalize(search);
            materialQuery = materialQuery.Where(m =>
                VietnameseSearchNormalizer.Normalize(m.File?.OriginalName).Contains(term) ||
                VietnameseSearchNormalizer.Normalize(m.MaterialGroup).Contains(term) ||
                VietnameseSearchNormalizer.Normalize(m.File?.FileType).Contains(term));
        }
        var materials = materialQuery.OrderBy(m => m.DisplayOrder).Select(m => new CourseMaterialDto
        {
            Id = m.Id, FileId = m.FileId, ChapterId = m.ChapterId, ChapterNumber = chapter.ChapterNumber, ChapterTitle = chapter.Title,
            OriginalName = m.File!.OriginalName, Extension = m.File.Extension, MimeType = m.File.MimeType, FileType = m.File.FileType,
            FileSize = m.File.FileSize, MaterialGroup = m.MaterialGroup, CanDownload = m.IsDownloadable, CanPrint = m.IsPrintable
        }).ToList();
        return Ok(new ChapterDetailDto
        {
            Id = chapter.Id, CourseId = chapter.SubjectId, CourseCode = chapter.Subject?.Code ?? string.Empty, CourseName = chapter.Subject?.Name ?? string.Empty,
            ChapterNumber = chapter.ChapterNumber, Title = chapter.Title, Description = chapter.Description,
            MaterialCount = materials.Count, Formats = materials.Select(m => m.FileType).Distinct().ToList(), Materials = materials
        });
    }

    [HttpGet("{courseId:long}/materials/search")]
    public async Task<IActionResult> SearchMaterials(ulong courseId, [FromQuery] ulong? userId, [FromQuery] string? q, [FromQuery] ulong? chapterId, [FromQuery] string? format)
    {
        if (string.IsNullOrWhiteSpace(q) && !chapterId.HasValue && string.IsNullOrWhiteSpace(format)) return Ok(Array.Empty<CourseMaterialDto>());
        if (q?.Length > 200) return BadRequest(new { message = "Từ khóa tìm kiếm tối đa 200 ký tự." });
        var (maxClearance, isStaff) = await GetViewerAsync(userId);
        var materials = _db.ChapterMaterials.AsNoTracking()
            .Where(m => m.Chapter!.SubjectId == courseId && m.Chapter.Status == "PUBLISHED" && m.IsVisible && m.File != null && m.File.Status == "ACTIVE")
            .Where(m => isStaff || m.File!.ClassificationLevel.LevelOrder <= maxClearance);
        if (chapterId.HasValue) materials = materials.Where(m => m.ChapterId == chapterId.Value);
        if (!string.IsNullOrWhiteSpace(format)) materials = ApplyFormat(materials, format);
        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            materials = materials.Where(m =>
                EF.Functions.Like(EF.Functions.Collate(m.File!.OriginalName, "utf8mb4_0900_ai_ci"), $"%{term}%") ||
                EF.Functions.Like(EF.Functions.Collate(m.Chapter!.Title, "utf8mb4_0900_ai_ci"), $"%{term}%") ||
                EF.Functions.Like(EF.Functions.Collate(m.MaterialGroup, "utf8mb4_0900_ai_ci"), $"%{term}%") ||
                (m.File.Extension != null && EF.Functions.Like(m.File.Extension, $"%{term}%")) ||
                EF.Functions.Like(m.File.FileType, $"%{term}%"));
        }
        return Ok(await materials.OrderBy(m => m.Chapter!.DisplayOrder).ThenBy(m => m.DisplayOrder).Select(MaterialProjection()).Take(100).ToListAsync());
    }

    [HttpPost("{courseId:long}/chapters")]
    public async Task<IActionResult> CreateChapter(ulong courseId, [FromQuery] ulong userId, [FromBody] CreateChapterDto dto)
    {
        var denied = await EnsureManagerAsync(courseId, userId); if (denied != null) return denied;
        if (dto.ChapterNumber <= 0 || string.IsNullOrWhiteSpace(dto.Title)) return BadRequest(new { message = "Số chương và tên chương là bắt buộc." });
        if (await _db.Chapters.AnyAsync(c => c.SubjectId == courseId && c.ChapterNumber == dto.ChapterNumber)) return Conflict(new { message = "Số chương đã tồn tại trong môn học." });
        var chapter = new Chapter { SubjectId = courseId, ChapterNumber = dto.ChapterNumber, Title = dto.Title.Trim(), Description = dto.Description, DisplayOrder = dto.ChapterNumber };
        _db.Chapters.Add(chapter); await _db.SaveChangesAsync();
        await _audit.LogAsync(userId, "CREATE_CHAPTER", "CHAPTER", chapter.Id, null, System.Text.Json.JsonSerializer.Serialize(new { chapter.Title }), HttpContext.Connection.RemoteIpAddress?.ToString());
        return Ok(new { chapter.Id, message = "Đã tạo chương." });
    }

    [HttpPut("{courseId:long}/chapters/{chapterId:long}")]
    public async Task<IActionResult> UpdateChapter(ulong courseId, ulong chapterId, [FromQuery] ulong userId, [FromBody] UpdateChapterDto dto)
    {
        var denied = await EnsureManagerAsync(courseId, userId); if (denied != null) return denied;
        var chapter = await _db.Chapters.FirstOrDefaultAsync(c => c.Id == chapterId && c.SubjectId == courseId);
        if (chapter == null) return NotFound(new { message = "Không tìm thấy chương." });
        if (dto.ChapterNumber <= 0 || string.IsNullOrWhiteSpace(dto.Title)) return BadRequest(new { message = "Số chương và tên chương là bắt buộc." });
        chapter.ChapterNumber = dto.ChapterNumber; chapter.Title = dto.Title.Trim(); chapter.Description = dto.Description; chapter.DisplayOrder = dto.DisplayOrder; chapter.Status = dto.Status; chapter.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _audit.LogAsync(userId, "UPDATE_CHAPTER", "CHAPTER", chapter.Id, null, System.Text.Json.JsonSerializer.Serialize(new { chapter.Title }), HttpContext.Connection.RemoteIpAddress?.ToString());
        return Ok(new { message = "Đã cập nhật chương." });
    }

    [HttpDelete("{courseId:long}/chapters/{chapterId:long}")]
    public async Task<IActionResult> DeleteChapter(ulong courseId, ulong chapterId, [FromQuery] ulong userId)
    {
        var denied = await EnsureManagerAsync(courseId, userId); if (denied != null) return denied;
        var chapter = await _db.Chapters.FirstOrDefaultAsync(c => c.Id == chapterId && c.SubjectId == courseId);
        if (chapter == null) return NotFound(new { message = "Không tìm thấy chương." });
        chapter.DeletedAt = DateTime.UtcNow; chapter.Status = "ARCHIVED"; await _db.SaveChangesAsync();
        await _audit.LogAsync(userId, "DELETE_CHAPTER", "CHAPTER", chapter.Id, null, null, HttpContext.Connection.RemoteIpAddress?.ToString());
        return Ok(new { message = "Đã lưu trữ chương." });
    }

    [HttpPost("{courseId:long}/chapters/{chapterId:long}/materials")]
    public async Task<IActionResult> AddMaterial(ulong courseId, ulong chapterId, [FromQuery] ulong userId, [FromBody] UpsertChapterMaterialDto dto)
    {
        var denied = await EnsureManagerAsync(courseId, userId); if (denied != null) return denied;
        if (!AllowedGroups.Contains(dto.MaterialGroup)) return BadRequest(new { message = "Nhóm tài liệu không hợp lệ." });
        if (!await _db.Chapters.AnyAsync(c => c.Id == chapterId && c.SubjectId == courseId) || !await _db.Files.AnyAsync(f => f.Id == dto.FileId && f.Status == "ACTIVE")) return NotFound(new { message = "Không tìm thấy chương hoặc tài liệu." });
        if (await _db.ChapterMaterials.AnyAsync(m => m.ChapterId == chapterId && m.FileId == dto.FileId)) return Conflict(new { message = "Tài liệu đã có trong chương." });
        var material = new ChapterMaterial { ChapterId = chapterId, FileId = dto.FileId, MaterialGroup = dto.MaterialGroup.ToUpperInvariant(), DisplayOrder = dto.DisplayOrder, IsVisible = dto.IsVisible, IsDownloadable = dto.IsDownloadable, IsPrintable = dto.IsPrintable };
        _db.ChapterMaterials.Add(material); await _db.SaveChangesAsync();
        await _audit.LogAsync(userId, "ADD_CHAPTER_MATERIAL", "CHAPTER_MATERIAL", material.Id, null, System.Text.Json.JsonSerializer.Serialize(new { dto.FileId }), HttpContext.Connection.RemoteIpAddress?.ToString());
        return Ok(new { material.Id, message = "Đã thêm tài liệu vào chương." });
    }

    [HttpDelete("{courseId:long}/chapters/{chapterId:long}/materials/{materialId:long}")]
    public async Task<IActionResult> RemoveMaterial(ulong courseId, ulong chapterId, ulong materialId, [FromQuery] ulong userId)
    {
        var denied = await EnsureManagerAsync(courseId, userId); if (denied != null) return denied;
        var material = await _db.ChapterMaterials.FirstOrDefaultAsync(m => m.Id == materialId && m.ChapterId == chapterId && m.Chapter!.SubjectId == courseId);
        if (material == null) return NotFound(new { message = "Không tìm thấy tài liệu trong chương." });
        _db.ChapterMaterials.Remove(material); await _db.SaveChangesAsync();
        await _audit.LogAsync(userId, "REMOVE_CHAPTER_MATERIAL", "CHAPTER_MATERIAL", materialId, null, null, HttpContext.Connection.RemoteIpAddress?.ToString());
        return Ok(new { message = "Đã gỡ tài liệu khỏi chương." });
    }

    private static System.Linq.Expressions.Expression<Func<ChapterMaterial, CourseMaterialDto>> MaterialProjection() => m => new CourseMaterialDto
    {
        Id = m.Id, FileId = m.FileId, ChapterId = m.ChapterId, ChapterNumber = m.Chapter!.ChapterNumber, ChapterTitle = m.Chapter.Title,
        OriginalName = m.File!.OriginalName, Extension = m.File.Extension, MimeType = m.File.MimeType, FileType = m.File.FileType,
        FileSize = m.File.FileSize, MaterialGroup = m.MaterialGroup, CanDownload = m.IsDownloadable, CanPrint = m.IsPrintable
    };

    private static IQueryable<ChapterMaterial> ApplyFormat(IQueryable<ChapterMaterial> query, string format)
    {
        var f = format.Trim().ToUpperInvariant();
        return f switch
        {
            "PDF" => query.Where(m => m.File!.Extension == ".pdf" || m.File.FileType == "PDF"),
            "VIDEO" => query.Where(m => m.File!.FileType == "VIDEO"),
            "POWERPOINT" => query.Where(m => m.File!.Extension == ".ppt" || m.File.Extension == ".pptx"),
            "WORD" => query.Where(m => m.File!.Extension == ".doc" || m.File.Extension == ".docx"),
            "IMAGE" => query.Where(m => m.File!.FileType == "IMAGE"),
            _ => query
        };
    }

    private async Task<(int maxClearance, bool isStaff)> GetViewerAsync(ulong? userId)
    {
        if (!userId.HasValue) return (1, false);
        var user = await _db.Users.AsNoTracking().Include(u => u.Role).Include(u => u.ClearanceLevels).ThenInclude(c => c.ClassificationLevel).FirstOrDefaultAsync(u => u.Id == userId.Value);
        if (user == null) return (1, false);
        var staff = user.Role?.Code is "ADMIN" or "SUPER_ADMIN" or "TEACHER";
        var clearance = user.ClearanceLevels.Where(c => c.Status == "ACTIVE" && (c.ExpiresAt == null || c.ExpiresAt > DateTime.UtcNow)).Max(c => (int?)c.ClassificationLevel!.LevelOrder) ?? 1;
        return (clearance, staff);
    }

    private async Task<IActionResult?> EnsureManagerAsync(ulong courseId, ulong userId)
    {
        var user = await _db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == userId && u.Status == "ACTIVE");
        if (user == null) return Unauthorized(new { message = "Tài khoản không hợp lệ." });
        if (user.Role?.Code is "ADMIN" or "SUPER_ADMIN") return null;
        if (user.Role?.Code == "TEACHER" && await _db.TeacherSubjects.AnyAsync(t => t.SubjectId == courseId && t.TeacherId == userId)) return null;
        return StatusCode(403, new { message = "Bạn không có quyền quản lý môn học này." });
    }
}
