using Ambev.DeveloperEvaluation.Common.Caching;
using Ambev.DeveloperEvaluation.Application.Users.DeleteUser;
using Ambev.DeveloperEvaluation.Application.Users.GetUser;
using Ambev.DeveloperEvaluation.WebApi.Features.Users;
using AutoMapper;
using FluentAssertions;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using NSubstitute;
using Xunit;

namespace Ambev.DeveloperEvaluation.Unit.WebApi.Caching;

public sealed class UsersControllerCacheTests
{
    [Fact]
    public async Task GetUser_ShouldUseCacheKey()
    {
        var mediator = Substitute.For<IMediator>();
        var mapper = Substitute.For<IMapper>();
        var cache = Substitute.For<ICacheService>();

        var userId = Guid.NewGuid();

        mapper.Map<GetUserCommand>(Arg.Any<Guid>())
            .Returns(ci => new GetUserCommand((Guid)ci[0]));

        var handlerResult = new GetUserResult { Id = userId, Name = "Test", Email = "t@t.com", Phone = "0" };
        mediator.Send(Arg.Any<GetUserCommand>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(handlerResult));

        mapper.Map<Ambev.DeveloperEvaluation.WebApi.Features.Users.GetUser.GetUserResponse>(Arg.Any<GetUserResult>())
            .Returns(new Ambev.DeveloperEvaluation.WebApi.Features.Users.GetUser.GetUserResponse { Id = userId });

        cache.GetOrSetAsync<GetUserResult>(
                Arg.Any<string>(),
                Arg.Any<Func<CancellationToken, Task<GetUserResult>>>(),
                Arg.Any<TimeSpan?>(),
                Arg.Any<CancellationToken>())
            .Returns(callInfo =>
            {
                var factory = callInfo.ArgAt<Func<CancellationToken, Task<GetUserResult>>>(1);
                return factory(CancellationToken.None);
            });

        var controller = new UsersController(mediator, mapper, cache);

        var result = await controller.GetUser(userId, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
        await cache.Received(1).GetOrSetAsync<GetUserResult>(
            Arg.Is<string>(k => k == $"users:get:{userId}"),
            Arg.Any<Func<CancellationToken, Task<GetUserResult>>>(),
            Arg.Any<TimeSpan?>(),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task DeleteUser_ShouldInvalidateUserCache()
    {
        var mediator = Substitute.For<IMediator>();
        var mapper = Substitute.For<IMapper>();
        var cache = Substitute.For<ICacheService>();

        var userId = Guid.NewGuid();

        mapper.Map<DeleteUserCommand>(Arg.Any<Guid>())
            .Returns(ci => new DeleteUserCommand((Guid)ci[0]));

        mediator.Send(Arg.Any<DeleteUserCommand>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(new DeleteUserResponse()));

        var controller = new UsersController(mediator, mapper, cache);

        var result = await controller.DeleteUser(userId, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
        await cache.Received(1).RemoveAsync($"users:get:{userId}", Arg.Any<CancellationToken>());
    }
}

