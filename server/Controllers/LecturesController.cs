using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.DTOs;
using Server.Models.Training;
using Server.Services;

namespace Server.Controllers;

[ApiController]
[Route("api/training/lectures")]
public class LecturesController : ControllerBase
{
    private readonly TrainingDbContext _db;
    private readonly IAuditService _audit;
    private readonly IAccessDecisionService _access;

    public LecturesController(TrainingDbContext db, IAuditService audit, IAccessDecisionService access)
    {
        _db = db;
        _audit = audit;
        _access = access;
    }

    [HttpGet]
    public async Task<IActionResult> GetLectures(
        [FromQuery] ulong? userId,
        [FromQuery] string? status,
        [FromQuery] string? search,
        [FromQuery] ulong? subjectId,
        [FromQuery] int? page,
        [FromQuery] int? pageSize)
    {
        var query = _db.Lectures
            .Include(l => l.Subject)
            .Include(l => l.Teacher)
            .Include(l => l.Permissions)
                .ThenInclude(lp => lp.Class)
            .Include(l => l.LectureFiles)
                .ThenInclude(lf => lf.File)
                    .ThenInclude(f => f.ClassificationLevel)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && status != "ALL")
        {
            query = query.Where(l => l.Status == status);
        }

        if (subjectId.HasValue && subjectId.Value > 0)
        {
            query = query.Where(l => l.SubjectId == subjectId.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            string s = search.Trim().ToLower();
            query = query.Where(l => l.Title.ToLower().Contains(s) ||
                                     (l.Subject != null && (l.Subject.Name.ToLower().Contains(s) || l.Subject.Code.ToLower().Contains(s))) ||
                                     (l.Teacher != null && l.Teacher.FullName.ToLower().Contains(s)));
        }

        if (userId.HasValue)
        {
            var user = await _db.Users
                .Include(u => u.Role)
                .Include(u => u.StudentClasses)
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == userId.Value);

            if (user != null && user.Role?.Code == "STUDENT")
            {
                var studentClassIds = user.StudentClasses.Where(sc => sc.Status == "ACTIVE").Select(sc => sc.ClassId).ToList();
                // Student sees lectures that are PUBLISHED and active, and either Public to all (no permission rows or classId==0) OR granted to student's class
                query = query.Where(l => l.Status == "PUBLISHED" &&
                                        (l.CloseAt == null || l.CloseAt > DateTime.UtcNow) &&
                                        (!l.Permissions.Any() || l.Permissions.Any(lp => lp.ClassId == 0 || (studentClassIds.Contains(lp.ClassId) && lp.CanView))));
            }
            else if (user != null && user.Role?.Code == "TEACHER")
            {
                // Teacher sees authored lectures or all published in department
                query = query.Where(l => l.TeacherId == user.Id || l.Status == "PUBLISHED");
            }
        }

        query = query.OrderByDescending(l => l.CreatedAt);

        var selectExpression = (IQueryable<Lecture> q) => q.Select(l => new LectureSummaryDto
        {
            Id = l.Id,
            Title = l.Title,
            Description = l.Description,
            Status = l.Status,
            Version = l.Version,
            Subject = l.Subject != null ? l.Subject.Name : "N/A",
            SubjectCode = l.Subject != null ? l.Subject.Code : "N/A",
            DepartmentName = (l.Subject != null && l.Subject.OrganizationalUnit != null) ? l.Subject.OrganizationalUnit.Name : (l.Subject != null ? l.Subject.Name : "Khoa Nghiệp vụ An ninh"),
            TeacherName = l.Teacher != null ? l.Teacher.FullName : "N/A",
            TeacherId = l.TeacherId,
            PublishAt = l.PublishAt,
            CloseAt = l.CloseAt,
            CreatedAt = l.CreatedAt,
            IsPublicAll = !l.Permissions.Any() || l.Permissions.Any(lp => lp.ClassId == 0),
            AssignedClasses = l.Permissions.Where(lp => lp.Class != null).Select(lp => lp.Class.Name).ToList(),
            AssignedClassIds = l.Permissions.Select(lp => lp.ClassId).ToList(),
            FileCount = l.LectureFiles.Count(lf => lf.IsVisible),
            Files = l.LectureFiles
                .OrderBy(lf => lf.DisplayOrder)
                .Select(lf => new LectureFileItemDto
                {
                    FileId = lf.FileId,
                    OriginalName = lf.File.OriginalName,
                    FileType = lf.File.FileType,
                    FileSize = lf.File.FileSize,
                    Classification = lf.File.ClassificationLevel != null ? lf.File.ClassificationLevel.Name : "Công khai",
                    ClassificationOrder = lf.File.ClassificationLevel != null ? lf.File.ClassificationLevel.LevelOrder : 1,
                    DisplayOrder = lf.DisplayOrder,
                    IsVisible = lf.IsVisible,
                    IsDownloadable = lf.IsDownloadable,
                    IsPrintable = lf.IsPrintable
                }).ToList()
        });

        if (page.HasValue && page.Value > 0)
        {
            int size = Math.Clamp(pageSize ?? 10, 1, 100);
            int total = await query.CountAsync();
            var items = await selectExpression(query.Skip((page.Value - 1) * size).Take(size)).ToListAsync();
            return Ok(new
            {
                items,
                totalCount = total,
                page = page.Value,
                pageSize = size,
                totalPages = (int)Math.Ceiling((double)total / size)
            });
        }

        var list = await selectExpression(query.Take(100)).ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetLectureDetail(ulong id, [FromQuery] ulong? userId)
    {
        var lecture = await _db.Lectures
            .Include(l => l.Subject)
                .ThenInclude(s => s.OrganizationalUnit)
            .Include(l => l.Teacher)
            .Include(l => l.Permissions)
                .ThenInclude(lp => lp.Class)
            .Include(l => l.LectureFiles)
                .ThenInclude(lf => lf.File)
                    .ThenInclude(f => f.ClassificationLevel)
            .Include(l => l.QuizQuestions)
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.Id == id);

        if (lecture == null)
            return NotFound(new { message = "Không tìm thấy bài giảng." });

        var dto = new LectureSummaryDto
        {
            Id = lecture.Id,
            Title = lecture.Title,
            Description = lecture.Description,
            Status = lecture.Status,
            Version = lecture.Version,
            Subject = lecture.Subject?.Name ?? "N/A",
            SubjectCode = lecture.Subject?.Code ?? "N/A",
            DepartmentName = lecture.Subject?.OrganizationalUnit?.Name ?? (lecture.Subject?.Name ?? "Khoa Nghiệp vụ An ninh"),
            TeacherName = lecture.Teacher?.FullName ?? "N/A",
            TeacherId = lecture.TeacherId,
            PublishAt = lecture.PublishAt,
            CloseAt = lecture.CloseAt,
            CreatedAt = lecture.CreatedAt,
            IsPublicAll = !lecture.Permissions.Any() || lecture.Permissions.Any(lp => lp.ClassId == 0),
            AssignedClasses = lecture.Permissions.Where(lp => lp.Class != null).Select(lp => lp.Class.Name).ToList(),
            AssignedClassIds = lecture.Permissions.Select(lp => lp.ClassId).ToList(),
            FileCount = lecture.LectureFiles.Count(lf => lf.IsVisible),
            Files = lecture.LectureFiles
                .OrderBy(lf => lf.DisplayOrder)
                .Select(lf => new LectureFileItemDto
                {
                    FileId = lf.FileId,
                    OriginalName = lf.File.OriginalName,
                    FileType = lf.File.FileType,
                    FileSize = lf.File.FileSize,
                    Classification = lf.File.ClassificationLevel?.Name ?? "Công khai",
                    ClassificationOrder = lf.File.ClassificationLevel?.LevelOrder ?? 1,
                    DisplayOrder = lf.DisplayOrder,
                    IsVisible = lf.IsVisible,
                    IsDownloadable = lf.IsDownloadable,
                    IsPrintable = lf.IsPrintable
                }).ToList(),
            QuizQuestions = lecture.QuizQuestions
                .OrderBy(q => q.OrderIndex)
                .Select(q => new QuizQuestionDto
                {
                    Id = q.Id,
                    LectureId = q.LectureId,
                    Question = q.Question,
                    Options = System.Text.Json.JsonSerializer.Deserialize<List<string>>(q.OptionsJson) ?? new(),
                    CorrectIndex = q.CorrectIndex,
                    Explanation = q.Explanation,
                    OrderIndex = q.OrderIndex
                }).ToList()
        };

        if (userId.HasValue && userId.Value > 0)
        {
            var progress = await _db.LearningProgresses
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.LectureId == id && p.UserId == userId.Value);

            if (progress != null)
            {
                dto.UserProgress = new LearningProgressDto
                {
                    Id = progress.Id,
                    UserId = progress.UserId,
                    LectureId = progress.LectureId,
                    ProgressPercent = progress.ProgressPercent,
                    Completed = progress.Completed,
                    CompletedAt = progress.CompletedAt,
                    Notes = progress.Notes,
                    CompletedParts = string.IsNullOrEmpty(progress.CompletedParts)
                        ? new()
                        : progress.CompletedParts.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(int.Parse).ToList(),
                    QuizScore = progress.QuizScore,
                    LastAccessedAt = progress.LastAccessedAt
                };
            }
        }

        return Ok(dto);
    }

    [HttpGet("{id}/progress")]
    public async Task<IActionResult> GetProgress(ulong id, [FromQuery] ulong userId)
    {
        if (userId == 0) return BadRequest(new { message = "UserId là bắt buộc." });

        var progress = await _db.LearningProgresses
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.LectureId == id && p.UserId == userId);

        if (progress == null)
        {
            return Ok(new LearningProgressDto
            {
                UserId = userId,
                LectureId = id,
                ProgressPercent = 0,
                Completed = false,
                CompletedParts = new() { 1 }
            });
        }

        return Ok(new LearningProgressDto
        {
            Id = progress.Id,
            UserId = progress.UserId,
            LectureId = progress.LectureId,
            ProgressPercent = progress.ProgressPercent,
            Completed = progress.Completed,
            CompletedAt = progress.CompletedAt,
            Notes = progress.Notes,
            CompletedParts = string.IsNullOrEmpty(progress.CompletedParts)
                ? new()
                : progress.CompletedParts.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(int.Parse).ToList(),
            QuizScore = progress.QuizScore,
            LastAccessedAt = progress.LastAccessedAt
        });
    }

    [HttpPost("{id}/progress")]
    public async Task<IActionResult> SaveProgress(ulong id, [FromBody] UpdateProgressDto dto)
    {
        if (dto.UserId == 0) return BadRequest(new { message = "UserId là bắt buộc." });

        var progress = await _db.LearningProgresses
            .FirstOrDefaultAsync(p => p.LectureId == id && p.UserId == dto.UserId);

        if (progress == null)
        {
            progress = new LearningProgress
            {
                UserId = dto.UserId,
                LectureId = id,
                CreatedAt = DateTime.UtcNow
            };
            _db.LearningProgresses.Add(progress);
        }

        if (dto.ProgressPercent.HasValue) progress.ProgressPercent = dto.ProgressPercent.Value;
        if (dto.Completed.HasValue)
        {
            progress.Completed = dto.Completed.Value;
            if (progress.Completed && progress.CompletedAt == null)
                progress.CompletedAt = DateTime.UtcNow;
        }
        if (dto.Notes != null) progress.Notes = dto.Notes;
        if (dto.CompletedParts != null)
            progress.CompletedParts = string.Join(",", dto.CompletedParts);
        if (dto.QuizScore.HasValue) progress.QuizScore = dto.QuizScore.Value;

        progress.LastAccessedAt = DateTime.UtcNow;
        progress.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            message = "Đã lưu tiến độ học tập và ghi chú vào CSDL thành công.",
            progressId = progress.Id
        });
    }

    [HttpPost("{id}/quiz/submit")]
    public async Task<IActionResult> SubmitQuiz(ulong id, [FromBody] SubmitQuizDto dto)
    {
        var sessionUser = await LearningAccess.UserIdAsync(_db, Request);
        if (sessionUser == null) return Unauthorized(new { message = "Vui lòng đăng nhập lại." });
        dto.UserId = sessionUser.Value;
        if (!await LearningAccess.LectureAsync(_db, dto.UserId, id)) return StatusCode(403, new { message = "Không có quyền học bài giảng này." });
        if (dto.SubmissionId == Guid.Empty) dto.SubmissionId = Guid.NewGuid();
        var existing = await _db.Set<QuizAttempt>().AsNoTracking().Where(a => a.UserId == dto.UserId && a.SubmissionId == dto.SubmissionId && a.LectureId == id)
            .Select(a => a.ResultJson).FirstOrDefaultAsync();
        if (existing != null) return Ok(System.Text.Json.JsonSerializer.Deserialize<QuizResultDto>(existing));
        var questions = await _db.QuizQuestions
            .Where(q => q.LectureId == id)
            .OrderBy(q => q.OrderIndex)
            .ToListAsync();

        if (!questions.Any())
            return BadRequest(new { message = "Bài giảng này chưa có câu hỏi trắc nghiệm." });

        if (dto.Answers == null || dto.Answers.Count != questions.Count || questions.Any(q => !dto.Answers.TryGetValue(q.Id, out var answer)
            || answer < 0 || answer >= (System.Text.Json.JsonSerializer.Deserialize<List<string>>(q.OptionsJson)?.Count ?? 0)))
            return BadRequest(new { message = "Vui lòng trả lời đầy đủ, hợp lệ các câu hỏi." });

        int correctCount = 0;
        var details = new List<QuizAnswerDetailDto>();

        foreach (var q in questions)
        {
            int selected = dto.Answers.ContainsKey(q.Id) ? dto.Answers[q.Id] : -1;
            bool isCorrect = (selected == q.CorrectIndex);
            if (isCorrect) correctCount++;

            details.Add(new QuizAnswerDetailDto
            {
                QuestionId = q.Id,
                SelectedIndex = selected,
                CorrectIndex = q.CorrectIndex,
                IsCorrect = isCorrect,
                Explanation = q.Explanation
            });
        }

        int score = (int)Math.Round((double)correctCount * 100 / questions.Count);
        bool passed = score >= 70;

        var result = new QuizResultDto { TotalQuestions = questions.Count, CorrectAnswers = correctCount, Score = score, Passed = passed, Details = details };
        _db.Add(new QuizAttempt { UserId = dto.UserId, LectureId = id, QuizId = id, SubmissionId = dto.SubmissionId,
            AnswersJson = System.Text.Json.JsonSerializer.Serialize(dto.Answers), ResultJson = System.Text.Json.JsonSerializer.Serialize(result),
            Score = score, Completed = true });
        var quizPart = await _db.Set<LearningPartProgress>().FirstOrDefaultAsync(p => p.UserId == dto.UserId && p.LectureId == id && p.PartId == 5);
        if (quizPart == null) { quizPart = new LearningPartProgress { UserId = dto.UserId, LectureId = id, PartId = 5 }; _db.Add(quizPart); }
        quizPart.Completed = true;
        quizPart.UpdatedAt = DateTime.UtcNow;

        if (dto.UserId > 0)
        {
            var progress = await _db.LearningProgresses
                .FirstOrDefaultAsync(p => p.LectureId == id && p.UserId == dto.UserId);

            if (progress == null)
            {
                progress = new LearningProgress
                {
                    UserId = dto.UserId,
                    LectureId = id,
                    CreatedAt = DateTime.UtcNow
                };
                _db.LearningProgresses.Add(progress);
            }

            progress.QuizScore = score;
            var parts = string.IsNullOrEmpty(progress.CompletedParts)
                ? new HashSet<int>()
                : progress.CompletedParts.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(int.Parse).ToHashSet();
            parts.Add(5); // part 5 completed
            progress.CompletedParts = string.Join(",", parts);
            progress.ProgressPercent = Math.Max(progress.ProgressPercent, (decimal)parts.Count * 20);
            if (parts.Count >= 5) progress.Completed = true;

            progress.LastAccessedAt = DateTime.UtcNow;
            progress.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
        }

        return Ok(new QuizResultDto
        {
            TotalQuestions = questions.Count,
            CorrectAnswers = correctCount,
            Score = score,
            Passed = passed,
            Details = details
        });
    }

    [HttpPost]
    public async Task<IActionResult> CreateLecture([FromBody] CreateLectureDto dto, [FromQuery] ulong? userId)
    {
        ulong uid = (userId.HasValue && userId.Value > 0) ? userId.Value : ((await LearningAccess.UserIdAsync(_db, Request)) ?? 1);
        var teacher = await _db.Users.FirstOrDefaultAsync(u => u.Id == uid);
        if (teacher == null) return Unauthorized(new { message = "Người dùng không hợp lệ." });

        using var trans = await _db.Database.BeginTransactionAsync();
        try
        {
            var lecture = new Lecture
            {
                SubjectId = dto.SubjectId,
                TeacherId = uid,
                Title = dto.Title,
                Description = dto.Description,
                Status = "PUBLISHED",
                PublishAt = DateTime.UtcNow,
                Version = 1,
                CreatedAt = DateTime.UtcNow
            };

            _db.Lectures.Add(lecture);
            await _db.SaveChangesAsync();

            // Assign classes
            foreach (var classId in dto.ClassIds)
            {
                _db.LecturePermissions.Add(new LecturePermission
                {
                    LectureId = lecture.Id,
                    ClassId = classId,
                    CanView = true,
                    PublishAt = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow
                });
            }

            // Attach files
            int order = 1;
            foreach (var fileId in dto.FileIds)
            {
                var fileRec = await _db.Files.FirstOrDefaultAsync(f => f.Id == fileId);
                bool canDownload = fileRec?.FileType != "VIDEO"; // Videos default stream only
                _db.LectureFiles.Add(new LectureFile
                {
                    LectureId = lecture.Id,
                    FileId = fileId,
                    DisplayOrder = order++,
                    IsVisible = true,
                    IsDownloadable = canDownload,
                    IsPrintable = fileRec?.FileType == "PDF",
                    CreatedAt = DateTime.UtcNow
                });
            }

            await _db.SaveChangesAsync();
            await _audit.LogAsync(uid, "CREATE_LECTURE", "LECTURE", lecture.Id, null, $"{{\"title\":\"{lecture.Title}\"}}", HttpContext.Connection.RemoteIpAddress?.ToString());
            await trans.CommitAsync();

            return CreatedAtAction(nameof(GetLectureDetail), new { id = lecture.Id }, lecture);
        }
        catch (Exception ex)
        {
            await trans.RollbackAsync();
            return StatusCode(500, new { message = "Lỗi tạo bài giảng: " + ex.Message });
        }
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(ulong id, [FromBody] UpdateLectureStatusDto dto, [FromQuery] ulong? userId)
    {
        ulong uid = (userId.HasValue && userId.Value > 0) ? userId.Value : ((await LearningAccess.UserIdAsync(_db, Request)) ?? 1);
        var perm = await _access.CanManageLectureAsync(uid, id);
        if (!perm.Allowed) return StatusCode(perm.StatusCode, new { message = perm.Reason });

        var lecture = await _db.Lectures.FirstOrDefaultAsync(l => l.Id == id);
        if (lecture == null) return NotFound();

        string oldStatus = lecture.Status;
        lecture.Status = dto.Status;
        if (dto.Status == "PUBLISHED" && lecture.PublishAt == null)
        {
            lecture.PublishAt = DateTime.UtcNow;
        }
        else if (dto.Status == "CLOSED" || dto.Status == "LOCKED")
        {
            lecture.CloseAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        await _audit.LogAsync(uid, "UPDATE_LECTURE_STATUS", "LECTURE", id, $"{{\"status\":\"{oldStatus}\"}}", $"{{\"status\":\"{dto.Status}\"}}", HttpContext.Connection.RemoteIpAddress?.ToString());

        return Ok(new { message = $"Đã cập nhật trạng thái bài giảng thành {dto.Status}", lectureId = id, status = dto.Status });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateLecture(ulong id, [FromBody] UpdateLectureDto dto, [FromQuery] ulong? userId)
    {
        ulong uid = (userId.HasValue && userId.Value > 0) ? userId.Value : ((await LearningAccess.UserIdAsync(_db, Request)) ?? 1);
        var lecture = await _db.Lectures
            .Include(l => l.Permissions)
            .Include(l => l.LectureFiles)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (lecture == null) return NotFound(new { message = "Không tìm thấy bài giảng." });

        using var trans = await _db.Database.BeginTransactionAsync();
        try
        {
            if (dto.SubjectId > 0) lecture.SubjectId = dto.SubjectId;
            if (!string.IsNullOrWhiteSpace(dto.Title)) lecture.Title = dto.Title;
            lecture.Description = dto.Description;
            if (!string.IsNullOrWhiteSpace(dto.Status)) lecture.Status = dto.Status;
            lecture.UpdatedAt = DateTime.UtcNow;
            lecture.Version += 1;

            // Update assigned classes
            if (dto.ClassIds != null)
            {
                _db.LecturePermissions.RemoveRange(lecture.Permissions);
                foreach (var cid in dto.ClassIds)
                {
                    _db.LecturePermissions.Add(new LecturePermission
                    {
                        LectureId = lecture.Id,
                        ClassId = cid,
                        CanView = true,
                        PublishAt = DateTime.UtcNow,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }

            // Update files
            if (dto.FileIds != null)
            {
                _db.LectureFiles.RemoveRange(lecture.LectureFiles);
                int order = 1;
                foreach (var fid in dto.FileIds)
                {
                    var fileRec = await _db.Files.FirstOrDefaultAsync(f => f.Id == fid);
                    _db.LectureFiles.Add(new LectureFile
                    {
                        LectureId = lecture.Id,
                        FileId = fid,
                        DisplayOrder = order++,
                        IsVisible = true,
                        IsDownloadable = fileRec?.FileType != "VIDEO",
                        IsPrintable = fileRec?.FileType == "PDF",
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }

            await _db.SaveChangesAsync();
            await _audit.LogAsync(userId, "UPDATE_LECTURE", "LECTURE", lecture.Id, null, $"{{\"title\":\"{lecture.Title}\"}}", HttpContext.Connection.RemoteIpAddress?.ToString());
            await trans.CommitAsync();

            return Ok(new { message = "Cập nhật bài giảng thành công!", lectureId = lecture.Id });
        }
        catch (Exception ex)
        {
            await trans.RollbackAsync();
            return StatusCode(500, new { message = "Lỗi khi cập nhật bài giảng: " + ex.Message });
        }
    }

    [HttpPut("{id}/permissions")]
    public async Task<IActionResult> UpdateLecturePermissions(ulong id, [FromQuery] ulong userId, [FromBody] UpdateLecturePermissionsDto dto)
    {
        var lecture = await _db.Lectures.Include(l => l.Permissions).FirstOrDefaultAsync(l => l.Id == id);
        if (lecture == null) return NotFound(new { message = "Không tìm thấy bài giảng." });

        using var trans = await _db.Database.BeginTransactionAsync();
        try
        {
            _db.LecturePermissions.RemoveRange(lecture.Permissions);

            if (dto.Scope == "SPECIFIC" && dto.ClassIds != null && dto.ClassIds.Count > 0)
            {
                foreach (var cid in dto.ClassIds)
                {
                    _db.LecturePermissions.Add(new LecturePermission
                    {
                        LectureId = lecture.Id,
                        ClassId = cid,
                        CanView = true,
                        PublishAt = DateTime.UtcNow,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }
            // If Scope == "ALL", leaving permissions empty represents public to all academy students

            lecture.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            await _audit.LogAsync(userId, "UPDATE_LECTURE_PERMISSIONS", "LECTURE", lecture.Id, null,
                $"{{\"scope\":\"{dto.Scope}\",\"classCount\":{dto.ClassIds?.Count ?? 0}}}",
                HttpContext.Connection.RemoteIpAddress?.ToString());
            await trans.CommitAsync();

            return Ok(new
            {
                message = dto.Scope == "ALL"
                    ? "Đã mở công khai bài giảng cho tất cả học viên trong học viện!"
                    : $"Đã giới hạn quyền xem bài giảng cho {dto.ClassIds?.Count ?? 0} lớp học vụ chỉ định.",
                isPublicAll = dto.Scope == "ALL",
                assignedClassIds = dto.Scope == "ALL" ? new List<ulong>() : (dto.ClassIds ?? new List<ulong>())
            });
        }
        catch (Exception ex)
        {
            await trans.RollbackAsync();
            return StatusCode(500, new { message = "Lỗi khi cập nhật phân quyền bài giảng: " + ex.Message });
        }
    }

    [HttpPut("{id}/files/{fileId}/downloadable")]
    public async Task<IActionResult> ToggleFileDownloadable(ulong id, ulong fileId, [FromQuery] ulong userId, [FromBody] ToggleFileDownloadableDto dto)
    {
        var lectureFile = await _db.LectureFiles
            .Include(lf => lf.File)
            .FirstOrDefaultAsync(lf => lf.LectureId == id && lf.FileId == fileId);

        if (lectureFile == null)
            return NotFound(new { message = "Không tìm thấy học liệu trong bài giảng này." });

        lectureFile.IsDownloadable = dto.IsDownloadable;
        await _db.SaveChangesAsync();

        await _audit.LogAsync(userId, "TOGGLE_FILE_DOWNLOADABLE", "LECTURE_FILE", fileId,
            $"LectureId={id}",
            $"{{\"isDownloadable\":{dto.IsDownloadable.ToString().ToLowerInvariant()}}}",
            HttpContext.Connection.RemoteIpAddress?.ToString());

        return Ok(new
        {
            message = dto.IsDownloadable
                ? "Đã cho phép học viên tải tài liệu này về máy."
                : "Đã khóa tính năng tải về: Học viên chỉ được xem trực tuyến trên hệ thống.",
            lectureId = id,
            fileId,
            isDownloadable = dto.IsDownloadable
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteLecture(ulong id, [FromQuery] ulong userId)
    {
        var lecture = await _db.Lectures
            .Include(l => l.Permissions)
            .Include(l => l.LectureFiles)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (lecture == null) return NotFound(new { message = "Không tìm thấy bài giảng." });

        using var trans = await _db.Database.BeginTransactionAsync();
        try
        {
            lecture.Status = "ARCHIVED";
            lecture.DeletedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            await _audit.LogAsync(userId, "DELETE_LECTURE", "LECTURE", lecture.Id, null, $"{{\"title\":\"{lecture.Title}\"}}", HttpContext.Connection.RemoteIpAddress?.ToString());
            await trans.CommitAsync();

            return Ok(new { message = "Đã lưu trữ/xóa bài giảng thành công.", lectureId = id });
        }
        catch (Exception ex)
        {
            await trans.RollbackAsync();
            return StatusCode(500, new { message = "Lỗi khi xóa bài giảng: " + ex.Message });
        }
    }
}
