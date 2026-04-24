using Ambev.DeveloperEvaluation.Domain.Enums;
using Ambev.DeveloperEvaluation.Domain.Repositories;
using FluentValidation;
using MediatR;

namespace Ambev.DeveloperEvaluation.Application.Users.UpdateUser;

public sealed class UpdateUserHandler : IRequestHandler<UpdateUserCommand, UpdateUserResult>
{
    private readonly IUserRepository _users;

    public UpdateUserHandler(IUserRepository users) => _users = users;

    public async Task<UpdateUserResult> Handle(UpdateUserCommand request, CancellationToken cancellationToken)
    {
        var validator = new UpdateUserValidator();
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
            throw new ValidationException(validationResult.Errors);

        var user = await _users.GetByIdAsync(request.Id, cancellationToken);
        if (user is null)
            throw new KeyNotFoundException($"User with ID {request.Id} not found");

        user.Username = request.Username;
        user.Email = request.Email;
        user.Phone = request.Phone;
        user.Role = (UserRole)request.Role;
        user.Status = (UserStatus)request.Status;
        user.UpdatedAt = DateTime.UtcNow;

        await _users.UpdateAsync(user, cancellationToken);

        return new UpdateUserResult
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            Phone = user.Phone,
            Role = (int)user.Role,
            Status = (int)user.Status
        };
    }
}

