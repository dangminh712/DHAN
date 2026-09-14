namespace Server.DTOs;

public class ClassDto
{
    public ulong Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string AcademicYear { get; set; } = string.Empty;
    public string? Semester { get; set; }
    public string Status { get; set; } = "ACTIVE";
    public string FacultyName { get; set; } = string.Empty;
    public int StudentCount { get; set; }
}

public class SubjectDto
{
    public ulong Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal? Credits { get; set; }
    public string Status { get; set; } = "ACTIVE";
    public string FacultyName { get; set; } = string.Empty;
    public List<string> AssignedTeachers { get; set; } = new();
}

public class OrganizationalUnitDto
{
    public ulong Id { get; set; }
    public ulong? ParentId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string UnitType { get; set; } = string.Empty;
    public string Status { get; set; } = "ACTIVE";
    public string? ParentName { get; set; }
    public int ChildCount { get; set; }
    public List<OrganizationalUnitDto> Children { get; set; } = new();
}

public class CreateSubjectDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Credits { get; set; } = 3;
    public ulong? OrganizationalUnitId { get; set; }
}

public class UpdateSubjectDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Credits { get; set; } = 3;
    public ulong? OrganizationalUnitId { get; set; }
    public string Status { get; set; } = "ACTIVE";
}

public class CreateClassDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string AcademicYear { get; set; } = "2025-2026";
    public string? Semester { get; set; } = "Học kỳ 1";
    public ulong? OrganizationalUnitId { get; set; }
}

public class UpdateClassDto
{
    public string Name { get; set; } = string.Empty;
    public string AcademicYear { get; set; } = "2025-2026";
    public string? Semester { get; set; } = "Học kỳ 1";
    public ulong? OrganizationalUnitId { get; set; }
    public string Status { get; set; } = "ACTIVE";
}

