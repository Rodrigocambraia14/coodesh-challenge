import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import type { ListSalesResponse } from '../sales/sales.api';

@Component({
  standalone: true,
  selector: 'app-orders-list-page',
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
    <div class="header">
      <h1>Meus pedidos</h1>
      <a mat-stroked-button routerLink="/loja">
        <mat-icon>storefront</mat-icon>
        Loja
      </a>
    </div>

    <div class="grid">
      <mat-card *ngFor="let s of data()?.data" class="sale">
        <mat-card-title>
          <div class="sale-title">{{ s.saleNumber }}</div>
        </mat-card-title>
        <mat-card-subtitle>{{ s.date | date: 'short' }}</mat-card-subtitle>
        <mat-card-content>
          <div class="row"><span class="k">Total</span><span class="v">{{ s.totalSaleAmount | currency: 'BRL' }}</span></div>
          <div class="row"><span class="k">Situação</span><span class="v">{{ s.cancelled ? 'Cancelada' : 'Ativa' }}</span></div>
        </mat-card-content>
        <mat-card-actions align="end">
          <a mat-button [routerLink]="['/pedidos', s.id]">Detalhes</a>
          <button mat-button color="warn" *ngIf="!s.cancelled" (click)="cancel(s.id)">Cancelar compra</button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 12px;
      }
      .grid {
        margin-top: 12px;
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      }
      .sale {
        min-width: 0;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      .sale mat-card-title {
        min-width: 0;
        max-width: 100%;
        line-height: 1.25;
      }
      .sale-title {
        overflow-wrap: anywhere;
        word-break: break-word;
        hyphens: auto;
        max-width: 100%;
      }
      .row {
        display: grid;
        grid-template-columns: 90px 1fr;
        gap: 8px;
        padding: 2px 0;
        min-width: 0;
      }
      .row .v {
        min-width: 0;
        overflow-wrap: anywhere;
      }
      .k {
        color: var(--app-text-muted);
      }
    `
  ]
})
export class OrdersListPage {
  readonly data = signal<ListSalesResponse | null>(null);

  private readonly http = inject(HttpClient);
  private readonly snack = inject(MatSnackBar);

  constructor() {
    this.load();
  }

  load() {
    const params = new HttpParams().set('_page', '1').set('_size', '20').set('_order', 'date desc');
    this.http.get<ListSalesResponse>('/api/Sales', { params }).subscribe({
      next: (res) => this.data.set(res),
      error: () => this.snack.open('Não foi possível carregar os pedidos.', 'OK', { duration: 2500 })
    });
  }

  cancel(id: string) {
    this.http.post(`/api/Sales/${id}/cancel`, {}).subscribe({
      next: () => {
        this.snack.open('Compra cancelada.', 'OK', { duration: 2500 });
        this.load();
      },
      error: () => this.snack.open('Não foi possível cancelar.', 'OK', { duration: 2500 })
    });
  }
}
