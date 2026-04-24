import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { CartService } from './cart.service';

@Component({
  standalone: true,
  selector: 'app-cart-page',
  imports: [
    CommonModule,
    CurrencyPipe,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],
  template: `
    <div class="head">
      <h1>Carrinho</h1>
      <a mat-stroked-button routerLink="/loja">Continuar comprando</a>
    </div>

    <mat-card *ngIf="cart.lines().length === 0">
      <mat-card-content>Seu carrinho está vazio.</mat-card-content>
    </mat-card>

    <div class="stack" *ngIf="cart.lines().length">
      <mat-card *ngFor="let line of cart.lines()">
        <mat-card-content class="row">
          <div class="info">
            <div class="t">{{ line.productDescription }}</div>
            <div class="m">{{ line.unitPrice | currency: 'BRL' }} cada</div>
          </div>
          <mat-form-field appearance="outline" class="qty">
            <mat-label>Qtd</mat-label>
            <input
              matInput
              type="number"
              min="1"
              [ngModel]="line.quantity"
              (ngModelChange)="onQty(line.productId, $event)"
            />
          </mat-form-field>
          <div class="sub">{{ line.quantity * line.unitPrice | currency: 'BRL' }}</div>
          <button mat-icon-button type="button" (click)="cart.removeLine(line.productId)" aria-label="Remover">
            <mat-icon>delete</mat-icon>
          </button>
        </mat-card-content>
      </mat-card>

      <div class="actions">
        <a mat-flat-button color="primary" routerLink="/checkout">Finalizar compra</a>
      </div>
    </div>
  `,
  styles: [
    `
      .head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 16px;
      }
      .stack {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .row {
        display: flex;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
      }
      .info {
        flex: 1 1 160px;
        min-width: 0;
      }
      .t {
        font-weight: 600;
      }
      .m {
        font-size: 13px;
        color: var(--app-text-muted);
      }
      .qty {
        width: 100px;
      }
      .sub {
        font-weight: 600;
        min-width: 88px;
        text-align: right;
      }
      .actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 8px;
      }
    `
  ]
})
export class CartPage {
  readonly cart = inject(CartService);

  onQty(productId: string, raw: string | number) {
    const n = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
    this.cart.setQuantity(productId, Number.isFinite(n) ? n : 1);
  }
}
