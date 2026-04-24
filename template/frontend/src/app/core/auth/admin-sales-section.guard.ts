import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Admin/Manager sales backoffice; customers are redirected to the store. */
export const adminSalesSectionGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAdminOrManager()) return true;
  return router.createUrlTree(['/loja']);
};
