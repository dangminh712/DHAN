using System.Net;
using System.Net.Sockets;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Models.Training;
using Server.Services;

namespace Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MediaController : ControllerBase
{
    private readonly TrainingDbContext _db;
    private readonly IFileStorageService _storage;
    private readonly ILogger<MediaController> _logger;

    public MediaController(TrainingDbContext db, IFileStorageService storage, ILogger<MediaController> logger)
    {
        _db = db;
        _storage = storage;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? category, [FromQuery] string? search)
    {
        try
        {
            var query = _db.Files.Where(f => f.Status != "DELETED");

            if (!string.IsNullOrWhiteSpace(category) && category != "all")
            {
                string cat = category.Trim().ToLowerInvariant();
                if (cat == "document")
                {
                    query = query.Where(f => f.FileType == "DOCUMENT" || f.Extension == ".pdf" || f.Extension == ".doc" || f.Extension == ".docx");
                }
                else if (cat == "video")
                {
                    query = query.Where(f => f.FileType == "VIDEO" || f.Extension == ".mp4" || f.Extension == ".mkv");
                }
                else if (cat == "audio")
                {
                    query = query.Where(f => f.FileType == "AUDIO" || f.Extension == ".mp3" || f.Extension == ".wav");
                }
                else if (cat == "image")
                {
                    query = query.Where(f => f.FileType == "IMAGE" || f.Extension == ".png" || f.Extension == ".jpg" || f.Extension == ".svg");
                }
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                string s = search.Trim();
                query = query.Where(f => f.OriginalName.Contains(s));
            }

            var list = await query.OrderByDescending(f => f.CreatedAt).ToListAsync();

            var mapped = list.Select(f => new MediaFile
            {
                Id = (int)f.Id,
                OriginalFileName = f.OriginalName,
                StoredFileName = f.StoredName,
                ContentType = f.MimeType,
                FileSize = (long)f.FileSize,
                Category = MapToCategory(f.FileType, f.Extension),
                Checksum = f.ChecksumSha256,
                CreatedAt = f.CreatedAt
            }).ToList();

            return Ok(mapped);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi lấy danh sách tập tin từ training_management.files");
            return Ok(new List<MediaFile>());
        }
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var f = await _db.Files.FirstOrDefaultAsync(x => x.Id == (ulong)id && x.Status != "DELETED");
        if (f == null) return NotFound(new { message = "Không tìm thấy tập tin." });

        var mapped = new MediaFile
        {
            Id = (int)f.Id,
            OriginalFileName = f.OriginalName,
            StoredFileName = f.StoredName,
            ContentType = f.MimeType,
            FileSize = (long)f.FileSize,
            Category = MapToCategory(f.FileType, f.Extension),
            Checksum = f.ChecksumSha256,
            CreatedAt = f.CreatedAt
        };

        return Ok(mapped);
    }

    [HttpGet("stream/{id:int}")]
    public async Task<IActionResult> Stream(int id)
    {
        var file = await _db.Files.FirstOrDefaultAsync(x => x.Id == (ulong)id);
        if (file == null) return NotFound();

        string physicalPath = _storage.GetPhysicalFullPath(file.StoragePath);
        if (!System.IO.File.Exists(physicalPath))
        {
            return NotFound(new { message = "Tập tin vật lý không tồn tại trên ổ cứng." });
        }

        return PhysicalFile(physicalPath, file.MimeType, enableRangeProcessing: true);
    }

    [HttpGet("download/{id:int}")]
    public async Task<IActionResult> Download(int id)
    {
        var file = await _db.Files.FirstOrDefaultAsync(x => x.Id == (ulong)id);
        if (file == null) return NotFound();

        string physicalPath = _storage.GetPhysicalFullPath(file.StoragePath);
        if (!System.IO.File.Exists(physicalPath))
        {
            return NotFound(new { message = "Tập tin vật lý không tồn tại trên ổ cứng." });
        }

        return PhysicalFile(physicalPath, file.MimeType, file.OriginalName, enableRangeProcessing: true);
    }

    [HttpPost("upload")]
    [RequestSizeLimit(1073741824)] // 1 GB max per file
    public async Task<IActionResult> Upload([FromForm] IFormFile? file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "Vui lòng chọn một tập tin hợp lệ." });
        }

        var originalFileName = Path.GetFileName(file.FileName);
        var storedInfo = await _storage.SavePhysicalFileAsync(file);

        var fileRecord = new FileRecord
        {
            OriginalName = originalFileName,
            StoredName = storedInfo.StoredName,
            StoragePath = storedInfo.RelativePath,
            MimeType = string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType,
            Extension = storedInfo.Extension,
            FileType = storedInfo.FileType,
            FileSize = storedInfo.FileSize,
            ChecksumSha256 = storedInfo.ChecksumSha256,
            ClassificationLevelId = 2, // Mặc định: Lưu hành nội bộ
            UploadedBy = 1, // Admin
            Status = "ACTIVE",
            CreatedAt = DateTime.UtcNow
        };

        _db.Files.Add(fileRecord);
        await _db.SaveChangesAsync();

        var mediaFile = new MediaFile
        {
            Id = (int)fileRecord.Id,
            OriginalFileName = fileRecord.OriginalName,
            StoredFileName = fileRecord.StoredName,
            ContentType = fileRecord.MimeType,
            FileSize = (long)fileRecord.FileSize,
            Category = MapToCategory(fileRecord.FileType, fileRecord.Extension),
            Checksum = fileRecord.ChecksumSha256,
            CreatedAt = fileRecord.CreatedAt
        };

        return CreatedAtAction(nameof(GetById), new { id = mediaFile.Id }, mediaFile);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var file = await _db.Files.FirstOrDefaultAsync(x => x.Id == (ulong)id);
        if (file == null) return NotFound();

        file.Status = "DELETED";
        await _db.SaveChangesAsync();

        return Ok(new { message = "Đã xóa tập tin thành công." });
    }

    [HttpGet("network-info")]
    public IActionResult GetNetworkInfo()
    {
        var hostName = Dns.GetHostName();
        var hostEntry = Dns.GetHostEntry(hostName);
        var ipv4Addresses = hostEntry.AddressList
            .Where(ip => ip.AddressFamily == AddressFamily.InterNetwork && !IPAddress.IsLoopback(ip))
            .Select(ip => ip.ToString())
            .ToList();

        return Ok(new
        {
            machineName = hostName,
            lanIps = ipv4Addresses,
            apiPort = 5000,
            clientPort = 5173,
            offlineMode = true,
            storageMode = "MySQL 8.0 (training_management.files)",
            storageDirectory = "Storage/YYYY/MM/DD/"
        });
    }

    private static string MapToCategory(string fileType, string extension)
    {
        string t = fileType.ToUpperInvariant();
        if (t == "VIDEO") return "video";
        if (t == "AUDIO") return "audio";
        if (t == "IMAGE") return "image";
        if (t == "DOCUMENT") return "document";

        string ext = extension.ToLowerInvariant();
        if (ext == ".pdf" || ext == ".doc" || ext == ".docx") return "document";
        if (ext == ".mp4" || ext == ".mkv") return "video";
        if (ext == ".png" || ext == ".jpg" || ext == ".svg") return "image";
        if (ext == ".mp3" || ext == ".wav") return "audio";
        return "other";
    }

    private static string DetermineFileType(string ext, string contentType)
    {
        ext = ext.ToLowerInvariant();
        if (ext == ".pdf" || ext == ".doc" || ext == ".docx" || ext == ".txt") return "DOCUMENT";
        if (ext == ".mp4" || ext == ".mkv" || ext == ".avi") return "VIDEO";
        if (ext == ".png" || ext == ".jpg" || ext == ".jpeg" || ext == ".svg") return "IMAGE";
        if (ext == ".mp3" || ext == ".wav" || ext == ".ogg") return "AUDIO";
        return "DOCUMENT";
    }
}
