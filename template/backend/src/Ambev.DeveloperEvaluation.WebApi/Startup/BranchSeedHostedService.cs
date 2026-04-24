using Ambev.DeveloperEvaluation.Domain.Entities;
using Ambev.DeveloperEvaluation.ORM;
using Microsoft.EntityFrameworkCore;

namespace Ambev.DeveloperEvaluation.WebApi.Startup;

public sealed class BranchSeedHostedService : IHostedService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<BranchSeedHostedService> _logger;

    public BranchSeedHostedService(IServiceProvider serviceProvider, ILogger<BranchSeedHostedService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<DefaultContext>();

        await db.Database.MigrateAsync(cancellationToken);

        var any = await db.Branches.AsNoTracking().AnyAsync(cancellationToken);
        if (any)
        {
            _logger.LogInformation("Branches seed skipped: table already has data.");
            return;
        }

        var branches = new[]
        {
            new Branch(Guid.Parse("11111111-1111-1111-1111-111111111111"), "Loja online"),
            new Branch(Guid.Parse("99999999-9999-9999-9999-999999999901"), "Filial Centro — São Paulo"),
            new Branch(Guid.Parse("99999999-9999-9999-9999-999999999902"), "Filial Zona Sul — Rio de Janeiro"),
            new Branch(Guid.Parse("99999999-9999-9999-9999-999999999903"), "CD Nacional — Contagem"),
            new Branch(Guid.Parse("99999999-9999-9999-9999-999999999904"), "Loja Conceito — Curitiba")
        };

        await db.Branches.AddRangeAsync(branches, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Branches seed completed: {Count} branches inserted.", branches.Length);
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
