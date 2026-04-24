export type ApiResponse = { success: boolean; message?: string };
export type ApiResponseWithData<T> = { success: boolean; message?: string; data?: T };

export type SaleItemRequest = {
  productId: string;
  productDescription: string;
  quantity: number;
  unitPrice: number;
};

export type CreateSaleRequest = {
  date: string;
  customerId: string;
  customerDescription: string;
  branchId: string;
  branchDescription: string;
  items: SaleItemRequest[];
};

export type UpdateSaleRequest = CreateSaleRequest;

export type SaleItemResponse = {
  id: string;
  productId: string;
  productDescription: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalItemAmount: number;
  cancelled: boolean;
};

export type SaleResponse = {
  id: string;
  saleNumber: string;
  date: string;
  customerId: string;
  customerDescription: string;
  branchId: string;
  branchDescription: string;
  totalSaleAmount: number;
  cancelled: boolean;
  items: SaleItemResponse[];
};

export type ListSalesResponse = {
  data: SaleResponse[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
};

export type PreviewItemStatus = 'Ok' | 'Blocked';

export type PreviewReason = {
  code: string;
  message: string;
};

export type PreviewSaleSummary = {
  grossTotal: number;
  netTotal: number;
  discountTotal: number;
};

export type PreviewSaleItem = {
  productId: string;
  productDescription: string;
  quantity: number;
  unitPrice: number;
  grossAmount: number;
  discountRate: number;
  discountAmount: number;
  netAmount: number;
  status: PreviewItemStatus;
  reasons: PreviewReason[];
};

export type PreviewSaleResponse = {
  isBlocked: boolean;
  reasons: PreviewReason[];
  items: PreviewSaleItem[];
  summary: PreviewSaleSummary;
};

