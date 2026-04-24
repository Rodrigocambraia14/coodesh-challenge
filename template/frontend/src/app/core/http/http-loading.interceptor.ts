import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { HttpLoadingService } from './http-loading.service';

/**
 * Associa cada pedido HTTP ao overlay global até o observable completar ou falhar.
 */
export const httpLoadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loading = inject(HttpLoadingService);
  loading.begin();
  return next(req).pipe(finalize(() => loading.end()));
};
