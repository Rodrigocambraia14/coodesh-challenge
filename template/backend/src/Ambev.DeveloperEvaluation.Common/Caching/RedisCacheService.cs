using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Text.Json;

namespace Ambev.DeveloperEvaluation.Common.Caching;

public sealed class RedisCacheService : ICacheService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly IDistributedCache _cache;
    private readonly CacheOptions _options;
    private readonly ILogger<RedisCacheService> _logger;

    public RedisCacheService(
        IDistributedCache cache,
        IOptions<CacheOptions> options,
        ILogger<RedisCacheService> logger)
    {
        _cache = cache;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<T> GetOrSetAsync<T>(
        string key,
        Func<CancellationToken, Task<T>> factory,
        TimeSpan? ttl = null,
        CancellationToken cancellationToken = default)
    {
        var cached = await _cache.GetStringAsync(key, cancellationToken);
        if (!string.IsNullOrEmpty(cached))
        {
            try
            {
                return JsonSerializer.Deserialize<T>(cached, JsonOptions)!;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Cache deserialize failed for key {Key}", key);
            }
        }

        var value = await factory(cancellationToken);

        var json = JsonSerializer.Serialize(value, JsonOptions);
        await _cache.SetStringAsync(
            key,
            json,
            new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = ttl ?? _options.DefaultTtl
            },
            cancellationToken);

        return value;
    }

    public Task RemoveAsync(string key, CancellationToken cancellationToken = default)
        => _cache.RemoveAsync(key, cancellationToken);

    // IDistributedCache doesn't support atomic INCR, so we implement a simple (non-atomic) version token.
    // For this challenge use case, it's sufficient to avoid heavy key scanning.
    public async Task<long> IncrementAsync(string key, CancellationToken cancellationToken = default)
    {
        var raw = await _cache.GetStringAsync(key, cancellationToken);
        var current = long.TryParse(raw, out var parsed) ? parsed : 0;
        var next = current + 1;

        await _cache.SetStringAsync(
            key,
            next.ToString(),
            new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(7) },
            cancellationToken);

        return next;
    }
}

