using Ambev.DeveloperEvaluation.Application.Sales.Common;
using MediatR;

namespace Ambev.DeveloperEvaluation.Application.Sales.ListSales;

public class ListSalesQuery : IRequest<ListSalesResult>
{
    public int Page { get; set; } = 1;
    public int Size { get; set; } = 10;

    public string? Order { get; set; }

    public Dictionary<string, string> Filters { get; set; } = new(StringComparer.OrdinalIgnoreCase);
}

public class ListSalesResult
{
    public IReadOnlyList<SaleDto> Data { get; set; } = Array.Empty<SaleDto>();
    public int TotalItems { get; set; }
    public int CurrentPage { get; set; }
    public int TotalPages { get; set; }
}

