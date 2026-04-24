import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DashboardApi, type DashboardGroupBy, type DashboardResponse } from './dashboard.api';
import { BaseChartDirective } from 'ng2-charts';
import type { ChartData, ChartOptions } from 'chart.js';

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
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatTableModule,
    BaseChartDirective
  ],
  template: `
    <div class="page">
      <header class="header">
        <div class="title">
          <h2>Dashboard</h2>
          <div class="subtitle">Visão geral de vendas, cancelamentos, clientes e descontos</div>
        </div>

        <form class="filters" [formGroup]="filters" (ngSubmit)="reload()">
          <mat-form-field appearance="outline">
            <mat-label>De</mat-label>
            <input matInput type="date" formControlName="from" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Até</mat-label>
            <input matInput type="date" formControlName="to" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Agrupar</mat-label>
            <mat-select formControlName="groupBy">
              <mat-option value="Month">Mensal</mat-option>
              <mat-option value="Week">Semanal</mat-option>
              <mat-option value="Day">Diário</mat-option>
            </mat-select>
          </mat-form-field>

          <button mat-flat-button color="primary" type="submit" [disabled]="filters.invalid || loading">
            Aplicar
          </button>
        </form>
      </header>

      <mat-progress-bar *ngIf="loading" mode="indeterminate" />

      <section class="kpis" *ngIf="vm() as d">
        <mat-card class="kpi">
          <div class="kpi-label">Vendas</div>
          <div class="kpi-value">{{ d.kpis.totalSales }}</div>
        </mat-card>
        <mat-card class="kpi">
          <div class="kpi-label">Canceladas</div>
          <div class="kpi-value">{{ d.kpis.cancelledSales }}</div>
          <div class="kpi-sub">{{ (d.kpis.cancelledRate * 100) | number : '1.0-2' }}%</div>
        </mat-card>
        <mat-card class="kpi">
          <div class="kpi-label">Clientes</div>
          <div class="kpi-value">{{ d.kpis.totalCustomers }}</div>
        </mat-card>
        <mat-card class="kpi">
          <div class="kpi-label">Receita líquida</div>
          <div class="kpi-value money">{{ d.kpis.netRevenue | number : '1.2-2' }}</div>
        </mat-card>
        <mat-card class="kpi">
          <div class="kpi-label">Desconto total</div>
          <div class="kpi-value money">{{ d.kpis.totalDiscountAmount | number : '1.2-2' }}</div>
        </mat-card>
      </section>

      <section class="grid" *ngIf="vm() as d">
        <mat-card class="panel">
          <mat-card-title>Canceladas vs total</mat-card-title>
          <mat-card-content>
            <div class="chart">
              <canvas
                baseChart
                [type]="'doughnut'"
                [data]="cancelChartData(d)"
                [options]="doughnutOptions"
              ></canvas>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="panel">
          <mat-card-title>Receita por período</mat-card-title>
          <mat-card-content>
            <div class="chart">
              <canvas
                baseChart
                [type]="'bar'"
                [data]="revenueChartData(d)"
                [options]="barOptions"
              ></canvas>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="panel span-2">
          <mat-card-title>Top 10 produtos</mat-card-title>
          <mat-card-content>
            <table mat-table [dataSource]="d.topProducts" class="table">
              <ng-container matColumnDef="productName">
                <th mat-header-cell *matHeaderCellDef>Produto</th>
                <td mat-cell *matCellDef="let r" class="cell-text">{{ r.productName }}</td>
              </ng-container>
              <ng-container matColumnDef="quantitySold">
                <th mat-header-cell *matHeaderCellDef class="num">Qtd</th>
                <td mat-cell *matCellDef="let r" class="num">{{ r.quantitySold }}</td>
              </ng-container>
              <ng-container matColumnDef="netAmount">
                <th mat-header-cell *matHeaderCellDef class="num">Líquido</th>
                <td mat-cell *matCellDef="let r" class="num">{{ r.netAmount | number : '1.2-2' }}</td>
              </ng-container>
              <ng-container matColumnDef="discountAmount">
                <th mat-header-cell *matHeaderCellDef class="num">Desconto</th>
                <td mat-cell *matCellDef="let r" class="num">{{ r.discountAmount | number : '1.2-2' }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="productCols"></tr>
              <tr mat-row *matRowDef="let row; columns: productCols"></tr>
            </table>
          </mat-card-content>
        </mat-card>

        <mat-card class="panel span-2">
          <mat-card-title>Venda x valor (últimas {{ d.saleValuePoints.length }})</mat-card-title>
          <mat-card-content>
            <div class="chart tall">
              <canvas
                baseChart
                [type]="'scatter'"
                [data]="scatterChartData(d)"
                [options]="scatterOptions"
              ></canvas>
            </div>
          </mat-card-content>
        </mat-card>
      </section>
    </div>
  `,
  styles: [
    `
      .page {
        display: grid;
        gap: 16px;
      }
      .header {
        display: grid;
        grid-template-columns: 1fr;
        gap: 12px;
      }
      .title h2 {
        margin: 0;
        font-size: 1.25rem;
      }
      .subtitle {
        color: var(--app-text-muted);
        margin-top: 4px;
      }
      .filters {
        display: grid;
        grid-template-columns: 180px 180px 160px auto;
        gap: 12px;
        align-items: end;
      }
      @media (max-width: 900px) {
        .filters {
          grid-template-columns: 1fr 1fr;
        }
      }
      .kpis {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 12px;
      }
      @media (max-width: 1100px) {
        .kpis {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      .kpi {
        padding: 12px;
      }
      .kpi-label {
        color: var(--app-text-muted);
        font-size: 0.85rem;
      }
      .kpi-value {
        font-size: 1.4rem;
        font-weight: 700;
        margin-top: 6px;
      }
      .kpi-sub {
        margin-top: 2px;
        color: var(--app-text-muted);
      }
      .money {
        font-variant-numeric: tabular-nums;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }
      .span-2 {
        grid-column: span 2;
      }
      @media (max-width: 900px) {
        .grid {
          grid-template-columns: 1fr;
        }
        .span-2 {
          grid-column: auto;
        }
      }
      .panel {
        overflow: hidden;
      }
      .chart {
        margin-top: 8px;
        height: 260px;
      }
      .chart.tall {
        min-height: 340px;
        height: 380px;
      }
      .table {
        width: 100%;
      }
      .cell-text {
        white-space: normal;
        word-break: break-word;
      }
      .num {
        text-align: right;
        font-variant-numeric: tabular-nums;
      }
    `
  ]
})
export class DashboardPage {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(DashboardApi);
  private readonly snack = inject(MatSnackBar);

  loading = false;
  private _data: DashboardResponse | null = null;
  vm = computed(() => this._data);

  productCols: Array<'productName' | 'quantitySold' | 'netAmount' | 'discountAmount'> = [
    'productName',
    'quantitySold',
    'netAmount',
    'discountAmount'
  ];

  filters = this.fb.group({
    from: ['', [Validators.required]],
    to: ['', [Validators.required]],
    groupBy: ['Month' as DashboardGroupBy, [Validators.required]]
  });

  constructor() {
    const today = new Date();
    const to = today.toISOString().slice(0, 10);
    const fromDate = new Date(today);
    fromDate.setMonth(fromDate.getMonth() - 6);
    const from = fromDate.toISOString().slice(0, 10);

    this.filters.patchValue({ from, to, groupBy: 'Month' }, { emitEvent: false });
    this.reload();
  }

  doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' }
    }
  };

  barOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { maxRotation: 0, autoSkip: true } },
      y: { beginAtZero: true }
    }
  };

  scatterOptions: ChartOptions<'scatter'> = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } },
    scales: {
      x: { title: { display: true, text: 'Índice (mais recente → mais antigo)' } },
      y: { beginAtZero: true, title: { display: true, text: 'Valor líquido' } }
    }
  };

  cancelChartData(d: DashboardResponse): ChartData<'doughnut'> {
    const cancelled = d.kpis.cancelledSales ?? 0;
    const ok = Math.max(0, (d.kpis.totalSales ?? 0) - cancelled);
    return {
      labels: ['Concluídas', 'Canceladas'],
      datasets: [
        {
          data: [ok, cancelled],
          backgroundColor: ['rgba(46,125,50,0.65)', 'rgba(211,47,47,0.65)'],
          borderColor: ['rgba(46,125,50,1)', 'rgba(211,47,47,1)'],
          borderWidth: 1
        }
      ]
    };
  }

  revenueChartData(d: DashboardResponse): ChartData<'bar'> {
    const labels = d.timeSeries.map((p) => p.period);
    const values = d.timeSeries.map((p) => p.netRevenue);
    return {
      labels,
      datasets: [
        {
          data: values,
          label: 'Receita líquida',
          backgroundColor: 'rgba(103,80,164,0.65)',
          borderColor: 'rgba(103,80,164,1)',
          borderWidth: 1
        }
      ]
    };
  }

  scatterChartData(d: DashboardResponse): ChartData<'scatter'> {
    const points = d.saleValuePoints.map((p, idx) => ({ x: idx, y: p.netAmount }));
    const cancelled = d.saleValuePoints
      .map((p, idx) => (p.cancelled ? { x: idx, y: p.netAmount } : null))
      .filter((x): x is { x: number; y: number } => x != null);

    return {
      datasets: [
        {
          label: 'Todas',
          data: points,
          pointRadius: 3,
          backgroundColor: 'rgba(25,118,210,0.55)'
        },
        {
          label: 'Canceladas',
          data: cancelled,
          pointRadius: 4,
          backgroundColor: 'rgba(211,47,47,0.75)'
        }
      ]
    };
  }

  reload() {
    if (this.filters.invalid) return;
    const v = this.filters.getRawValue();

    // Backend expects DateTime; we send ISO with time to avoid timezone ambiguity.
    const fromIso = new Date(`${v.from}T00:00:00.000Z`).toISOString();
    const toIso = new Date(`${v.to}T23:59:59.999Z`).toISOString();

    this.loading = true;
    this.api
      .get(fromIso, toIso, v.groupBy!)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (d) => {
          this._data = d;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.snack.open('Não foi possível carregar o dashboard.', 'OK', { duration: 2500 });
        }
      });
  }
}

