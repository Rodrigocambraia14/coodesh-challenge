import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';

type ApiResponseWithData<T> = { success: boolean; message?: string; data?: T };
type CreateUserResponse = { id: string; name: string; email: string; phone: string; role: number; status: number };

@Component({
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSnackBarModule,
    MatIconModule
  ],
  template: `
    <mat-card>
      <mat-card-title>Novo usuário</mat-card-title>
      <mat-card-content>
        <p class="role-note">
          <mat-icon class="role-note-icon">info</mat-icon>
          <span>
            <strong>Ambiente de teste:</strong> o <strong>Perfil</strong> pode ser escolhido aqui para validar fluxos de Cliente, Gestor ou Administrador.
            Num sistema real, contas de <strong>Gestor</strong> e <strong>Administrador</strong> seriam criadas por um <strong>processo interno</strong> (IT, RH ou ferramenta corporativa), e não por um formulário público como este — o auto-registo cobriria sobretudo <strong>Clientes</strong>.
          </span>
        </p>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="grid">
            <mat-form-field appearance="outline">
              <mat-label>Nome de usuário</mat-label>
              <input matInput formControlName="username" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Telefone</mat-label>
              <input matInput formControlName="phone" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Senha</mat-label>
              <input matInput type="password" formControlName="password" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Estado</mat-label>
              <mat-select formControlName="status">
                <mat-option [value]="1">Ativo</mat-option>
                <mat-option [value]="2">Inativo</mat-option>
                <mat-option [value]="3">Suspenso</mat-option>
                <mat-option [value]="0">Desconhecido</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Perfil</mat-label>
              <mat-select formControlName="role">
                <mat-option [value]="1">Cliente</mat-option>
                <mat-option [value]="2">Gestor</mat-option>
                <mat-option [value]="3">Administrador</mat-option>
                <mat-option [value]="0">Nenhum</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">Criar</button>
        </form>

        <div *ngIf="created as c" class="created">
          <div><strong>Criado:</strong> {{ c.id }}</div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      form {
        display: grid;
        gap: 16px;
      }
      .grid {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      @media (max-width: 720px) {
        .grid {
          grid-template-columns: 1fr;
        }
      }
      .created {
        margin-top: 12px;
        color: var(--app-text-muted);
      }
      .role-note {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        margin: 0 0 16px;
        padding: 12px 14px;
        border-radius: 8px;
        background: color-mix(in srgb, var(--mat-sys-primary, #6750a4) 8%, transparent);
        border-left: 4px solid var(--mat-sys-primary, #6750a4);
        font-size: 0.9rem;
        line-height: 1.45;
      }
      .role-note-icon {
        flex-shrink: 0;
        margin-top: 2px;
        font-size: 22px;
        width: 22px;
        height: 22px;
        color: var(--mat-sys-primary, #6750a4);
      }
    `
  ]
})
export class UserCreatePage {
  created: CreateUserResponse | null = null;

  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly snack = inject(MatSnackBar);

  form = this.fb.group({
    username: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required]],
    password: ['', [Validators.required]],
    status: [1, [Validators.required]],
    role: [1, [Validators.required]]
  });

  submit() {
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    const body = {
      username: v.username!,
      email: v.email!,
      phone: v.phone!,
      password: v.password!,
      status: v.status!,
      role: v.role!
    };

    this.http.post<ApiResponseWithData<CreateUserResponse>>('/api/Users', body).subscribe({
      next: (res) => {
        this.created = res.data ?? null;
        this.snack.open('Usuário criado.', 'OK', { duration: 2500 });
      },
      error: () => this.snack.open('Não foi possível criar o usuário.', 'OK', { duration: 2500 })
    });
  }
}

