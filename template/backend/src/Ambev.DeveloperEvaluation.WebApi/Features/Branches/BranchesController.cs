using Ambev.DeveloperEvaluation.Application.Branches.ListBranches;
using Ambev.DeveloperEvaluation.WebApi.Features.Branches.ListBranches;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ambev.DeveloperEvaluation.WebApi.Features.Branches;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Manager")]
public sealed class BranchesController : ControllerBase
{
    private readonly IMediator _mediator;

    public BranchesController(IMediator mediator) => _mediator = mediator;

    /// <summary>Lista filiais ativas com pesquisa e paginação.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ListBranchesResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> List(
        [FromQuery(Name = "_page")] int? page,
        [FromQuery(Name = "_size")] int? size,
        [FromQuery] string? search,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(
            new ListBranchesQuery
            {
                Page = page ?? 1,
                Size = size ?? 20,
                Search = search
            },
            cancellationToken);

        return Ok(
            new ListBranchesResponse
            {
                Data = result.Data.Select(b => new BranchListRow { Id = b.Id, Name = b.Name }).ToList(),
                TotalItems = result.TotalItems,
                CurrentPage = result.CurrentPage,
                TotalPages = result.TotalPages
            });
    }
}
