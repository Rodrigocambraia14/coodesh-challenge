using MediatR;

namespace Ambev.DeveloperEvaluation.Application.Branches.ListBranches;

public sealed class ListBranchesQuery : IRequest<ListBranchesResult>
{
    public int Page { get; set; } = 1;
    public int Size { get; set; } = 20;
    public string? Search { get; set; }
}

public sealed class BranchListItemDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
}

public sealed class ListBranchesResult
{
    public IReadOnlyList<BranchListItemDto> Data { get; set; } = Array.Empty<BranchListItemDto>();
    public int TotalItems { get; set; }
    public int CurrentPage { get; set; }
    public int TotalPages { get; set; }
}
