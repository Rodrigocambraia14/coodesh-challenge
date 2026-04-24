using Ambev.DeveloperEvaluation.Domain.Entities;
using Ambev.DeveloperEvaluation.Domain.ValueObjects;
using FluentAssertions;
using Xunit;

namespace Ambev.DeveloperEvaluation.Unit.Domain.Entities;

public class SaleItemTests
{
    [Theory(DisplayName = "Given quantity tiers When recalculating Then applies expected discount")]
    [InlineData(1, 0.00)]
    [InlineData(3, 0.00)]
    [InlineData(4, 0.10)]
    [InlineData(9, 0.10)]
    [InlineData(10, 0.20)]
    [InlineData(20, 0.20)]
    public void Recalculate_DiscountTiers_Applied(int quantity, double expectedDiscount)
    {
        var item = new SaleItem(new ExternalIdentity(Guid.NewGuid(), "Beer"), quantity, 10m);

        item.Discount.Should().Be((decimal)expectedDiscount);
        item.TotalItemAmount.Should().Be((10m * quantity) - ((10m * quantity) * (decimal)expectedDiscount));
    }

    [Fact(DisplayName = "Given quantity above 20 When creating item Then throws")]
    public void Create_QuantityAbove20_Throws()
    {
        var act = () => new SaleItem(new ExternalIdentity(Guid.NewGuid(), "Beer"), 21, 10m);
        act.Should().Throw<InvalidOperationException>();
    }

    [Fact(DisplayName = "Given cancelled item When cancelling Then totals become zero")]
    public void Cancel_SetsTotalsToZero()
    {
        var item = new SaleItem(new ExternalIdentity(Guid.NewGuid(), "Beer"), 10, 10m);
        item.TotalItemAmount.Should().BeGreaterThan(0);

        item.Cancel();

        item.Cancelled.Should().BeTrue();
        item.Discount.Should().Be(0m);
        item.TotalItemAmount.Should().Be(0m);
    }
}

