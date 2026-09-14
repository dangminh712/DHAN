using System.Data.Common;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;

namespace Server.Infrastructure;

public class ApiExceptionMiddleware(RequestDelegate next, ILogger<ApiExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try { await next(context); }
        catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested) { }
        catch (Exception ex) when (!context.Response.HasStarted)
        {
            var database = ex is DbException or DbUpdateException;
            var conflict = ex is DbUpdateException && ex.InnerException is MySqlConnector.MySqlException { Number: 1062 };
            logger.LogError("{ErrorType}: request failed ({TraceId})", ex.GetType().Name, context.TraceIdentifier);
            context.Response.StatusCode = conflict ? 409 : database ? 503 : 500;
            await context.Response.WriteAsJsonAsync(new { success = false,
                code = conflict ? "UPDATE_CONFLICT" : database ? "DATABASE_ERROR" : "SERVER_ERROR",
                message = conflict ? "Dữ liệu vừa được cập nhật. Vui lòng thử lại." : database ? "Không thể truy cập MySQL." : "Không thể xử lý yêu cầu." });
        }
    }
}

public class ApiErrorFilter : IResultFilter
{
    public void OnResultExecuting(ResultExecutingContext context)
    {
        if (context.Result is ObjectResult { StatusCode: >= 400 } result)
        {
            if (result.Value?.GetType().GetProperty("code") != null) return;
            var status = result.StatusCode.Value;
            var message = status >= 500 ? "Không thể xử lý yêu cầu." : result.Value?.GetType().GetProperty("message")?.GetValue(result.Value)?.ToString() ?? "Yêu cầu không hợp lệ.";
            result.Value = new { success = false, message, code = Code(status) };
        }
        else if (context.Result is StatusCodeResult { StatusCode: >= 400 } empty)
            context.Result = new ObjectResult(new { success = false, message = "Không thể xử lý yêu cầu.", code = Code(empty.StatusCode) }) { StatusCode = empty.StatusCode };
    }
    public void OnResultExecuted(ResultExecutedContext context) { }
    private static string Code(int status) => status switch { 400 => "VALIDATION_ERROR", 401 => "SESSION_REQUIRED", 403 => "ACCESS_DENIED", 404 => "NOT_FOUND", 416 => "INVALID_RANGE", >= 500 => "SERVER_ERROR", _ => "REQUEST_ERROR" };
}
