using Ambev.DeveloperEvaluation.Domain.Entities;
using AutoMapper;

namespace Ambev.DeveloperEvaluation.Application.Sales.CreateSale;

public class CreateSaleProfile : Profile
{
    public CreateSaleProfile()
    {
        CreateMap<Sale, CreateSaleResult>()
            .ForMember(d => d.CustomerId, o => o.MapFrom(s => s.Customer.ExternalId))
            .ForMember(d => d.CustomerDescription, o => o.MapFrom(s => s.Customer.Description))
            .ForMember(d => d.BranchId, o => o.MapFrom(s => s.Branch.ExternalId))
            .ForMember(d => d.BranchDescription, o => o.MapFrom(s => s.Branch.Description));

        CreateMap<SaleItem, CreateSaleItemResult>()
            .ForMember(d => d.ProductId, o => o.MapFrom(s => s.Product.ExternalId))
            .ForMember(d => d.ProductDescription, o => o.MapFrom(s => s.Product.Description));
    }
}

