using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;

namespace Server.Services;

public class MySqlMediaService : IMediaService
{
    private readonly IServiceScopeFactory _scopeFactory;

    public string StorageMode => "MySQL Server (Database: media_intranet_db)";

    public MySqlMediaService(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    public async Task<List<MediaFile>> GetAllAsync(string? category, string? search)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var query = context.MediaFiles.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(category) && category.ToLower() != "all")
        {
            query = query.Where(m => m.Category.ToLower() == category.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(m => m.OriginalFileName.Contains(search));
        }

        return await query.OrderByDescending(m => m.CreatedAt).ToListAsync();
    }

    public async Task<MediaFile?> GetByIdAsync(int id)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return await context.MediaFiles.FindAsync(id);
    }

    public async Task<MediaFile> AddAsync(MediaFile mediaFile)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        context.MediaFiles.Add(mediaFile);
        await context.SaveChangesAsync();
        return mediaFile;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var item = await context.MediaFiles.FindAsync(id);
        if (item == null) return false;

        context.MediaFiles.Remove(item);
        await context.SaveChangesAsync();
        return true;
    }
}
