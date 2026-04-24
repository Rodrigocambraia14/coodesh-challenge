using Ambev.DeveloperEvaluation.Common.Messaging;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NSubstitute;
using Rebus.Bus;
using Xunit;

namespace Ambev.DeveloperEvaluation.Unit.Common.Messaging;

public sealed class TopicIntegrationEventPublisherTests
{
    [Fact]
    public async Task PublishAsync_ShouldLogSimulatedPublishWithTopicAndEventType()
    {
        var logger = Substitute.For<ILogger<TopicIntegrationEventPublisher>>();
        var options = Options.Create(new IntegrationEventPublisherOptions { TopicName = "sales-events" });
        var bus = Substitute.For<IBus>();
        var publisher = new TopicIntegrationEventPublisher(options, bus, logger);

        await publisher.PublishAsync(
            eventType: "SaleCreatedEvent",
            payload: new { saleId = Guid.Parse("11111111-1111-1111-1111-111111111111") },
            applicationProperties: new Dictionary<string, object?> { ["saleId"] = Guid.Parse("11111111-1111-1111-1111-111111111111") });

        logger.ReceivedCalls().Should().NotBeEmpty();
        logger.Received(1).Log(
            LogLevel.Information,
            Arg.Any<EventId>(),
            Arg.Is<object>(o => o.ToString()!.Contains("Simulated message-bus publish to topic sales-events: SaleCreatedEvent")),
            Arg.Any<Exception?>(),
            Arg.Any<Func<object, Exception?, string>>());
    }
}

