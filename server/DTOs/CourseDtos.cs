namespace Server.DTOs;

public class CourseSummaryDto
{
    public ulong Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string IconName { get; set; } = "BookOpen";
    public int ChapterCount { get; set; }
    public int MaterialCount { get; set; }
    public List<string> Formats { get; set; } = new();
}

public class CourseDetailDto : CourseSummaryDto
{
    public List<ChapterSummaryDto> Chapters { get; set; } = new();
}

public class ChapterSummaryDto
{
    public ulong Id { get; set; }
    public int ChapterNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int MaterialCount { get; set; }
    public List<string> Formats { get; set; } = new();
}

public class ChapterDetailDto : ChapterSummaryDto
{
    public ulong CourseId { get; set; }
    public string CourseCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public List<CourseMaterialDto> Materials { get; set; } = new();
}

public class CourseMaterialDto
{
    public ulong Id { get; set; }
    public ulong FileId { get; set; }
    public ulong ChapterId { get; set; }
    public int ChapterNumber { get; set; }
    public string ChapterTitle { get; set; } = string.Empty;
    public string OriginalName { get; set; } = string.Empty;
    public string? Extension { get; set; }
    public string MimeType { get; set; } = string.Empty;
    public string FileType { get; set; } = string.Empty;
    public ulong FileSize { get; set; }
    public string MaterialGroup { get; set; } = "OTHER";
    public bool CanDownload { get; set; }
    public bool CanPrint { get; set; }
}

public class CreateChapterDto
{
    public int ChapterNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class UpdateChapterDto : CreateChapterDto
{
    public int DisplayOrder { get; set; }
    public string Status { get; set; } = "PUBLISHED";
}

public class UpsertChapterMaterialDto
{
    public ulong FileId { get; set; }
    public string MaterialGroup { get; set; } = "OTHER";
    public int DisplayOrder { get; set; }
    public bool IsVisible { get; set; } = true;
    public bool IsDownloadable { get; set; }
    public bool IsPrintable { get; set; }
}
