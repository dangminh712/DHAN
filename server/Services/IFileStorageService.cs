namespace Server.Services;

public class StoredFileInfo
{
    public string StoredName { get; set; } = string.Empty;
    public string RelativePath { get; set; } = string.Empty;
    public string PhysicalFullPath { get; set; } = string.Empty;
    public string ChecksumSha256 { get; set; } = string.Empty;
    public ulong FileSize { get; set; }
    public string Extension { get; set; } = string.Empty;
    public string FileType { get; set; } = "OTHER";
}

public interface IFileStorageService
{
    Task<StoredFileInfo> SavePhysicalFileAsync(IFormFile formFile, string? categoryFolder = null);
    string GetPhysicalFullPath(string relativeStoragePath);
}
