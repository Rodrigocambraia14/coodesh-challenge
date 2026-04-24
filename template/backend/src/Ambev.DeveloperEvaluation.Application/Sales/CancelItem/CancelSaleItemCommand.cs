using MediatR;

namespace Ambev.DeveloperEvaluation.Application.Sales.CancelItem;

public record CancelSaleItemCommand(Guid SaleId, Guid ItemId) : IRequest;

