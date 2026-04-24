import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import type { ListSalesResponse } from './sales.api';

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
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="header">
      <h2>Compras</h2>
      <a mat-flat-button color="primary" routerLink="/sales/create">
        <mat-icon>add</mat-icon>
        Nova compra
      </a>
    </div>

    <mat-card>
      <mat-card-content>
        <form class="filters" [formGroup]="filters" (ngSubmit)="load()">
          <mat-form-field appearance="outline">
            <mat-label>Número da venda</mat-label>
            <input matInput formControlName="saleNumber" placeholder="S-..." />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Cliente</mat-label>
            <input matInput formControlName="customerDescription" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Cancelada</mat-label>
            <mat-select formControlName="cancelled">
              <mat-option [value]="''">Qualquer</mat-option>
              <mat-option [value]="'true'">Sim</mat-option>
              <mat-option [value]="'false'">Não</mat-option>
            </mat-select>
          </mat-form-field>
          <button mat-stroked-button type="submit">Aplicar</button>
        </form>
      </mat-card-content>
    </mat-card>

    <div class="grid">
      <mat-card *ngFor="let s of data()?.data" class="sale">
        <mat-card-title>{{ s.saleNumber }}</mat-card-title>
        <mat-card-subtitle>{{ s.date | date: 'short' }}</mat-card-subtitle>
        <mat-card-content>
          <div class="row"><span class="k">Cliente</span><span class="v">{{ s.customerDescription }}</span></div>
          <div class="row"><span class="k">Filial</span><span class="v">{{ s.branchDescription }}</span></div>
          <div class="row"><span class="k">Total</span><span class="v">{{ s.totalSaleAmount | currency: 'BRL' }}</span></div>
          <div class="row"><span class="k">Cancelada</span><span class="v">{{ s.cancelled ? 'Sim' : 'Não' }}</span></div>
        </mat-card-content>
        <mat-card-actions align="end">
          <a mat-button [routerLink]="['/sales', s.id]">Detalhes</a>
          <a mat-button [routerLink]="['/sales', s.id, 'edit']">Editar</a>
          <button mat-button color="warn" (click)="cancel(s.id)">Cancelar compra</button>
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
      .filters {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        align-items: end;
      }
      @media (max-width: 900px) {
        .filters {
          grid-template-columns: 1fr;
        }
      }
      .grid {
        margin-top: 12px;
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      @media (max-width: 1100px) {
        .grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      @media (max-width: 720px) {
        .grid {
          grid-template-columns: 1fr;
        }
      }
      .row {
        display: grid;
        grid-template-columns: 90px 1fr;
        gap: 8px;
        padding: 2px 0;
      }
      .k {
        color: var(--app-text-muted);
      }
    `
  ]
})
export class SalesListPage {
  readonly data = signal<ListSalesResponse | null>(null);

  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly snack = inject(MatSnackBar);

  filters = this.fb.group({
    saleNumber: [''],
    customerDescription: [''],
    cancelled: ['']
  });

  constructor() {
    this.load();
  }

  load() {
    const v = this.filters.getRawValue();
    let params = new HttpParams().set('_page', '1').set('_size', '12').set('_order', 'date desc');

    if (v.saleNumber) params = params.set('saleNumber', v.saleNumber);
    if (v.customerDescription) params = params.set('customerDescription', v.customerDescription);
    if (v.cancelled) params = params.set('cancelled', v.cancelled);

    this.http.get<ListSalesResponse>('/api/Sales', { params }).subscribe({
      next: (res) => this.data.set(res),
      error: () => this.snack.open('Não foi possível carregar as compras.', 'OK', { duration: 2500 })
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

