using Ambev.DeveloperEvaluation.Application.Security;
using Ambev.DeveloperEvaluation.Domain.Repositories;
using Ambev.DeveloperEvaluation.Common.Messaging;
using Ambev.DeveloperEvaluation.Domain.Events;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Ambev.DeveloperEvaluation.Application.Sales.CancelSale;

public class CancelSaleHandler : IRequestHandler<CancelSaleCommand>
{
    private readonly ISaleRepository _saleRepository;
    private readonly ILogger<CancelSaleHandler> _logger;
    private readonly IIntegrationEventPublisher _publisher;
    private readonly ICurrentUser _currentUser;

    public CancelSaleHandler(
        ISaleRepository saleRepository,
        ILogger<CancelSaleHandler> logger,
        IIntegrationEventPublisher publisher,
        ICurrentUser currentUser)
    {
        _saleRepository = saleRepository;
        _logger = logger;
        _publisher = publisher;
        _currentUser = currentUser;
    }

    public async Task Handle(CancelSaleCommand request, CancellationToken cancellationToken)
    {
        var validator = new CancelSaleValidator();
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
            throw new ValidationException(validationResult.Errors);

        var sale = await _saleRepository.GetByIdAsync(request.Id, cancellationToken);
        if (sale is null)
            throw new KeyNotFoundException($"Sale with ID {request.Id} not found");

        if (_currentUser.IsCustomer && _currentUser.UserId is { } uid && sale.Customer.ExternalId != uid)
            throw new KeyNotFoundException($"Sale with ID {request.Id} not found");

        sale.CancelSale();
        await _saleRepository.UpdateAsync(sale, cancellationToken);

        _logger.LogInformation("Event: SaleCancelled {SaleId} {SaleNumber}", sale.Id, sale.SaleNumber);

        await _publisher.PublishAsync(
            eventType: nameof(SaleCancelledEvent),
            payload: new SaleCancelledEvent(sale),
            applicationProperties: new Dictionary<string, object?>
            {
                ["saleId"] = sale.Id,
                ["saleNumber"] = sale.SaleNumber
            },
            cancellationToken: cancellationToken);
    }
}

