using Server.Models;

namespace Server.Services;

public interface IMediaService
{
    string StorageMode { get; }
    Task<List<MediaFile>> GetAllAsync(string? category, string? search);
    Task<MediaFile?> GetByIdAsync(int id);
    Task<MediaFile> AddAsync(MediaFile mediaFile);
    Task<bool> DeleteAsync(int id);
}
