using Ambev.DeveloperEvaluation.Domain.Repositories;
using MediatR;

namespace Ambev.DeveloperEvaluation.Application.Users.ListUsers;

public sealed class ListUsersHandler : IRequestHandler<ListUsersQuery, ListUsersResult>
{
    private readonly IUserRepository _users;

    public ListUsersHandler(IUserRepository users) => _users = users;

    public async Task<ListUsersResult> Handle(ListUsersQuery request, CancellationToken cancellationToken)
    {
        var page = request.Page <= 0 ? 1 : request.Page;
        var size = request.Size <= 0 ? 20 : Math.Min(request.Size, 100);

        var (items, total) = await _users.SearchAsync(request.Search, request.Role, page, size, cancellationToken);
        var totalPages = (int)Math.Ceiling(total / (double)size);

        return new ListUsersResult
        {
            Data = items
                .Select(u => new UserListItemDto { Id = u.Id, Username = u.Username, Email = u.Email, Role = u.Role.ToString(), Status = u.Status.ToString() })
                .ToList(),
            TotalItems = total,
            CurrentPage = page,
            TotalPages = totalPages
        };
    }
}
