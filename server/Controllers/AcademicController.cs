using Server.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.DTOs;
using Server.Models.Training;

namespace Server.Controllers;

[ApiController]
[Route("api/training/academic")]
[Route("api/academic")]
public class AcademicController : ControllerBase
{
    private readonly TrainingDbContext _db;

    public AcademicController(TrainingDbContext db)
    {
        _db = db;
    }

    [HttpGet("classes")]
    public async Task<IActionResult> GetClasses([FromQuery] string? search, [FromQuery] int? page, [FromQuery] int? pageSize, [FromQuery] string? sortBy = null, [FromQuery] string? sortDir = null)
    {
        var query = _db.Classes
            .Include(c => c.OrganizationalUnit)
            .Include(c => c.StudentClasses)
            .Where(c => c.Status != "DELETED")
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            string s = search.Trim().ToLower();
            query = query.Where(c => c.Code.ToLower().Contains(s) || c.Name.ToLower().Contains(s));
        }

        var selectQuery = query
            .OrderBy(c => c.Code)
            .Select(c => new ClassDto
            {
                Id = c.Id,
                Code = c.Code,
                Name = c.Name,
                AcademicYear = c.AcademicYear,
                Semester = c.Semester,
                Status = c.Status,
                FacultyName = c.OrganizationalUnit != null ? c.OrganizationalUnit.Name : "T04",
                StudentCount = c.StudentClasses.Count(sc => sc.Status == "ACTIVE")
            });

        return Ok(await selectQuery.Sort(sortBy, sortDir ?? "asc", "Code", "Id,Code,Name,AcademicYear,Semester,Status,FacultyName,StudentCount").ResultAsync(page, pageSize));
    }

    [HttpGet("classes/{id}/students")]
    public async Task<IActionResult> GetClassStudents(ulong id, [FromQuery] string? search, [FromQuery] int? page = null, [FromQuery] int? pageSize = null, [FromQuery] string? sortBy = null, [FromQuery] string? sortDir = null)
    {
        var cls = await _db.Classes.FirstOrDefaultAsync(c => c.Id == id);
        if (cls == null) return NotFound(new { message = "Không tìm thấy lớp học vụ." });

        var query = _db.StudentClasses
            .Include(sc => sc.Student)
            .Where(sc => sc.ClassId == id)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            string s = search.Trim().ToLower();
            query = query.Where(sc =>
                sc.Student.Username.ToLower().Contains(s) ||
                sc.Student.FullName.ToLower().Contains(s) ||
                (sc.Student.StudentCode != null && sc.Student.StudentCode.ToLower().Contains(s)));
        }

        var selected = query
            .OrderBy(sc => sc.Student.StudentCode)
            .Select(sc => new
            {
                sc.StudentId,
                Username = sc.Student.Username,
                FullName = sc.Student.FullName,
                StudentCode = sc.Student.StudentCode,
                Email = sc.Student.Email,
                Phone = sc.Student.Phone,
                sc.Status,
                sc.JoinedAt
            });
        var sorted = selected.Sort(sortBy, sortDir, "StudentCode", "StudentId,Username,FullName,StudentCode,Email,Phone,Status,JoinedAt", "StudentId");
        if (page.HasValue) return Ok(await sorted.ResultAsync(page, pageSize));
        var total = await query.CountAsync();
        var list = await sorted.Take(100).ToListAsync();

        return Ok(new
        {
            classId = cls.Id,
            classCode = cls.Code,
            className = cls.Name,
            totalStudents = total,
            students = list
        });
    }

    [HttpGet("subjects")]
    public async Task<IActionResult> GetSubjects([FromQuery] int? page = null, [FromQuery] int? pageSize = null, [FromQuery] string? search = null, [FromQuery] string? sortBy = null, [FromQuery] string? sortDir = null)
    {
        var query = _db.Subjects
            .Include(s => s.OrganizationalUnit)
            .Include(s => s.TeacherSubjects)
                .ThenInclude(ts => ts.Teacher)
            .Select(s => new SubjectDto
            {
                Id = s.Id,
                Code = s.Code,
                Name = s.Name,
                Description = s.Description,
                Credits = s.Credits,
                Status = s.Status,
                FacultyName = s.OrganizationalUnit != null ? s.OrganizationalUnit.Name : "T04",
                AssignedTeachers = s.TeacherSubjects.Select(ts => ts.Teacher.FullName).ToList()
            });

        if (!string.IsNullOrWhiteSpace(search)) query = query.Where(s => s.Code.Contains(search) || s.Name.Contains(search));
        return Ok(await query.Sort(sortBy, sortDir, "Code", "Id,Code,Name,Credits,Status,FacultyName,unitName:FacultyName").ResultAsync(page, pageSize));
    }

    [HttpGet("units")]
    public async Task<IActionResult> GetOrganizationalUnits([FromQuery] bool tree = false, [FromQuery] int? page = null, [FromQuery] int? pageSize = null, [FromQuery] string? search = null, [FromQuery] string? sortBy = null, [FromQuery] string? sortDir = null)
    {
        if (!tree || page.HasValue)
        {
            var query = _db.OrganizationalUnits.AsNoTracking().Select(u => new OrganizationalUnitDto
            {
                Id = u.Id, ParentId = u.ParentId, Code = u.Code, Name = u.Name,
                UnitType = u.UnitType, Status = u.Status,
                ParentName = _db.OrganizationalUnits.Where(p => p.Id == u.ParentId).Select(p => p.Name).FirstOrDefault() ?? "Trường Đại học An ninh Nhân dân",
                ChildCount = _db.OrganizationalUnits.Count(c => c.ParentId == u.Id)
            });
            if (!string.IsNullOrWhiteSpace(search)) query = query.Where(u => u.Code.Contains(search) || u.Name.Contains(search));
            return Ok(await query.Sort(sortBy, sortDir, "Code", "Id,Code,Name,UnitType,Status,ParentName,ChildCount").ResultAsync(page, pageSize));
        }
        var allUnits = await _db.OrganizationalUnits
            .OrderBy(u => u.ParentId)
            .ThenBy(u => u.Id)
            .ToListAsync();

        if (tree)
        {
            var rootUnits = allUnits.Where(u => u.ParentId == null).Select(u => new OrganizationalUnitDto
            {
                Id = u.Id,
                ParentId = u.ParentId,
                Code = u.Code,
                Name = u.Name,
                UnitType = u.UnitType,
                Status = u.Status,
                ParentName = "Trường Đại học An ninh Nhân dân",
                ChildCount = allUnits.Count(c => c.ParentId == u.Id),
                Children = allUnits.Where(c => c.ParentId == u.Id).Select(c => new OrganizationalUnitDto
                {
                    Id = c.Id,
                    ParentId = c.ParentId,
                    Code = c.Code,
                    Name = c.Name,
                    UnitType = c.UnitType,
                    Status = c.Status,
                    ParentName = u.Name,
                    ChildCount = allUnits.Count(sub => sub.ParentId == c.Id),
                    Children = allUnits.Where(sub => sub.ParentId == c.Id).Select(sub => new OrganizationalUnitDto
                    {
                        Id = sub.Id,
                        ParentId = sub.ParentId,
                        Code = sub.Code,
                        Name = sub.Name,
                        UnitType = sub.UnitType,
                        Status = sub.Status,
                        ParentName = c.Name,
                        ChildCount = 0
                    }).ToList()
                }).ToList()
            }).ToList();

            return Ok(rootUnits);
        }

        var flatUnits = allUnits.Select(u => new OrganizationalUnitDto
        {
            Id = u.Id,
            ParentId = u.ParentId,
            Code = u.Code,
            Name = u.Name,
            UnitType = u.UnitType,
            Status = u.Status,
            ParentName = u.ParentId != null ? allUnits.FirstOrDefault(p => p.Id == u.ParentId)?.Name : "Trường Đại học An ninh Nhân dân",
            ChildCount = allUnits.Count(c => c.ParentId == u.Id)
        }).ToList();

        return Ok(flatUnits);
    }

    [HttpPost("subjects")]
    public async Task<IActionResult> CreateSubject([FromBody] CreateSubjectDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Code) || string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest(new { message = "Mã môn học và Tên môn học là bắt buộc." });

        var exists = await _db.Subjects.AnyAsync(s => s.Code == dto.Code);
        if (exists) return BadRequest(new { message = $"Mã môn học '{dto.Code}' đã tồn tại." });

        var subject = new Subject
        {
            Code = dto.Code.Trim().ToUpper(),
            Name = dto.Name.Trim(),
            Description = dto.Description,
            Credits = dto.Credits,
            OrganizationalUnitId = dto.OrganizationalUnitId,
            Status = "ACTIVE",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Subjects.Add(subject);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Thêm môn học thành công!", subjectId = subject.Id });
    }

    [HttpPut("subjects/{id}")]
    public async Task<IActionResult> UpdateSubject(ulong id, [FromBody] UpdateSubjectDto dto)
    {
        var subject = await _db.Subjects.FirstOrDefaultAsync(s => s.Id == id);
        if (subject == null) return NotFound(new { message = "Không tìm thấy môn học." });

        if (!string.IsNullOrWhiteSpace(dto.Name)) subject.Name = dto.Name.Trim();
        subject.Description = dto.Description;
        if (dto.Credits > 0) subject.Credits = dto.Credits;
        if (dto.OrganizationalUnitId.HasValue && dto.OrganizationalUnitId.Value > 0)
            subject.OrganizationalUnitId = dto.OrganizationalUnitId.Value;
        if (!string.IsNullOrWhiteSpace(dto.Status)) subject.Status = dto.Status;
        subject.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(new { message = "Cập nhật môn học thành công!", subjectId = id });
    }

    [HttpDelete("subjects/{id}")]
    public async Task<IActionResult> DeleteSubject(ulong id)
    {
        var subject = await _db.Subjects.FirstOrDefaultAsync(s => s.Id == id);
        if (subject == null) return NotFound(new { message = "Không tìm thấy môn học." });

        subject.Status = "DELETED";
        subject.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new { message = $"Đã xóa môn học {subject.Code} thành công.", subjectId = id });
    }

    [HttpPost("classes")]
    public async Task<IActionResult> CreateClass([FromBody] CreateClassDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Code) || string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest(new { message = "Mã lớp và Tên lớp là bắt buộc." });

        var exists = await _db.Classes.AnyAsync(c => c.Code == dto.Code);
        if (exists) return BadRequest(new { message = $"Mã lớp '{dto.Code}' đã tồn tại." });

        var cls = new ClassRecord
        {
            Code = dto.Code.Trim().ToUpper(),
            Name = dto.Name.Trim(),
            AcademicYear = string.IsNullOrWhiteSpace(dto.AcademicYear) ? "2025-2026" : dto.AcademicYear,
            Semester = dto.Semester ?? "Học kỳ 1",
            OrganizationalUnitId = dto.OrganizationalUnitId,
            Status = "ACTIVE",
            CreatedAt = DateTime.UtcNow
        };

        _db.Classes.Add(cls);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Thêm lớp học vụ thành công!", classId = cls.Id });
    }

    [HttpPut("classes/{id}")]
    public async Task<IActionResult> UpdateClass(ulong id, [FromBody] UpdateClassDto dto)
    {
        var cls = await _db.Classes.FirstOrDefaultAsync(c => c.Id == id);
        if (cls == null) return NotFound(new { message = "Không tìm thấy lớp học vụ." });

        if (!string.IsNullOrWhiteSpace(dto.Name)) cls.Name = dto.Name.Trim();
        if (!string.IsNullOrWhiteSpace(dto.AcademicYear)) cls.AcademicYear = dto.AcademicYear.Trim();
        if (dto.Semester != null) cls.Semester = dto.Semester.Trim();
        if (dto.OrganizationalUnitId.HasValue && dto.OrganizationalUnitId.Value > 0)
            cls.OrganizationalUnitId = dto.OrganizationalUnitId.Value;
        if (!string.IsNullOrWhiteSpace(dto.Status)) cls.Status = dto.Status;

        await _db.SaveChangesAsync();
        return Ok(new { message = "Cập nhật lớp học vụ thành công!", classId = id });
    }

    [HttpDelete("classes/{id}")]
    public async Task<IActionResult> DeleteClass(ulong id)
    {
        var cls = await _db.Classes.FirstOrDefaultAsync(c => c.Id == id);
        if (cls == null) return NotFound(new { message = "Không tìm thấy lớp học vụ." });

        cls.Status = "DELETED";
        await _db.SaveChangesAsync();

        return Ok(new { message = $"Đã xóa lớp học vụ {cls.Code} thành công.", classId = id });
    }
}
