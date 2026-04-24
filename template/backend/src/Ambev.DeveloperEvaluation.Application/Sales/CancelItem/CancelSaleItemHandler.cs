using Ambev.DeveloperEvaluation.Application.Security;
using Ambev.DeveloperEvaluation.Domain.Repositories;
using Ambev.DeveloperEvaluation.Common.Messaging;
using Ambev.DeveloperEvaluation.Domain.Events;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Ambev.DeveloperEvaluation.Application.Sales.CancelItem;

public class CancelSaleItemHandler : IRequestHandler<CancelSaleItemCommand>
{
    private readonly ISaleRepository _saleRepository;
    private readonly ILogger<CancelSaleItemHandler> _logger;
    private readonly IIntegrationEventPublisher _publisher;
    private readonly ICurrentUser _currentUser;

    public CancelSaleItemHandler(
        ISaleRepository saleRepository,
        ILogger<CancelSaleItemHandler> logger,
        IIntegrationEventPublisher publisher,
        ICurrentUser currentUser)
    {
        _saleRepository = saleRepository;
        _logger = logger;
        _publisher = publisher;
        _currentUser = currentUser;
    }

    public async Task Handle(CancelSaleItemCommand request, CancellationToken cancellationToken)
    {
        var validator = new CancelSaleItemValidator();
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
            throw new ValidationException(validationResult.Errors);

        var sale = await _saleRepository.GetByIdAsync(request.SaleId, cancellationToken);
        if (sale is null)
            throw new KeyNotFoundException($"Sale with ID {request.SaleId} not found");

        if (_currentUser.IsCustomer && _currentUser.UserId is { } uid && sale.Customer.ExternalId != uid)
            throw new KeyNotFoundException($"Sale with ID {request.SaleId} not found");

        sale.CancelItem(request.ItemId);
        await _saleRepository.UpdateAsync(sale, cancellationToken);

        _logger.LogInformation("Event: ItemCancelled {SaleId} {ItemId}", sale.Id, request.ItemId);

        await _publisher.PublishAsync(
            eventType: nameof(ItemCancelledEvent),
            payload: new ItemCancelledEvent(sale, sale.Items.First(i => i.Id == request.ItemId)),
            applicationProperties: new Dictionary<string, object?>
            {
                ["saleId"] = sale.Id,
                ["saleNumber"] = sale.SaleNumber,
                ["itemId"] = request.ItemId
            },
            cancellationToken: cancellationToken);
    }
}

