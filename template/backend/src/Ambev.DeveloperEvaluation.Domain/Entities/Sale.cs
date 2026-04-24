using Ambev.DeveloperEvaluation.Domain.Common;
using Ambev.DeveloperEvaluation.Domain.ValueObjects;

namespace Ambev.DeveloperEvaluation.Domain.Entities;

public class Sale : BaseEntity
{
    public string SaleNumber { get; private set; } = string.Empty;

    public DateTime Date { get; private set; }

    public ExternalIdentity Customer { get; private set; } = new(Guid.Empty, string.Empty);

    public ExternalIdentity Branch { get; private set; } = new(Guid.Empty, string.Empty);

    public decimal TotalSaleAmount { get; private set; }

    public bool Cancelled { get; private set; }

    public ICollection<SaleItem> Items { get; private set; } = new List<SaleItem>();

    // EF Core
    private Sale() { }

    public Sale(string saleNumber, DateTime date, ExternalIdentity customer, ExternalIdentity branch, IEnumerable<SaleItem> items)
    {
        SaleNumber = saleNumber ?? string.Empty;
        Date = date;
        Customer = customer;
        Branch = branch;
        Items = items?.ToList() ?? throw new ArgumentNullException(nameof(items));

        if (Items.Count == 0)
            throw new InvalidOperationException("Sale must contain at least one item.");

        RecalculateTotals();
    }

    public void SetSaleNumber(string saleNumber)
    {
        if (string.IsNullOrWhiteSpace(saleNumber))
            throw new ArgumentException("SaleNumber is required.", nameof(saleNumber));

        SaleNumber = saleNumber;
    }

    public void Update(DateTime date, ExternalIdentity customer, ExternalIdentity branch, IEnumerable<SaleItem> items)
    {
        Date = date;
        Customer = customer;
        Branch = branch;

        var newItems = items?.ToList() ?? throw new ArgumentNullException(nameof(items));
        if (newItems.Count == 0)
            throw new InvalidOperationException("Sale must contain at least one item.");

        Items.Clear();
        foreach (var item in newItems)
            Items.Add(item);

        Cancelled = false;
        RecalculateTotals();
    }

    public void CancelSale()
    {
        Cancelled = true;
        foreach (var item in Items)
            item.Cancel();

        RecalculateTotals();
    }

    public void CancelItem(Guid itemId)
    {
        var item = Items.FirstOrDefault(i => i.Id == itemId);
        if (item is null)
            throw new InvalidOperationException("Item not found.");

        item.Cancel();
        RecalculateTotals();
    }

    public void RecalculateTotals()
    {
        if (Cancelled)
        {
            TotalSaleAmount = 0m;
            return;
        }

        foreach (var item in Items)
            item.Recalculate();

        TotalSaleAmount = Items.Sum(i => i.TotalItemAmount);
    }
}

