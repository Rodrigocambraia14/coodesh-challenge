using Ambev.DeveloperEvaluation.WebApi.Features.Sales.CreateSale;
using FluentValidation;

namespace Ambev.DeveloperEvaluation.WebApi.Features.Sales.PreviewSale;

/// <summary>
/// Validator used for preview only. It allows quantities above 20 so the API can
/// return blocked items + discount explanations instead of failing validation.
/// </summary>
public sealed class PreviewSaleRequestValidator : AbstractValidator<CreateSaleRequest>
{
    public PreviewSaleRequestValidator()
    {
        RuleFor(x => x.Date).NotEmpty();
        RuleFor(x => x.CustomerId).NotEmpty();
        RuleFor(x => x.CustomerDescription).NotEmpty().MaximumLength(200);
        RuleFor(x => x.BranchId).NotEmpty();
        RuleFor(x => x.BranchDescription).NotEmpty().MaximumLength(200);

        RuleFor(x => x.Items).NotNull().Must(i => i.Count > 0).WithMessage("Sale must contain at least one item.");
        RuleForEach(x => x.Items).SetValidator(new PreviewSaleItemRequestValidator());
    }
}

public sealed class PreviewSaleItemRequestValidator : AbstractValidator<CreateSaleItemRequest>
{
    public PreviewSaleItemRequestValidator()
    {
        RuleFor(x => x.ProductId).NotEmpty();
        RuleFor(x => x.ProductDescription).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Quantity).GreaterThan(0); // no <=20 here
        RuleFor(x => x.UnitPrice).GreaterThanOrEqualTo(0);
    }
}

