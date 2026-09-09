namespace Server.DTOs;

public class LectureSummaryDto
{
    public ulong Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = "DRAFT";
    public int Version { get; set; } = 1;
    public string Subject { get; set; } = string.Empty;
    public string SubjectCode { get; set; } = string.Empty;
    public string TeacherName { get; set; } = string.Empty;
    public ulong TeacherId { get; set; }
    public DateTime? PublishAt { get; set; }
    public DateTime? CloseAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<string> AssignedClasses { get; set; } = new();
    public int FileCount { get; set; }
    public List<LectureFileItemDto> Files { get; set; } = new();
}

public class LectureFileItemDto
{
    public ulong FileId { get; set; }
    public string OriginalName { get; set; } = string.Empty;
    public string FileType { get; set; } = string.Empty;
    public ulong FileSize { get; set; }
    public string Classification { get; set; } = string.Empty;
    public int ClassificationOrder { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsVisible { get; set; }
    public bool IsDownloadable { get; set; }
    public bool IsPrintable { get; set; }
}

public class CreateLectureDto
{
    public ulong SubjectId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public List<ulong> ClassIds { get; set; } = new();
    public List<ulong> FileIds { get; set; } = new();
}

public class UpdateLectureStatusDto
{
    public string Status { get; set; } = "PUBLISHED"; // PUBLISHED, CLOSED, DRAFT
}
