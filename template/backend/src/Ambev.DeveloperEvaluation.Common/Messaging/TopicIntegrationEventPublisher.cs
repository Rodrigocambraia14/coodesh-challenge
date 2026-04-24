using System.Diagnostics;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Rebus.Bus;

namespace Ambev.DeveloperEvaluation.Common.Messaging;

/// <summary>
/// Publishes integration events to a topic on a message bus.
/// In this challenge template, publishing is simulated (log-only).
/// </summary>
public sealed class TopicIntegrationEventPublisher : IIntegrationEventPublisher
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly IntegrationEventPublisherOptions _options;
    private readonly IBus _bus;
    private readonly ILogger<TopicIntegrationEventPublisher> _logger;

    public TopicIntegrationEventPublisher(
        IOptions<IntegrationEventPublisherOptions> options,
        IBus bus,
        ILogger<TopicIntegrationEventPublisher> logger)
    {
        _options = options.Value;
        _bus = bus;
        _logger = logger;
    }

    public Task PublishAsync(
        string eventType,
        object payload,
        IReadOnlyDictionary<string, object?>? applicationProperties = null,
        CancellationToken cancellationToken = default)
    {
        var occurredAt = DateTimeOffset.UtcNow;
        var correlationId = Activity.Current?.TraceId.ToString() ?? Guid.NewGuid().ToString("N");

        var body = JsonSerializer.Serialize(payload, JsonOptions);

        var headers = new Dictionary<string, object?>
        {
            ["eventType"] = eventType,
            ["occurredAt"] = occurredAt.ToString("O"),
            ["correlationId"] = correlationId
        };

        if (applicationProperties is not null)
        {
            foreach (var kv in applicationProperties)
            {
                if (kv.Value is null)
                    continue;
                headers[kv.Key] = kv.Value;
            }
        }

        _logger.LogInformation(
            "Simulated message-bus publish to topic {TopicName}: {EventType} correlationId={CorrelationId} body={Body} headers={Headers}",
            _options.TopicName,
            eventType,
            correlationId,
            body,
            JsonSerializer.Serialize(headers, JsonOptions));

        // Publica??o real em t?pico (mantida comentada intencionalmente para evitar erros em tempo de execu??o por conex?o/config inexistente com o broker):
        // await _bus.Advanced.Topics.Publish(_options.TopicName, body, headers);

        return Task.CompletedTask;
    }
}

