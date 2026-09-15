using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;

namespace Server.Infrastructure;

public static class TableQuery
{
    public static int Page(int? page) => Math.Clamp(page ?? 1, 1, 100000);
    public static int Size(int? size) => Math.Clamp(size ?? 20, 1, 100);

    // Only named, projected scalar fields can become SQL order expressions.
    public static IOrderedQueryable<T> Sort<T>(this IQueryable<T> query, string? sortBy, string? sortDir,
        string fallback, string allowed, string tie = "Id")
    {
        var entries = allowed.Split(',').Select(s => s.Split(':')).ToArray();
        var entry = entries.FirstOrDefault(e => e[0].Equals(sortBy, StringComparison.OrdinalIgnoreCase));
        var name = entry is null ? fallback : entry[^1];
        var descending = string.Equals(sortDir, "desc", StringComparison.OrdinalIgnoreCase);
        var parameter = Expression.Parameter(typeof(T), "row");
        IQueryable<T> Apply(IQueryable<T> source, string property, string method)
        {
            var member = Expression.PropertyOrField(parameter, property);
            var selector = Expression.Lambda(member, parameter);
            return source.Provider.CreateQuery<T>(Expression.Call(typeof(Queryable), method,
                new[] { typeof(T), member.Type }, source.Expression, Expression.Quote(selector)));
        }
        var ordered = Apply(query, name, descending ? "OrderByDescending" : "OrderBy");
        if (!name.Equals(tie, StringComparison.OrdinalIgnoreCase)) ordered = Apply(ordered, tie, "ThenBy");
        return (IOrderedQueryable<T>)ordered;
    }

    public static object Envelope<T>(IReadOnlyList<T> items, int total, int? page, int? pageSize) => new
    {
        items, totalCount = total, page = Page(page), pageSize = Size(pageSize),
        totalPages = (int)Math.Ceiling((double)total / Size(pageSize))
    };

    public static async Task<object> ResultAsync<T>(this IQueryable<T> query, int? page, int? pageSize, int legacyLimit = 100)
    {
        if (!page.HasValue) return await query.Take(Math.Clamp(legacyLimit, 1, 100)).ToListAsync();
        var total = await query.CountAsync();
        var items = await query.Skip((Page(page) - 1) * Size(pageSize)).Take(Size(pageSize)).ToListAsync();
        return Envelope(items, total, page, pageSize);
    }
}
