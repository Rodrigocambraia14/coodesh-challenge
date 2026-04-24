namespace Ambev.DeveloperEvaluation.WebApi.Features.Sales.PreviewSale;

public enum PreviewItemStatus
{
    Ok = 0,
    Blocked = 1
}

public sealed class PreviewReason
{
    public string Code { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}

public sealed class PreviewSaleSummary
{
    public decimal GrossTotal { get; set; }
    public decimal NetTotal { get; set; }
    public decimal DiscountTotal { get; set; }
}

public sealed class PreviewSaleItem
{
    public Guid ProductId { get; set; }
    public string ProductDescription { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }

    public decimal GrossAmount { get; set; }
    public decimal DiscountRate { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal NetAmount { get; set; }

    public PreviewItemStatus Status { get; set; }
    public List<PreviewReason> Reasons { get; set; } = new();
}

public sealed class PreviewSaleResponse
{
    public bool IsBlocked { get; set; }
    public List<PreviewReason> Reasons { get; set; } = new();
    public List<PreviewSaleItem> Items { get; set; } = new();
    public PreviewSaleSummary Summary { get; set; } = new();
}

