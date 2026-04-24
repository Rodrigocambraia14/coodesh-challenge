import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import { readApiDataArray } from './api-response.util';

export type ProductDto = { id: string; name: string; category: string };
export type ApiResponseWithData<T> = { success: boolean; message?: string; data?: T };

@Injectable({ providedIn: 'root' })
export class ProductsApi {
  private readonly http = inject(HttpClient);

  /** Lista normalizada (sempre um array; aceita `data`/`Data` ou corpo já em array). */
  list() {
    return this.http.get<unknown>('/api/Products').pipe(map((body) => readApiDataArray<ProductDto>(body)));
  }
}
