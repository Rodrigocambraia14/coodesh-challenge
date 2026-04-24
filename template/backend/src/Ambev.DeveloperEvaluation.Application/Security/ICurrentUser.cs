namespace Ambev.DeveloperEvaluation.Application.Security;

/// <summary>
/// Authenticated user context (populated from JWT in the Web API).
/// </summary>
public interface ICurrentUser
{
    Guid? UserId { get; }

    /// <summary>True when the user has the Customer role (not Admin/Manager).</summary>
    bool IsCustomer { get; }

    /// <summary>True for Admin or Manager (full sales backoffice).</summary>
    bool IsAdminOrManager { get; }

    /// <summary>JWT <see cref="System.Security.Claims.ClaimTypes.Name"/> (username).</summary>
    string? DisplayName { get; }
}
