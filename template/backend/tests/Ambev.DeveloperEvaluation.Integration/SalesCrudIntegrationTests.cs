using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Xunit;

namespace Ambev.DeveloperEvaluation.Integration;

public class SalesCrudIntegrationTests : IClassFixture<SalesApiFactory>
{
    private readonly HttpClient _client;

    public SalesCrudIntegrationTests(SalesApiFactory factory)
    {
        _client = factory.CreateAuthenticatedClient();
    }

    [Fact(DisplayName = "POST -> GET -> CancelSale -> GET")]
    public async Task SalesCrud_BasicFlow_Works()
    {
        var create = new
        {
            date = DateTime.UtcNow,
            customerId = Guid.NewGuid(),
            customerDescription = "Customer A",
            branchId = Guid.NewGuid(),
            branchDescription = "Branch X",
            items = new[]
            {
                new { productId = Guid.NewGuid(), productDescription = "Beer", quantity = 4, unitPrice = 10m },
                new { productId = Guid.NewGuid(), productDescription = "Soda", quantity = 3, unitPrice = 5m }
            }
        };

        var postResp = await _client.PostAsJsonAsync("/api/sales", create);
        postResp.StatusCode.Should().Be(HttpStatusCode.Created);

        var createdWrapper = await postResp.Content.ReadFromJsonAsync<ApiWrapper<SaleResponse>>();
        createdWrapper!.success.Should().BeTrue();
        createdWrapper.data.id.Should().NotBeEmpty();
        createdWrapper.data.totalSaleAmount.Should().Be(51m);

        var saleId = createdWrapper.data.id;

        var getResp = await _client.GetAsync($"/api/sales/{saleId}");
        getResp.StatusCode.Should().Be(HttpStatusCode.OK);

        var getJson = await getResp.Content.ReadAsStringAsync();
        var getWrapper = JsonSerializer.Deserialize<ApiWrapper<SaleResponse>>(getJson, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        getWrapper!.data.id.Should().Be(saleId);
        getWrapper.data.cancelled.Should().BeFalse();

        var cancelResp = await _client.PostAsync($"/api/sales/{saleId}/cancel", content: null);
        cancelResp.StatusCode.Should().Be(HttpStatusCode.OK);

        var afterCancel = await _client.GetFromJsonAsync<ApiWrapper<SaleResponse>>($"/api/sales/{saleId}");
        afterCancel!.data.cancelled.Should().BeTrue();
        afterCancel.data.totalSaleAmount.Should().Be(0m);
    }

    [Fact(DisplayName = "Cancel item sets item total to zero and updates sale total")]
    public async Task CancelItem_UpdatesTotals()
    {
        var create = new
        {
            date = DateTime.UtcNow,
            customerId = Guid.NewGuid(),
            customerDescription = "Customer B",
            branchId = Guid.NewGuid(),
            branchDescription = "Branch Y",
            items = new[]
            {
                new { productId = Guid.NewGuid(), productDescription = "Beer", quantity = 4, unitPrice = 10m }, // 36
                new { productId = Guid.NewGuid(), productDescription = "Soda", quantity = 3, unitPrice = 5m }  // 15
            }
        };

        var postResp = await _client.PostAsJsonAsync("/api/sales", create);
        var created = (await postResp.Content.ReadFromJsonAsync<ApiWrapper<SaleResponse>>())!.data;

        created.totalSaleAmount.Should().Be(51m);
        created.items.Should().HaveCount(2);

        var itemToCancel = created.items.Single(i => i.productDescription == "Soda");

        var cancelItemResp = await _client.PostAsync($"/api/sales/{created.id}/items/{itemToCancel.id}/cancel", null);
        cancelItemResp.StatusCode.Should().Be(HttpStatusCode.OK);

        var after = await _client.GetFromJsonAsync<ApiWrapper<SaleResponse>>($"/api/sales/{created.id}");
        after!.data.totalSaleAmount.Should().Be(36m);

        var cancelledItem = after.data.items.Single(i => i.id == itemToCancel.id);
        cancelledItem.cancelled.Should().BeTrue();
        cancelledItem.totalItemAmount.Should().Be(0m);
    }

    // minimal DTOs to parse API envelope
    private sealed class ApiWrapper<T>
    {
        public bool success { get; set; }
        public string message { get; set; } = string.Empty;
        public T data { get; set; } = default!;
    }

    private sealed class SaleResponse
    {
        public Guid id { get; set; }
        public string saleNumber { get; set; } = string.Empty;
        public DateTime date { get; set; }
        public Guid customerId { get; set; }
        public string customerDescription { get; set; } = string.Empty;
        public Guid branchId { get; set; }
        public string branchDescription { get; set; } = string.Empty;
        public decimal totalSaleAmount { get; set; }
        public bool cancelled { get; set; }
        public List<SaleItemResponse> items { get; set; } = new();
    }

    private sealed class SaleItemResponse
    {
        public Guid id { get; set; }
        public Guid productId { get; set; }
        public string productDescription { get; set; } = string.Empty;
        public int quantity { get; set; }
        public decimal unitPrice { get; set; }
        public decimal discount { get; set; }
        public decimal totalItemAmount { get; set; }
        public bool cancelled { get; set; }
    }
}

