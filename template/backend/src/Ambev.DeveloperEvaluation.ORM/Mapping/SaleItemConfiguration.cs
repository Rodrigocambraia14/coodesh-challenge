using Ambev.DeveloperEvaluation.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ambev.DeveloperEvaluation.ORM.Mapping;

public class SaleItemConfiguration : IEntityTypeConfiguration<SaleItem>
{
    public void Configure(EntityTypeBuilder<SaleItem> builder)
    {
        builder.ToTable("SaleItems");

        builder.HasKey(i => i.Id);
        builder.Property(i => i.Id).HasColumnType("uuid").HasDefaultValueSql("gen_random_uuid()");

        builder.Property(i => i.Quantity).IsRequired();
        builder.Property(i => i.UnitPrice).HasPrecision(18, 2);
        builder.Property(i => i.Discount).HasPrecision(5, 4);
        builder.Property(i => i.TotalItemAmount).HasPrecision(18, 2);
        builder.Property(i => i.Cancelled).IsRequired();

        builder.OwnsOne(i => i.Product, owned =>
        {
            owned.Property(p => p.ExternalId).HasColumnName("ProductId").HasColumnType("uuid");
            owned.Property(p => p.Description).HasColumnName("ProductDescription").HasMaxLength(200);
        });

        // Shadow FK declared in SaleConfiguration (SaleId)
    }
}

