from pathlib import Path
base=Path('server/Controllers')
for name in ['Academic','Auth','Files','Media','Lectures','System']:
 p=base/(name+'Controller.cs');s=p.read_text(encoding='utf-8-sig');s='using Server.Infrastructure;\n'+s;p.write_text(s,encoding='utf-8')
# endpoints already returning envelopes
for name,method,allowed,fallback in [
 ('Academic','GetClasses','Id,Code,Name,AcademicYear,Semester,Status,FacultyName,StudentCount','Code'),
 ('Auth','GetProvisionedStudents','Id,Username,FullName,Email,Phone,StudentCode,ClassCode,ClassName,Status,MustChangePassword,isFirstLogin:MustChangePassword,CreatedAt,LastLoginAt','CreatedAt'),
 ('System','GetAuditLogs','Id,Username,Action,EntityType,EntityId,IpAddress,CreatedAt','CreatedAt')]:
 p=base/(name+'Controller.cs');s=p.read_text();start=s.index('    public async Task<IActionResult> '+method);end=s.index('\n    [Http',start);part=s[start:end]
 # extend last arg
 ix=part.index(')\n    {');part=part[:ix]+', [FromQuery] string? sortBy = null, [FromQuery] string? sortDir = null'+part[ix:]
 ix=part.index('        if (page.HasValue');part=part[:ix]+f'        return Ok(await selectQuery.Sort(sortBy, sortDir ?? "asc", "{fallback}", "{allowed}").ResultAsync(page, pageSize));\n    }}\n'
 s=s[:start]+part+s[end:];p.write_text(s)
# users/files simple projected lists
for name,method,var,allowed,fallback in [
 ('Auth','GetSampleUsers','users','Id,Username,FullName,Role,RoleName,Department,unitName:Department,MaxClearance,clearanceLevel:ClearanceLevelOrder,Status,StudentCode','Id'),
 ('Files','GetFiles','files','Id,OriginalName,originalFileName:OriginalName,FileType,category:FileType,FileSize,ClassificationName,classification:ClassificationOrder,UploaderName,uploader:UploaderName,Status,CreatedAt','CreatedAt')]:
 p=base/(name+'Controller.cs');s=p.read_text();start=s.index('    public async Task<IActionResult> '+method);end=s.index('\n    [Http' if name=='Auth' else '\n    private',start);part=s[start:end]
 part=part.replace('int page = 1','int? page = null').replace('int pageSize = 50','int? pageSize = null')
 ix=part.index(')\n    {');part=part[:ix]+', [FromQuery] string? sortBy = null, [FromQuery] string? sortDir = null, [FromQuery] string? role = null'+part[ix:] if name=='Auth' else part[:ix]+', [FromQuery] string? sortBy = null, [FromQuery] string? sortDir = null'+part[ix:]
 part=part.replace('var '+var+' = await','var query =')
 import re
 part=re.sub(r'            \.OrderBy[^\n]*Skip[^\n]*\n','',part)
 part=part.replace('})\n            .ToListAsync();','});')
 if name=='Auth':part=part.replace('        return Ok(users);','        if (!string.IsNullOrWhiteSpace(role)) query = query.Where(u => u.Role == role);\n'+f'        return Ok(await query.Sort(sortBy, sortDir, "{fallback}", "{allowed}").ResultAsync(page, pageSize));')
 else:part=part.replace('        return Ok(files);',f'        return Ok(await query.Sort(sortBy, sortDir, "{fallback}", "{allowed}").ResultAsync(page, pageSize));')
 s=s[:start]+part+s[end:];p.write_text(s)
