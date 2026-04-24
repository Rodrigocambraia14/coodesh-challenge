import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Restrict route to users whose role is one of the allowed strings (e.g. Admin, Manager). */
export const roleGuard =
  (allowedRoles: string[]): CanMatchFn =>
  () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const role = auth.session()?.role;
    if (role && allowedRoles.includes(role)) return true;
    return router.createUrlTree(['/']);
  };
