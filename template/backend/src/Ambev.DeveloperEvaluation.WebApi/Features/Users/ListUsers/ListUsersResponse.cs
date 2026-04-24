namespace Ambev.DeveloperEvaluation.WebApi.Features.Users.ListUsers;

public sealed class ListUsersResponse
{
    public IReadOnlyList<UserListRow> Data { get; set; } = Array.Empty<UserListRow>();
    public int TotalItems { get; set; }
    public int CurrentPage { get; set; }
    public int TotalPages { get; set; }
}

public sealed class UserListRow
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}
