import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CartService, type CatalogProduct } from './cart.service';
import { precoUnitarioPorCategoria } from './shop.constants';
import { ProductsApi } from '../../shared/data/products.api';

@Component({
  standalone: true,
  selector: 'app-catalog-page',
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="head">
      <h1>Loja</h1>
      <a mat-stroked-button routerLink="/carrinho">
        <mat-icon>shopping_cart</mat-icon>
        Carrinho ({{ cart.itemCount() }})
      </a>
    </div>
    <p class="hint">Produtos do catálogo. Adicione ao carrinho e finalize em Checkout.</p>

    <div class="loading" *ngIf="loading()">
      <mat-spinner diameter="40"></mat-spinner>
    </div>

    <div class="grid" *ngIf="!loading()">
      <mat-card class="p" *ngFor="let p of products()">
        <mat-card-title>{{ p.name }}</mat-card-title>
        <mat-card-subtitle>{{ p.category }}</mat-card-subtitle>
        <mat-card-content>
          <div class="price">
            {{ preco(p) | currency: 'BRL' }}
          </div>
        </mat-card-content>
        <mat-card-actions align="end">
          <button mat-flat-button color="primary" type="button" (click)="add(p)">
            <mat-icon>add_shopping_cart</mat-icon>
            Adicionar
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 8px;
      }
      h1 {
        margin: 0;
        font-size: 1.35rem;
      }
      .hint {
        color: var(--app-text-muted);
        margin: 0 0 16px;
      }
      .loading {
        display: flex;
        justify-content: center;
        padding: 40px;
      }
      .grid {
        display: grid;
        gap: 14px;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      }
      .price {
        font-weight: 600;
        font-size: 1.1rem;
      }
    `
  ]
})
export class CatalogPage {
  readonly products = signal<CatalogProduct[]>([]);
  readonly loading = signal(true);
  readonly cart = inject(CartService);
  preco = (p: CatalogProduct) => precoUnitarioPorCategoria(p.category);

  private readonly productsApi = inject(ProductsApi);
  private readonly snack = inject(MatSnackBar);

  constructor() {
    this.productsApi
      .list()
      .pipe(
        takeUntilDestroyed(),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (list) => this.products.set(list),
        error: () => this.snack.open('Não foi possível carregar os produtos.', 'OK', { duration: 3500 })
      });
  }

  add(p: CatalogProduct) {
    this.cart.addProduct(p, 1);
    this.snack.open(`${p.name} adicionado ao carrinho.`, 'OK', { duration: 2000 });
  }
}
