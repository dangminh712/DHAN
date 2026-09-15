from pathlib import Path
for p in Path('server/Controllers').glob('*.cs'):
 s=p.read_text();s=s.replace('using Server.Infrastructure;\nusing Server.Infrastructure;','using Server.Infrastructure;');p.write_text(s)
p=Path('server/Controllers/MediaController.cs');s=p.read_text();idx=s.index('[HttpGet("{id:int}")]');s=s[:idx]+s[idx:].replace('return Ok(page.HasValue ? TableQuery.Envelope(mapped, total, page, pageSize) : mapped);','return Ok(mapped);');p.write_text(s)
