using Microsoft.EntityFrameworkCore;
using Server.Data;

namespace Server.Services;

public class AccessDecisionService : IAccessDecisionService
{
    private readonly TrainingDbContext _db;

    public AccessDecisionService(TrainingDbContext db)
    {
        _db = db;
    }

    public async Task<AccessDecisionResult> CanViewFileAsync(ulong userId, ulong fileId, ulong? lectureId)
    {
        // 1. User authenticated & active
        var user = await _db.Users
            .Include(u => u.Role)
                .ThenInclude(r => r!.RolePermissions)
                    .ThenInclude(rp => rp.Permission)
            .Include(u => u.ClearanceLevels)
                .ThenInclude(c => c.ClassificationLevel)
            .Include(u => u.StudentClasses)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null || user.Status != "ACTIVE")
            return new AccessDecisionResult { Allowed = false, StatusCode = 401, Reason = "Tài khoản không tồn tại hoặc đã bị khóa." };

        // Admin has full view rights
        if (user.Role?.Code == "SUPER_ADMIN" || user.Role?.Code == "ADMIN")
            return new AccessDecisionResult { Allowed = true };

        // 2. Check Role Permission: FILE_VIEW
        bool hasFileView = user.Role?.RolePermissions.Any(rp => rp.Permission?.Code == "FILE_VIEW") ?? false;
        if (!hasFileView)
            return new AccessDecisionResult { Allowed = false, StatusCode = 403, Reason = "Vai trò không có quyền xem học liệu (FILE_VIEW)." };

        // 3. File exists and status != DELETED
        var file = await _db.Files
            .Include(f => f.ClassificationLevel)
            .FirstOrDefaultAsync(f => f.Id == fileId);

        if (file == null || file.Status == "DELETED")
            return new AccessDecisionResult { Allowed = false, StatusCode = 404, Reason = "Tập tin không tồn tại hoặc đã bị xóa." };

        // 4. Check Special File Permission Override (Section 19)
        var userClassIds = user.StudentClasses.Where(sc => sc.Status == "ACTIVE").Select(sc => sc.ClassId).ToList();
        var specialPerm = await _db.FilePermissions
            .Where(fp => fp.FileId == fileId && (fp.UserId == userId || (fp.ClassId != null && userClassIds.Contains(fp.ClassId.Value))))
            .Where(fp => fp.ExpiresAt == null || fp.ExpiresAt > DateTime.UtcNow)
            .FirstOrDefaultAsync();

        if (specialPerm != null && specialPerm.CanView)
            return new AccessDecisionResult { Allowed = true, Reason = "Cấp quyền truy cập đặc cách: " + specialPerm.AccessReason };

        // 5. If Lecture context provided: Check Lecture Rules
        if (lectureId.HasValue)
        {
            var lecture = await _db.Lectures
                .Include(l => l.Permissions)
                .Include(l => l.LectureFiles)
                .FirstOrDefaultAsync(l => l.Id == lectureId.Value);

            if (lecture == null || lecture.DeletedAt != null)
                return new AccessDecisionResult { Allowed = false, StatusCode = 404, Reason = "Bài giảng không tồn tại." };

            // Teacher who authored the lecture has view access
            if (lecture.TeacherId == userId)
                return new AccessDecisionResult { Allowed = true };

            // Section 34: If lecture is CLOSED, students DENY
            if (lecture.Status == "CLOSED")
                return new AccessDecisionResult { Allowed = false, StatusCode = 403, Reason = "Bài giảng đã đóng (CLOSED). Toàn bộ quyền truy cập bị khóa." };

            if (lecture.Status != "PUBLISHED")
                return new AccessDecisionResult { Allowed = false, StatusCode = 403, Reason = "Bài giảng chưa được phát hành (Trạng thái: " + lecture.Status + ")." };

            // Section 38: Student's class must be in lecture_permissions
            bool classAllowed = lecture.Permissions.Any(lp => userClassIds.Contains(lp.ClassId) && lp.CanView);
            if (!classAllowed && user.Role?.Code == "STUDENT")
                return new AccessDecisionResult { Allowed = false, StatusCode = 403, Reason = "Lớp học của học viên không được phân quyền bài giảng này." };

            // Section 35: File must be in lecture_files and is_visible = true
            var lectureFile = lecture.LectureFiles.FirstOrDefault(lf => lf.FileId == fileId);
            if (lectureFile == null || !lectureFile.IsVisible)
                return new AccessDecisionResult { Allowed = false, StatusCode = 403, Reason = "Tập tin bị ẩn hoặc không thuộc danh mục bài giảng." };
        }

        // 6. Section 37: File Classification <= User Clearance
        int fileLevelOrder = file.ClassificationLevel?.LevelOrder ?? 1;
        int userMaxClearanceOrder = user.ClearanceLevels
            .Where(c => c.Status == "ACTIVE" && (c.ExpiresAt == null || c.ExpiresAt > DateTime.UtcNow))
            .Max(c => (int?)c.ClassificationLevel?.LevelOrder) ?? 1;

        if (fileLevelOrder > userMaxClearanceOrder)
        {
            return new AccessDecisionResult
            {
                Allowed = false,
                StatusCode = 403,
                Reason = $"Cấp độ bảo mật tập tin ({file.ClassificationLevel?.Name} - Bậc {fileLevelOrder}) cao hơn cấp độ Clearance của bạn (Bậc {userMaxClearanceOrder}). Quyền truy cập bị từ chối."
            };
        }

        return new AccessDecisionResult { Allowed = true };
    }

    public async Task<AccessDecisionResult> CanDownloadFileAsync(ulong userId, ulong fileId, ulong? lectureId)
    {
        // Must first satisfy CanView
        var viewResult = await CanViewFileAsync(userId, fileId, lectureId);
        if (!viewResult.Allowed) return viewResult;

        var user = await _db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == userId);
        if (user?.Role?.Code == "SUPER_ADMIN" || user?.Role?.Code == "ADMIN")
            return new AccessDecisionResult { Allowed = true };

        // Check Special Permission Override
        var specialPerm = await _db.FilePermissions
            .Where(fp => fp.FileId == fileId && fp.UserId == userId)
            .Where(fp => fp.ExpiresAt == null || fp.ExpiresAt > DateTime.UtcNow)
            .FirstOrDefaultAsync();

        if (specialPerm != null && specialPerm.CanDownload)
            return new AccessDecisionResult { Allowed = true, Reason = "Đặc cách tải học liệu: " + specialPerm.AccessReason };

        // Check Lecture File is_downloadable
        if (lectureId.HasValue)
        {
            var lectureFile = await _db.LectureFiles.FirstOrDefaultAsync(lf => lf.LectureId == lectureId.Value && lf.FileId == fileId);
            if (lectureFile != null && !lectureFile.IsDownloadable)
            {
                return new AccessDecisionResult
                {
                    Allowed = false,
                    StatusCode = 403,
                    Reason = "Học liệu này chỉ được phép xem trực tuyến, giảng viên không mở quyền tải về máy (is_downloadable=false)."
                };
            }
        }

        // Check Rate Limit (Section 33, 45)
        var oneHourAgo = DateTime.UtcNow.AddHours(-1);
        int recentDownloads = await _db.DownloadLogs
            .Where(dl => dl.UserId == userId && dl.DownloadedAt >= oneHourAgo && dl.Status == "SUCCESS")
            .CountAsync();

        var rateLimitSetting = await _db.SystemSettings.FirstOrDefaultAsync(s => s.SettingKey == "DOWNLOAD_RATE_LIMIT_PER_HOUR");
        int maxDownloadsPerHour = int.TryParse(rateLimitSetting?.SettingValue, out int ml) ? ml : 20;

        if (recentDownloads >= maxDownloadsPerHour)
        {
            return new AccessDecisionResult
            {
                Allowed = false,
                StatusCode = 429,
                Reason = $"Bạn đã vượt quá giới hạn tải cho phép ({maxDownloadsPerHour} lần/giờ). Vui lòng thử lại sau."
            };
        }

        return new AccessDecisionResult { Allowed = true };
    }

    public async Task<AccessDecisionResult> CanManageLectureAsync(ulong userId, ulong lectureId)
    {
        var user = await _db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null || user.Status != "ACTIVE")
            return new AccessDecisionResult { Allowed = false, StatusCode = 401, Reason = "Tài khoản không hợp lệ." };

        if (user.Role?.Code == "SUPER_ADMIN" || user.Role?.Code == "ADMIN")
            return new AccessDecisionResult { Allowed = true };

        var lecture = await _db.Lectures.FirstOrDefaultAsync(l => l.Id == lectureId);
        if (lecture == null)
            return new AccessDecisionResult { Allowed = false, StatusCode = 404, Reason = "Bài giảng không tồn tại." };

        if (lecture.TeacherId == userId)
            return new AccessDecisionResult { Allowed = true };

        return new AccessDecisionResult { Allowed = false, StatusCode = 403, Reason = "Bạn không phải là giảng viên phụ trách bài giảng này." };
    }
}
