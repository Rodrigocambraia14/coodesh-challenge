using Ambev.DeveloperEvaluation.Domain.ValueObjects;

namespace Ambev.DeveloperEvaluation.Domain.Entities;

public class SaleItem
{
    public Guid Id { get; set; }

    public ExternalIdentity Product { get; private set; } = new(Guid.Empty, string.Empty);

    public int Quantity { get; private set; }

    public decimal UnitPrice { get; private set; }

    /// <summary>
    /// Discount percentage in range [0, 1]. Example: 0.10m for 10%.
    /// </summary>
    public decimal Discount { get; private set; }

    public decimal TotalItemAmount { get; private set; }

    public bool Cancelled { get; private set; }

    // EF Core
    private SaleItem() { }

    public SaleItem(ExternalIdentity product, int quantity, decimal unitPrice)
    {
        Product = product;
        SetQuantity(quantity);
        SetUnitPrice(unitPrice);
        Recalculate();
    }

    public void SetQuantity(int quantity)
    {
        if (quantity <= 0)
            throw new ArgumentOutOfRangeException(nameof(quantity), "Quantity must be greater than 0.");

        if (quantity > 20)
            throw new InvalidOperationException("It's not possible to sell above 20 identical items.");

        Quantity = quantity;
    }

    public void SetUnitPrice(decimal unitPrice)
    {
        if (unitPrice < 0)
            throw new ArgumentOutOfRangeException(nameof(unitPrice), "UnitPrice must be non-negative.");

        UnitPrice = unitPrice;
    }

    public void Cancel()
    {
        Cancelled = true;
        Recalculate();
    }

    public void Reinstate()
    {
        Cancelled = false;
        Recalculate();
    }

    public void Recalculate()
    {
        if (Cancelled)
        {
            Discount = 0m;
            TotalItemAmount = 0m;
            return;
        }

        Discount = Quantity switch
        {
            < 4 => 0m,
            >= 10 and <= 20 => 0.20m,
            _ => 0.10m // desconto padrão entre 4 e 9 unidades
        };

        var gross = UnitPrice * Quantity;
        TotalItemAmount = gross - (gross * Discount);
    }
}

