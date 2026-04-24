import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Redirects the authenticated user to the correct home based on role.
 * Prevents ping-pong loops when role is None/unknown.
 */
export const homeRedirectGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAdminOrManager()) return router.createUrlTree(['/dashboard']);
  if (auth.isCustomer()) return router.createUrlTree(['/loja']);

  // Role is missing/None/unknown -> force login again (avoids infinite redirects).
  auth.logout();
  return router.createUrlTree(['/login']);
};

