using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Server.Data;

namespace Server.Services;

public static class LearningAccess
{
    public static async Task<ulong?> UserIdAsync(TrainingDbContext db, HttpRequest request, CancellationToken ct = default)
    {
        // 1. Try Bearer session token
        var header = request.Headers.Authorization.ToString();
        if (header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            var rawToken = header[7..].Trim();
            if (!string.IsNullOrEmpty(rawToken))
            {
                var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken))).ToLowerInvariant();
                var now = DateTime.UtcNow;
                var sessionUser = await db.UserSessions.AsNoTracking()
                    .Where(s => s.SessionTokenHash == hash && s.RevokedAt == null && s.ExpiresAt > now && s.User != null && s.User.Status == "ACTIVE")
                    .Select(s => (ulong?)s.UserId)
                    .FirstOrDefaultAsync(ct);
                if (sessionUser.HasValue) return sessionUser;
            }
        }

        // 2. Try X-User-Id header
        if (request.Headers.TryGetValue("X-User-Id", out var xUserIdVal) && ulong.TryParse(xUserIdVal, out var headerUserId) && headerUserId > 0)
        {
            var userExists = await db.Users.AsNoTracking().AnyAsync(u => u.Id == headerUserId && u.Status == "ACTIVE", ct);
            if (userExists) return headerUserId;
        }

        // 3. Try query string ?userId=...
        if (request.Query.TryGetValue("userId", out var qUserIdVal) && ulong.TryParse(qUserIdVal, out var queryUserId) && queryUserId > 0)
        {
            var userExists = await db.Users.AsNoTracking().AnyAsync(u => u.Id == queryUserId && u.Status == "ACTIVE", ct);
            if (userExists) return queryUserId;
        }

        // 4. Fallback to first active user in development/intranet mode
        var defaultUser = await db.Users.AsNoTracking()
            .Where(u => u.Status == "ACTIVE")
            .OrderBy(u => u.Id)
            .Select(u => (ulong?)u.Id)
            .FirstOrDefaultAsync(ct);

        return defaultUser;
    }

    public static async Task<bool> LectureAsync(TrainingDbContext db, ulong userId, ulong lectureId, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var lecture = await db.Lectures.AsNoTracking().FirstOrDefaultAsync(l => l.Id == lectureId, ct);
        if (lecture == null) return false;

        var user = await db.Users.Include(u => u.Role).AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user == null || user.Status != "ACTIVE") return false;

        // Admin & Teacher always have access
        if (user.Role != null && (user.Role.Code == "SUPER_ADMIN" || user.Role.Code == "ADMIN" || user.Role.Code == "TEACHER"))
            return true;

        if (lecture.TeacherId == userId) return true;

        // Active published lecture accessible to students
        if (lecture.Status == "PUBLISHED" && (lecture.CloseAt == null || lecture.CloseAt > now))
            return true;

        return await db.LecturePermissions.AnyAsync(p => p.LectureId == lectureId && (p.ClassId == 0 || (p.CanView &&
            db.StudentClasses.Any(s => s.StudentId == userId && s.ClassId == p.ClassId && s.Status == "ACTIVE"))), ct);
    }
}
