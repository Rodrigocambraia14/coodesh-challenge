using Ambev.DeveloperEvaluation.Domain.Entities;
using Ambev.DeveloperEvaluation.ORM;
using Microsoft.EntityFrameworkCore;

namespace Ambev.DeveloperEvaluation.WebApi.Startup;

public sealed class ProductSeedHostedService : IHostedService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ProductSeedHostedService> _logger;

    public ProductSeedHostedService(IServiceProvider serviceProvider, ILogger<ProductSeedHostedService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<DefaultContext>();

        // Ensure schema is updated, then seed idempotently.
        await db.Database.MigrateAsync(cancellationToken);

        var any = await db.Products.AsNoTracking().AnyAsync(cancellationToken);
        if (any)
        {
            _logger.LogInformation("Products seed skipped: Products table already has data.");
            return;
        }

        var products = new[]
        {
            new Product(Guid.Parse("11111111-1111-1111-1111-111111111111"), "Skol Pilsen (Lata 350ml)", "Beer"),
            new Product(Guid.Parse("22222222-2222-2222-2222-222222222222"), "Brahma Duplo Malte (Lata 350ml)", "Beer"),
            new Product(Guid.Parse("33333333-3333-3333-3333-333333333333"), "Antarctica Original (Lata 350ml)", "Beer"),
            new Product(Guid.Parse("44444444-4444-4444-4444-444444444444"), "Bohemia Puro Malte (Long Neck 355ml)", "Beer"),
            new Product(Guid.Parse("55555555-5555-5555-5555-555555555555"), "Stella Artois (Long Neck 330ml)", "Beer"),
            new Product(Guid.Parse("66666666-6666-6666-6666-666666666666"), "Guaraná Antarctica (Lata 350ml)", "SoftDrink"),
            new Product(Guid.Parse("77777777-7777-7777-7777-777777777777"), "Pepsi (Lata 350ml)", "SoftDrink"),
            new Product(Guid.Parse("88888888-8888-8888-8888-888888888888"), "Sukita Laranja (Lata 350ml)", "SoftDrink")
        };

        await db.Products.AddRangeAsync(products, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Products seed completed: {Count} products inserted.", products.Length);
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}

