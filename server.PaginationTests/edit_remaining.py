from pathlib import Path
base=Path('server/Controllers')
p=base/'AcademicController.cs';s=p.read_text()
# roster
start=s.index('    public async Task<IActionResult> GetClassStudents');end=s.index('\n    [HttpGet("subjects")]',start);part=s[start:end].replace('[FromQuery] string? search)','[FromQuery] string? search, [FromQuery] int? page = null, [FromQuery] int? pageSize = null, [FromQuery] string? sortBy = null, [FromQuery] string? sortDir = null)')
part=part.replace('var list = await query','var selected = query').replace('})\n            .ToListAsync();','});\n        var sorted = selected.Sort(sortBy, sortDir, "StudentCode", "StudentId,Username,FullName,StudentCode,Email,Phone,Status,JoinedAt", "StudentId");\n        if (page.HasValue) return Ok(await sorted.ResultAsync(page, pageSize));\n        var total = await query.CountAsync();\n        var list = await sorted.Take(100).ToListAsync();').replace('totalStudents = list.Count','totalStudents = total')
s=s[:start]+part+s[end:]
start=s.index('    public async Task<IActionResult> GetSubjects');end=s.index('\n    [HttpGet("units")]',start);part=s[start:end].replace('GetSubjects()','GetSubjects([FromQuery] int? page = null, [FromQuery] int? pageSize = null, [FromQuery] string? search = null, [FromQuery] string? sortBy = null, [FromQuery] string? sortDir = null)').replace('var subjects = await','var query =').replace('})\n            .ToListAsync();','});').replace('return Ok(subjects);','if (!string.IsNullOrWhiteSpace(search)) query = query.Where(s => s.Code.Contains(search) || s.Name.Contains(search));\n        return Ok(await query.Sort(sortBy, sortDir, "Code", "Id,Code,Name,Credits,Status,FacultyName,unitName:FacultyName").ResultAsync(page, pageSize));');s=s[:start]+part+s[end:]
# Flat units directly database, keep explicit tree legacy intact
s=s.replace('GetOrganizationalUnits([FromQuery] bool tree = false)','GetOrganizationalUnits([FromQuery] bool tree = false, [FromQuery] int? page = null, [FromQuery] int? pageSize = null, [FromQuery] string? search = null, [FromQuery] string? sortBy = null, [FromQuery] string? sortDir = null)')
needle='        var allUnits = await';idx=s.index(needle)
s=s[:idx]+'''        if (!tree || page.HasValue)
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
''' +s[idx:];p.write_text(s)
p=base/'SystemController.cs';s=p.read_text()
for method,var,fallback,allowed in [('GetSecurityAlerts','alerts','CreatedAt','Id,Username,AlertType,Severity,Description,SourceIp,Status,ResolverName,ResolvedAt,CreatedAt'),('GetUserSessions','list','LastActivityAt','Id,UserId,Username,DeviceId,DeviceName,IpAddress,LastActivityAt,lastSeenAt:LastActivityAt,ExpiresAt,RevokedAt')]:
 start=s.index('    public async Task<IActionResult> '+method);end=s.index('\n    [Http',start);part=s[start:end].replace('int page = 1','int? page = null');ix=part.index(')\n    {');part=part[:ix]+', [FromQuery] int? pageSize = null, [FromQuery] string? search = null, [FromQuery] string? sortBy = null, [FromQuery] string? sortDir = null'+part[ix:]
 part=part.replace('var '+var+' = await','var selected =')
 import re
 part=re.sub(r'            \.OrderBy[^\n]*\n','',part).replace('})\n            .ToListAsync();','});')
 part=part.replace('return Ok('+var+');',f'if (!string.IsNullOrWhiteSpace(search)) selected = selected.Where(s => s.Username.Contains(search));\n        return Ok(await selected.Sort(sortBy, sortDir ?? "desc", "{fallback}", "{allowed}").ResultAsync(page, pageSize));')
 s=s[:start]+part+s[end:]
start=s.index('    public async Task<IActionResult> GetNotifications');s=s[:start]+'''    public async Task<IActionResult> GetNotifications([FromQuery] ulong userId, [FromQuery] int? page = null, [FromQuery] int? pageSize = null, [FromQuery] string? search = null, [FromQuery] string? sortBy = null, [FromQuery] string? sortDir = null)
    {
        var query = _db.Notifications.AsNoTracking().Where(n => n.UserId == userId);
        if (!string.IsNullOrWhiteSpace(search)) query = query.Where(n => n.Title.Contains(search));
        return Ok(await query.Sort(sortBy, sortDir ?? "desc", "CreatedAt", "Id,Title,CreatedAt").ResultAsync(page, pageSize));
    }
}
''';p.write_text(s)
p=base/'LecturesController.cs';s=p.read_text();start=s.index('    public async Task<IActionResult> GetLectures');end=s.index('\n    [HttpGet("{id}")]',start);part=s[start:end].replace('[FromQuery] int? pageSize)','[FromQuery] int? pageSize, [FromQuery] string? sortBy = null, [FromQuery] string? sortDir = null, [FromQuery] string? scope = null)')
part=part.replace('        query = query.OrderByDescending(l => l.CreatedAt);','''        if (scope == "PUBLIC") query = query.Where(l => !l.Permissions.Any() || l.Permissions.Any(p => p.ClassId == 0));
        if (scope == "RESTRICTED") query = query.Where(l => l.Permissions.Any() && !l.Permissions.Any(p => p.ClassId == 0));''')
idx=part.index('        if (page.HasValue');part=part[:idx]+'''        return Ok(await selectExpression(query).Sort(sortBy, sortDir ?? "desc", "CreatedAt", "Id,Title,Subject,SubjectCode,DepartmentName,TeacherName,Status,Version,FileCount,scope:IsPublicAll,IsPublicAll,PublishAt,CloseAt,CreatedAt").ResultAsync(page, pageSize));
    }
''';s=s[:start]+part+s[end:];p.write_text(s)
p=base/'MediaController.cs';s=p.read_text().replace('int page = 1','int? page = null').replace('int pageSize = 50)','int? pageSize = null, [FromQuery] string? sortBy = null, [FromQuery] string? sortDir = null, [FromQuery] string? classification = null)');s=s.replace('            var list = await query.AsNoTracking()','''            var classificationOrder = classification switch { "TUYET_MAT" => 5, "TOI_MAT" => 4, "MAT" => 3, "NOI_BO" => 2, "CONG_KHAI" => 1, _ => 0 };
            if (classificationOrder > 0) query = query.Where(f => f.ClassificationLevel != null && f.ClassificationLevel.LevelOrder == classificationOrder);
            var total = page.HasValue ? await query.CountAsync() : 0;
            var selected = query.AsNoTracking()''');s=s.replace('                .OrderByDescending(f => f.CreatedAt).ThenByDescending(f => f.Id)\n                .Skip((Math.Clamp(page, 1, 100000) - 1) * Math.Clamp(pageSize, 1, 100)).Take(Math.Clamp(pageSize, 1, 100))\n','');s=s.replace('                }).ToListAsync();','''                });
            var sorted = selected.Sort(sortBy, sortDir ?? "desc", "CreatedAt", "Id,originalFileName:OriginalName,OriginalName,category:FileType,FileType,FileSize,classification:ClassificationOrder,ClassificationOrder,uploader:UploaderName,UploaderName,CreatedAt");
            var list = await sorted.Skip(page.HasValue ? (TableQuery.Page(page) - 1) * TableQuery.Size(pageSize) : 0).Take(page.HasValue ? TableQuery.Size(pageSize) : 100).ToListAsync();''',1).replace('return Ok(mapped);','return Ok(page.HasValue ? TableQuery.Envelope(mapped, total, page, pageSize) : mapped);');p.write_text(s)
