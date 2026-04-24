using Ambev.DeveloperEvaluation.Application.Sales.Common;
using Ambev.DeveloperEvaluation.Application.Sales.CreateSale;
using AutoMapper;

namespace Ambev.DeveloperEvaluation.WebApi.Features.Sales;

public class SaleResponseProfile : Profile
{
    public SaleResponseProfile()
    {
        CreateMap<SaleDto, SaleResponse>();
        CreateMap<SaleItemDto, SaleItemResponse>();

        CreateMap<CreateSaleResult, SaleResponse>();
        CreateMap<CreateSaleItemResult, SaleItemResponse>();
    }
}

