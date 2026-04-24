using Ambev.DeveloperEvaluation.Common.Caching;
using Ambev.DeveloperEvaluation.Domain.Enums;
using Ambev.DeveloperEvaluation.ORM;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;

namespace Ambev.DeveloperEvaluation.WebApi.Features.Dashboard;

public enum DashboardGroupBy
{
    Day,
    Week,
    Month
}

public sealed class DashboardResponse
{
    public DashboardKpis Kpis { get; set; } = new();
    public IReadOnlyList<DashboardTimeSeriesPoint> TimeSeries { get; set; } = Array.Empty<DashboardTimeSeriesPoint>();
    public IReadOnlyList<DashboardSaleValuePoint> SaleValuePoints { get; set; } = Array.Empty<DashboardSaleValuePoint>();
    public IReadOnlyList<DashboardTopProductRow> TopProducts { get; set; } = Array.Empty<DashboardTopProductRow>();
}

public sealed class DashboardKpis
{
    public int TotalSales { get; set; }
    public int CancelledSales { get; set; }
    public decimal CancelledRate { get; set; }
    public int TotalCustomers { get; set; }
    public decimal GrossRevenue { get; set; }
    public decimal NetRevenue { get; set; }
    public decimal TotalDiscountAmount { get; set; }
}

public sealed class DashboardTimeSeriesPoint
{
    public string Period { get; set; } = string.Empty;
    public int TotalSales { get; set; }
    public int CancelledSales { get; set; }
    public decimal NetRevenue { get; set; }
    public decimal DiscountAmount { get; set; }
}

public sealed class DashboardSaleValuePoint
{
    public string SaleNumber { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public decimal NetAmount { get; set; }
    public bool Cancelled { get; set; }
}

public sealed class DashboardTopProductRow
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int QuantitySold { get; set; }
    public decimal GrossAmount { get; set; }
    public decimal NetAmount { get; set; }
    public decimal DiscountAmount { get; set; }
}

[ApiController]
[Route("api/[controller]")]
public sealed class DashboardController : ControllerBase
{
    private readonly DefaultContext _db;
    private readonly ICacheService _cache;

    public DashboardController(DefaultContext db, ICacheService cache)
    {
        _db = db;
        _cache = cache;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(DashboardResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(
        [FromQuery] DateTime from,
        [FromQuery] DateTime to,
        [FromQuery] DashboardGroupBy? groupBy,
        CancellationToken cancellationToken)
    {
        if (to <= from)
            return BadRequest("'to' must be greater than 'from'.");

        var g = groupBy ?? DashboardGroupBy.Month;

        var versionKey = "dashboard:version";
        var version = await _cache.GetOrSetAsync(
            versionKey,
            _ => Task.FromResult(0L),
            ttl: TimeSpan.FromDays(7),
            cancellationToken: cancellationToken);

        var signature = $"{from:o}|{to:o}|{g}";
        var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(signature))).ToLowerInvariant();
        var cacheKey = $"dashboard:v{version}:{hash}";

        var result = await _cache.GetOrSetAsync(
            cacheKey,
            async ct => await BuildDashboardAsync(from, to, g, ct),
            ttl: TimeSpan.FromMinutes(5),
            cancellationToken: cancellationToken);

        return Ok(result);
    }

    private async Task<DashboardResponse> BuildDashboardAsync(DateTime from, DateTime to, DashboardGroupBy groupBy, CancellationToken cancellationToken)
    {
        var salesInRange = _db.Sales
            .AsNoTracking()
            .Where(s => s.Date >= from && s.Date < to);

        var totalSales = await salesInRange.CountAsync(cancellationToken);
        var cancelledSales = await salesInRange.CountAsync(s => s.Cancelled, cancellationToken);

        var totalCustomers = await _db.Users
            .AsNoTracking()
            .CountAsync(u => u.Role == UserRole.Customer, cancellationToken);

        var itemsInRange = _db.SaleItems
            .AsNoTracking()
            .Where(i => !i.Cancelled)
            .Join(
                salesInRange.Where(s => !s.Cancelled),
                i => EF.Property<Guid>(i, "SaleId"),
                s => s.Id,
                (i, s) => new { Item = i, Sale = s });

        var grossRevenue = await itemsInRange.SumAsync(x => x.Item.UnitPrice * x.Item.Quantity, cancellationToken);
        var netRevenue = await itemsInRange.SumAsync(x => x.Item.TotalItemAmount, cancellationToken);
        var totalDiscountAmount = grossRevenue - netRevenue;

        var timeSeries = await BuildTimeSeriesAsync(salesInRange, groupBy, cancellationToken);

        var saleValuePoints = await salesInRange
            .OrderByDescending(s => s.Date)
            .Select(s => new DashboardSaleValuePoint
            {
                SaleNumber = s.SaleNumber,
                Date = s.Date,
                NetAmount = s.TotalSaleAmount,
                Cancelled = s.Cancelled
            })
            .Take(400)
            .ToListAsync(cancellationToken);

        var topProducts = await itemsInRange
            .GroupBy(x => new { x.Item.Product.ExternalId, x.Item.Product.Description })
            .Select(g => new DashboardTopProductRow
            {
                ProductId = g.Key.ExternalId,
                ProductName = g.Key.Description,
                QuantitySold = g.Sum(x => x.Item.Quantity),
                GrossAmount = g.Sum(x => x.Item.UnitPrice * x.Item.Quantity),
                NetAmount = g.Sum(x => x.Item.TotalItemAmount),
                DiscountAmount = g.Sum(x => (x.Item.UnitPrice * x.Item.Quantity) - x.Item.TotalItemAmount)
            })
            .OrderByDescending(r => r.QuantitySold)
            .ThenByDescending(r => r.NetAmount)
            .Take(10)
            .ToListAsync(cancellationToken);

        return new DashboardResponse
        {
            Kpis = new DashboardKpis
            {
                TotalSales = totalSales,
                CancelledSales = cancelledSales,
                CancelledRate = totalSales == 0 ? 0m : Math.Round((decimal)cancelledSales / totalSales, 4),
                TotalCustomers = totalCustomers,
                GrossRevenue = grossRevenue,
                NetRevenue = netRevenue,
                TotalDiscountAmount = totalDiscountAmount
            },
            TimeSeries = timeSeries,
            SaleValuePoints = saleValuePoints,
            TopProducts = topProducts
        };
    }

    private static async Task<IReadOnlyList<DashboardTimeSeriesPoint>> BuildTimeSeriesAsync(
        IQueryable<Domain.Entities.Sale> salesInRange,
        DashboardGroupBy groupBy,
        CancellationToken cancellationToken)
    {
        if (groupBy == DashboardGroupBy.Day)
        {
            return await salesInRange
                .GroupBy(s => new { s.Date.Year, s.Date.Month, s.Date.Day })
                .Select(g => new DashboardTimeSeriesPoint
                {
                    Period = $"{g.Key.Year:D4}-{g.Key.Month:D2}-{g.Key.Day:D2}",
                    TotalSales = g.Count(),
                    CancelledSales = g.Count(s => s.Cancelled),
                    NetRevenue = g.Sum(s => s.TotalSaleAmount),
                    DiscountAmount = 0m
                })
                .OrderBy(p => p.Period)
                .ToListAsync(cancellationToken);
        }

        if (groupBy == DashboardGroupBy.Month)
        {
            return await salesInRange
                .GroupBy(s => new { s.Date.Year, s.Date.Month })
                .Select(g => new DashboardTimeSeriesPoint
                {
                    Period = $"{g.Key.Year:D4}-{g.Key.Month:D2}",
                    TotalSales = g.Count(),
                    CancelledSales = g.Count(s => s.Cancelled),
                    NetRevenue = g.Sum(s => s.TotalSaleAmount),
                    DiscountAmount = 0m
                })
                .OrderBy(p => p.Period)
                .ToListAsync(cancellationToken);
        }

        // Week: compute in-memory due to translation variability across providers.
        var sales = await salesInRange
            .Select(s => new { s.Date, s.Cancelled, s.TotalSaleAmount })
            .ToListAsync(cancellationToken);

        static DateTime WeekStart(DateTime dt)
        {
            var d = dt.Date;
            var dayOfWeek = (int)d.DayOfWeek; // Sunday=0
            var mondayBased = dayOfWeek == 0 ? 6 : dayOfWeek - 1;
            return d.AddDays(-mondayBased);
        }

        return sales
            .GroupBy(s => WeekStart(s.Date))
            .OrderBy(g => g.Key)
            .Select(g => new DashboardTimeSeriesPoint
            {
                Period = $"{g.Key:yyyy-MM-dd}",
                TotalSales = g.Count(),
                CancelledSales = g.Count(x => x.Cancelled),
                NetRevenue = g.Sum(x => x.TotalSaleAmount),
                DiscountAmount = 0m
            })
            .ToList();
    }
}

