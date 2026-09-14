using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Migrations.Operations;
using MySqlConnector;
using Server.Data;

using var db = new TrainingDbContextFactory().CreateDbContext([]);
var mode = args.FirstOrDefault() ?? "check-baseline";
if (mode == "smoke-tests") await LearningSmokeTests.Run(db, args.Length > 1 ? args[1] : "http://localhost:5011");
else if (mode is "check-baseline" or "adopt-baseline")
{
    var migrations = db.GetService<IMigrationsAssembly>();
    var baseline = migrations.Migrations.First(m => m.Key.EndsWith("_TrainingBaseline"));
    var migration = migrations.CreateMigration(baseline.Value, db.Database.ProviderName!);
    await db.Database.OpenConnectionAsync();
    var connection = (MySqlConnection)db.Database.GetDbConnection();
    var errors = new List<string>();
    foreach (var table in migration.UpOperations.OfType<CreateTableOperation>())
    {
        using var command = connection.CreateCommand();
        command.CommandText = "SELECT COLUMN_NAME, DATA_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@table";
        command.Parameters.AddWithValue("@table", table.Name);
        var columns = new Dictionary<string, string>();
        await using (var reader = await command.ExecuteReaderAsync())
            while (await reader.ReadAsync()) columns[reader.GetString(0)] = reader.GetString(1);
        foreach (var column in table.Columns)
        {
            if (!columns.TryGetValue(column.Name, out var actual)) { errors.Add($"Missing {table.Name}.{column.Name}"); continue; }
            var expected = column.ColumnType?.Split('(', ' ')[0];
            var strings = new[] { "varchar", "longtext", "text", "char", "enum", "json" };
            if (actual != expected && !(strings.Contains(actual) && strings.Contains(expected))) errors.Add($"Type {table.Name}.{column.Name}: {actual} / {expected}");
        }
    }
    if (errors.Count > 0) throw new InvalidOperationException(string.Join(Environment.NewLine, errors));
    Console.WriteLine("Baseline compatibility: all expected tables/columns and type families exist. Existing lengths, defaults and index names are retained.");
    if (mode == "adopt-baseline")
    {
        await db.Database.ExecuteSqlRawAsync("CREATE TABLE IF NOT EXISTS `__EFMigrationsHistory` (`MigrationId` varchar(150) NOT NULL, `ProductVersion` varchar(32) NOT NULL, PRIMARY KEY (`MigrationId`)) CHARACTER SET utf8mb4");
        await db.Database.ExecuteSqlInterpolatedAsync($"INSERT IGNORE INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`) VALUES ({baseline.Key}, {"8.0.13"})");
        Console.WriteLine("Existing baseline recorded; no existing table was recreated or altered.");
    }
}
else if (mode == "integrity")
{
    ulong after = 0;
    int missing = 0, checkedCount = 0;
    var storage = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "server"));
    while (true)
    {
        var files = await db.Files.AsNoTracking().Where(f => f.Id > after).OrderBy(f => f.Id).Take(100)
            .Select(f => new { f.Id, f.StoragePath, f.FileSize }).ToListAsync();
        if (files.Count == 0) break;
        foreach (var f in files)
        {
            var path = Path.GetFullPath(Path.Combine(storage, f.StoragePath));
            if (!path.StartsWith(storage + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase) || !File.Exists(path) || (ulong)new FileInfo(path).Length != f.FileSize)
            { missing++; Console.WriteLine($"Missing/size mismatch: file {f.Id}"); }
            checkedCount++;
        }
        after = files[^1].Id;
    }
    Console.WriteLine($"Checked {checkedCount}; missing/mismatch {missing}");
}
else if (mode is "retention-preview" or "retention-apply")
{
    var days = args.Length > 1 ? int.Parse(args[1]) : 180;
    if (days < 30) throw new ArgumentException("Minimum retention is 30 days.");
    var cutoff = DateTime.UtcNow.AddDays(-days);
    var audits = db.AuditLogs.Where(l => l.CreatedAt < cutoff);
    var downloads = db.DownloadLogs.Where(l => l.DownloadedAt < cutoff);
    Console.WriteLine($"Eligible: audit={await audits.CountAsync()}, downloads={await downloads.CountAsync()}; cutoff={cutoff:O}");
    if (mode == "retention-apply")
    {
        var auditIds = await audits.OrderBy(l => l.CreatedAt).Take(500).Select(l => l.Id).ToListAsync();
        var downloadIds = await downloads.OrderBy(l => l.DownloadedAt).Take(500).Select(l => l.Id).ToListAsync();
        Console.WriteLine($"Deleted audit={await db.AuditLogs.Where(l => auditIds.Contains(l.Id)).ExecuteDeleteAsync()}, downloads={await db.DownloadLogs.Where(l => downloadIds.Contains(l.Id)).ExecuteDeleteAsync()}");
    }
}
else throw new ArgumentException("Commands: check-baseline, adopt-baseline, integrity, retention-preview [days], retention-apply [days]");
