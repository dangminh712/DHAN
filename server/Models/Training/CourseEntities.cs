using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models.Training;

[Table("chapters")]
public class Chapter
{
    [Key]
    public ulong Id { get; set; }
    public ulong SubjectId { get; set; }
    public Subject? Subject { get; set; }
    public int ChapterNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DisplayOrder { get; set; }
    public string Status { get; set; } = "PUBLISHED";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeletedAt { get; set; }
    public ICollection<ChapterMaterial> Materials { get; set; } = new List<ChapterMaterial>();
}

[Table("chapter_materials")]
public class ChapterMaterial
{
    [Key]
    public ulong Id { get; set; }
    public ulong ChapterId { get; set; }
    public Chapter? Chapter { get; set; }
    public ulong FileId { get; set; }
    public FileRecord? File { get; set; }
    public string MaterialGroup { get; set; } = "OTHER";
    public int DisplayOrder { get; set; }
    public bool IsVisible { get; set; } = true;
    public bool IsDownloadable { get; set; }
    public bool IsPrintable { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
