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

    public async Task<StoredFileInfo> SavePhysicalFileAsync(IFormFile formFile)
    {
        var now = DateTime.UtcNow;
        string subDir = Path.Combine(now.ToString("yyyy"), now.ToString("MM"), now.ToString("dd"));
        string targetDir = Path.Combine(_storageRoot, subDir);

        if (!Directory.Exists(targetDir))
        {
            Directory.CreateDirectory(targetDir);
        }

        string ext = Path.GetExtension(formFile.FileName).ToLower();
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

        string fileType = ext switch
        {
            ".pdf" => "PDF",
            ".mp4" or ".mov" or ".avi" or ".mkv" => "VIDEO",
            ".jpg" or ".jpeg" or ".png" or ".svg" or ".webp" => "IMAGE",
            ".doc" or ".docx" or ".xls" or ".xlsx" or ".ppt" or ".pptx" => "DOCUMENT",
            _ => "OTHER"
        };

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
        // Normalize slashes
        string normalized = relativeStoragePath.Replace("/", Path.DirectorySeparatorChar.ToString()).Replace("\\", Path.DirectorySeparatorChar.ToString());
        if (normalized.StartsWith("Storage" + Path.DirectorySeparatorChar))
        {
            normalized = normalized.Substring("Storage".Length + 1);
        }
        return Path.Combine(_storageRoot, normalized);
    }
}
