namespace Ambev.DeveloperEvaluation.WebApi.Features.Branches.ListBranches;

public sealed class ListBranchesResponse
{
    public IReadOnlyList<BranchListRow> Data { get; set; } = Array.Empty<BranchListRow>();
    public int TotalItems { get; set; }
    public int CurrentPage { get; set; }
    public int TotalPages { get; set; }
}

public sealed class BranchListRow
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
}
