using System.Security.Claims;
using Ambev.DeveloperEvaluation.Application.Security;
using Ambev.DeveloperEvaluation.Domain.Enums;

namespace Ambev.DeveloperEvaluation.WebApi.Security;

public sealed class HttpContextCurrentUser : ICurrentUser
{
    private readonly IHttpContextAccessor _http;

    public HttpContextCurrentUser(IHttpContextAccessor http) => _http = http;

    public Guid? UserId
    {
        get
        {
            var raw = _http.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(raw, out var id) ? id : null;
        }
    }

    public bool IsCustomer => HasRole(UserRole.Customer);

    public bool IsAdminOrManager => HasRole(UserRole.Admin) || HasRole(UserRole.Manager);

    public string? DisplayName => _http.HttpContext?.User?.FindFirstValue(ClaimTypes.Name);

    private bool HasRole(UserRole role)
    {
        var roles = _http.HttpContext?.User?.FindAll(ClaimTypes.Role).Select(c => c.Value) ?? [];
        return roles.Contains(role.ToString(), StringComparer.OrdinalIgnoreCase);
    }
}
