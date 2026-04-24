using Ambev.DeveloperEvaluation.Domain.Entities;
using AutoMapper;

namespace Ambev.DeveloperEvaluation.Application.Sales.Common;

public class SaleMappingsProfile : Profile
{
    public SaleMappingsProfile()
    {
        CreateMap<Sale, SaleDto>()
            .ForMember(d => d.CustomerId, o => o.MapFrom(s => s.Customer.ExternalId))
            .ForMember(d => d.CustomerDescription, o => o.MapFrom(s => s.Customer.Description))
            .ForMember(d => d.BranchId, o => o.MapFrom(s => s.Branch.ExternalId))
            .ForMember(d => d.BranchDescription, o => o.MapFrom(s => s.Branch.Description));

        CreateMap<SaleItem, SaleItemDto>()
            .ForMember(d => d.ProductId, o => o.MapFrom(s => s.Product.ExternalId))
            .ForMember(d => d.ProductDescription, o => o.MapFrom(s => s.Product.Description));
    }
}

