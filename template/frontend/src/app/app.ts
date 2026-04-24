import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpLoadingOverlayComponent } from './core/http/http-loading-overlay.component';
import { HttpLoadingService } from './core/http/http-loading.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HttpLoadingOverlayComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly httpLoading = inject(HttpLoadingService);

  /** Overlay fullscreen (Lottie) enquanto existirem pedidos HTTP ativos. */
  protected readonly httpLoadingVisible = this.httpLoading.visible;
}
