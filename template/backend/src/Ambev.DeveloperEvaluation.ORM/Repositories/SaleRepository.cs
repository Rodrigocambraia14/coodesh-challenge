using Ambev.DeveloperEvaluation.Domain.Entities;
using Ambev.DeveloperEvaluation.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Ambev.DeveloperEvaluation.ORM.Repositories;

public class SaleRepository : ISaleRepository
{
    private readonly DefaultContext _context;

    public SaleRepository(DefaultContext context)
    {
        _context = context;
    }

    public IQueryable<Sale> Query()
        => _context.Sales.AsQueryable();

    public async Task<Sale> CreateAsync(Sale sale, CancellationToken cancellationToken = default)
    {
        EnsureIds(sale);
        await _context.Sales.AddAsync(sale, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return sale;
    }

    public async Task<Sale?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Sales
            .Include(s => s.Items)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }

    public async Task<Sale?> GetBySaleNumberAsync(string saleNumber, CancellationToken cancellationToken = default)
    {
        return await _context.Sales
            .Include(s => s.Items)
            .FirstOrDefaultAsync(s => s.SaleNumber == saleNumber, cancellationToken);
    }

    public async Task<Sale> UpdateAsync(Sale sale, CancellationToken cancellationToken = default)
    {
        // Arroz com feijão:
        // - Se a entidade já está sendo rastreada por este DbContext, basta salvar.
        // - Se vier "detached" (ex.: de fora do contexto), aí sim carrega por PK e aplica.
        if (_context.Entry(sale).State != EntityState.Detached)
        {
            await _context.SaveChangesAsync(cancellationToken);
            return sale;
        }

        var existing = await _context.Sales
            .Include(s => s.Items)
            .FirstOrDefaultAsync(s => s.Id == sale.Id, cancellationToken);

        if (existing is null)
            throw new KeyNotFoundException($"Sale with ID {sale.Id} not found");

        // Recria os itens como novos registros (modelo atual não suporta update por item id).
        var newItems = sale.Items
            .Select(i => new SaleItem(i.Product, i.Quantity, i.UnitPrice) { Id = Guid.NewGuid() })
            .ToList();

        existing.Update(sale.Date, sale.Customer, sale.Branch, newItems);
        existing.RecalculateTotals();

        await _context.SaveChangesAsync(cancellationToken);
        return existing;
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var existing = await GetByIdAsync(id, cancellationToken);
        if (existing is null)
            return false;

        _context.Sales.Remove(existing);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static void EnsureIds(Sale sale)
    {
        if (sale.Id == Guid.Empty)
            sale.Id = Guid.NewGuid();

        foreach (var item in sale.Items)
        {
            if (item.Id == Guid.Empty)
                item.Id = Guid.NewGuid();
        }
    }
}

