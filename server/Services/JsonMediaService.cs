using System.Text.Json;
using Server.Models;

namespace Server.Services;

public class JsonMediaService : IMediaService
{
    private readonly string _metadataFilePath;
    private readonly SemaphoreSlim _lock = new(1, 1);
    private static readonly JsonSerializerOptions _jsonOptions = new() { WriteIndented = true };

    public string StorageMode => "Local Offline Storage (metadata.json)";

    public JsonMediaService(IWebHostEnvironment environment, IConfiguration configuration)
    {
        var configuredPath = configuration["Storage:Path"] ?? "Storage";
        var storagePath = Path.IsPathRooted(configuredPath)
            ? configuredPath
            : Path.Combine(environment.ContentRootPath, configuredPath);

        if (!Directory.Exists(storagePath))
        {
            Directory.CreateDirectory(storagePath);
        }

        _metadataFilePath = Path.Combine(storagePath, "metadata.json");

        if (!File.Exists(_metadataFilePath))
        {
            File.WriteAllText(_metadataFilePath, "[]");
        }
    }

    private async Task<List<MediaFile>> ReadAllAsync()
    {
        if (!File.Exists(_metadataFilePath)) return new List<MediaFile>();
        try
        {
            var json = await File.ReadAllTextAsync(_metadataFilePath);
            return JsonSerializer.Deserialize<List<MediaFile>>(json, _jsonOptions) ?? new List<MediaFile>();
        }
        catch
        {
            return new List<MediaFile>();
        }
    }

    private async Task SaveAllAsync(List<MediaFile> list)
    {
        var json = JsonSerializer.Serialize(list, _jsonOptions);
        await File.WriteAllTextAsync(_metadataFilePath, json);
    }

    public async Task<List<MediaFile>> GetAllAsync(string? category, string? search)
    {
        await _lock.WaitAsync();
        try
        {
            var files = await ReadAllAsync();
            var query = files.AsQueryable();

            if (!string.IsNullOrWhiteSpace(category) && category.ToLower() != "all")
            {
                query = query.Where(m => m.Category.Equals(category, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(m => m.OriginalFileName.Contains(search, StringComparison.OrdinalIgnoreCase));
            }

            return query.OrderByDescending(m => m.CreatedAt).ToList();
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<MediaFile?> GetByIdAsync(int id)
    {
        await _lock.WaitAsync();
        try
        {
            var files = await ReadAllAsync();
            return files.FirstOrDefault(f => f.Id == id);
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<MediaFile> AddAsync(MediaFile mediaFile)
    {
        await _lock.WaitAsync();
        try
        {
            var files = await ReadAllAsync();
            var nextId = files.Count > 0 ? files.Max(f => f.Id) + 1 : 1;
            mediaFile.Id = nextId;
            files.Add(mediaFile);
            await SaveAllAsync(files);
            return mediaFile;
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<bool> DeleteAsync(int id)
    {
        await _lock.WaitAsync();
        try
        {
            var files = await ReadAllAsync();
            var item = files.FirstOrDefault(f => f.Id == id);
            if (item == null) return false;

            files.Remove(item);
            await SaveAllAsync(files);
            return true;
        }
        finally
        {
            _lock.Release();
        }
    }
}
