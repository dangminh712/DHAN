using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Server.Data;

public class TrainingDbContextFactory : IDesignTimeDbContextFactory<TrainingDbContext>
{
    public TrainingDbContext CreateDbContext(string[] args)
    {
        var dir = File.Exists("appsettings.json") ? Directory.GetCurrentDirectory() : Path.Combine(Directory.GetCurrentDirectory(), "server");
        var config = new ConfigurationBuilder().SetBasePath(dir).AddJsonFile("appsettings.json").AddEnvironmentVariables().Build();
        var options = new DbContextOptionsBuilder<TrainingDbContext>().UseMySql(
            config.GetConnectionString("DefaultConnection"), new MySqlServerVersion(new Version(8, 0, 36))).Options;
        return new TrainingDbContext(options);
    }
}
