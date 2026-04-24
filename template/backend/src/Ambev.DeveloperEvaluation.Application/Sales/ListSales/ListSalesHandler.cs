using Ambev.DeveloperEvaluation.Application.Sales.Common;
using Ambev.DeveloperEvaluation.Application.Security;
using Ambev.DeveloperEvaluation.Domain.Repositories;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ambev.DeveloperEvaluation.Application.Sales.ListSales;

public class ListSalesHandler : IRequestHandler<ListSalesQuery, ListSalesResult>
{
    private readonly ISaleRepository _saleRepository;
    private readonly IMapper _mapper;
    private readonly ICurrentUser _currentUser;

    public ListSalesHandler(ISaleRepository saleRepository, IMapper mapper, ICurrentUser currentUser)
    {
        _saleRepository = saleRepository;
        _mapper = mapper;
        _currentUser = currentUser;
    }

    public async Task<ListSalesResult> Handle(ListSalesQuery request, CancellationToken cancellationToken)
    {
        var page = request.Page <= 0 ? 1 : request.Page;
        var size = request.Size <= 0 ? 10 : request.Size;

        var query = _saleRepository.Query()
            .AsNoTracking()
            .Include(s => s.Items)
            .AsQueryable();

        if (_currentUser.IsCustomer && _currentUser.UserId is { } customerId)
            query = query.Where(s => s.Customer.ExternalId == customerId);

        query = ApplyFilters(query, request.Filters);
        query = ApplyOrdering(query, request.Order);

        var totalItems = await query.CountAsync(cancellationToken);
        var totalPages = (int)Math.Ceiling(totalItems / (double)size);

        var items = await query
            .Skip((page - 1) * size)
            .Take(size)
            .ProjectTo<SaleDto>(_mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);

        return new ListSalesResult
        {
            Data = items,
            TotalItems = totalItems,
            CurrentPage = page,
            TotalPages = totalPages
        };
    }

    private static IQueryable<Domain.Entities.Sale> ApplyFilters(
        IQueryable<Domain.Entities.Sale> query,
        Dictionary<string, string> filters)
    {
        foreach (var (key, rawValue) in filters)
        {
            if (string.IsNullOrWhiteSpace(rawValue))
                continue;

            var value = rawValue.Trim();

            switch (key.ToLowerInvariant())
            {
                case "salenumber":
                    query = ApplyString(query, s => s.SaleNumber, value);
                    break;
                case "customerdescription":
                    query = ApplyString(query, s => s.Customer.Description, value);
                    break;
                case "branchdescription":
                    query = ApplyString(query, s => s.Branch.Description, value);
                    break;
                case "cancelled":
                    if (bool.TryParse(value, out var cancelled))
                        query = query.Where(s => s.Cancelled == cancelled);
                    break;
                case "_mindate":
                    if (DateTime.TryParse(value, out var minDate))
                        query = query.Where(s => s.Date >= minDate);
                    break;
                case "_maxdate":
                    if (DateTime.TryParse(value, out var maxDate))
                        query = query.Where(s => s.Date <= maxDate);
                    break;
                case "_mintotalsaleamount":
                    if (decimal.TryParse(value, out var minTotal))
                        query = query.Where(s => s.TotalSaleAmount >= minTotal);
                    break;
                case "_maxtotalsaleamount":
                    if (decimal.TryParse(value, out var maxTotal))
                        query = query.Where(s => s.TotalSaleAmount <= maxTotal);
                    break;
            }
        }

        return query;
    }

    private static IQueryable<Domain.Entities.Sale> ApplyString(
        IQueryable<Domain.Entities.Sale> query,
        System.Linq.Expressions.Expression<Func<Domain.Entities.Sale, string>> selector,
        string value)
    {
        var hasPrefix = value.StartsWith('*');
        var hasSuffix = value.EndsWith('*');
        var needle = value.Trim('*');

        if (string.IsNullOrEmpty(needle))
            return query;

        if (hasPrefix && hasSuffix)
            return query.Where(BuildLike(selector, $"%{needle}%"));
        if (hasPrefix)
            return query.Where(BuildLike(selector, $"%{needle}"));
        if (hasSuffix)
            return query.Where(BuildLike(selector, $"{needle}%"));

        return query.Where(BuildEquals(selector, needle));
    }

    private static System.Linq.Expressions.Expression<Func<Domain.Entities.Sale, bool>> BuildEquals(
        System.Linq.Expressions.Expression<Func<Domain.Entities.Sale, string>> selector,
        string value)
    {
        var param = selector.Parameters[0];
        var body = System.Linq.Expressions.Expression.Equal(
            selector.Body,
            System.Linq.Expressions.Expression.Constant(value));
        return System.Linq.Expressions.Expression.Lambda<Func<Domain.Entities.Sale, bool>>(body, param);
    }

    private static System.Linq.Expressions.Expression<Func<Domain.Entities.Sale, bool>> BuildLike(
        System.Linq.Expressions.Expression<Func<Domain.Entities.Sale, string>> selector,
        string pattern)
    {
        var param = selector.Parameters[0];
        var efFunctions = System.Linq.Expressions.Expression.Property(null, typeof(EF), nameof(EF.Functions));

        var likeMethod = typeof(DbFunctionsExtensions).GetMethod(
            nameof(DbFunctionsExtensions.Like),
            new[] { typeof(DbFunctions), typeof(string), typeof(string) });

        var body = System.Linq.Expressions.Expression.Call(
            likeMethod!,
            efFunctions,
            selector.Body,
            System.Linq.Expressions.Expression.Constant(pattern));

        return System.Linq.Expressions.Expression.Lambda<Func<Domain.Entities.Sale, bool>>(body, param);
    }

    private static IQueryable<Domain.Entities.Sale> ApplyOrdering(IQueryable<Domain.Entities.Sale> query, string? order)
    {
        if (string.IsNullOrWhiteSpace(order))
            return query.OrderBy(s => s.Date).ThenBy(s => s.SaleNumber);

        // Supports: "field desc, other asc"
        var parts = order.Trim().Trim('"').Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        IOrderedQueryable<Domain.Entities.Sale>? ordered = null;

        foreach (var part in parts)
        {
            var tokens = part.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            var field = tokens[0].ToLowerInvariant();
            var desc = tokens.Length > 1 && tokens[1].Equals("desc", StringComparison.OrdinalIgnoreCase);

            ordered = (ordered, field, desc) switch
            {
                (null, "date", false) => query.OrderBy(s => s.Date),
                (null, "date", true) => query.OrderByDescending(s => s.Date),
                (null, "salenumber", false) => query.OrderBy(s => s.SaleNumber),
                (null, "salenumber", true) => query.OrderByDescending(s => s.SaleNumber),
                (null, "totalsaleamount", false) => query.OrderBy(s => s.TotalSaleAmount),
                (null, "totalsaleamount", true) => query.OrderByDescending(s => s.TotalSaleAmount),
                (null, "customerdescription", false) => query.OrderBy(s => s.Customer.Description),
                (null, "customerdescription", true) => query.OrderByDescending(s => s.Customer.Description),
                (null, "branchdescription", false) => query.OrderBy(s => s.Branch.Description),
                (null, "branchdescription", true) => query.OrderByDescending(s => s.Branch.Description),

                (not null, "date", false) => ordered.ThenBy(s => s.Date),
                (not null, "date", true) => ordered.ThenByDescending(s => s.Date),
                (not null, "salenumber", false) => ordered.ThenBy(s => s.SaleNumber),
                (not null, "salenumber", true) => ordered.ThenByDescending(s => s.SaleNumber),
                (not null, "totalsaleamount", false) => ordered.ThenBy(s => s.TotalSaleAmount),
                (not null, "totalsaleamount", true) => ordered.ThenByDescending(s => s.TotalSaleAmount),
                (not null, "customerdescription", false) => ordered.ThenBy(s => s.Customer.Description),
                (not null, "customerdescription", true) => ordered.ThenByDescending(s => s.Customer.Description),
                (not null, "branchdescription", false) => ordered.ThenBy(s => s.Branch.Description),
                (not null, "branchdescription", true) => ordered.ThenByDescending(s => s.Branch.Description),

                _ => ordered
            };
        }

        return ordered ?? query.OrderBy(s => s.Date).ThenBy(s => s.SaleNumber);
    }
}

