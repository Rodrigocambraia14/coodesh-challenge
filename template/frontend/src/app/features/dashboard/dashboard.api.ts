import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

export type DashboardGroupBy = 'Day' | 'Week' | 'Month';

export type DashboardKpis = {
  totalSales: number;
  cancelledSales: number;
  cancelledRate: number;
  totalCustomers: number;
  grossRevenue: number;
  netRevenue: number;
  totalDiscountAmount: number;
};

export type DashboardTimeSeriesPoint = {
  period: string;
  totalSales: number;
  cancelledSales: number;
  netRevenue: number;
  discountAmount: number;
};

export type DashboardSaleValuePoint = {
  saleNumber: string;
  date: string;
  netAmount: number;
  cancelled: boolean;
};

export type DashboardTopProductRow = {
  productId: string;
  productName: string;
  quantitySold: number;
  grossAmount: number;
  netAmount: number;
  discountAmount: number;
};

export type DashboardResponse = {
  kpis: DashboardKpis;
  timeSeries: DashboardTimeSeriesPoint[];
  saleValuePoints: DashboardSaleValuePoint[];
  topProducts: DashboardTopProductRow[];
};

@Injectable({ providedIn: 'root' })
export class DashboardApi {
  private readonly http = inject(HttpClient);

  get(fromIso: string, toIso: string, groupBy: DashboardGroupBy) {
    const params = new HttpParams().set('from', fromIso).set('to', toIso).set('groupBy', groupBy);
    return this.http.get<DashboardResponse>('/api/Dashboard', { params });
  }
}

