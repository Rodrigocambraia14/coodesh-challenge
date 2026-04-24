using Ambev.DeveloperEvaluation.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ambev.DeveloperEvaluation.ORM.Mapping;

public class SaleConfiguration : IEntityTypeConfiguration<Sale>
{
    public void Configure(EntityTypeBuilder<Sale> builder)
    {
        builder.ToTable("Sales");

        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).HasColumnType("uuid").HasDefaultValueSql("gen_random_uuid()");

        builder.Property(s => s.SaleNumber).IsRequired().HasMaxLength(50);
        builder.HasIndex(s => s.SaleNumber).IsUnique();

        builder.Property(s => s.Date).IsRequired();
        builder.Property(s => s.TotalSaleAmount).HasPrecision(18, 2);
        builder.Property(s => s.Cancelled).IsRequired();

        builder.OwnsOne(s => s.Customer, owned =>
        {
            owned.Property(p => p.ExternalId).HasColumnName("CustomerId").HasColumnType("uuid");
            owned.Property(p => p.Description).HasColumnName("CustomerDescription").HasMaxLength(200);
        });

        builder.OwnsOne(s => s.Branch, owned =>
        {
            owned.Property(p => p.ExternalId).HasColumnName("BranchId").HasColumnType("uuid");
            owned.Property(p => p.Description).HasColumnName("BranchDescription").HasMaxLength(200);
        });

        builder.HasMany(s => s.Items)
            .WithOne()
            .HasForeignKey("SaleId")
            .OnDelete(DeleteBehavior.Cascade);
    }
}

