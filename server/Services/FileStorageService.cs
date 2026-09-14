using System.Security.Cryptography;

namespace Server.Services;

public class FileStorageService : IFileStorageService
{
    private readonly string _storageRoot;

    public FileStorageService(IWebHostEnvironment env)
    {
        _storageRoot = Path.Combine(env.ContentRootPath, "Storage");
        if (!Directory.Exists(_storageRoot))
        {
            Directory.CreateDirectory(_storageRoot);
        }
    }

    public async Task<StoredFileInfo> SavePhysicalFileAsync(IFormFile formFile, string? categoryFolder = null)
    {
        string ext = Path.GetExtension(formFile.FileName).ToLower();

        string fileType = ext switch
        {
            ".pdf" => "PDF",
            ".mp4" or ".mov" or ".avi" or ".mkv" or ".webm" => "VIDEO",
            ".jpg" or ".jpeg" or ".png" or ".svg" or ".webp" or ".gif" => "IMAGE",
            ".mp3" or ".wav" or ".m4a" or ".ogg" or ".aac" => "AUDIO",
            ".ppt" or ".pptx" => "SLIDE",
            ".doc" or ".docx" or ".xls" or ".xlsx" or ".txt" => "DOCUMENT",
            _ => "OTHER"
        };

        string targetCategory = !string.IsNullOrWhiteSpace(categoryFolder)
            ? categoryFolder.Trim()
            : fileType switch
            {
                "VIDEO" => "Videos",
                "PDF" => "PDFs",
                "SLIDE" => "Slides_PPT",
                "AUDIO" => "Audios",
                "IMAGE" => "Images",
                _ => "Documents"
            };

        var now = DateTime.UtcNow;
        string subDir = Path.Combine(targetCategory, now.ToString("yyyy"), now.ToString("MM"));
        string targetDir = Path.Combine(_storageRoot, subDir);

        if (!Directory.Exists(targetDir))
        {
            Directory.CreateDirectory(targetDir);
        }

        string guidName = $"{Guid.NewGuid():N}{ext}";
        string fullPath = Path.Combine(targetDir, guidName);
        string relativePath = Path.Combine("Storage", subDir, guidName).Replace("\\", "/");

        // Write file and calculate SHA-256
        using (var fileStream = new FileStream(fullPath, FileMode.Create, FileAccess.Write, FileShare.None))
        {
            await formFile.CopyToAsync(fileStream);
        }

        string sha256;
        using (var sha = SHA256.Create())
        using (var stream = File.OpenRead(fullPath))
        {
            byte[] hashBytes = await sha.ComputeHashAsync(stream);
            sha256 = Convert.ToHexString(hashBytes).ToLower();
        }

        return new StoredFileInfo
        {
            StoredName = guidName,
            RelativePath = relativePath,
            PhysicalFullPath = fullPath,
            ChecksumSha256 = sha256,
            FileSize = (ulong)new FileInfo(fullPath).Length,
            Extension = ext,
            FileType = fileType
        };
    }

    public string GetPhysicalFullPath(string relativeStoragePath)
    {
        if (string.IsNullOrWhiteSpace(relativeStoragePath)) return string.Empty;
        // Normalize slashes
        string normalized = relativeStoragePath.Replace("/", Path.DirectorySeparatorChar.ToString()).Replace("\\", Path.DirectorySeparatorChar.ToString());
        if (normalized.StartsWith("Storage" + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
        {
            normalized = normalized.Substring("Storage".Length + 1);
        }
        return Path.Combine(_storageRoot, normalized);
    }
}
