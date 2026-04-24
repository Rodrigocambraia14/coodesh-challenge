namespace Ambev.DeveloperEvaluation.Common.Messaging;

public sealed class IntegrationEventPublisherOptions
{
    public const string SectionName = "IntegrationEvents";

    public string TopicName { get; set; } = "sales-events";
}

