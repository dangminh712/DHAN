using System.Net;
using System.Net.Sockets;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Services;

namespace Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MediaController : ControllerBase
{
    private readonly IMediaService _mediaService;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<MediaController> _logger;
    private readonly string _storagePath;

    public MediaController(IMediaService mediaService, IWebHostEnvironment environment, IConfiguration configuration, ILogger<MediaController> logger)
    {
        _mediaService = mediaService;
        _environment = environment;
        _logger = logger;

        var configuredPath = configuration["Storage:Path"] ?? "Storage";
        _storagePath = Path.IsPathRooted(configuredPath) 
            ? configuredPath 
            : Path.Combine(_environment.ContentRootPath, configuredPath);

        if (!Directory.Exists(_storagePath))
        {
            Directory.CreateDirectory(_storagePath);
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? category, [FromQuery] string? search)
    {
        try
        {
            var files = await _mediaService.GetAllAsync(category, search);
            return Ok(files);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi lấy danh sách tập tin");
            return Ok(new List<MediaFile>());
        }
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        try
        {
            var file = await _mediaService.GetByIdAsync(id);
            if (file == null) return NotFound(new { message = "Không tìm thấy tập tin." });

            return Ok(file);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi tìm tập tin ID {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi truy vấn tập tin.", error = ex.Message });
        }
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
        var extension = Path.GetExtension(originalFileName).ToLowerInvariant();
        var storedFileName = $"{Guid.NewGuid():N}{extension}";
        var fullPath = Path.Combine(_storagePath, storedFileName);

        string checksum;
        using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        using (var sha256 = SHA256.Create())
        using (var stream = System.IO.File.OpenRead(fullPath))
        {
            var hashBytes = await sha256.ComputeHashAsync(stream);
            checksum = BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();
        }

        var category = DetermineCategory(extension, file.ContentType);

        var mediaFile = new MediaFile
        {
            OriginalFileName = originalFileName,
            StoredFileName = storedFileName,
            ContentType = string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType,
            FileSize = file.Length,
            Category = category,
            Checksum = checksum,
            CreatedAt = DateTime.UtcNow
        };

        try
        {
            var savedFile = await _mediaService.AddAsync(mediaFile);
            return CreatedAtAction(nameof(GetById), new { id = savedFile.Id }, savedFile);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi lưu thông tin tập tin {FileName}", originalFileName);
            if (System.IO.File.Exists(fullPath))
            {
                try { System.IO.File.Delete(fullPath); } catch { }
            }
            return StatusCode(500, new { message = "Không thể ghi nhận tập tin.", detail = ex.Message });
        }
    }

    [HttpGet("stream/{id:int}")]
    public async Task<IActionResult> Stream(int id)
    {
        try
        {
            var file = await _mediaService.GetByIdAsync(id);
            if (file == null) return NotFound();

            var fullPath = Path.Combine(_storagePath, file.StoredFileName);
            if (!System.IO.File.Exists(fullPath))
            {
                return NotFound(new { message = "Tập tin vật lý không tồn tại trên ổ cứng." });
            }

            // enableRangeProcessing: true enables HTTP 206 Partial Content (critical for video seeking & PDF rendering)
            return PhysicalFile(fullPath, file.ContentType, enableRangeProcessing: true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi stream tập tin ID {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi phát tập tin.", error = ex.Message });
        }
    }

    [HttpGet("download/{id:int}")]
    public async Task<IActionResult> Download(int id)
    {
        try
        {
            var file = await _mediaService.GetByIdAsync(id);
            if (file == null) return NotFound();

            var fullPath = Path.Combine(_storagePath, file.StoredFileName);
            if (!System.IO.File.Exists(fullPath))
            {
                return NotFound(new { message = "Tập tin vật lý không tồn tại trên ổ cứng." });
            }

            return PhysicalFile(fullPath, file.ContentType, file.OriginalFileName, enableRangeProcessing: true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi tải tập tin ID {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi tải tập tin.", error = ex.Message });
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var file = await _mediaService.GetByIdAsync(id);
            if (file == null) return NotFound();

            var fullPath = Path.Combine(_storagePath, file.StoredFileName);
            if (System.IO.File.Exists(fullPath))
            {
                try { System.IO.File.Delete(fullPath); } catch { }
            }

            await _mediaService.DeleteAsync(id);
            return Ok(new { message = "Đã xóa tập tin thành công." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi xóa tập tin ID {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi xóa tập tin.", error = ex.Message });
        }
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
            storageMode = _mediaService.StorageMode,
            storageDirectory = _storagePath
        });
    }

    private static string DetermineCategory(string extension, string contentType)
    {
        contentType = contentType.ToLowerInvariant();
        if (contentType.StartsWith("image/") || new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp" }.Contains(extension))
        {
            return "image";
        }
        if (contentType.StartsWith("video/") || new[] { ".mp4", ".mkv", ".webm", ".avi", ".mov", ".flv" }.Contains(extension))
        {
            return "video";
        }
        if (contentType.StartsWith("audio/") || new[] { ".mp3", ".wav", ".ogg", ".flac", ".m4a" }.Contains(extension))
        {
            return "audio";
        }
        if (contentType.Contains("pdf") || extension == ".pdf")
        {
            return "document";
        }
        if (new[] { ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".csv" }.Contains(extension))
        {
            return "document";
        }

        return "other";
    }
}
