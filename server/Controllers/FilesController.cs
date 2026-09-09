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
    public async Task<IActionResult> GetFiles([FromQuery] ulong? userId)
    {
        var files = await _db.Files
            .Include(f => f.ClassificationLevel)
            .Include(f => f.Uploader)
            .Include(f => f.Versions)
            .Where(f => f.Status != "DELETED")
            .OrderByDescending(f => f.CreatedAt)
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
            })
            .ToListAsync();

        return Ok(files);
    }

    [HttpGet("{id}/stream")]
    public async Task<IActionResult> StreamFile(ulong id, [FromQuery] ulong userId, [FromQuery] ulong? lectureId)
    {
        var decision = await _access.CanViewFileAsync(userId, id, lectureId);
        if (!decision.Allowed)
        {
            return StatusCode(decision.StatusCode, new { message = decision.Reason });
        }

        var file = await _db.Files.FirstOrDefaultAsync(f => f.Id == id);
        if (file == null) return NotFound(new { message = "Không tìm thấy file trong cơ sở dữ liệu." });

        string physicalPath = _storage.GetPhysicalFullPath(file.StoragePath);
        if (!System.IO.File.Exists(physicalPath))
        {
            return NotFound(new { message = "Không tìm thấy file vật lý trên máy chủ lưu trữ." });
        }

        // Return FileStreamResult with EnableRangeProcessing=true for HTTP 206 Partial Content (Video/Audio seeking)
        var stream = new FileStream(physicalPath, FileMode.Open, FileAccess.Read, FileShare.Read);
        return File(stream, file.MimeType, enableRangeProcessing: true);
    }

    [HttpGet("{id}/download")]
    public async Task<IActionResult> DownloadFile(ulong id, [FromQuery] ulong userId, [FromQuery] ulong? lectureId)
    {
        string? ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        string? userAgent = Request.Headers.UserAgent.ToString();

        var decision = await _access.CanDownloadFileAsync(userId, id, lectureId);
        if (!decision.Allowed)
        {
            // Log DENIED in download_logs (Section 23, 45)
            var deniedLog = new DownloadLog
            {
                UserId = userId,
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

            // Check for abnormality
            await _alertService.CheckDownloadAbnormalityAsync(userId, ip);

            return StatusCode(decision.StatusCode, new { message = decision.Reason });
        }

        var file = await _db.Files.FirstOrDefaultAsync(f => f.Id == id);
        if (file == null) return NotFound();

        string physicalPath = _storage.GetPhysicalFullPath(file.StoragePath);
        if (!System.IO.File.Exists(physicalPath))
        {
            return NotFound(new { message = "Tập tin vật lý không tồn tại." });
        }

        // Log SUCCESS
        var successLog = new DownloadLog
        {
            UserId = userId,
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

        var fileStream = new FileStream(physicalPath, FileMode.Open, FileAccess.Read, FileShare.Read);
        return File(fileStream, file.MimeType, file.OriginalName);
    }

    [HttpPost("upload")]
    public async Task<IActionResult> UploadFile([FromForm] IFormFile file, [FromForm] ulong userId, [FromForm] ulong classificationLevelId, [FromForm] string? changeNote, [FromForm] ulong? lectureId)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Vui lòng chọn tập tin hợp lệ." });

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return Unauthorized(new { message = "Người dùng không tồn tại." });

        using var trans = await _db.Database.BeginTransactionAsync();
        try
        {
            // 1. Save physical file to private storage with date path & SHA-256
            var stored = await _storage.SavePhysicalFileAsync(file);

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
                ClassificationLevelId = classificationLevelId,
                UploadedBy = userId,
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
                UploadedBy = userId,
                ChangeNote = changeNote ?? "Khởi tạo tài liệu phiên bản 1",
                CreatedAt = DateTime.UtcNow
            };

            _db.FileVersions.Add(versionRecord);

            // 4. If attached to a lecture, link to lecture_files
            if (lectureId.HasValue)
            {
                int nextOrder = (await _db.LectureFiles.Where(lf => lf.LectureId == lectureId.Value).MaxAsync(lf => (int?)lf.DisplayOrder) ?? 0) + 1;
                _db.LectureFiles.Add(new LectureFile
                {
                    LectureId = lectureId.Value,
                    FileId = fileRecord.Id,
                    DisplayOrder = nextOrder,
                    IsVisible = true,
                    IsDownloadable = stored.FileType != "VIDEO",
                    IsPrintable = stored.FileType == "PDF",
                    CreatedAt = DateTime.UtcNow
                });
            }

            await _db.SaveChangesAsync();
            await _audit.LogAsync(userId, "UPLOAD_FILE", "FILE", fileRecord.Id, null, $"{{\"name\":\"{fileRecord.OriginalName}\",\"sha256\":\"{fileRecord.ChecksumSha256}\"}}", HttpContext.Connection.RemoteIpAddress?.ToString());
            await trans.CommitAsync();

            return Ok(new
            {
                message = "Đăng tải học liệu thành công!",
                fileId = fileRecord.Id,
                originalName = fileRecord.OriginalName,
                checksumSha256 = fileRecord.ChecksumSha256,
                fileType = fileRecord.FileType
            });
        }
        catch (Exception ex)
        {
            await trans.RollbackAsync();
            return StatusCode(500, new { message = "Lỗi khi lưu trữ file: " + ex.Message });
        }
    }
}
