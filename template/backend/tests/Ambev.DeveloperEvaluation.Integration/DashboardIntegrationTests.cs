using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace Ambev.DeveloperEvaluation.Integration;

public sealed class DashboardIntegrationTests : IClassFixture<SalesApiFactory>
{
    private readonly SalesApiFactory _factory;

    public DashboardIntegrationTests(SalesApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Dashboard_ReturnsData_ForAdmin()
    {
        var client = _factory.CreateAuthenticatedClient("Admin");

        var from = DateTime.UtcNow.AddMonths(-2).ToString("O");
        var to = DateTime.UtcNow.AddDays(1).ToString("O");
        var url = $"/api/Dashboard?from={Uri.EscapeDataString(from)}&to={Uri.EscapeDataString(to)}&groupBy=Month";

        var res = await client.GetAsync(url);
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);

        var body = await res.Content.ReadFromJsonAsync<DashboardResponse>();
        Assert.NotNull(body);
        Assert.NotNull(body!.Kpis);
    }

    private sealed class DashboardResponse
    {
        public DashboardKpis Kpis { get; set; } = new();
    }

    private sealed class DashboardKpis
    {
        public int TotalSales { get; set; }
        public int CancelledSales { get; set; }
        public int TotalCustomers { get; set; }
    }
}

