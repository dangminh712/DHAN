using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models.Training;
using Server.Services;

namespace Server.Controllers;

[ApiController]
[Route("api/training/learning")]
public class LearningController(TrainingDbContext db) : ControllerBase
{
    private ObjectResult Error(int status, string code, string message) => StatusCode(status, new { success = false, code, message });

    [HttpGet("{lectureId}/quiz-attempts")]
    public async Task<IActionResult> Attempts(ulong lectureId, [FromQuery] int page = 1, CancellationToken ct = default)
    {
        var user = await LearningAccess.UserIdAsync(db, Request, ct);
        if (user == null) return Error(401, "SESSION_REQUIRED", "Vui lòng đăng nhập lại.");
        if (page < 1 || page > 100000) return Error(400, "INVALID_PAGE", "Trang không hợp lệ.");
        var query = db.Set<QuizAttempt>().AsNoTracking().Where(a => a.UserId == user && a.LectureId == lectureId);
        var totalCount = await query.CountAsync(ct);
        var rows = await query.OrderByDescending(a => a.SubmittedAt).ThenByDescending(a => a.Id).Skip((page - 1) * 10).Take(10)
            .Select(a => new { a.Id, a.QuizId, a.AnswersJson, a.ResultJson, a.Score, a.Completed, a.SubmittedAt }).ToListAsync(ct);
        return Ok(new { items = rows.Select(a => new { a.Id, a.QuizId, a.Score, a.Completed, a.SubmittedAt,
            answers = System.Text.Json.JsonSerializer.Deserialize<Dictionary<ulong, int>>(a.AnswersJson),
            result = System.Text.Json.JsonSerializer.Deserialize<Server.DTOs.QuizResultDto>(a.ResultJson) }), totalCount, page, pageSize = 10 });
    }

    [HttpGet("{lectureId}/progress")]
    public async Task<IActionResult> GetProgress(ulong lectureId, CancellationToken ct)
    {
        var user = await LearningAccess.UserIdAsync(db, Request, ct);
        if (user == null) return Error(401, "SESSION_REQUIRED", "Vui lòng đăng nhập lại.");
        if (!await LearningAccess.LectureAsync(db, user.Value, lectureId, ct)) return Error(403, "LECTURE_ACCESS_DENIED", "Không có quyền học bài giảng này.");
        var parts = await db.Set<LearningPartProgress>().AsNoTracking().Where(p => p.UserId == user && p.LectureId == lectureId)
            .Select(p => new { p.PartId, p.Completed }).ToListAsync(ct);
        var files = await db.WatchHistories.AsNoTracking().Where(p => p.UserId == user && db.LectureFiles.Any(f => f.LectureId == lectureId && f.FileId == p.FileId))
            .Select(p => new { p.FileId, p.LastPdfPage, LastVideoSecond = p.LastPositionSeconds, VideoDurationSecond = p.DurationSeconds, p.Completed }).ToListAsync(ct);
        return Ok(new { parts, files });
    }

    [HttpPatch("{lectureId}/progress")]
    public async Task<IActionResult> PatchProgress(ulong lectureId, [FromBody] ProgressUpdate update, CancellationToken ct)
    {
        var user = await LearningAccess.UserIdAsync(db, Request, ct);
        if (user == null) return Error(401, "SESSION_REQUIRED", "Vui lòng đăng nhập lại.");
        if (!await LearningAccess.LectureAsync(db, user.Value, lectureId, ct)) return Error(403, "LECTURE_ACCESS_DENIED", "Không có quyền học bài giảng này.");
        if (update.Completed == null && update.LastPdfPage == null && update.LastVideoSecond == null && update.VideoDurationSecond == null)
            return Error(400, "EMPTY_PATCH", "Không có trường thay đổi.");
        if (update.FileId == null && (update.LastPdfPage != null || update.LastVideoSecond != null || update.VideoDurationSecond != null))
            return Error(400, "FILE_REQUIRED", "Vị trí đọc/xem phải gắn với một học liệu.");
        var video = false;
        if (update.FileId != null)
        {
            var file = await db.LectureFiles.Where(f => f.LectureId == lectureId && f.FileId == update.FileId && f.IsVisible)
                .Select(f => new { f.File!.FileType, f.File.Extension }).FirstOrDefaultAsync(ct);
            if (file == null) return Error(404, "LECTURE_FILE_NOT_FOUND", "Không tìm thấy học liệu trong bài giảng.");
            video = file.FileType.Equals("VIDEO", StringComparison.OrdinalIgnoreCase);
            if (update.LastPdfPage != null && !string.Equals(file.Extension, ".pdf", StringComparison.OrdinalIgnoreCase))
                return Error(400, "NOT_PDF", "Học liệu không phải PDF.");
            if (!video && (update.LastVideoSecond != null || update.VideoDurationSecond != null))
                return Error(400, "NOT_VIDEO", "Học liệu không phải video.");
        }
        // Serialize changes to the same lecture progress without a background worker.
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        WatchHistory? media = null;
        if (update.FileId != null)
        {
            media = await db.WatchHistories.FirstOrDefaultAsync(p => p.UserId == user && p.FileId == update.FileId, ct);
            if (media == null)
            {
                media = new WatchHistory { UserId = user.Value, FileId = update.FileId.Value, LectureId = lectureId };
                db.WatchHistories.Add(media);
            }
            if (update.LastPdfPage != null) media.LastPdfPage = update.LastPdfPage;
            if (update.VideoDurationSecond != null) media.DurationSeconds = update.VideoDurationSecond;
            if (update.LastVideoSecond != null) media.LastPositionSeconds = Math.Min(update.LastVideoSecond.Value, media.DurationSeconds ?? update.LastVideoSecond.Value);
            if (video) media.Completed |= media.DurationSeconds > 0 && media.LastPositionSeconds >= media.DurationSeconds * .9m;
            media.UpdatedAt = media.LastWatchedAt = DateTime.UtcNow;
        }
        if (update.Completed != null || (video && media?.Completed == true))
        {
            // A video part cannot be completed by a manual button/forged completed flag.
            var hasVideo = await db.LectureFiles.AnyAsync(f => f.LectureId == lectureId && f.IsVisible && f.File!.FileType == "VIDEO", ct);
            if (update.PartId == 2 && hasVideo && media?.Completed != true && update.Completed == true)
                return Error(400, "VIDEO_INCOMPLETE", "Cần xem ít nhất 90% video.");
            if (update.PartId == 5) return Error(400, "QUIZ_SUBMIT_REQUIRED", "Hoàn thành phần câu hỏi bằng cách nộp bài.");
            var part = await db.Set<LearningPartProgress>().FirstOrDefaultAsync(p => p.UserId == user && p.LectureId == lectureId && p.PartId == update.PartId, ct);
            if (part == null)
            {
                part = new LearningPartProgress { UserId = user.Value, LectureId = lectureId, PartId = update.PartId };
                db.Add(part);
            }
            part.Completed = video ? media!.Completed : update.Completed!.Value;
            part.UpdatedAt = DateTime.UtcNow;
        }
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return Ok(new { success = true, completed = media?.Completed });
    }

    [HttpGet("{lectureId}/files/{fileId}/notes")]
    public async Task<IActionResult> Notes(ulong lectureId, ulong fileId, [FromQuery, Range(1, int.MaxValue)] int pdfPage, [FromQuery] ulong afterId = 0, CancellationToken ct = default)
    {
        var user = await LearningAccess.UserIdAsync(db, Request, ct);
        if (user == null) return Error(401, "SESSION_REQUIRED", "Vui lòng đăng nhập lại.");
        if (!await CanNote(user.Value, lectureId, fileId, ct)) return Error(403, "PDF_ACCESS_DENIED", "Không có quyền đọc PDF này.");
        var items = await db.Set<PdfNote>().AsNoTracking().Where(n => n.UserId == user && n.FileId == fileId && n.PdfPage == pdfPage && n.Id > afterId)
            .OrderBy(n => n.Id).Take(51).Select(n => new { n.Id, n.PdfPage, n.Content, n.CreatedAt, n.UpdatedAt }).ToListAsync(ct);
        return Ok(new { items = items.Take(50), hasMore = items.Count > 50 });
    }

    [HttpPost("{lectureId}/files/{fileId}/notes")]
    public async Task<IActionResult> AddNote(ulong lectureId, ulong fileId, [FromBody] NoteUpdate update, CancellationToken ct)
    {
        var user = await LearningAccess.UserIdAsync(db, Request, ct);
        if (user == null) return Error(401, "SESSION_REQUIRED", "Vui lòng đăng nhập lại.");
        if (!await CanNote(user.Value, lectureId, fileId, ct)) return Error(403, "PDF_ACCESS_DENIED", "Không có quyền đọc PDF này.");
        if (string.IsNullOrWhiteSpace(update.Content)) return Error(400, "EMPTY_NOTE", "Ghi chú không được để trống.");
        var note = new PdfNote { UserId = user.Value, FileId = fileId, PdfPage = update.PdfPage, Content = update.Content.Trim() };
        db.Add(note);
        await db.SaveChangesAsync(ct);
        return Ok(new { note.Id, note.PdfPage, note.Content, note.CreatedAt, note.UpdatedAt });
    }

    [HttpPatch("notes/{id}")]
    public async Task<IActionResult> EditNote(ulong id, [FromBody] NoteUpdate update, CancellationToken ct)
    {
        var user = await LearningAccess.UserIdAsync(db, Request, ct);
        if (user == null) return Error(401, "SESSION_REQUIRED", "Vui lòng đăng nhập lại.");
        var note = await db.Set<PdfNote>().FirstOrDefaultAsync(n => n.Id == id && n.UserId == user, ct);
        if (note == null) return Error(404, "NOTE_NOT_FOUND", "Không tìm thấy ghi chú.");
        if (string.IsNullOrWhiteSpace(update.Content)) return Error(400, "EMPTY_NOTE", "Ghi chú không được để trống.");
        note.Content = update.Content.Trim();
        note.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return Ok(new { note.Id, note.PdfPage, note.Content, note.CreatedAt, note.UpdatedAt });
    }

    [HttpDelete("notes/{id}")]
    public async Task<IActionResult> DeleteNote(ulong id, CancellationToken ct)
    {
        var user = await LearningAccess.UserIdAsync(db, Request, ct);
        if (user == null) return Error(401, "SESSION_REQUIRED", "Vui lòng đăng nhập lại.");
        var count = await db.Set<PdfNote>().Where(n => n.Id == id && n.UserId == user).ExecuteDeleteAsync(ct);
        return count == 0 ? Error(404, "NOTE_NOT_FOUND", "Không tìm thấy ghi chú.") : NoContent();
    }

    private async Task<bool> CanNote(ulong user, ulong lecture, ulong file, CancellationToken ct) =>
        await LearningAccess.LectureAsync(db, user, lecture, ct) && await db.LectureFiles.AnyAsync(f => f.LectureId == lecture && f.FileId == file && f.IsVisible && f.File!.Extension == ".pdf", ct);
}

public class ProgressUpdate
{
    [Range(1, 5)] public int PartId { get; set; }
    public ulong? FileId { get; set; }
    public bool? Completed { get; set; }
    [Range(1, int.MaxValue)] public int? LastPdfPage { get; set; }
    [Range(typeof(decimal), "0", "604800")] public decimal? LastVideoSecond { get; set; }
    [Range(typeof(decimal), "0.001", "604800")] public decimal? VideoDurationSecond { get; set; }
}

public class NoteUpdate
{
    [Range(1, int.MaxValue)] public int PdfPage { get; set; }
    [Required, StringLength(10000, MinimumLength = 1)] public string Content { get; set; } = "";
}
