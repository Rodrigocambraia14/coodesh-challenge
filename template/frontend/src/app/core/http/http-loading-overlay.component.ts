import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  PLATFORM_ID,
  signal,
  viewChild
} from '@angular/core';
import { HTTP_LOADING_LOTTIE_SRC, HTTP_LOADING_MESSAGES } from './http-loading.constants';

@Component({
  selector: 'app-http-loading-overlay',
  standalone: true,
  template: `
    <div
      class="backdrop"
      role="alertdialog"
      aria-modal="true"
      aria-busy="true"
      aria-live="polite"
      aria-label="A comunicar com o servidor"
    >
      <div class="panel">
        <canvas #lottieCanvas class="lottie-canvas" width="360" height="360"></canvas>
        <p class="message">{{ message() }}</p>
      </div>
    </div>
  `,
  styles: [
    `
      .backdrop {
        position: fixed;
        inset: 0;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        background: color-mix(in srgb, #0a0a12 72%, transparent);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        padding: 24px;
      }
      .panel {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
        max-width: min(420px, 100vw);
        text-align: center;
      }
      .lottie-canvas {
        width: min(72vw, 360px);
        height: min(72vw, 360px);
        max-width: 100%;
        max-height: 56vh;
      }
      .message {
        margin: 0;
        font-size: 1.05rem;
        line-height: 1.45;
        font-weight: 500;
        color: #f4f4f8;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
        min-height: 4.5em;
      }
    `
  ]
})
export class HttpLoadingOverlayComponent implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('lottieCanvas');

  readonly message = signal<string>(HTTP_LOADING_MESSAGES[0]);

  private dotLottie: { destroy: () => void | Promise<void> } | null = null;
  private messageTimer: ReturnType<typeof setInterval> | null = null;
  private messageIndex = 0;
  private cancelled = false;

  constructor() {
    afterNextRender(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      this.startMessageRotation();
      this.initDotLottie();
    });
  }

  private startMessageRotation(): void {
    this.messageTimer = setInterval(() => {
      this.messageIndex = (this.messageIndex + 1) % HTTP_LOADING_MESSAGES.length;
      this.message.set(HTTP_LOADING_MESSAGES[this.messageIndex]!);
    }, 2600);
  }

  private initDotLottie(): void {
    void (async () => {
      try {
        const { DotLottie } = await import('@lottiefiles/dotlottie-web');
        if (this.cancelled) return;
        const canvas = this.canvasRef().nativeElement;
        const instance = new DotLottie({
          canvas,
          src: HTTP_LOADING_LOTTIE_SRC,
          loop: true,
          autoplay: true,
          renderConfig: {
            autoResize: true,
            devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
          }
        });
        if (this.cancelled) {
          void instance.destroy();
          return;
        }
        this.dotLottie = instance;
      } catch {
        /* canvas / wasm indisponível (ex.: alguns ambientes de teste) */
      }
    })();
  }

  ngOnDestroy(): void {
    this.cancelled = true;
    if (this.messageTimer !== null) {
      clearInterval(this.messageTimer);
      this.messageTimer = null;
    }
    const dot = this.dotLottie;
    this.dotLottie = null;
    if (dot) void dot.destroy();
  }
}
