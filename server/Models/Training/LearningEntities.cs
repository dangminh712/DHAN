using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models.Training;

[Table("pdf_notes")]
public class PdfNote
{
    public ulong Id { get; set; }
    public ulong UserId { get; set; }
    public ulong FileId { get; set; }
    public int PdfPage { get; set; }
    [MaxLength(10000)] public string Content { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

[Table("learning_part_progress")]
public class LearningPartProgress
{
    public ulong Id { get; set; }
    public ulong UserId { get; set; }
    public ulong LectureId { get; set; }
    public int PartId { get; set; }
    public bool Completed { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

[Table("quiz_attempts")]
public class QuizAttempt
{
    public ulong Id { get; set; }
    public Guid SubmissionId { get; set; }
    public ulong UserId { get; set; }
    public ulong LectureId { get; set; }
    // One existing quiz per lecture; no duplicate quiz definition subsystem.
    public ulong QuizId { get; set; }
    public string AnswersJson { get; set; } = "{}";
    public string ResultJson { get; set; } = "{}";
    public int Score { get; set; }
    public bool Completed { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
}

[Table("lecture_parts")]
public class LecturePart
{
    public ulong Id { get; set; }
    public ulong LectureId { get; set; }
    public int PartNumber { get; set; }
    [MaxLength(255)] public string Title { get; set; } = "";
    [MaxLength(500)] public string? Subtitle { get; set; }
    [MaxLength(50)] public string DurationText { get; set; } = "30 phút";
    public int DurationMinutes { get; set; } = 30;
    [MaxLength(50)] public string DefaultTab { get; set; } = "doc";
    [MaxLength(50)] public string IconName { get; set; } = "BookOpen";
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey(nameof(LectureId))]
    public Lecture? Lecture { get; set; }
}
