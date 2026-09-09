using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.DTOs;

namespace Server.Controllers;

[ApiController]
[Route("api/training/academic")]
public class AcademicController : ControllerBase
{
    private readonly TrainingDbContext _db;

    public AcademicController(TrainingDbContext db)
    {
        _db = db;
    }

    [HttpGet("classes")]
    public async Task<IActionResult> GetClasses()
    {
        var classes = await _db.Classes
            .Include(c => c.OrganizationalUnit)
            .Include(c => c.StudentClasses)
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
            })
            .ToListAsync();

        return Ok(classes);
    }

    [HttpGet("subjects")]
    public async Task<IActionResult> GetSubjects()
    {
        var subjects = await _db.Subjects
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
            })
            .ToListAsync();

        return Ok(subjects);
    }

    [HttpGet("units")]
    public async Task<IActionResult> GetOrganizationalUnits()
    {
        var allUnits = await _db.OrganizationalUnits
            .OrderBy(u => u.ParentId)
            .ThenBy(u => u.Id)
            .ToListAsync();

        var rootUnits = allUnits.Where(u => u.ParentId == null).Select(u => new OrganizationalUnitDto
        {
            Id = u.Id,
            ParentId = u.ParentId,
            Code = u.Code,
            Name = u.Name,
            UnitType = u.UnitType,
            Status = u.Status,
            Children = allUnits.Where(c => c.ParentId == u.Id).Select(c => new OrganizationalUnitDto
            {
                Id = c.Id,
                ParentId = c.ParentId,
                Code = c.Code,
                Name = c.Name,
                UnitType = c.UnitType,
                Status = c.Status,
                Children = allUnits.Where(sub => sub.ParentId == c.Id).Select(sub => new OrganizationalUnitDto
                {
                    Id = sub.Id,
                    ParentId = sub.ParentId,
                    Code = sub.Code,
                    Name = sub.Name,
                    UnitType = sub.UnitType,
                    Status = sub.Status
                }).ToList()
            }).ToList()
        }).ToList();

        return Ok(rootUnits);
    }
}
