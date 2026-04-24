using Ambev.DeveloperEvaluation.Domain.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ambev.DeveloperEvaluation.WebApi.Features.Products;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class ProductsController : ControllerBase
{
    private readonly IProductRepository _products;

    public ProductsController(IProductRepository products)
    {
        _products = products;
    }

    /// <summary>
    /// Lista produtos ativos (seed do catálogo Ambev) para uso no cadastro/edição de vendas.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        var list = await _products.ListActiveAsync(cancellationToken);
        var data = list.Select(p => new { id = p.Id, name = p.Name, category = p.Category });

        return Ok(new { success = true, data });
    }
}

