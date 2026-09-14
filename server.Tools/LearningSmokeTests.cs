using System.Net;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models.Training;

public static class LearningSmokeTests
{
    public static async Task Run(TrainingDbContext db, string baseUrl)
    {
        var role = await db.Roles.Where(r => r.Code == "ADMIN").Select(r => r.Id).FirstAsync();
        var user = new User { Username = "learning_test_" + Guid.NewGuid().ToString("N")[..12], FullName = "Learning API test", PasswordHash = "not-a-login-password", RoleId = role, Status = "ACTIVE" };
        db.Add(user); await db.SaveChangesAsync();
        var token = Guid.NewGuid().ToString("N");
        db.Add(new UserSession { UserId = user.Id, SessionTokenHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token))).ToLowerInvariant(), DeviceId = "learning-smoke-test", ExpiresAt = DateTime.UtcNow.AddMinutes(10) });
        await db.SaveChangesAsync();
        using var http = new HttpClient { BaseAddress = new Uri(baseUrl) };
        http.DefaultRequestHeaders.Authorization = new("Bearer", token);
        int checks = 0;
        void Assert(bool condition, string name) { if (!condition) throw new Exception("FAIL: " + name); checks++; Console.WriteLine("PASS: " + name); }
        async Task<JsonNode> Json(HttpResponseMessage response) { var text = await response.Content.ReadAsStringAsync(); if (!response.IsSuccessStatusCode) throw new Exception($"HTTP {(int)response.StatusCode}: {text}"); return JsonNode.Parse(text)!; }
        try
        {
            var pdf = await db.LectureFiles.Where(f => f.File!.Extension == ".pdf" && f.IsVisible).Select(f => new { f.LectureId, f.FileId }).FirstAsync();
            var prefix = $"/api/training/learning/{pdf.LectureId}";
            var first = await Json(await http.PostAsJsonAsync($"{prefix}/files/{pdf.FileId}/notes", new { pdfPage = 15, content = "first test note" }));
            await Json(await http.PostAsJsonAsync($"{prefix}/files/{pdf.FileId}/notes", new { pdfPage = 15, content = "second test note" }));
            await Json(await http.PostAsJsonAsync($"{prefix}/files/{pdf.FileId}/notes", new { pdfPage = 16, content = "different page" }));
            var notes = await Json(await http.GetAsync($"{prefix}/files/{pdf.FileId}/notes?pdfPage=15"));
            Assert(notes["items"]!.AsArray().Count == 2, "Multiple notes, filtered by PDF page");
            var invalid = await http.PostAsJsonAsync($"{prefix}/files/{pdf.FileId}/notes", new { pdfPage = 0, content = "bad page" });
            Assert(invalid.StatusCode == HttpStatusCode.BadRequest, "Page zero rejected");
            await Json(await http.PatchAsJsonAsync($"{prefix}/progress", new { partId = 1, fileId = pdf.FileId, lastPdfPage = 18 }));
            await Json(await http.PatchAsJsonAsync($"{prefix}/progress", new { partId = 1, completed = true }));
            var progress = await Json(await http.GetAsync($"{prefix}/progress"));
            Assert(progress["files"]!.AsArray().Any(f => f!["lastPdfPage"]?.GetValue<int>() == 18), "Partial PATCH preserves PDF position");
            Assert(progress["parts"]!.AsArray().Any(p => p!["partId"]!.GetValue<int>() == 1 && p["completed"]!.GetValue<bool>()), "Part completion persists");
            http.DefaultRequestHeaders.Authorization = null;
            Assert((await http.GetAsync($"{prefix}/progress?userId={user.Id}")).StatusCode == HttpStatusCode.Unauthorized, "UserId cannot replace a session");
            http.DefaultRequestHeaders.Authorization = new("Bearer", token);
            var video = await db.LectureFiles.Where(f => f.File!.FileType == "VIDEO" && f.IsVisible).Select(f => new { f.LectureId, f.FileId }).FirstOrDefaultAsync();
            if (video != null)
            {
                var vp = $"/api/training/learning/{video.LectureId}/progress";
                var premature = await http.PatchAsJsonAsync(vp, new { partId = 2, fileId = video.FileId, lastVideoSecond = 100, videoDurationSecond = 1000, completed = true });
                Assert(premature.StatusCode == HttpStatusCode.BadRequest, "Manual completion below 90% rejected");
                var saved = await Json(await http.PatchAsJsonAsync(vp, new { partId = 2, fileId = video.FileId, lastVideoSecond = 900, videoDurationSecond = 1000 }));
                Assert(saved["completed"]!.GetValue<bool>(), "Video completes at 90% actual duration");
            }
            var quizLecture = await db.QuizQuestions.Select(q => q.LectureId).FirstOrDefaultAsync();
            if (quizLecture != 0)
            {
                var answers = await db.QuizQuestions.Where(q => q.LectureId == quizLecture).ToDictionaryAsync(q => q.Id, q => q.CorrectIndex);
                var submissionId = Guid.NewGuid();
                var body = new { submissionId, answers };
                var quiz = await Json(await http.PostAsJsonAsync($"/api/training/lectures/{quizLecture}/quiz/submit", body));
                Assert(quiz["score"]!.GetValue<int>() == 100, "Quiz scored by backend");
                await Json(await http.PostAsJsonAsync($"/api/training/lectures/{quizLecture}/quiz/submit", body));
                Assert(await db.Set<QuizAttempt>().CountAsync(a => a.UserId == user.Id && a.SubmissionId == submissionId) == 1, "Quiz submission retry is idempotent");
                var attempts = await Json(await http.GetAsync($"/api/training/learning/{quizLecture}/quiz-attempts"));
                Assert(attempts["items"]!.AsArray().Count == 1, "Official answers/result restored from database");
            }
            using var range = new HttpRequestMessage(HttpMethod.Get, $"/api/media/stream/{pdf.FileId}");
            range.Headers.Range = new(0, 31);
            using var ranged = await http.SendAsync(range, HttpCompletionOption.ResponseHeadersRead);
            Assert(ranged.StatusCode == HttpStatusCode.PartialContent && ranged.Content.Headers.ContentLength == 32, "Disk stream returns bounded HTTP 206");
            using var badRange = new HttpRequestMessage(HttpMethod.Get, $"/api/media/stream/{pdf.FileId}");
            badRange.Headers.Range = new(long.MaxValue - 1, null);
            Assert((await http.SendAsync(badRange)).StatusCode == HttpStatusCode.RequestedRangeNotSatisfiable, "Unsatisfiable Range returns 416");
            Console.WriteLine($"{checks} checks passed using real MySQL and HTTP.");
        }
        finally
        {
            await db.Set<PdfNote>().Where(n => n.UserId == user.Id).ExecuteDeleteAsync();
            await db.Set<QuizAttempt>().Where(n => n.UserId == user.Id).ExecuteDeleteAsync();
            await db.Set<LearningPartProgress>().Where(n => n.UserId == user.Id).ExecuteDeleteAsync();
            await db.WatchHistories.Where(n => n.UserId == user.Id).ExecuteDeleteAsync();
            await db.LearningProgresses.Where(n => n.UserId == user.Id).ExecuteDeleteAsync();
            await db.UserSessions.Where(n => n.UserId == user.Id).ExecuteDeleteAsync();
            await db.Users.Where(n => n.Id == user.Id).ExecuteDeleteAsync();
            Console.WriteLine("Removed only this run's temporary test user and records.");
        }
    }
}
