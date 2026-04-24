import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, type PageEvent } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { HttpClient } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, startWith, switchMap } from 'rxjs';
import { AdminLookupApi, type UserListRow } from '../../shared/data/admin-lookup.api';

type ApiResponseWithData<T> = { success: boolean; message?: string; data?: T };
type GetUserResponse = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: number;
  status: number;
};

type UpdateUserRequest = { username: string; email: string; phone: string; role: number; status: number };

@Component({
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatDialogModule
  ],
  template: `
    <mat-card>
      <mat-card-title>Procurar usuário</mat-card-title>
      <mat-card-content>
        <div class="toolbar">
          <mat-form-field appearance="outline" class="field">
            <mat-label>Filtrar por nome ou email</mat-label>
            <input matInput [formControl]="filterCtrl" placeholder="Ex.: maria, @empresa.com" />
            <button
              mat-icon-button
              matSuffix
              type="button"
              aria-label="Limpar filtro"
              *ngIf="filterCtrl.value.length > 0"
              (click)="clearFilter()"
            >
              <mat-icon>close</mat-icon>
            </button>
          </mat-form-field>
          <button mat-stroked-button type="button" (click)="reload()">Atualizar</button>
        </div>

        <div class="table-wrap" *ngIf="users.length > 0; else empty">
          <table mat-table [dataSource]="users" class="table">
            <ng-container matColumnDef="username">
              <th mat-header-cell *matHeaderCellDef>Nome</th>
              <td mat-cell *matCellDef="let u" class="cell-text cell-name" [title]="u.username">{{ u.username }}</td>
            </ng-container>

            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>Email</th>
              <td mat-cell *matCellDef="let u" class="cell-text cell-email" [title]="u.email">{{ u.email }}</td>
            </ng-container>

            <ng-container matColumnDef="role">
              <th mat-header-cell *matHeaderCellDef>Perfil</th>
              <td mat-cell *matCellDef="let u">{{ roleLabel(u.role) }}</td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let u">{{ statusLabel(u.status) }}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="cell-actions">Ações</th>
              <td mat-cell *matCellDef="let u" class="cell-actions">
                <button mat-button type="button" (click)="openDetails(u)">Detalhes</button>
                <button mat-button type="button" (click)="openEdit(u)">Editar</button>
                <button
                  mat-button
                  type="button"
                  [color]="isActive(u) ? 'warn' : undefined"
                  (click)="confirmToggleActive(u)"
                >
                  {{ isActive(u) ? 'Desativar' : 'Ativar' }}
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
          </table>
        </div>
        <ng-template #empty>
          <div class="empty">Nenhum usuário encontrado.</div>
        </ng-template>

        <mat-paginator
          class="paginator"
          [length]="totalItems"
          [pageIndex]="page - 1"
          [pageSize]="pageSize"
          [pageSizeOptions]="[10, 20, 50, 100]"
          (page)="onPage($event)"
          aria-label="Paginação de usuários"
        />

        <div *ngIf="user as u" class="result">
          <div class="row"><span class="k">Nome</span><span class="v">{{ u.name }}</span></div>
          <div class="row"><span class="k">Email</span><span class="v">{{ u.email }}</span></div>
          <div class="row"><span class="k">Telefone</span><span class="v">{{ u.phone }}</span></div>
          <div class="row"><span class="k">Perfil</span><span class="v">{{ u.role }}</span></div>
          <div class="row"><span class="k">Estado</span><span class="v">{{ u.status }}</span></div>
          <button mat-stroked-button color="warn" (click)="deleteUser()">
            <mat-icon>delete</mat-icon>
            Excluir
          </button>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .toolbar {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        align-items: flex-start;
      }
      .field {
        flex: 1;
        min-width: 260px;
      }
      .table-wrap {
        margin-top: 8px;
        border-radius: 8px;
        overflow: auto;
        border: 1px solid color-mix(in srgb, var(--app-text, #000) 12%, transparent);
      }
      .table {
        min-width: 900px;
        width: 100%;
      }
      .cell-text {
        white-space: normal;
        word-break: break-word;
        line-height: 1.35;
        padding-top: 10px;
        padding-bottom: 10px;
      }
      .cell-name {
        min-width: 240px;
      }
      .cell-email {
        min-width: 320px;
      }
      .cell-actions {
        white-space: nowrap;
        width: 1%;
      }
      .empty {
        margin-top: 12px;
        color: var(--app-text-muted);
      }
      .paginator {
        margin-top: 12px;
      }
      .result {
        margin-top: 16px;
        display: grid;
        gap: 8px;
      }
      .row {
        display: grid;
        grid-template-columns: 120px 1fr;
        gap: 12px;
      }
      .k {
        color: var(--app-text-muted);
      }
    `
  ]
})
export class UserFindPage {
  user: GetUserResponse | null = null;
  users: UserListRow[] = [];
  page = 1;
  totalPages = 1;
  pageSize = 20;
  totalItems = 0;
  displayedColumns: Array<'username' | 'email' | 'role' | 'status' | 'actions'> = [
    'username',
    'email',
    'role',
    'status',
    'actions'
  ];

  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly snack = inject(MatSnackBar);
  private readonly lookup = inject(AdminLookupApi);
  private readonly dialog = inject(MatDialog);

  filterCtrl = new FormControl<string>('', { nonNullable: true });

  // mantém compatibilidade com a chamada antiga de detalhes/exclusão (GET /api/Users/{id})
  form = this.fb.group({});

  constructor() {
    this.filterCtrl.valueChanges
      .pipe(
        startWith(this.filterCtrl.value),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((q) => {
          this.page = 1;
          return this.lookup.listUsers(1, this.pageSize, q || undefined);
        }),
        takeUntilDestroyed()
      )
      .subscribe({
        next: (res) => {
          this.users = [...res.data];
          this.totalPages = res.totalPages;
          this.totalItems = res.totalItems;
        },
        error: () => this.snack.open('Não foi possível carregar usuários.', 'OK', { duration: 2500 })
      });
  }

  clearFilter() {
    this.filterCtrl.setValue('');
  }

  reload() {
    // dispara o pipeline do valueChanges sem mudar o valor
    this.filterCtrl.setValue(this.filterCtrl.value);
  }

  onPage(e: PageEvent) {
    const q = this.filterCtrl.value;
    this.pageSize = e.pageSize;
    const nextPage = e.pageIndex + 1;
    this.lookup.listUsers(nextPage, this.pageSize, q || undefined).subscribe({
      next: (res) => {
        this.page = res.currentPage;
        this.users = [...res.data];
        this.totalPages = res.totalPages;
        this.totalItems = res.totalItems;
      },
      error: () => this.snack.open('Não foi possível carregar usuários.', 'OK', { duration: 2500 })
    });
  }

  openDetails(u: UserListRow) {
    this.fetch(u.id);
  }

  roleLabel(role: string) {
    // backend envia enum ToString()
    return role === 'Admin' ? 'Administrador' : role === 'Manager' ? 'Gestor' : role === 'Customer' ? 'Cliente' : 'Nenhum';
  }

  statusLabel(status: string) {
    return status === 'Active'
      ? 'Ativo'
      : status === 'Inactive'
        ? 'Inativo'
        : status === 'Suspended'
          ? 'Suspenso'
          : 'Desconhecido';
  }

  isActive(u: UserListRow) {
    return u.status === 'Active';
  }

  confirmToggleActive(u: UserListRow) {
    const nextStatus = this.isActive(u) ? 2 : 1; // Inactive=2, Active=1
    const title = this.isActive(u) ? 'Desativar usuário?' : 'Ativar usuário?';
    const body = `${u.username} (${u.email})`;

    const ref = this.dialog.open(SimpleConfirmDialog, { data: { title, body } });
    ref.afterClosed().subscribe((ok) => {
      if (!ok) return;
      this.updateUser(u.id, {
        username: u.username,
        email: u.email,
        phone: this.user?.id === u.id ? this.user.phone : '',
        role: this.roleToInt(u.role),
        status: nextStatus
      });
    });
  }

  openEdit(u: UserListRow) {
    // Carrega detalhes para editar com phone/role/status (backend exige Admin/Manager).
    this.http.get<ApiResponseWithData<GetUserResponse>>(`/api/Users/${u.id}`).subscribe({
      next: (res) => {
        const d = res.data;
        if (!d) return;
        const ref = this.dialog.open(EditUserDialog, { data: d });
        ref.afterClosed().subscribe((payload: UpdateUserRequest | null) => {
          if (!payload) return;
          this.updateUser(u.id, payload);
        });
      },
      error: () => this.snack.open('Não foi possível carregar detalhes do usuário.', 'OK', { duration: 2500 })
    });
  }

  private roleToInt(role: string) {
    return role === 'Customer' ? 1 : role === 'Manager' ? 2 : role === 'Admin' ? 3 : 0;
  }

  private updateUser(id: string, payload: UpdateUserRequest) {
    // phone vazio quebra validação; precisa estar presente. Se não tiver detalhe carregado, busca primeiro.
    if (!payload.phone?.trim()) {
      this.http.get<ApiResponseWithData<GetUserResponse>>(`/api/Users/${id}`).subscribe({
        next: (res) => {
          const d = res.data;
          if (!d) return;
          this.updateUser(id, { ...payload, phone: d.phone });
        },
        error: () => this.snack.open('Não foi possível atualizar o usuário.', 'OK', { duration: 2500 })
      });
      return;
    }

    this.http.put<ApiResponseWithData<unknown>>(`/api/Users/${id}`, payload).subscribe({
      next: () => {
        this.snack.open('Usuário atualizado.', 'OK', { duration: 2500 });
        this.reload();
      },
      error: () => this.snack.open('Não foi possível atualizar o usuário (requer Admin/Gestor).', 'OK', { duration: 2500 })
    });
  }

  private fetch(id: string) {
    this.http.get<ApiResponseWithData<GetUserResponse>>(`/api/Users/${id}`).subscribe({
      next: (res) => (this.user = res.data ?? null),
      error: () => {
        this.user = null;
        this.snack.open('Usuário não encontrado.', 'OK', { duration: 2500 });
      }
    });
  }

  deleteUser() {
    if (!this.user) return;
    this.http.delete(`/api/Users/${this.user.id}`).subscribe({
      next: () => {
        this.snack.open('Usuário excluído.', 'OK', { duration: 2500 });
        this.user = null;
      },
      error: () => this.snack.open('Não foi possível excluir o usuário.', 'OK', { duration: 2500 })
    });
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <div mat-dialog-content class="content">{{ data.body }}</div>
    <div mat-dialog-actions align="end">
      <button mat-button type="button" (click)="close(false)">Cancelar</button>
      <button mat-flat-button color="primary" type="button" (click)="close(true)">Confirmar</button>
    </div>
  `,
  styles: [
    `
      .content {
        padding-top: 8px;
        color: var(--app-text, #111);
      }
    `
  ]
})
export class SimpleConfirmDialog {
  data = inject<{ title: string; body: string }>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<SimpleConfirmDialog>);
  close(v: boolean) {
    this.ref.close(v);
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Editar usuário</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <div mat-dialog-content class="grid">
        <mat-form-field appearance="outline">
          <mat-label>Nome</mat-label>
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
          <mat-label>Perfil (0=None,1=Cliente,2=Gestor,3=Admin)</mat-label>
          <input matInput type="number" formControlName="role" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Status (0=Unknown,1=Ativo,2=Inativo,3=Suspenso)</mat-label>
          <input matInput type="number" formControlName="status" />
        </mat-form-field>
      </div>
      <div mat-dialog-actions align="end">
        <button mat-button type="button" (click)="close()">Cancelar</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">Salvar</button>
      </div>
    </form>
  `,
  styles: [
    `
      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
        padding-top: 8px;
      }
      @media (max-width: 720px) {
        .grid {
          grid-template-columns: 1fr;
        }
      }
    `
  ]
})
export class EditUserDialog {
  private readonly ref = inject(MatDialogRef<EditUserDialog, UpdateUserRequest | null>);
  data = inject<GetUserResponse>(MAT_DIALOG_DATA);

  form = inject(FormBuilder).group({
    username: [this.data.name ?? '', [Validators.required]],
    email: [this.data.email ?? '', [Validators.required, Validators.email]],
    phone: [this.data.phone ?? '', [Validators.required]],
    role: [this.data.role ?? 1, [Validators.required]],
    status: [this.data.status ?? 1, [Validators.required]]
  });

  save() {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.ref.close({
      username: v.username!,
      email: v.email!,
      phone: v.phone!,
      role: Number(v.role),
      status: Number(v.status)
    } satisfies UpdateUserRequest);
  }

  close() {
    this.ref.close(null);
  }
}

