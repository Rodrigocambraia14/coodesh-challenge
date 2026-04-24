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
import type { ApiResponseWithData, CreateSaleRequest, PreviewSaleResponse } from '../sales/sales.api';
import { SalesPreviewApi } from '../sales/sales-preview.api';

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
        <p>Passo 1 — Revisar itens</p>
        <ul>
          <li *ngFor="let l of cart.lines()">{{ l.productDescription }} × {{ l.quantity }}</li>
        </ul>
      </mat-card-content>
      <mat-card-actions align="end">
        <a mat-button routerLink="/carrinho">Voltar</a>
        <button mat-stroked-button type="button" [disabled]="loading() || previewLoading()" (click)="runPreview()">
          <span *ngIf="!previewLoading()">Calcular descontos</span>
          <mat-spinner *ngIf="previewLoading()" diameter="20"></mat-spinner>
        </button>
      </mat-card-actions>
    </mat-card>

    <mat-card *ngIf="preview() as p">
      <mat-card-content>
        <p>Passo 2 — Descontos e validação</p>

        <div class="alert" *ngIf="p.isBlocked">
          Existem itens que infringem regras e precisam ser ajustados antes de finalizar.
        </div>

        <div class="summary">
          <div class="row">
            <span class="k">Total bruto</span><span class="v">{{ p.summary.grossTotal | number : '1.2-2' }}</span>
          </div>
          <div class="row">
            <span class="k">Desconto</span><span class="v">- {{ p.summary.discountTotal | number : '1.2-2' }}</span>
          </div>
          <div class="row">
            <span class="k">Total líquido</span><span class="v strong">{{ p.summary.netTotal | number : '1.2-2' }}</span>
          </div>
        </div>

        <div class="items">
          <div class="it" *ngFor="let it of p.items">
            <div class="top">
              <div class="name">{{ it.productDescription }}</div>
              <span class="badge" [class.bad]="it.status === 'Blocked'">{{ it.status === 'Blocked' ? 'BLOQUEADO' : 'OK' }}</span>
            </div>
            <div class="meta">
              <span>Qtd: {{ it.quantity }}</span>
              <span>Unit: {{ it.unitPrice | number : '1.2-2' }}</span>
              <span>Desc: {{ (it.discountRate * 100) | number : '1.0-2' }}%</span>
              <span>Líquido: {{ it.netAmount | number : '1.2-2' }}</span>
            </div>
            <ul class="reasons">
              <li *ngFor="let r of it.reasons">{{ r.message }}</li>
            </ul>
          </div>
        </div>
      </mat-card-content>
      <mat-card-actions align="end">
        <a mat-button routerLink="/carrinho">Voltar ao carrinho</a>
        <button mat-flat-button color="primary" type="button" [disabled]="loading() || p.isBlocked" (click)="submit()">
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
  private readonly previewApi = inject(SalesPreviewApi);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);
  readonly loading = signal(false);
  readonly previewLoading = signal(false);
  readonly preview = signal<PreviewSaleResponse | null>(null);

  private buildRequestBody(): CreateSaleRequest | null {
    const lines = this.cart.lines();
    if (!lines.length) return null;
    const session = this.auth.session();
    if (!session?.userId) return null;

    return {
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
  }

  runPreview() {
    const body = this.buildRequestBody();
    if (!body) {
      this.snack.open('Sessão inválida. Entre novamente.', 'OK', { duration: 3500 });
      return;
    }

    this.previewLoading.set(true);
    this.previewApi
      .preview(body)
      .pipe(finalize(() => this.previewLoading.set(false)))
      .subscribe({
        next: (res) => this.preview.set(res.data ?? null),
        error: (err: any) => {
          const data = (err?.error as ApiResponseWithData<PreviewSaleResponse> | undefined)?.data;
          if (data) {
            this.preview.set(data);
            return;
          }
          this.snack.open('Não foi possível calcular os descontos.', 'OK', { duration: 3500 });
        }
      });
  }

  submit() {
    const body = this.buildRequestBody();
    if (!body) {
      this.snack.open('Sessão inválida. Entre novamente.', 'OK', { duration: 3500 });
      return;
    }

    const p = this.preview();
    if (!p) {
      this.snack.open('Antes de finalizar, calcule os descontos.', 'OK', { duration: 3500 });
      return;
    }
    if (p.isBlocked) {
      this.snack.open('Existem itens bloqueados. Ajuste o carrinho para continuar.', 'OK', { duration: 3500 });
      return;
    }

    this.loading.set(true);
    this.http
      .post('/api/Sales', body)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.cart.clear();
          this.preview.set(null);
          this.snack.open('Pedido registrado com sucesso.', 'OK', { duration: 2500 });
          this.router.navigateByUrl('/pedidos');
        },
        error: (err: any) => {
          const data = (err?.error as ApiResponseWithData<PreviewSaleResponse> | undefined)?.data;
          if (data) {
            this.preview.set(data);
            this.snack.open('Existem itens bloqueados. Ajuste o carrinho para continuar.', 'OK', { duration: 4000 });
            return;
          }
          this.snack.open('Não foi possível finalizar o pedido.', 'OK', { duration: 3500 });
        }
      });
  }
}
