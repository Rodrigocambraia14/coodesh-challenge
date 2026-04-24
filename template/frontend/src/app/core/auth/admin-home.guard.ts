import { inject } from '@angular/core';
import { CanMatchFn } from '@angular/router';
import { AuthService } from './auth.service';

/** Matches when the logged-in user should land on the admin sales home. */
export const adminHomeGuard: CanMatchFn = () => inject(AuthService).isAdminOrManager();
