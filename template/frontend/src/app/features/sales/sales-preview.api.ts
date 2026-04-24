import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { ApiResponseWithData, CreateSaleRequest } from './sales.api';
import type { PreviewSaleResponse } from './sales.api';

@Injectable({ providedIn: 'root' })
export class SalesPreviewApi {
  private readonly http = inject(HttpClient);

  preview(body: CreateSaleRequest) {
    return this.http.post<ApiResponseWithData<PreviewSaleResponse>>('/api/Sales/preview', body);
  }
}

