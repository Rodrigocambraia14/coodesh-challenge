using Ambev.DeveloperEvaluation.Domain.Entities;
using Ambev.DeveloperEvaluation.Domain.ValueObjects;
using FluentAssertions;
using Xunit;

namespace Ambev.DeveloperEvaluation.Unit.Domain.Entities;

public class SaleTests
{
    [Fact(DisplayName = "Given sale with items When created Then totals are calculated from items")]
    public void Create_CalculatesTotalSaleAmount()
    {
        var items = new[]
        {
            new SaleItem(new ExternalIdentity(Guid.NewGuid(), "Beer"), 4, 10m),  // 10% => 36
            new SaleItem(new ExternalIdentity(Guid.NewGuid(), "Soda"), 3, 5m)    // 0% => 15
        };

        var sale = new Sale(
            saleNumber: "S-TEST",
            date: DateTime.UtcNow,
            customer: new ExternalIdentity(Guid.NewGuid(), "Customer A"),
            branch: new ExternalIdentity(Guid.NewGuid(), "Branch X"),
            items: items);

        sale.TotalSaleAmount.Should().Be(51m);
    }

    [Fact(DisplayName = "Given sale When cancelled Then all totals become zero")]
    public void CancelSale_ZeroesTotalsAndItems()
    {
        var item = new SaleItem(new ExternalIdentity(Guid.NewGuid(), "Beer"), 10, 10m);
        var sale = new Sale(
            saleNumber: "S-TEST",
            date: DateTime.UtcNow,
            customer: new ExternalIdentity(Guid.NewGuid(), "Customer A"),
            branch: new ExternalIdentity(Guid.NewGuid(), "Branch X"),
            items: new[] { item });

        sale.TotalSaleAmount.Should().BeGreaterThan(0m);

        sale.CancelSale();

        sale.Cancelled.Should().BeTrue();
        sale.TotalSaleAmount.Should().Be(0m);
        sale.Items.All(i => i.Cancelled).Should().BeTrue();
    }
}

