import { Routes } from '@angular/router';

export const USERS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./user-find.page').then((m) => m.UserFindPage) },
  { path: 'create', loadComponent: () => import('./user-create.page').then((m) => m.UserCreatePage) }
];

