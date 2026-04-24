using Ambev.DeveloperEvaluation.Domain.Common;

namespace Ambev.DeveloperEvaluation.Domain.Entities;

public sealed class Product : BaseEntity
{
    public string Name { get; private set; } = string.Empty;
    public string Category { get; private set; } = string.Empty; // Beer | SoftDrink
    public bool Active { get; private set; } = true;

    // EF Core
    private Product() { }

    public Product(Guid id, string name, string category, bool active = true)
    {
        if (id == Guid.Empty) throw new ArgumentException("Id is required.", nameof(id));
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("Name is required.", nameof(name));
        if (string.IsNullOrWhiteSpace(category)) throw new ArgumentException("Category is required.", nameof(category));

        Id = id;
        Name = name.Trim();
        Category = category.Trim();
        Active = active;
    }
}

