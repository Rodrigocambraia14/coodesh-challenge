import { Routes } from '@angular/router';

export const SALES_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./sales-list.page').then((m) => m.SalesListPage) },
  { path: 'create', loadComponent: () => import('./sale-create.page').then((m) => m.SaleCreatePage) },
  { path: ':id', loadComponent: () => import('./sale-details.page').then((m) => m.SaleDetailsPage) },
  { path: ':id/edit', loadComponent: () => import('./sale-edit.page').then((m) => m.SaleEditPage) }
];

