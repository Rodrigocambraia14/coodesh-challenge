namespace Ambev.DeveloperEvaluation.WebApi.Features.Sales.ListSales;

/// <summary>
/// Response model for the Sales listing endpoint.
/// </summary>
public sealed class ListSalesResponse
{
    /// <summary>
    /// Sales data for the current page.
    /// </summary>
    public IReadOnlyList<Ambev.DeveloperEvaluation.WebApi.Features.Sales.SaleResponse> Data { get; set; }
        = Array.Empty<Ambev.DeveloperEvaluation.WebApi.Features.Sales.SaleResponse>();

    /// <summary>
    /// Total number of items matching the applied filters.
    /// </summary>
    public int TotalItems { get; set; }

    /// <summary>
    /// Current page number (1-based).
    /// </summary>
    public int CurrentPage { get; set; }

    /// <summary>
    /// Total number of pages based on <see cref="TotalItems"/> and the page size.
    /// </summary>
    public int TotalPages { get; set; }
}

