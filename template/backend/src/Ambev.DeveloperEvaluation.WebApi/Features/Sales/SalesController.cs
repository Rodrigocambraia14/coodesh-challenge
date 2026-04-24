using Ambev.DeveloperEvaluation.Application.Security;
using Ambev.DeveloperEvaluation.Application.Sales.CreateSale;
using Ambev.DeveloperEvaluation.Application.Sales.CancelItem;
using Ambev.DeveloperEvaluation.Application.Sales.CancelSale;
using Ambev.DeveloperEvaluation.Application.Sales.DeleteSale;
using Ambev.DeveloperEvaluation.Application.Sales.GetSale;
using Ambev.DeveloperEvaluation.Application.Sales.ListSales;
using Ambev.DeveloperEvaluation.Application.Sales.UpdateSale;
using Ambev.DeveloperEvaluation.Common.Caching;
using Ambev.DeveloperEvaluation.WebApi.Common;
using Ambev.DeveloperEvaluation.WebApi.Features.Sales.CreateSale;
using Ambev.DeveloperEvaluation.WebApi.Features.Sales.GetSale;
using Ambev.DeveloperEvaluation.WebApi.Features.Sales.ListSales;
using Ambev.DeveloperEvaluation.WebApi.Features.Sales.UpdateSale;
using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Cryptography;
using System.Text;

namespace Ambev.DeveloperEvaluation.WebApi.Features.Sales;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SalesController : BaseController
{
    private readonly IMediator _mediator;
    private readonly IMapper _mapper;
    private readonly ICacheService _cache;
    private readonly ICurrentUser _currentUser;

    public SalesController(IMediator mediator, IMapper mapper, ICacheService cache, ICurrentUser currentUser)
    {
        _mediator = mediator;
        _mapper = mapper;
        _cache = cache;
        _currentUser = currentUser;
    }

    /// <summary>
    /// Creates a new sale.
    /// </summary>
    /// <param name="request">Sale header and items.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The created sale.</returns>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponseWithData<SaleResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateSaleRequest request, CancellationToken cancellationToken)
    {
        var validator = new CreateSaleRequestValidator();
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
            return BadRequest(validationResult.Errors);

        var command = _mapper.Map<CreateSaleCommand>(request);
        var result = await _mediator.Send(command, cancellationToken);

        await _cache.IncrementAsync("sales:list:version", cancellationToken);
        await _cache.IncrementAsync("dashboard:version", cancellationToken);

        return Created(string.Empty, new ApiResponseWithData<SaleResponse>
        {
            Success = true,
            Message = "Sale created successfully",
            Data = _mapper.Map<SaleResponse>(result)
        });
    }

    /// <summary>
    /// Retrieves a sale by its ID.
    /// </summary>
    /// <param name="id">Sale ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The sale if found.</returns>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponseWithData<SaleResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Get([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var req = new GetSaleRequest { Id = id };
        var validator = new GetSaleRequestValidator();
        var validationResult = await validator.ValidateAsync(req, cancellationToken);
        if (!validationResult.IsValid)
            return BadRequest(validationResult.Errors);

        var result = await _mediator.Send(new GetSaleCommand(id), cancellationToken);

        return new OkObjectResult(new ApiResponseWithData<SaleResponse>
        {
            Success = true,
            Message = "Sale retrieved successfully",
            Data = _mapper.Map<SaleResponse>(result)
        });
    }

    /// <summary>
    /// Updates a sale by its ID.
    /// </summary>
    /// <param name="id">Sale ID.</param>
    /// <param name="request">Updated sale header and items.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The updated sale.</returns>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(ApiResponseWithData<SaleResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update([FromRoute] Guid id, [FromBody] UpdateSaleRequest request, CancellationToken cancellationToken)
    {
        var validator = new UpdateSaleRequestValidator();
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
            return BadRequest(validationResult.Errors);

        var command = _mapper.Map<UpdateSaleCommand>(request);
        command.Id = id;

        var result = await _mediator.Send(command, cancellationToken);

        await _cache.RemoveAsync($"sales:get:{id}", cancellationToken);
        await _cache.IncrementAsync("sales:list:version", cancellationToken);
        await _cache.IncrementAsync("dashboard:version", cancellationToken);

        return new OkObjectResult(new ApiResponseWithData<SaleResponse>
        {
            Success = true,
            Message = "Sale updated successfully",
            Data = _mapper.Map<SaleResponse>(result)
        });
    }

    /// <summary>
    /// Deletes a sale by its ID.
    /// </summary>
    /// <param name="id">Sale ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Success response if the sale was deleted.</returns>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        await _mediator.Send(new DeleteSaleCommand(id), cancellationToken);

        await _cache.RemoveAsync($"sales:get:{id}", cancellationToken);
        await _cache.IncrementAsync("sales:list:version", cancellationToken);
        await _cache.IncrementAsync("dashboard:version", cancellationToken);

        return new OkObjectResult(new ApiResponse
        {
            Success = true,
            Message = "Sale deleted successfully"
        });
    }

    /// <summary>
    /// Cancels an entire sale.
    /// </summary>
    /// <param name="id">Sale ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Success response if the sale was cancelled.</returns>
    [HttpPost("{id:guid}/cancel")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Cancel([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        await _mediator.Send(new CancelSaleCommand(id), cancellationToken);

        await _cache.RemoveAsync($"sales:get:{id}", cancellationToken);
        await _cache.IncrementAsync("sales:list:version", cancellationToken);
        await _cache.IncrementAsync("dashboard:version", cancellationToken);

        return new OkObjectResult(new ApiResponse { Success = true, Message = "Sale cancelled successfully" });
    }

    /// <summary>
    /// Cancels a specific item from a sale.
    /// </summary>
    /// <param name="id">Sale ID.</param>
    /// <param name="itemId">Sale item ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Success response if the item was cancelled.</returns>
    [HttpPost("{id:guid}/items/{itemId:guid}/cancel")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CancelItem([FromRoute] Guid id, [FromRoute] Guid itemId, CancellationToken cancellationToken)
    {
        await _mediator.Send(new CancelSaleItemCommand(id, itemId), cancellationToken);

        await _cache.RemoveAsync($"sales:get:{id}", cancellationToken);
        await _cache.IncrementAsync("sales:list:version", cancellationToken);
        await _cache.IncrementAsync("dashboard:version", cancellationToken);

        return new OkObjectResult(new ApiResponse { Success = true, Message = "Item cancelled successfully" });
    }

    /// <summary>
    /// Lists sales with pagination, ordering and filters.
    /// </summary>
    /// <param name="page">
    /// Page number (1-based). Query parameter name: <c>_page</c>. Default: 1.
    /// </param>
    /// <param name="size">
    /// Page size. Query parameter name: <c>_size</c>. Default: 10.
    /// </param>
    /// <param name="order">
    /// Ordering expression. Query parameter name: <c>_order</c>.
    /// Supports: <c>field asc|desc</c>, multiple fields separated by comma.
    /// Fields: <c>date</c>, <c>saleNumber</c>, <c>totalSaleAmount</c>, <c>customerDescription</c>, <c>branchDescription</c>.
    /// </param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <remarks>
    /// Filters (query string) supported in addition to <c>_page</c>, <c>_size</c>, <c>_order</c>:
    /// <list type="bullet">
    /// <item><description><c>saleNumber</c>, <c>customerDescription</c>, <c>branchDescription</c>: exact match or wildcard with '*' prefix/suffix (e.g. <c>*bev*</c>).</description></item>
    /// <item><description><c>cancelled</c>: boolean (<c>true</c>/<c>false</c>).</description></item>
    /// <item><description><c>_minDate</c> / <c>_maxDate</c>: date range.</description></item>
    /// <item><description><c>_minTotalSaleAmount</c> / <c>_maxTotalSaleAmount</c>: total amount range.</description></item>
    /// </list>
    /// </remarks>
    /// <returns>Paginated list of sales.</returns>
    [HttpGet]
    [ProducesResponseType(typeof(Ambev.DeveloperEvaluation.WebApi.Features.Sales.ListSales.ListSalesResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> List([FromQuery(Name = "_page")] int? page, [FromQuery(Name = "_size")] int? size, [FromQuery(Name = "_order")] string? order, CancellationToken cancellationToken)
    {
        var query = new ListSalesQuery
        {
            Page = page ?? 1,
            Size = size ?? 10,
            Order = order,
            Filters = ExtractFilters(Request.Query)
        };

        var versionKey = "sales:list:version";
        var version = await _cache.GetOrSetAsync(
            versionKey,
            _ => Task.FromResult(0L),
            ttl: TimeSpan.FromDays(7),
            cancellationToken: cancellationToken);

        var listScope = _currentUser.IsAdminOrManager ? "all" : (_currentUser.UserId?.ToString() ?? "anon");
        var signature =
            $"{listScope}|{query.Page}|{query.Size}|{query.Order}|{string.Join('&', query.Filters.OrderBy(kv => kv.Key).Select(kv => $"{kv.Key}={kv.Value}"))}";
        var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(signature))).ToLowerInvariant();
        var cacheKey = $"sales:list:v{version}:{hash}";

        var result = await _cache.GetOrSetAsync(
            cacheKey,
            async ct => await _mediator.Send(query, ct),
            cancellationToken: cancellationToken);

        return new OkObjectResult(new Ambev.DeveloperEvaluation.WebApi.Features.Sales.ListSales.ListSalesResponse
        {
            Data = result.Data.Select(s => _mapper.Map<SaleResponse>(s)).ToList(),
            TotalItems = result.TotalItems,
            CurrentPage = result.CurrentPage,
            TotalPages = result.TotalPages
        });
    }

    private static Dictionary<string, string> ExtractFilters(IQueryCollection query)
    {
        var reserved = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "_page", "_size", "_order" };
        var result = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        foreach (var kv in query)
        {
            if (reserved.Contains(kv.Key))
                continue;

            // Support both: field=value and _minX/_maxX as in docs.
            result[kv.Key] = kv.Value.ToString();
        }

        return result;
    }
}

