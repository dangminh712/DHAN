using Server.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.DTOs;
using Server.Models.Training;
using Server.Services;

namespace Server.Controllers;

[ApiController]
[Route("api/training/files")]
public class FilesController : ControllerBase
{
    private readonly TrainingDbContext _db;
    private readonly IFileStorageService _storage;
    private readonly IAccessDecisionService _access;
    private readonly IAuditService _audit;
    private readonly ISecurityAlertService _alertService;

    public FilesController(
        TrainingDbContext db,
        IFileStorageService storage,
        IAccessDecisionService access,
        IAuditService audit,
        ISecurityAlertService alertService)
    {
        _db = db;
        _storage = storage;
        _access = access;
        _audit = audit;
        _alertService = alertService;
    }

    [HttpGet]
    public async Task<IActionResult> GetFiles([FromQuery] ulong? userId, [FromQuery] int? page = null, [FromQuery] int? pageSize = null, [FromQuery] string? search = null, [FromQuery] string? sortBy = null, [FromQuery] string? sortDir = null)
    {
        var query = _db.Files.AsNoTracking()
            .Include(f => f.ClassificationLevel)
            .Include(f => f.Uploader)
            .Include(f => f.Versions)
            .Where(f => f.Status != "DELETED" && (search == null || f.OriginalName.Contains(search)))
            .Select(f => new FileDetailDto
            {
                Id = f.Id,
                OriginalName = f.OriginalName,
                StoredName = f.StoredName,
                MimeType = f.MimeType,
                Extension = f.Extension,
                FileType = f.FileType,
                FileSize = f.FileSize,
                ChecksumSha256 = f.ChecksumSha256,
                ClassificationName = f.ClassificationLevel != null ? f.ClassificationLevel.Name : "N/A",
                ClassificationOrder = f.ClassificationLevel != null ? f.ClassificationLevel.LevelOrder : 1,
                UploaderName = f.Uploader != null ? f.Uploader.FullName : "N/A",
                UploaderId = f.UploadedBy,
                Status = f.Status,
                CreatedAt = f.CreatedAt,
                Versions = f.Versions.Select(fv => new FileVersionDto
                {
                    Version = fv.Version,
                    StoredName = fv.StoredName,
                    ChecksumSha256 = fv.ChecksumSha256,
                    ChangeNote = fv.ChangeNote,
                    CreatedAt = fv.CreatedAt
                }).ToList()
            });

        return Ok(await query.Sort(sortBy, sortDir, "CreatedAt", "Id,OriginalName,originalFileName:OriginalName,FileType,category:FileType,FileSize,ClassificationName,classification:ClassificationOrder,UploaderName,uploader:UploaderName,Status,CreatedAt").ResultAsync(page, pageSize));
    }

    private async Task<ulong> ResolveUserIdAsync(ulong? providedUserId)
    {
        if (providedUserId.HasValue && providedUserId.Value > 0)
            return providedUserId.Value;

        var uid = await LearningAccess.UserIdAsync(_db, Request);
        return uid ?? 1;
    }

    [HttpGet("{id}/stream")]
    public async Task<IActionResult> StreamFile(ulong id, [FromQuery] ulong? userId, [FromQuery] ulong? lectureId, [FromQuery] ulong? chapterId)
    {
        ulong uid = await ResolveUserIdAsync(userId);
        if (chapterId.HasValue && !await _db.ChapterMaterials.AnyAsync(m => m.ChapterId == chapterId.Value && m.FileId == id && m.IsVisible && m.Chapter!.Status == "PUBLISHED"))
            return StatusCode(403, new { message = "Tài liệu bị ẩn hoặc không thuộc chương này." });
        var decision = await _access.CanViewFileAsync(uid, id, lectureId);
        if (!decision.Allowed)
        {
            return StatusCode(decision.StatusCode, new { message = decision.Reason });
        }

        var file = await _db.Files.FirstOrDefaultAsync(f => f.Id == id);
        if (file == null) return NotFound(new { message = "Không tìm thấy file trong cơ sở dữ liệu." });

        string physicalPath = _storage.GetPhysicalFullPath(file.StoragePath);
        if (string.IsNullOrWhiteSpace(physicalPath) || !System.IO.File.Exists(physicalPath))
        {
            return NotFound(new { message = "Không tìm thấy file vật lý trên máy chủ lưu trữ." });
        }

        string mime = string.IsNullOrWhiteSpace(file.MimeType) ? "application/octet-stream" : file.MimeType;
        var stream = new FileStream(physicalPath, FileMode.Open, FileAccess.Read, FileShare.Read);
        return File(stream, mime, enableRangeProcessing: true);
    }

    [HttpGet("{id}/download")]
    public async Task<IActionResult> DownloadFile(ulong id, [FromQuery] ulong? userId, [FromQuery] ulong? lectureId, [FromQuery] ulong? chapterId)
    {
        ulong uid = await ResolveUserIdAsync(userId);
        string? ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        string? userAgent = Request.Headers.UserAgent.ToString();

        if (chapterId.HasValue)
        {
            var chapterMaterial = await _db.ChapterMaterials.AsNoTracking().FirstOrDefaultAsync(m => m.ChapterId == chapterId.Value && m.FileId == id && m.IsVisible);
            if (chapterMaterial == null || !chapterMaterial.IsDownloadable)
                return StatusCode(403, new { message = "Tài liệu này chỉ được phép xem trực tuyến." });
        }
        var decision = await _access.CanDownloadFileAsync(uid, id, lectureId);
        if (!decision.Allowed)
        {
            try
            {
                if (await _db.Users.AnyAsync(u => u.Id == uid))
                {
                    var deniedLog = new DownloadLog
                    {
                        UserId = uid,
                        FileId = id,
                        LectureId = lectureId,
                        IpAddress = ip,
                        UserAgent = userAgent,
                        Status = "DENIED",
                        DenialReason = decision.Reason,
                        DownloadedAt = DateTime.UtcNow
                    };
                    _db.DownloadLogs.Add(deniedLog);
                    await _db.SaveChangesAsync();
                    await _alertService.CheckDownloadAbnormalityAsync(uid, ip);
                }
            }
            catch { /* protect stream/download flow from telemetry crashes */ }

            return StatusCode(decision.StatusCode, new { message = decision.Reason });
        }

        var file = await _db.Files.FirstOrDefaultAsync(f => f.Id == id);
        if (file == null) return NotFound(new { message = "Không tìm thấy tập tin trong hệ thống." });

        string physicalPath = _storage.GetPhysicalFullPath(file.StoragePath);
        if (string.IsNullOrWhiteSpace(physicalPath) || !System.IO.File.Exists(physicalPath))
        {
            return NotFound(new { message = "Tập tin vật lý không tồn tại trên máy chủ." });
        }

        try
        {
            if (await _db.Users.AnyAsync(u => u.Id == uid))
            {
                var successLog = new DownloadLog
                {
                    UserId = uid,
                    FileId = id,
                    LectureId = lectureId,
                    IpAddress = ip,
                    UserAgent = userAgent,
                    FileSize = file.FileSize,
                    Status = "SUCCESS",
                    DownloadedAt = DateTime.UtcNow
                };
                _db.DownloadLogs.Add(successLog);
                await _db.SaveChangesAsync();
            }
        }
        catch { /* protect stream/download flow from telemetry crashes */ }

        string mime = string.IsNullOrWhiteSpace(file.MimeType) ? "application/octet-stream" : file.MimeType;
        string downloadName = string.IsNullOrWhiteSpace(file.OriginalName) ? Path.GetFileName(physicalPath) : file.OriginalName;
        var fileStream = new FileStream(physicalPath, FileMode.Open, FileAccess.Read, FileShare.Read);
        return File(fileStream, mime, downloadName, enableRangeProcessing: true);
    }

    [HttpGet("folders")]
    public async Task<IActionResult> GetFolders()
    {
        var activeFiles = await _db.Files.AsNoTracking().Where(f => f.Status != "DELETED").ToListAsync();

        var categories = new[]
        {
            new { Id = "Videos", Name = "Video bài giảng & Huấn luyện", Extensions = new[] { ".mp4", ".mkv", ".mov", ".webm" }, Icon = "video" },
            new { Id = "PDFs", Name = "Giáo trình & Văn bản PDF", Extensions = new[] { ".pdf" }, Icon = "file-text" },
            new { Id = "Slides_PPT", Name = "Slide trình chiếu PPT/PPTX", Extensions = new[] { ".ppt", ".pptx", ".svg" }, Icon = "presentation" },
            new { Id = "Audios", Name = "Ghi âm hiện trường & Lời khai", Extensions = new[] { ".wav", ".mp3", ".m4a" }, Icon = "music" },
            new { Id = "Images", Name = "Sơ đồ tác chiến & Bản đồ", Extensions = new[] { ".jpg", ".jpeg", ".png", ".webp" }, Icon = "image" },
            new { Id = "Documents", Name = "Tài liệu nghiệp vụ khác (Word/Excel)", Extensions = new[] { ".doc", ".docx", ".xls", ".xlsx", ".txt" }, Icon = "file" }
        };

        var result = categories.Select(c =>
        {
            var matchedFiles = activeFiles.Where(f =>
            {
                string ext = (f.Extension ?? "").ToLower();
                return c.Extensions.Contains(ext) || f.StoragePath.Contains("/" + c.Id + "/");
            }).ToList();

            long totalBytes = matchedFiles.Sum(f => (long)f.FileSize);
            return new
            {
                folderId = c.Id,
                name = c.Name,
                icon = c.Icon,
                fileCount = matchedFiles.Count,
                totalSizeBytes = totalBytes,
                totalSizeFormatted = totalBytes > 1048576
                    ? $"{(totalBytes / 1048576.0):F1} MB"
                    : $"{(totalBytes / 1024.0):F1} KB"
            };
        });

        return Ok(result);
    }

    [HttpPost("upload")]
    public async Task<IActionResult> UploadFile(
        IFormFile? file,
        [FromForm] ulong? userId,
        [FromForm] ulong? classificationLevelId,
        [FromForm] string? changeNote,
        [FromForm] ulong? lectureId,
        [FromForm] string? categoryFolder,
        [FromQuery] ulong? qUserId,
        [FromQuery] ulong? qClassificationLevelId,
        [FromQuery] string? qChangeNote,
        [FromQuery] ulong? qLectureId,
        [FromQuery] string? qCategoryFolder)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Vui lòng chọn tập tin hợp lệ." });

        ulong targetUserId = userId ?? qUserId ?? (await ResolveUserIdAsync(null));
        ulong targetClassification = classificationLevelId ?? qClassificationLevelId ?? 2;
        string targetChangeNote = changeNote ?? qChangeNote ?? "Tải lên học liệu mới";
        ulong? targetLectureId = lectureId ?? qLectureId;
        string? targetFolder = categoryFolder ?? qCategoryFolder;

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == targetUserId);
        if (user == null) return Unauthorized(new { message = "Người dùng không tồn tại." });

        using var trans = await _db.Database.BeginTransactionAsync();
        try
        {
            // 1. Save physical file to private storage with category folder & SHA-256
            var stored = await _storage.SavePhysicalFileAsync(file, targetFolder);

            // 2. Insert into files table
            var fileRecord = new FileRecord
            {
                OriginalName = file.FileName,
                StoredName = stored.StoredName,
                MimeType = file.ContentType ?? "application/octet-stream",
                Extension = stored.Extension,
                FileType = stored.FileType,
                FileSize = stored.FileSize,
                StoragePath = stored.RelativePath,
                ChecksumSha256 = stored.ChecksumSha256,
                ClassificationLevelId = targetClassification,
                UploadedBy = targetUserId,
                Status = "ACTIVE",
                CreatedAt = DateTime.UtcNow
            };

            _db.Files.Add(fileRecord);
            await _db.SaveChangesAsync();

            // 3. Insert v1 into file_versions
            var versionRecord = new FileVersion
            {
                FileId = fileRecord.Id,
                Version = 1,
                StoredName = stored.StoredName,
                StoragePath = stored.RelativePath,
                ChecksumSha256 = stored.ChecksumSha256,
                UploadedBy = targetUserId,
                ChangeNote = targetChangeNote,
                CreatedAt = DateTime.UtcNow
            };

            _db.FileVersions.Add(versionRecord);

            // 4. If attached to a lecture, link to lecture_files
            if (targetLectureId.HasValue)
            {
                int nextOrder = (await _db.LectureFiles.Where(lf => lf.LectureId == targetLectureId.Value).MaxAsync(lf => (int?)lf.DisplayOrder) ?? 0) + 1;
                _db.LectureFiles.Add(new LectureFile
                {
                    LectureId = targetLectureId.Value,
                    FileId = fileRecord.Id,
                    DisplayOrder = nextOrder,
                    IsVisible = true,
                    IsDownloadable = stored.FileType != "VIDEO",
                    IsPrintable = stored.FileType == "PDF",
                    CreatedAt = DateTime.UtcNow
                });
            }

            await _db.SaveChangesAsync();
            await _audit.LogAsync(targetUserId, "UPLOAD_FILE", "FILE", fileRecord.Id, null, $"{{\"name\":\"{fileRecord.OriginalName}\",\"sha256\":\"{fileRecord.ChecksumSha256}\"}}", HttpContext.Connection.RemoteIpAddress?.ToString());
            await trans.CommitAsync();

            return Ok(new
            {
                message = "Đăng tải học liệu thành công!",
                fileId = fileRecord.Id,
                originalName = fileRecord.OriginalName,
                checksumSha256 = fileRecord.ChecksumSha256,
                fileType = fileRecord.FileType,
                fileSize = fileRecord.FileSize,
                storagePath = fileRecord.StoragePath
            });
        }
        catch (Exception ex)
        {
            await trans.RollbackAsync();
            return StatusCode(500, new { message = "Lỗi khi lưu trữ file: " + ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteFile(ulong id, [FromQuery] ulong? userId)
    {
        var file = await _db.Files.FirstOrDefaultAsync(f => f.Id == id);
        if (file == null) return NotFound(new { message = "Không tìm thấy file." });

        file.Status = "DELETED";
        file.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        if (userId.HasValue)
        {
            await _audit.LogAsync(userId.Value, "DELETE_FILE", "FILE", id, null, $"{{\"name\":\"{file.OriginalName}\"}}", HttpContext.Connection.RemoteIpAddress?.ToString());
        }

        return Ok(new { message = "Đã xóa học liệu thành công.", id });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateFile(ulong id, [FromBody] UpdateFileDto dto, [FromQuery] ulong? userId)
    {
        var file = await _db.Files.FirstOrDefaultAsync(f => f.Id == id);
        if (file == null) return NotFound(new { message = "Không tìm thấy file." });

        if (!string.IsNullOrWhiteSpace(dto.OriginalName)) file.OriginalName = dto.OriginalName;
        if (dto.ClassificationLevelId > 0) file.ClassificationLevelId = dto.ClassificationLevelId;
        if (!string.IsNullOrWhiteSpace(dto.Status)) file.Status = dto.Status;
        file.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        if (userId.HasValue)
        {
            await _audit.LogAsync(userId.Value, "UPDATE_FILE", "FILE", id, null, $"{{\"name\":\"{file.OriginalName}\"}}", HttpContext.Connection.RemoteIpAddress?.ToString());
        }

        return Ok(new { message = "Cập nhật học liệu thành công.", file });
    }
}
