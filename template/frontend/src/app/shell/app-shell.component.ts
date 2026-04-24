import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../core/auth/auth.service';
import { CartService } from '../features/shop/cart.service';

@Component({
  standalone: true,
  selector: 'app-shell',
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatListModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule
  ],
  template: `
    <mat-sidenav-container class="layout">
      <mat-sidenav #sidenav mode="over" class="sidenav" [fixedInViewport]="true">
        <div class="brand">Avaliação Developer</div>
        <mat-nav-list>
          <ng-container *ngIf="auth.isCustomer()">
            <a mat-list-item routerLink="/loja" (click)="sidenav.close()">
              <mat-icon matListItemIcon>storefront</mat-icon>
              <span matListItemTitle>Loja</span>
            </a>
            <a mat-list-item routerLink="/carrinho" (click)="sidenav.close()">
              <span matListItemIcon class="nav-ico">
                <mat-icon
                  [matBadge]="cart.itemCount()"
                  [matBadgeHidden]="cart.itemCount() === 0"
                  matBadgeSize="small"
                  matBadgeColor="accent"
                  >shopping_cart</mat-icon
                >
              </span>
              <span matListItemTitle>Carrinho</span>
            </a>
            <a mat-list-item routerLink="/checkout" (click)="sidenav.close()">
              <mat-icon matListItemIcon>payments</mat-icon>
              <span matListItemTitle>Checkout</span>
            </a>
            <a mat-list-item routerLink="/pedidos" (click)="sidenav.close()">
              <mat-icon matListItemIcon>receipt_long</mat-icon>
              <span matListItemTitle>Meus pedidos</span>
            </a>
          </ng-container>
          <ng-container *ngIf="auth.isAdminOrManager()">
            <a mat-list-item routerLink="/dashboard" (click)="sidenav.close()">
              <mat-icon matListItemIcon>dashboard</mat-icon>
              <span matListItemTitle>Dashboard</span>
            </a>
            <a mat-list-item routerLink="/sales" (click)="sidenav.close()">
              <mat-icon matListItemIcon>analytics</mat-icon>
              <span matListItemTitle>Compras</span>
            </a>
            <a mat-list-item routerLink="/users/create" (click)="sidenav.close()">
              <mat-icon matListItemIcon>person_add</mat-icon>
              <span matListItemTitle>Novo usuário</span>
            </a>
            <a mat-list-item routerLink="/users" (click)="sidenav.close()">
              <mat-icon matListItemIcon>manage_accounts</mat-icon>
              <span matListItemTitle>Procurar usuário</span>
            </a>
          </ng-container>
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar class="toolbar">
          <button mat-icon-button (click)="sidenav.open()" aria-label="Abrir menu">
            <mat-icon>menu</mat-icon>
          </button>
          <span class="spacer"></span>
          <button mat-button [matMenuTriggerFor]="menu">
            <span class="who">{{ who() }}</span>
            <mat-icon>expand_more</mat-icon>
          </button>
          <mat-menu #menu="matMenu">
            <button mat-menu-item (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>Sair</span>
            </button>
          </mat-menu>
        </mat-toolbar>

        <main class="content">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [
    `
      .layout {
        min-height: 100dvh;
        background: var(--app-bg);
        color: var(--app-text);
      }
      .sidenav {
        width: 280px;
        background: var(--app-surface);
        border-right: 1px solid var(--app-border);
      }
      .brand {
        padding: 16px 16px 8px;
        font-weight: 600;
        letter-spacing: 0.2px;
        color: var(--ambev-blue);
      }
      .toolbar {
        position: sticky;
        top: 0;
        z-index: 5;
        background: rgba(255, 255, 255, 0.86);
        backdrop-filter: blur(10px);
        border-bottom: 1px solid var(--app-border);
      }
      .spacer {
        flex: 1;
      }
      .content {
        padding: 16px;
        max-width: 1200px;
        margin: 0 auto;
      }
      .nav-ico {
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .who {
        max-width: 220px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        display: inline-block;
        vertical-align: bottom;
      }
    `
  ]
})
export class AppShellComponent {
  readonly auth = inject(AuthService);
  readonly cart = inject(CartService);
  who = computed(() => this.auth.session()?.email ?? 'Usuário');

  logout() {
    this.auth.logout();
    this.cart.clear();
    location.href = '/login';
  }
}
