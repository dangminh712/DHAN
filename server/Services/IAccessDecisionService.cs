namespace Server.Services;

public class AccessDecisionResult
{
    public bool Allowed { get; set; }
    public string Reason { get; set; } = string.Empty;
    public int StatusCode { get; set; } = 200;
}

public interface IAccessDecisionService
{
    Task<AccessDecisionResult> CanViewFileAsync(ulong userId, ulong fileId, ulong? lectureId);
    Task<AccessDecisionResult> CanDownloadFileAsync(ulong userId, ulong fileId, ulong? lectureId);
    Task<AccessDecisionResult> CanManageLectureAsync(ulong userId, ulong lectureId);
}
