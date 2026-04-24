import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { CartService } from './cart.service';
import { LOJA_ONLINE_BRANCH } from './shop.constants';
import type { CreateSaleRequest } from '../sales/sales.api';

@Component({
  standalone: true,
  selector: 'app-checkout-page',
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatSnackBarModule, MatProgressSpinnerModule],
  template: `
    <h1>Checkout</h1>
    <mat-card *ngIf="cart.lines().length === 0">
      <mat-card-content>Não há itens no carrinho.</mat-card-content>
      <mat-card-actions>
        <a mat-button routerLink="/loja">Ir à loja</a>
      </mat-card-actions>
    </mat-card>

    <mat-card *ngIf="cart.lines().length">
      <mat-card-content>
        <p>Confirme o pedido. O cliente será a sua conta autenticada.</p>
        <ul>
          <li *ngFor="let l of cart.lines()">{{ l.productDescription }} × {{ l.quantity }}</li>
        </ul>
      </mat-card-content>
      <mat-card-actions align="end">
        <a mat-button routerLink="/carrinho">Voltar</a>
        <button mat-flat-button color="primary" type="button" [disabled]="loading()" (click)="submit()">
          <span *ngIf="!loading()">Confirmar pedido</span>
          <mat-spinner *ngIf="loading()" diameter="22"></mat-spinner>
        </button>
      </mat-card-actions>
    </mat-card>
  `
})
export class CheckoutPage {
  readonly cart = inject(CartService);
  readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);
  readonly loading = signal(false);

  submit() {
    const lines = this.cart.lines();
    if (!lines.length) return;
    const session = this.auth.session();
    if (!session?.userId) {
      this.snack.open('Sessão inválida. Entre novamente.', 'OK', { duration: 3500 });
      return;
    }
    this.loading.set(true);
    const body: CreateSaleRequest = {
      date: new Date().toISOString(),
      customerId: session.userId,
      customerDescription: session.name,
      branchId: LOJA_ONLINE_BRANCH.id,
      branchDescription: LOJA_ONLINE_BRANCH.description,
      items: lines.map((l) => ({
        productId: l.productId,
        productDescription: l.productDescription,
        quantity: l.quantity,
        unitPrice: l.unitPrice
      }))
    };
    this.http
      .post('/api/Sales', body)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.cart.clear();
          this.snack.open('Pedido registrado com sucesso.', 'OK', { duration: 2500 });
          this.router.navigateByUrl('/pedidos');
        },
        error: () => this.snack.open('Não foi possível finalizar o pedido.', 'OK', { duration: 3500 })
      });
  }
}
