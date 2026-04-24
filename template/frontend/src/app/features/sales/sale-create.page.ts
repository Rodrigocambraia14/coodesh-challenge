import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, startWith, switchMap } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import type { ApiResponseWithData, CreateSaleRequest, SaleResponse } from './sales.api';
import { ProductsApi, type ProductDto } from '../../shared/data/products.api';
import { AdminLookupApi, type BranchListRow, type UserListRow } from '../../shared/data/admin-lookup.api';

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
    MatAutocompleteModule,
    MatSelectModule
  ],
  template: `
    <mat-card>
      <mat-card-title>Nova compra</mat-card-title>
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="grid">
            <mat-form-field appearance="outline">
              <mat-label>Data</mat-label>
              <input matInput type="datetime-local" formControlName="date" />
            </mat-form-field>

            <div class="lookup-block">
              <mat-form-field appearance="outline" class="lookup-field">
                <mat-label>Cliente</mat-label>
                <input
                  matInput
                  [formControl]="customerFilterCtrl"
                  [matAutocomplete]="custAuto"
                  (focus)="ensureCustomerLoaded()"
                />
                <mat-autocomplete
                  #custAuto="matAutocomplete"
                  [displayWith]="displayCustomer"
                  (optionSelected)="onCustomerSelected($event.option.value)"
                >
                  <mat-option *ngFor="let u of customerOptions" [value]="u">{{ formatUser(u) }}</mat-option>
                </mat-autocomplete>
              </mat-form-field>
              <button
                mat-stroked-button
                type="button"
                class="load-more"
                *ngIf="customerPage < customerTotalPages"
                (click)="loadMoreCustomers()"
              >
                Carregar mais clientes
              </button>
            </div>

            <div class="lookup-block">
              <mat-form-field appearance="outline" class="lookup-field">
                <mat-label>Filial</mat-label>
                <input
                  matInput
                  [formControl]="branchFilterCtrl"
                  [matAutocomplete]="branchAuto"
                  (focus)="ensureBranchLoaded()"
                />
                <mat-autocomplete
                  #branchAuto="matAutocomplete"
                  [displayWith]="displayBranch"
                  (optionSelected)="onBranchSelected($event.option.value)"
                >
                  <mat-option *ngFor="let b of branchOptions" [value]="b">{{ b.name }}</mat-option>
                </mat-autocomplete>
              </mat-form-field>
              <button
                mat-stroked-button
                type="button"
                class="load-more"
                *ngIf="branchPage < branchTotalPages"
                (click)="loadMoreBranches()"
              >
                Carregar mais filiais
              </button>
            </div>
          </div>

          <div class="items">
            <div class="items-head">
              <h3>Itens</h3>
              <button mat-stroked-button type="button" (click)="addItem()">
                <mat-icon>add</mat-icon>
                Adicionar item
              </button>
            </div>

            <div class="item" *ngFor="let g of items.controls; let i = index" [formGroup]="$any(g)">
              <mat-form-field appearance="outline">
                <mat-label>Produto</mat-label>
                <mat-select formControlName="productId" (selectionChange)="onProductSelectChange(i, $event.value)">
                  <mat-option *ngFor="let p of products" [value]="p.id">{{ p.name }}</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Descrição</mat-label>
                <input matInput formControlName="productDescription" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Quantidade</mat-label>
                <input matInput type="number" formControlName="quantity" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Preço unitário</mat-label>
                <input matInput type="number" formControlName="unitPrice" />
              </mat-form-field>
              <button mat-icon-button color="warn" type="button" (click)="removeItem(i)" aria-label="Remover item">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </div>

          <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || items.length === 0">
            Criar
          </button>
        </form>
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
      @media (max-width: 900px) {
        .grid {
          grid-template-columns: 1fr;
        }
      }
      .lookup-block {
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 0;
      }
      .lookup-field {
        width: 100%;
      }
      .load-more {
        align-self: flex-start;
      }
      .items {
        display: grid;
        gap: 12px;
      }
      .items-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .item {
        display: grid;
        gap: 12px;
        grid-template-columns: 2fr 3fr 1fr 1fr auto;
        align-items: center;
      }
      @media (max-width: 1100px) {
        .item {
          grid-template-columns: 1fr 1fr;
        }
      }
    `
  ]
})
export class SaleCreatePage {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly snack = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly productsApi = inject(ProductsApi);
  private readonly lookup = inject(AdminLookupApi);

  products: ProductDto[] = [];

  customerFilterCtrl = new FormControl<string | UserListRow | null>(null);
  customerOptions: UserListRow[] = [];
  customerPage = 1;
  customerTotalPages = 1;

  branchFilterCtrl = new FormControl<string | BranchListRow | null>(null);
  branchOptions: BranchListRow[] = [];
  branchPage = 1;
  branchTotalPages = 1;

  readonly formatUser = AdminLookupApi.formatUserLabel;

  form = this.fb.group({
    date: [new Date().toISOString().slice(0, 16), [Validators.required]],
    customerId: ['', [Validators.required]],
    customerDescription: ['', [Validators.required]],
    branchId: ['', [Validators.required]],
    branchDescription: ['', [Validators.required]],
    items: this.fb.array([])
  });

  get items() {
    return this.form.controls.items as FormArray;
  }

  displayCustomer = (v: string | UserListRow | null): string => {
    if (v == null || v === '') return '';
    if (typeof v === 'string') return v;
    return AdminLookupApi.formatUserLabel(v);
  };

  displayBranch = (v: string | BranchListRow | null): string => {
    if (v == null || v === '') return '';
    if (typeof v === 'string') return v;
    return v.name;
  };

  constructor() {
    this.productsApi
      .list()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (list) => {
          this.products = list;
          if (this.items.length === 0) this.addItem();
        },
        error: () => {
          this.snack.open('Não foi possível carregar os produtos.', 'OK', { duration: 2500 });
          if (this.items.length === 0) this.addItem();
        }
      });

    this.customerFilterCtrl.valueChanges
      .pipe(
        startWith(this.customerFilterCtrl.value),
        debounceTime(300),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        switchMap((v) => {
          const q = typeof v === 'string' ? v : '';
          this.customerPage = 1;
          return this.lookup.listUsers(1, 30, q || undefined, 'Customer');
        }),
        takeUntilDestroyed()
      )
      .subscribe({
        next: (res) => {
          this.customerOptions = [...res.data];
          this.customerTotalPages = res.totalPages;
        },
        error: () => this.snack.open('Não foi possível carregar clientes.', 'OK', { duration: 2500 })
      });

    this.branchFilterCtrl.valueChanges
      .pipe(
        startWith(this.branchFilterCtrl.value),
        debounceTime(300),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        switchMap((v) => {
          const q = typeof v === 'string' ? v : '';
          this.branchPage = 1;
          return this.lookup.listBranches(1, 30, q || undefined);
        }),
        takeUntilDestroyed()
      )
      .subscribe({
        next: (res) => {
          this.branchOptions = [...res.data];
          this.branchTotalPages = res.totalPages;
        },
        error: () => this.snack.open('Não foi possível carregar filiais.', 'OK', { duration: 2500 })
      });
  }

  ensureCustomerLoaded() {
    if (this.customerOptions.length === 0) {
      this.lookup.listUsers(1, 30, undefined, 'Customer').subscribe({
        next: (res) => {
          this.customerOptions = [...res.data];
          this.customerTotalPages = res.totalPages;
        }
      });
    }
  }

  ensureBranchLoaded() {
    if (this.branchOptions.length === 0) {
      this.lookup.listBranches(1, 30, undefined).subscribe({
        next: (res) => {
          this.branchOptions = [...res.data];
          this.branchTotalPages = res.totalPages;
        }
      });
    }
  }

  loadMoreCustomers() {
    const raw = this.customerFilterCtrl.value;
    const q = typeof raw === 'string' ? raw : '';
    if (this.customerPage >= this.customerTotalPages) return;
    const next = this.customerPage + 1;
    this.lookup.listUsers(next, 30, q || undefined, 'Customer').subscribe({
      next: (res) => {
        this.customerPage = next;
        this.customerOptions = [...this.customerOptions, ...res.data];
        this.customerTotalPages = res.totalPages;
      }
    });
  }

  loadMoreBranches() {
    const raw = this.branchFilterCtrl.value;
    const q = typeof raw === 'string' ? raw : '';
    if (this.branchPage >= this.branchTotalPages) return;
    const next = this.branchPage + 1;
    this.lookup.listBranches(next, 30, q || undefined).subscribe({
      next: (res) => {
        this.branchPage = next;
        this.branchOptions = [...this.branchOptions, ...res.data];
        this.branchTotalPages = res.totalPages;
      }
    });
  }

  onCustomerSelected(u: UserListRow) {
    this.form.patchValue({
      customerId: u.id,
      customerDescription: u.username
    });
    this.customerFilterCtrl.setValue(u, { emitEvent: false });
  }

  onBranchSelected(b: BranchListRow) {
    this.form.patchValue({
      branchId: b.id,
      branchDescription: b.name
    });
    this.branchFilterCtrl.setValue(b, { emitEvent: false });
  }

  addItem() {
    this.items.push(
      this.fb.group({
        productId: ['', [Validators.required]],
        productDescription: ['', [Validators.required]],
        quantity: [1, [Validators.required, Validators.min(1)]],
        unitPrice: [1, [Validators.required, Validators.min(0)]]
      })
    );

    const idx = this.items.length - 1;
    const first = this.products[0];
    if (first) this.onProductSelectChange(idx, first.id);
  }

  removeItem(i: number) {
    this.items.removeAt(i);
  }

  onProductSelectChange(index: number, productId: string) {
    const p = this.products.find((x) => x.id === productId);
    if (!p) return;
    const g = this.items.at(index);
    if (!g) return;
    g.patchValue({ productId: p.id, productDescription: p.name });
  }

  submit() {
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    const payload: CreateSaleRequest = {
      date: new Date(v.date!).toISOString(),
      customerId: v.customerId!,
      customerDescription: v.customerDescription!,
      branchId: v.branchId!,
      branchDescription: v.branchDescription!,
      items: (v.items ?? []) as any
    };

    this.http.post<ApiResponseWithData<SaleResponse>>('/api/Sales', payload).subscribe({
      next: (res) => {
        const id = res.data?.id;
        this.snack.open('Compra criada.', 'OK', { duration: 2500 });
        if (id) this.router.navigate(['/sales', id]);
      },
      error: () => this.snack.open('Não foi possível criar a compra.', 'OK', { duration: 2500 })
    });
  }
}
