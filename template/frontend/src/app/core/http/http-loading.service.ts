import { Injectable, computed, signal } from '@angular/core';

/**
 * Conta requisições HTTP em curso para exibir o overlay global (Lottie + mensagens).
 */
@Injectable({ providedIn: 'root' })
export class HttpLoadingService {
  private readonly pending = signal(0);

  /** Número de pedidos ainda sem resposta (útil para testes/diagnóstico). */
  readonly pendingCount = this.pending.asReadonly();

  /** True quando existe pelo menos uma requisição ativa. */
  readonly visible = computed(() => this.pending() > 0);

  begin(): void {
    this.pending.update((n) => n + 1);
  }

  end(): void {
    this.pending.update((n) => Math.max(0, n - 1));
  }
}
