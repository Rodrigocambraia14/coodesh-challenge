using Ambev.DeveloperEvaluation.Domain.Repositories;
using MediatR;

namespace Ambev.DeveloperEvaluation.Application.Branches.ListBranches;

public sealed class ListBranchesHandler : IRequestHandler<ListBranchesQuery, ListBranchesResult>
{
    private readonly IBranchRepository _branches;

    public ListBranchesHandler(IBranchRepository branches) => _branches = branches;

    public async Task<ListBranchesResult> Handle(ListBranchesQuery request, CancellationToken cancellationToken)
    {
        var page = request.Page <= 0 ? 1 : request.Page;
        var size = request.Size <= 0 ? 20 : Math.Min(request.Size, 100);

        var (items, total) = await _branches.SearchAsync(request.Search, page, size, cancellationToken);
        var totalPages = (int)Math.Ceiling(total / (double)size);

        return new ListBranchesResult
        {
            Data = items.Select(b => new BranchListItemDto { Id = b.Id, Name = b.Name }).ToList(),
            TotalItems = total,
            CurrentPage = page,
            TotalPages = totalPages
        };
    }
}
