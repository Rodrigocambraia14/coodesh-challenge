using Ambev.DeveloperEvaluation.Domain.Entities;

namespace Ambev.DeveloperEvaluation.Domain.Repositories;

public interface IProductRepository
{
    Task<IReadOnlyList<Product>> ListActiveAsync(CancellationToken cancellationToken = default);
}

