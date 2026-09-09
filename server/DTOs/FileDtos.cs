namespace Server.DTOs;

public class FileDetailDto
{
    public ulong Id { get; set; }
    public string OriginalName { get; set; } = string.Empty;
    public string StoredName { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public string? Extension { get; set; }
    public string FileType { get; set; } = string.Empty;
    public ulong FileSize { get; set; }
    public string ChecksumSha256 { get; set; } = string.Empty;
    public string ClassificationName { get; set; } = string.Empty;
    public int ClassificationOrder { get; set; }
    public string UploaderName { get; set; } = string.Empty;
    public ulong UploaderId { get; set; }
    public string Status { get; set; } = "ACTIVE";
    public DateTime CreatedAt { get; set; }
    public List<FileVersionDto> Versions { get; set; } = new();
}

public class FileVersionDto
{
    public int Version { get; set; }
    public string StoredName { get; set; } = string.Empty;
    public string ChecksumSha256 { get; set; } = string.Empty;
    public string? ChangeNote { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class UploadFileMetadataDto
{
    public string OriginalName { get; set; } = string.Empty;
    public ulong ClassificationLevelId { get; set; } = 2; // Default INTERNAL
    public string? ChangeNote { get; set; }
    public ulong? LectureId { get; set; }
    public bool IsDownloadable { get; set; } = true;
}
