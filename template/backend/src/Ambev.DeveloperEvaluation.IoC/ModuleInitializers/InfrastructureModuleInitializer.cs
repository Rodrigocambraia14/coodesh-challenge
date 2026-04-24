using Ambev.DeveloperEvaluation.Domain.Repositories;
using Ambev.DeveloperEvaluation.Common.Messaging;
using Ambev.DeveloperEvaluation.ORM;
using Ambev.DeveloperEvaluation.ORM.Repositories;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Rebus.Activation;
using Rebus.Bus;
using Rebus.Config;
using Rebus.Transport.InMem;

namespace Ambev.DeveloperEvaluation.IoC.ModuleInitializers;

public class InfrastructureModuleInitializer : IModuleInitializer
{
    public void Initialize(WebApplicationBuilder builder)
    {
        builder.Services.AddScoped<DbContext>(provider => provider.GetRequiredService<DefaultContext>());
        builder.Services.AddScoped<IUserRepository, UserRepository>();
        builder.Services.AddScoped<ISaleRepository, SaleRepository>();
        builder.Services.AddScoped<IProductRepository, ProductRepository>();
        builder.Services.AddScoped<IBranchRepository, BranchRepository>();

        // Rebus (simulated bus by default)
        // We register an in-memory transport so the app can resolve IBus even without broker connectivity.
        // When you want a real broker (e.g., Azure Service Bus), configure Rebus accordingly and then uncomment the publish line.
        builder.Services.AddSingleton(new InMemNetwork());
        builder.Services.AddSingleton<IBus>(sp =>
        {
            var activator = new BuiltinHandlerActivator();
            var network = sp.GetRequiredService<InMemNetwork>();

            return Configure.With(activator)
                .Transport(t => t.UseInMemoryTransport(network, "integration-events"))
                .Start();
        });

        builder.Services.Configure<IntegrationEventPublisherOptions>(
            builder.Configuration.GetSection(IntegrationEventPublisherOptions.SectionName));
        builder.Services.AddSingleton<IIntegrationEventPublisher, TopicIntegrationEventPublisher>();
    }
}