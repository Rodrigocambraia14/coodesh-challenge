import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  standalone: true,
  selector: 'app-login-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatSelectModule
  ],
  template: `
    <div class="login" [class.show-login]="showLogin">
      <header class="brand-slot">
        <div class="brand" [class.show]="showLogin">
          <div class="mark" aria-hidden="true">
            <mat-icon class="beer-icon">liquor</mat-icon>
          </div>
          <div class="word" aria-label="ambev">
            <span class="l" style="--i: 0">a</span>
            <span class="l" style="--i: 1">m</span>
            <span class="l" style="--i: 2">b</span>
            <span class="l" style="--i: 3">e</span>
            <span class="l" style="--i: 4">v</span>
          </div>
        </div>
      </header>

      <div class="stage">
        <div class="intro" [class.hide]="introDone" [class.pass-through]="passThrough">
          <div class="intro-logo">
            <div class="mark" aria-hidden="true">
              <mat-icon class="beer-icon">liquor</mat-icon>
            </div>
            <div class="word" aria-label="ambev">
              <span class="l" style="--i: 0">a</span>
              <span class="l" style="--i: 1">m</span>
              <span class="l" style="--i: 2">b</span>
              <span class="l" style="--i: 3">e</span>
              <span class="l" style="--i: 4">v</span>
            </div>
          </div>
        </div>

        <mat-card *ngIf="showLogin" class="card">
        <mat-card-header>
          <mat-card-title>Avaliação Developer</mat-card-title>
          <mat-card-subtitle *ngIf="mode === 'login'">Entre para acessar o painel</mat-card-subtitle>
          <mat-card-subtitle *ngIf="mode === 'signup'">Crie sua conta para testar ponta a ponta</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form *ngIf="mode === 'login'" [formGroup]="loginForm" (ngSubmit)="onLogin()">
            <div class="server-validation" *ngIf="loginServerErrorLines().length" role="alert">
              <strong>Não foi possível entrar</strong>
              <ul>
                <li *ngFor="let line of loginServerErrorLines()">{{ line }}</li>
              </ul>
            </div>
            <mat-form-field appearance="outline" class="field">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" autocomplete="email" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="field">
              <mat-label>Senha</mat-label>
              <input matInput type="password" formControlName="password" autocomplete="current-password" />
            </mat-form-field>

            <button
              mat-flat-button
              color="primary"
              class="submit"
              type="submit"
              [disabled]="loginForm.invalid || loading()"
            >
              <span *ngIf="!loading()">Entrar</span>
              <mat-spinner *ngIf="loading()" diameter="18"></mat-spinner>
            </button>
          </form>

          <form *ngIf="mode === 'signup'" [formGroup]="signupForm" (ngSubmit)="onSignup()">
            <div class="server-validation" *ngIf="signupServerErrorLines().length" role="alert">
              <strong>Corrija os seguintes pontos</strong>
              <ul>
                <li *ngFor="let line of signupServerErrorLines()">{{ line }}</li>
              </ul>
            </div>
            <p class="signup-role-note">
              <mat-icon class="signup-role-note-icon">info</mat-icon>
              <span>
                Optei por permitir a seleção de perfil diretamente no modo público de cadastro por se tratar de um desafio técnico. Em um case real, haveria um sistema interno / backoffice para controle de perfis administrativos / de gerenciamento, apartado do sistema público de marketplace.
              </span>
            </p>
            <div class="grid">
              <mat-form-field appearance="outline" class="field">
                <mat-label>Nome</mat-label>
                <input matInput formControlName="username" autocomplete="name" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="field">
                <mat-label>Telefone</mat-label>
                <input matInput formControlName="phone" autocomplete="tel" />
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="field">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" autocomplete="email" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="field">
              <mat-label>Senha</mat-label>
              <input matInput type="password" formControlName="password" autocomplete="new-password" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="field">
              <mat-label>Perfil</mat-label>
              <mat-select formControlName="role">
                <mat-option [value]="1">Cliente</mat-option>
                <mat-option [value]="2">Gestor</mat-option>
                <mat-option [value]="3">Administrador</mat-option>
                <mat-option [value]="0">Nenhum</mat-option>
              </mat-select>
            </mat-form-field>

            <button
              mat-flat-button
              color="primary"
              class="submit"
              type="submit"
              [disabled]="signupForm.invalid || loading()"
            >
              <span *ngIf="!loading()">Criar conta</span>
              <mat-spinner *ngIf="loading()" diameter="18"></mat-spinner>
            </button>
          </form>

          <mat-divider class="divider"></mat-divider>

          <div class="switch">
            <button mat-stroked-button type="button" (click)="switchMode(mode === 'login' ? 'signup' : 'login')">
              {{ mode === 'login' ? 'Criar conta' : 'Já tenho conta' }}
            </button>
          </div>
        </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [
    `
      .login {
        height: 100dvh;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        padding: 16px 20px 24px;
        background: radial-gradient(900px 520px at 50% 0%, rgba(39, 51, 134, 0.14), transparent 55%), var(--app-bg);
        overflow: hidden;
      }

      .brand-slot {
        flex: 0 0 auto;
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        min-height: 0;
      }

      .brand {
        display: grid;
        place-items: center;
        gap: 10px;
        max-height: 0;
        opacity: 0;
        overflow: hidden;
        transform: translateY(-6px);
        transition: max-height 650ms ease, opacity 650ms ease, transform 650ms cubic-bezier(0.2, 0.9, 0.2, 1);
        pointer-events: none;
      }
      .brand.show {
        max-height: 220px;
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
      }
      .brand .mark {
        width: 84px;
        height: 84px;
        border-radius: 22px;
        background: var(--ambev-blue);
        display: grid;
        place-items: center;
        box-shadow: 0 10px 28px rgba(39, 51, 134, 0.28);
      }
      .brand .beer-icon {
        width: 48px;
        height: 48px;
        font-size: 48px;
        color: var(--ambev-light);
      }
      .brand .word {
        font-size: clamp(34px, 5.5vw, 48px);
        gap: 3px;
      }
      .brand .l {
        opacity: 1;
        transform: none;
        animation: none;
        cursor: pointer;
        user-select: none;
        display: inline-block;
      }
      .brand .l:hover {
        animation: letterSillyHop 0.55s cubic-bezier(0.33, 1.18, 0.32, 1) infinite;
      }

      .stage {
        position: relative;
        flex: 1 1 auto;
        min-height: 0;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .card {
        position: relative;
        z-index: 1;
        width: 100%;
        max-width: 420px;
        background: var(--app-surface);
        border: 1px solid var(--app-border);
        box-shadow: 0 12px 40px rgba(35, 35, 35, 0.06);
        opacity: 0;
        transform: translateY(12px);
        transition: opacity 700ms ease, transform 700ms cubic-bezier(0.2, 0.9, 0.2, 1);
      }
      .login.show-login .card {
        opacity: 1;
        transform: translateY(0);
      }
      form {
        display: grid;
        gap: 14px;
        margin-top: 12px;
      }
      .grid {
        display: grid;
        gap: 12px;
        grid-template-columns: 1fr 1fr;
      }
      @media (max-width: 520px) {
        .grid {
          grid-template-columns: 1fr;
        }
      }
      .field {
        width: 100%;
      }
      .signup-role-note {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        margin: 0 0 14px;
        padding: 12px 14px;
        border-radius: 8px;
        background: color-mix(in srgb, var(--mat-sys-primary, #6750a4) 8%, transparent);
        border-left: 4px solid var(--mat-sys-primary, #6750a4);
        font-size: 0.875rem;
        line-height: 1.45;
        color: var(--mat-sys-color-on-surface, #1b1b1b);
      }
      .signup-role-note-icon {
        flex-shrink: 0;
        margin-top: 1px;
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: var(--mat-sys-primary, #6750a4);
      }
      .submit {
        height: 44px;
      }
      .server-validation {
        margin-bottom: 14px;
        padding: 12px 14px;
        border-radius: 8px;
        border: 1px solid color-mix(in srgb, var(--mat-sys-color-error, #b3261e) 40%, transparent);
        background: color-mix(in srgb, var(--mat-sys-color-error, #b3261e) 8%, transparent);
        color: var(--mat-sys-color-on-surface, #1b1b1b);
        font-size: 14px;
        line-height: 1.45;
      }
      .server-validation strong {
        display: block;
        margin-bottom: 2px;
        color: var(--mat-sys-color-error, #b3261e);
      }
      .server-validation ul {
        margin: 8px 0 0;
        padding-left: 1.1rem;
      }
      .server-validation li + li {
        margin-top: 4px;
      }
      .divider {
        margin: 16px 0 10px;
        opacity: 0.35;
      }
      .switch {
        display: flex;
        justify-content: center;
      }

      .intro {
        position: absolute;
        inset: 0;
        z-index: 2;
        display: grid;
        place-items: center;
        background: var(--app-bg);
        transition: opacity 600ms ease, visibility 600ms ease;
        overflow: hidden;
      }
      .intro.pass-through {
        pointer-events: none;
      }
      .intro.hide {
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
      }
      .intro-logo {
        display: grid;
        gap: 18px;
        place-items: center;
        transform: translateY(10px);
        animation: introRise 480ms cubic-bezier(0.2, 0.9, 0.2, 1) forwards;
      }
      .mark {
        width: 168px;
        height: 168px;
        border-radius: 36px;
        background: var(--ambev-blue);
        box-shadow: 0 18px 60px rgba(39, 51, 134, 0.6);
        display: grid;
        place-items: center;
        animation: markPop 520ms cubic-bezier(0.2, 0.9, 0.2, 1) forwards;
      }
      .intro-logo .beer-icon {
        width: 88px;
        height: 88px;
        font-size: 88px;
        line-height: 88px;
        color: var(--ambev-light);
        opacity: 0;
        transform: translateY(6px) scale(0.98);
        animation: beerIn 380ms cubic-bezier(0.2, 0.9, 0.2, 1) 100ms forwards;
      }
      .intro-logo .word {
        font-size: clamp(72px, 12vw, 118px);
      }
      .word {
        font-family: 'DIN Next Rounded', system-ui, sans-serif;
        font-weight: 700;
        font-size: clamp(56px, 8vw, 92px);
        letter-spacing: -1px;
        color: var(--ambev-blue);
        line-height: 1;
        display: flex;
        gap: 2px;
        align-items: baseline;
        justify-content: center;
      }
      .l {
        display: inline-block;
        opacity: 0;
        transform: translateY(22px);
        animation: letterBounceGravity 480ms linear calc(120ms + (var(--i) * 45ms)) forwards;
        will-change: transform;
      }

      @keyframes letterSillyHop {
        0% {
          transform: translateY(0) rotate(0deg) scale(1);
        }
        20% {
          transform: translateY(-10px) rotate(-7deg) scale(1.05);
        }
        40% {
          transform: translateY(2px) rotate(6deg) scale(0.96);
        }
        60% {
          transform: translateY(-6px) rotate(-4deg) scale(1.03);
        }
        80% {
          transform: translateY(3px) rotate(3deg) scale(0.98);
        }
        100% {
          transform: translateY(0) rotate(0deg) scale(1);
        }
      }
      @keyframes introRise {
        to {
          transform: translateY(0);
        }
      }
      @keyframes markPop {
        0% {
          transform: scale(0.92);
          opacity: 0.2;
        }
        60% {
          transform: scale(1.02);
          opacity: 1;
        }
        100% {
          transform: scale(1);
        }
      }
      @keyframes beerIn {
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      /* smooth "gravity" bounce: quick up, slower fall, tiny settle */
      @keyframes letterBounceGravity {
        0% {
          opacity: 0;
          transform: translateY(22px);
          animation-timing-function: cubic-bezier(0.12, 0.86, 0.25, 1);
        }
        18% {
          opacity: 1;
          transform: translateY(0);
          animation-timing-function: cubic-bezier(0.2, 0.6, 0.2, 1);
        }
        38% {
          transform: translateY(-10px);
          animation-timing-function: cubic-bezier(0.1, 0.9, 0.2, 1);
        }
        62% {
          transform: translateY(0);
          animation-timing-function: cubic-bezier(0.2, 0.6, 0.2, 1);
        }
        78% {
          transform: translateY(-4px);
          animation-timing-function: cubic-bezier(0.1, 0.9, 0.2, 1);
        }
        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .intro-logo,
        .mark,
        .beer-icon,
        .l {
          animation: none !important;
          transform: none !important;
          opacity: 1 !important;
        }
        .brand .l:hover {
          animation: none !important;
        }
        .intro {
          transition: none !important;
        }
      }
    `
  ]
})
export class LoginPage {
  readonly loading = signal(false);
  /** Server-side validation keyed by field (camelCase), e.g. password. */
  readonly signupServerErrors = signal<Record<string, string[]>>({});
  readonly loginServerErrors = signal<Record<string, string[]>>({});

  introDone = false;
  showLogin = false;
  passThrough = false;

  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);
  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);

  mode: 'login' | 'signup' = 'login';

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(3)]]
  });

  signupForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.required, Validators.minLength(8)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(3)]],
    role: [1, [Validators.required]]
  });

  private readonly fieldLabels: Record<string, string> = {
    password: 'Senha',
    email: 'E-mail',
    username: 'Nome',
    phone: 'Telefone',
    role: 'Perfil'
  };

  constructor() {
    // 1) Intro anima (~1s CSS) + pausa 2s — card fora do DOM (*ngIf showLogin)
    // 2) introDone: overlay faz fade-out opaco até invisível (introFadeOutMs)
    // 3) Só então showLogin + passThrough: card entra e overlay não bloqueia cliques
    const introPhaseMs = 1000;
    const delayBeforeLoginCardMs = 2000;
    const introFadeOutMs = 600;

    const introExitAt = introPhaseMs + delayBeforeLoginCardMs;

    window.setTimeout(() => {
      this.zone.run(() => {
        this.introDone = true;
        this.cdr.markForCheck();
      });
    }, introExitAt);

    window.setTimeout(() => {
      this.zone.run(() => {
        this.showLogin = true;
        this.passThrough = true;
        this.cdr.markForCheck();
      });
    }, introExitAt + introFadeOutMs);
  }

  switchMode(next: 'login' | 'signup') {
    this.mode = next;
    this.loading.set(false);
    this.signupServerErrors.set({});
    this.loginServerErrors.set({});
  }

  signupServerErrorLines(): string[] {
    return this.serverValidationLines(this.signupServerErrors());
  }

  loginServerErrorLines(): string[] {
    return this.serverValidationLines(this.loginServerErrors());
  }

  onLogin() {
    if (this.loginForm.invalid || this.loading()) return;
    this.loading.set(true);
    this.loginServerErrors.set({});

    const { email, password } = this.loginForm.getRawValue();

    this.auth
      .login({ email: email!, password: password! })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => this.navigateAfterAuth(),
        error: (err) => this.handleLoginHttpError(err as HttpErrorResponse)
      });
  }

  onSignup() {
    if (this.signupForm.invalid || this.loading()) return;
    this.loading.set(true);
    this.signupServerErrors.set({});

    const v = this.signupForm.getRawValue();
    const body = {
      username: v.username!,
      email: v.email!,
      phone: v.phone!,
      password: v.password!,
      status: 1,
      role: v.role!
    };

    this.http
      .post<{ success: boolean; message?: string; data?: any }>('/api/Users', body)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.signupServerErrors.set({});
          // auto-login after signup to test end-to-end flow
          this.auth.login({ email: v.email!, password: v.password! }).subscribe({
            next: () => this.navigateAfterAuth(),
            error: () =>
              this.snack.open('Conta criada, mas falhou ao autenticar. Tente entrar.', 'OK', { duration: 3500 })
          });
        },
        error: (err) => this.handleSignupHttpError(err as HttpErrorResponse)
      });
  }

  private navigateAfterAuth() {
    const s = this.auth.session();
    const role = (s?.role ?? '').trim();

    if (this.auth.isAdminOrManager()) {
      this.router.navigateByUrl('/dashboard');
      return;
    }

    if (this.auth.isCustomer()) {
      this.router.navigateByUrl('/loja');
      return;
    }

    // Avoid loops when role is None/unknown.
    this.auth.logout();
    const msg = role ? `Seu usuário está sem permissão (perfil: ${role}).` : 'Seu usuário está sem permissão.';
    this.snack.open(`${msg} Entre novamente com outro usuário.`, 'OK', { duration: 4500 });
    this.router.navigateByUrl('/login');
  }

  private serverValidationLines(by: Record<string, string[]>): string[] {
    return Object.entries(by).flatMap(([key, msgs]) => {
      const label = key === '_' ? '' : (this.fieldLabels[key] ?? this.formatFieldLabel(key));
      return msgs.map((m) => (label ? `${label}: ${m}` : m));
    });
  }

  private formatFieldLabel(key: string): string {
    if (!key) return '';
    return key.charAt(0).toUpperCase() + key.slice(1);
  }

  private parseValidationErrors(err: HttpErrorResponse): Record<string, string[]> {
    const out: Record<string, string[]> = {};
    const push = (key: string, msg: string) => {
      const t = msg.trim();
      if (!t) return;
      if (!out[key]) out[key] = [];
      if (!out[key].includes(t)) out[key].push(t);
    };

    type Row = {
      propertyName?: string;
      propertyname?: string;
      errorMessage?: string;
      errormessage?: string;
      detail?: string;
      error?: string;
    };

    const body = err.error;
    const rows: Row[] = [];
    if (Array.isArray(body)) {
      rows.push(...(body as Row[]));
    } else if (body && typeof body === 'object') {
      const o = body as { errors?: Row[]; Errors?: Row[]; message?: string; Message?: string };
      const arr = o.errors ?? o.Errors;
      if (Array.isArray(arr)) rows.push(...arr);
      else {
        const msg = (o.message ?? o.Message)?.trim();
        if (msg) push('_', msg);
      }
    }

    for (const row of rows) {
      const msg = (row.errorMessage ?? row.errormessage ?? row.detail ?? row.error ?? '').trim();
      if (!msg) continue;
      const raw = (row.propertyName ?? row.propertyname ?? '').trim();
      const key = raw ? raw.charAt(0).toLowerCase() + raw.slice(1) : '_';
      push(key, msg);
    }

    return out;
  }

  private handleSignupHttpError(err: HttpErrorResponse) {
    const parsed = this.parseValidationErrors(err);
    if (Object.keys(parsed).length) {
      this.signupServerErrors.set(parsed);
      return;
    }
    this.snack.open('Falha ao criar conta. Verifique os dados e tente novamente.', 'OK', { duration: 4500 });
  }

  private handleLoginHttpError(err: HttpErrorResponse) {
    const parsed = this.parseValidationErrors(err);
    if (Object.keys(parsed).length) {
      this.loginServerErrors.set(parsed);
      return;
    }
    this.snack.open('Falha ao autenticar. Verifique suas credenciais.', 'OK', { duration: 3500 });
  }
}

