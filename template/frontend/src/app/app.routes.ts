import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { adminHomeGuard } from './core/auth/admin-home.guard';
import { adminSalesSectionGuard } from './core/auth/admin-sales-section.guard';
import { customerSectionGuard } from './core/auth/customer-section.guard';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.page').then((m) => m.LoginPage)
  },
  {
    path: '',
    canMatch: [authGuard],
    loadComponent: () => import('./shell/app-shell.component').then((m) => m.AppShellComponent),
    children: [
      { path: '', pathMatch: 'full', canMatch: [adminHomeGuard], redirectTo: 'dashboard' },
      { path: '', pathMatch: 'full', redirectTo: 'loja' },
      {
        path: 'dashboard',
        canMatch: [roleGuard(['Admin', 'Manager'])],
        loadComponent: () => import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage)
      },
      {
        path: 'sales',
        canMatch: [adminSalesSectionGuard],
        loadChildren: () => import('./features/sales/sales.routes').then((m) => m.SALES_ROUTES)
      },
      {
        path: 'loja',
        canMatch: [customerSectionGuard],
        loadComponent: () => import('./features/shop/catalog.page').then((m) => m.CatalogPage)
      },
      {
        path: 'carrinho',
        canMatch: [customerSectionGuard],
        loadComponent: () => import('./features/shop/cart.page').then((m) => m.CartPage)
      },
      {
        path: 'checkout',
        canMatch: [customerSectionGuard],
        loadComponent: () => import('./features/shop/checkout.page').then((m) => m.CheckoutPage)
      },
      {
        path: 'pedidos',
        canMatch: [customerSectionGuard],
        loadChildren: () => import('./features/orders/orders.routes').then((m) => m.ORDERS_ROUTES)
      },
      {
        path: 'users',
        canMatch: [roleGuard(['Admin', 'Manager'])],
        loadChildren: () => import('./features/users/users.routes').then((m) => m.USERS_ROUTES)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
