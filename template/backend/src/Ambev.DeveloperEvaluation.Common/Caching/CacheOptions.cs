namespace Ambev.DeveloperEvaluation.Common.Caching;

public sealed class CacheOptions
{
    public const string SectionName = "Cache";

    public int DefaultTtlSeconds { get; set; } = 300;

    public TimeSpan DefaultTtl => TimeSpan.FromSeconds(DefaultTtlSeconds);
}

