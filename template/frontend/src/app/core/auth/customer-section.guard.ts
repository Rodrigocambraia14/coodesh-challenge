import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Only customers may open the shop / orders section; others go to admin sales. */
export const customerSectionGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isCustomer()) return true;
  return router.createUrlTree(['/sales']);
};
