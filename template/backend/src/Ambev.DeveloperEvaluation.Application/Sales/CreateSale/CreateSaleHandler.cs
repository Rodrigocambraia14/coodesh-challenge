using AutoMapper;
using FluentValidation;
using MediatR;
using Ambev.DeveloperEvaluation.Application.Security;
using Ambev.DeveloperEvaluation.Domain.Repositories;
using Microsoft.Extensions.Logging;
using Ambev.DeveloperEvaluation.Domain.Entities;
using Ambev.DeveloperEvaluation.Domain.ValueObjects;
using Ambev.DeveloperEvaluation.Common.Messaging;
using Ambev.DeveloperEvaluation.Domain.Events;

namespace Ambev.DeveloperEvaluation.Application.Sales.CreateSale;

public class CreateSaleHandler : IRequestHandler<CreateSaleCommand, CreateSaleResult>
{
    private readonly ISaleRepository _saleRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<CreateSaleHandler> _logger;
    private readonly IIntegrationEventPublisher _publisher;
    private readonly ICurrentUser _currentUser;

    public CreateSaleHandler(
        ISaleRepository saleRepository,
        IMapper mapper,
        ILogger<CreateSaleHandler> logger,
        IIntegrationEventPublisher publisher,
        ICurrentUser currentUser)
    {
        _saleRepository = saleRepository;
        _mapper = mapper;
        _logger = logger;
        _publisher = publisher;
        _currentUser = currentUser;
    }

    public async Task<CreateSaleResult> Handle(CreateSaleCommand request, CancellationToken cancellationToken)
    {
        if (_currentUser.IsCustomer && _currentUser.UserId is { } uid)
        {
            request.CustomerId = uid;
            var desc = string.IsNullOrWhiteSpace(_currentUser.DisplayName)
                ? "Cliente"
                : _currentUser.DisplayName.Trim();
            request.CustomerDescription = desc.Length > 200 ? desc[..200] : desc;
        }

        var validator = new CreateSaleValidator();
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
            throw new ValidationException(validationResult.Errors);

        var items = request.Items.Select(i =>
            new SaleItem(new ExternalIdentity(i.ProductId, i.ProductDescription), i.Quantity, i.UnitPrice)
            {
                Id = Guid.NewGuid()
            });

        Sale sale = new(
            saleNumber: string.Empty,
            date: request.Date,
            customer: new ExternalIdentity(request.CustomerId, request.CustomerDescription),
            branch: new ExternalIdentity(request.BranchId, request.BranchDescription),
            items: items)
        {
            Id = Guid.NewGuid()
        };

        //seta o n?mero identificador da venda
        sale.SetSaleNumber(SaleNumberGenerator.Generate());

        sale.RecalculateTotals();

        var created = await _saleRepository.CreateAsync(sale, cancellationToken);
        _logger.LogInformation("Event: SaleCreated {SaleId} {SaleNumber}", created.Id, created.SaleNumber);

        await _publisher.PublishAsync(
            eventType: nameof(SaleCreatedEvent),
            payload: new SaleCreatedEvent(created),
            applicationProperties: new Dictionary<string, object?>
            {
                ["saleId"] = created.Id,
                ["saleNumber"] = created.SaleNumber
            },
            cancellationToken: cancellationToken);

        return _mapper.Map<CreateSaleResult>(created);
    }
}

internal static class SaleNumberGenerator
{
    public static string Generate()
        => $"S-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid():N}";
}

