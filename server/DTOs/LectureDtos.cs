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
    public string DepartmentName { get; set; } = string.Empty;
    public string TeacherName { get; set; } = string.Empty;
    public ulong TeacherId { get; set; }
    public DateTime? PublishAt { get; set; }
    public DateTime? CloseAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<string> AssignedClasses { get; set; } = new();
    public List<ulong> AssignedClassIds { get; set; } = new();
    public bool IsPublicAll { get; set; }
    public int FileCount { get; set; }
    public List<LectureFileItemDto> Files { get; set; } = new();
    public List<QuizQuestionDto> QuizQuestions { get; set; } = new();
    public LearningProgressDto? UserProgress { get; set; }
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
    public bool IsPublicAll { get; set; }
    public List<ulong> ClassIds { get; set; } = new();
    public List<ulong> FileIds { get; set; } = new();
}

public class UpdateLectureDto
{
    public ulong SubjectId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = "PUBLISHED";
    public bool IsPublicAll { get; set; }
    public List<ulong> ClassIds { get; set; } = new();
    public List<ulong> FileIds { get; set; } = new();
}

public class UpdateLectureStatusDto
{
    public string Status { get; set; } = "PUBLISHED"; // PUBLISHED, CLOSED, DRAFT
}

public class UpdateLecturePermissionsDto
{
    public string Scope { get; set; } = "ALL"; // "ALL" or "SPECIFIC"
    public List<ulong> ClassIds { get; set; } = new();
}

public class ToggleFileDownloadableDto
{
    public bool IsDownloadable { get; set; }
}

public class QuizQuestionDto
{
    public ulong Id { get; set; }
    public ulong LectureId { get; set; }
    public string Question { get; set; } = string.Empty;
    public List<string> Options { get; set; } = new();
    public int CorrectIndex { get; set; }
    public string? Explanation { get; set; }
    public int OrderIndex { get; set; }
}

public class LearningProgressDto
{
    public ulong Id { get; set; }
    public ulong UserId { get; set; }
    public ulong LectureId { get; set; }
    public decimal ProgressPercent { get; set; }
    public bool Completed { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? Notes { get; set; }
    public List<int> CompletedParts { get; set; } = new();
    public int? QuizScore { get; set; }
    public DateTime? LastAccessedAt { get; set; }
}

public class UpdateProgressDto
{
    public ulong UserId { get; set; }
    public decimal? ProgressPercent { get; set; }
    public bool? Completed { get; set; }
    public string? Notes { get; set; }
    public List<int>? CompletedParts { get; set; }
    public int? QuizScore { get; set; }
}

public class SubmitQuizDto
{
    public Guid SubmissionId { get; set; }
    public ulong UserId { get; set; }
    public Dictionary<ulong, int> Answers { get; set; } = new(); // questionId -> selectedOptionIndex
}

public class QuizResultDto
{
    public int TotalQuestions { get; set; }
    public int CorrectAnswers { get; set; }
    public int Score { get; set; }
    public bool Passed { get; set; }
    public List<QuizAnswerDetailDto> Details { get; set; } = new();
}

public class QuizAnswerDetailDto
{
    public ulong QuestionId { get; set; }
    public int SelectedIndex { get; set; }
    public int CorrectIndex { get; set; }
    public bool IsCorrect { get; set; }
    public string? Explanation { get; set; }
}
