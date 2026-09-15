using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Controllers;
using Server.Data;
using Server.Infrastructure;
using System.Text.Json;

static void Check(bool condition, string message) { if (!condition) throw new Exception(message); }
var rows = new[] { new { Id = 3, Name = "A" }, new { Id = 1, Name = "B" }, new { Id = 2, Name = "A" } }.AsQueryable();
Check(rows.Sort("name", "asc", "Id", "Id,Name").Select(x => x.Id).SequenceEqual(new[] {2,3,1}), "Ascending sort must have stable ID tie-breaker.");
Check(rows.Sort("name", "desc", "Id", "Id,Name").Select(x => x.Id).SequenceEqual(new[] {1,2,3}), "Descending sort must precede pagination.");
Check(rows.Sort("Name); DROP TABLE users", "desc", "Id", "Id,Name").First().Id == 3, "Unknown sorts must use the whitelist fallback.");
Check(TableQuery.Page(int.MaxValue) == 100000 && TableQuery.Page(-1) == 1 && TableQuery.Size(int.MaxValue) == 100, "Bounds must prevent overflow/unbounded pages.");
using var sqlDb = new TrainingDbContext(new DbContextOptionsBuilder<TrainingDbContext>().UseMySql("server=localhost;database=unused;user=unused", new MySqlServerVersion(new Version(8,0,36))).Options);
var sql = sqlDb.Users.Where(u => u.Status == "ACTIVE").Select(u => new {u.Id, Name=u.FullName}).Sort("Name", "desc", "Id", "Id,Name").Skip(20).Take(10).ToQueryString();
Check(sql.Contains("ORDER BY") && sql.Contains("DESC") && sql.Contains("LIMIT") && sql.Contains("OFFSET"), "Sorting and pagination must translate to SQL.");
Console.WriteLine("PASS: stable global sorting, whitelist fallback, bounds, MySQL SQL translation.");
if (!args.Contains("--database")) return;
using var db = new TrainingDbContextFactory().CreateDbContext([]);
var academic = new AcademicController(db);
var auth = new AuthController(db, null!, null!);
var system = new SystemController(db, null!);
var files = new FilesController(db, null!, null!, null!, null!);
var lectures = new LecturesController(db, null!, null!);
var media = new MediaController(db, null!, Microsoft.Extensions.Logging.Abstractions.NullLogger<MediaController>.Instance);
var cases = new (string, Func<Task<IActionResult>>)[] {
 ("classes", () => academic.GetClasses(null,1,2,"studentCount","desc")),
 ("subjects", () => academic.GetSubjects(1,2,null,"unitName","asc")),
 ("units", () => academic.GetOrganizationalUnits(false,1,2,null,"childCount","desc")),
 ("users", () => auth.GetSampleUsers(1,2,null,"maxClearance","desc")),
 ("students", () => auth.GetProvisionedStudents(null,null,null,1,2,"classCode","asc")),
 ("audit", () => system.GetAuditLogs(null,null,null,1,2,50,"username","asc")),
 ("alerts", () => system.GetSecurityAlerts(1,2,null,"severity","desc")),
 ("sessions", () => system.GetUserSessions(null,1,2,null,"lastSeenAt","desc")),
 ("notifications", () => system.GetNotifications(1,1,2,null,"title","asc")),
 ("files", () => files.GetFiles(null,1,2,null,"classification","desc")),
 ("lectures", () => lectures.GetLectures(null,null,null,null,1,2,"fileCount","desc")),
 ("media", () => media.GetAll(null,null,1,2,"fileSize","desc"))
};
foreach(var (name, call) in cases) {
 var result = (OkObjectResult)await call();
 var json = JsonSerializer.SerializeToElement(result.Value);
 Check(json.GetProperty("page").GetInt32()==1 && json.GetProperty("pageSize").GetInt32()==2 && json.GetProperty("items").GetArrayLength()<=2, name+" envelope invalid");
 Console.WriteLine("PASS: "+name+" database count/sort/page");
}
var empty = (OkObjectResult)await academic.GetClasses("__no_matching_record_903908__",1,2,"name","desc");
Check(JsonSerializer.SerializeToElement(empty.Value).GetProperty("totalCount").GetInt32()==0,"Filtered total should be zero.");
var legacy=(OkObjectResult)await auth.GetSampleUsers();
Check(JsonSerializer.SerializeToElement(legacy.Value).GetArrayLength()<=100,"Legacy response must be bounded.");
Console.WriteLine("PASS: filtered totals and bounded legacy arrays.");
