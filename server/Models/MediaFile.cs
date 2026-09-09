using System.ComponentModel.DataAnnotations;

namespace Server.Models;

public class MediaFile
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(255)]
    public string OriginalFileName { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string StoredFileName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string ContentType { get; set; } = string.Empty;

    public long FileSize { get; set; }

    [MaxLength(50)]
    public string Category { get; set; } = "other"; // "image", "video", "document", "other"

    [MaxLength(64)]
    public string Checksum { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
