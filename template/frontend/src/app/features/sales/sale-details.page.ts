import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/auth/auth.service';
import type { ApiResponseWithData, SaleResponse } from './sales.api';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    CurrencyPipe,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    @if (sale(); as s) {
      <div class="header">
        <h2>{{ s.saleNumber }}</h2>
        <div class="actions">
          <a mat-stroked-button [routerLink]="listLink()">Voltar à lista</a>
          @if (auth.isAdminOrManager()) {
            <a mat-stroked-button [routerLink]="['/sales', s.id, 'edit']">
              <mat-icon>edit</mat-icon>
              Editar
            </a>
          }
          @if (!s.cancelled) {
            <button mat-stroked-button color="warn" type="button" (click)="cancelSale(s.id)">
              <mat-icon>block</mat-icon>
              Cancelar compra
            </button>
          }
          @if (auth.isAdminOrManager()) {
            <button mat-stroked-button color="warn" type="button" (click)="deleteSale(s.id)">
              <mat-icon>delete</mat-icon>
              Excluir
            </button>
          }
        </div>
      </div>

      <mat-card>
        <mat-card-content>
          <div class="grid">
            <div class="row"><span class="k">Data</span><span class="v">{{ s.date | date: 'short' }}</span></div>
            <div class="row"><span class="k">Cliente</span><span class="v">{{ s.customerDescription }}</span></div>
            <div class="row"><span class="k">Filial</span><span class="v">{{ s.branchDescription }}</span></div>
            <div class="row"><span class="k">Total</span><span class="v">{{ s.totalSaleAmount | currency: 'BRL' }}</span></div>
            <div class="row"><span class="k">Situação</span><span class="v">{{ s.cancelled ? 'Cancelada' : 'Ativa' }}</span></div>
          </div>

          <h3>Itens</h3>
          @for (it of s.items; track it.id) {
            <div class="item">
              <div class="item-main">
                <div class="t">{{ it.productDescription }}</div>
                <div class="m">
                  qtd={{ it.quantity }} · unitário={{ it.unitPrice | currency: 'BRL' }} · desconto={{ it.discount | currency: 'BRL' }} ·
                  total={{ it.totalItemAmount | currency: 'BRL' }}
                </div>
              </div>
              <div class="item-actions">
                <span class="tag" [class.cancelled]="it.cancelled">{{ it.cancelled ? 'cancelado' : 'ativo' }}</span>
                @if (auth.isAdminOrManager()) {
                  <button mat-button color="warn" type="button" (click)="cancelItem(s.id, it.id)" [disabled]="it.cancelled">
                    Cancelar item
                  </button>
                }
              </div>
            </div>
          }
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: [
    `
      .header {
        display: flex;
        justify-content: space-between;
        align-items: start;
        gap: 12px;
        flex-wrap: wrap;
      }
      .actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .grid {
        display: grid;
        gap: 8px;
        margin-bottom: 12px;
      }
      .row {
        display: grid;
        grid-template-columns: 120px 1fr;
        gap: 12px;
      }
      .k {
        color: var(--app-text-muted);
      }
      .item {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        padding: 10px 0;
        border-top: 1px solid var(--app-border);
        flex-wrap: wrap;
      }
      .t {
        font-weight: 600;
      }
      .m {
        color: var(--app-text-muted);
        font-size: 12px;
      }
      .tag {
        font-size: 12px;
        padding: 3px 8px;
        border-radius: 999px;
        background: rgba(46, 204, 113, 0.14);
        color: rgba(46, 204, 113, 0.95);
        align-self: center;
      }
      .tag.cancelled {
        background: rgba(231, 76, 60, 0.14);
        color: rgba(231, 76, 60, 0.95);
      }
      .item-actions {
        display: flex;
        gap: 8px;
        align-items: center;
      }
    `
  ]
})
export class SaleDetailsPage {
  readonly sale = signal<SaleResponse | null>(null);

  readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.load(id);
  }

  listLink(): string[] {
    return this.auth.isCustomer() ? ['/pedidos'] : ['/sales'];
  }

  load(id: string) {
    this.http.get<ApiResponseWithData<SaleResponse>>(`/api/Sales/${id}`).subscribe({
      next: (res) => this.sale.set(res.data ?? null),
      error: () => this.snack.open('Não foi possível carregar a venda.', 'OK', { duration: 2500 })
    });
  }

  cancelSale(id: string) {
    this.http.post(`/api/Sales/${id}/cancel`, {}).subscribe({
      next: () => {
        this.snack.open('Compra cancelada.', 'OK', { duration: 2500 });
        this.load(id);
      },
      error: () => this.snack.open('Não foi possível cancelar.', 'OK', { duration: 2500 })
    });
  }

  cancelItem(saleId: string, itemId: string) {
    this.http.post(`/api/Sales/${saleId}/items/${itemId}/cancel`, {}).subscribe({
      next: () => {
        this.snack.open('Item cancelado.', 'OK', { duration: 2500 });
        this.load(saleId);
      },
      error: () => this.snack.open('Não foi possível cancelar o item.', 'OK', { duration: 2500 })
    });
  }

  deleteSale(id: string) {
    this.http.delete(`/api/Sales/${id}`).subscribe({
      next: () => {
        this.snack.open('Venda excluída.', 'OK', { duration: 2500 });
        this.router.navigateByUrl(this.auth.isCustomer() ? '/pedidos' : '/sales');
      },
      error: () => this.snack.open('Não foi possível excluir.', 'OK', { duration: 2500 })
    });
  }
}
