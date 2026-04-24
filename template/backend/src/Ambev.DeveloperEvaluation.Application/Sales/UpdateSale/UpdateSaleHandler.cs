using Ambev.DeveloperEvaluation.Application.Sales.Common;
using Ambev.DeveloperEvaluation.Domain.Entities;
using Ambev.DeveloperEvaluation.Domain.Repositories;
using Ambev.DeveloperEvaluation.Domain.ValueObjects;
using Ambev.DeveloperEvaluation.Common.Messaging;
using Ambev.DeveloperEvaluation.Domain.Events;
using AutoMapper;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Ambev.DeveloperEvaluation.Application.Sales.UpdateSale;

public class UpdateSaleHandler : IRequestHandler<UpdateSaleCommand, SaleDto>
{
    private readonly ISaleRepository _saleRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<UpdateSaleHandler> _logger;
    private readonly IIntegrationEventPublisher _publisher;

    public UpdateSaleHandler(ISaleRepository saleRepository, IMapper mapper, ILogger<UpdateSaleHandler> logger, IIntegrationEventPublisher publisher)
    {
        _saleRepository = saleRepository;
        _mapper = mapper;
        _logger = logger;
        _publisher = publisher;
    }

    public async Task<SaleDto> Handle(UpdateSaleCommand request, CancellationToken cancellationToken)
    {
        var validator = new UpdateSaleValidator();
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
            throw new ValidationException(validationResult.Errors);

        // "Arroz com feijão": carrega por PK, aplica update e salva (sem retries).
        var sale = await _saleRepository.GetByIdAsync(request.Id, cancellationToken);
        if (sale is null)
            throw new KeyNotFoundException($"Sale with ID {request.Id} not found");

        var items = request.Items.Select(i =>
            new SaleItem(new ExternalIdentity(i.ProductId, i.ProductDescription), i.Quantity, i.UnitPrice)
            {
                Id = Guid.NewGuid()
            });

        sale.Update(
            date: request.Date,
            customer: new ExternalIdentity(request.CustomerId, request.CustomerDescription),
            branch: new ExternalIdentity(request.BranchId, request.BranchDescription),
            items: items);

        sale.RecalculateTotals();

        var updated = await _saleRepository.UpdateAsync(sale, cancellationToken);
        _logger.LogInformation("Event: SaleModified {SaleId} {SaleNumber}", updated.Id, updated.SaleNumber);

        await _publisher.PublishAsync(
            eventType: nameof(SaleModifiedEvent),
            payload: new SaleModifiedEvent(updated),
            applicationProperties: new Dictionary<string, object?>
            {
                ["saleId"] = updated.Id,
                ["saleNumber"] = updated.SaleNumber
            },
            cancellationToken: cancellationToken);

        return _mapper.Map<SaleDto>(updated);
    }
}

