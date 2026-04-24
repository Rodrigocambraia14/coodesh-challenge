namespace Ambev.DeveloperEvaluation.Common.Messaging;

public interface IIntegrationEventPublisher
{
    Task PublishAsync(
        string eventType,
        object payload,
        IReadOnlyDictionary<string, object?>? applicationProperties = null,
        CancellationToken cancellationToken = default);
}

