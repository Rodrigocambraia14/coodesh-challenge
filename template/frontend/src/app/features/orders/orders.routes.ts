import { Routes } from '@angular/router';

export const ORDERS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./orders-list.page').then((m) => m.OrdersListPage) },
  {
    path: ':id',
    loadComponent: () => import('../sales/sale-details.page').then((m) => m.SaleDetailsPage)
  }
];
