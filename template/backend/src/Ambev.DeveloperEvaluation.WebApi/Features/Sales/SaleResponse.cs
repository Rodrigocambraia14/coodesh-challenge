namespace Ambev.DeveloperEvaluation.WebApi.Features.Sales;

public class SaleResponse
{
    public Guid Id { get; set; }
    public string SaleNumber { get; set; } = string.Empty;
    public DateTime Date { get; set; }

    public Guid CustomerId { get; set; }
    public string CustomerDescription { get; set; } = string.Empty;

    public Guid BranchId { get; set; }
    public string BranchDescription { get; set; } = string.Empty;

    public decimal TotalSaleAmount { get; set; }
    public bool Cancelled { get; set; }

    public List<SaleItemResponse> Items { get; set; } = new();
}

public class SaleItemResponse
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductDescription { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Discount { get; set; }
    public decimal TotalItemAmount { get; set; }
    public bool Cancelled { get; set; }
}

