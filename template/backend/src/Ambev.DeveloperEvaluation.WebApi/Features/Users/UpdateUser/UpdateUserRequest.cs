namespace Ambev.DeveloperEvaluation.WebApi.Features.Users.UpdateUser;

public sealed class UpdateUserRequest
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public int Role { get; set; }
    public int Status { get; set; }
}

