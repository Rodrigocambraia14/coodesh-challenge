import { Injectable, computed, signal } from '@angular/core';
import { precoUnitarioPorCategoria } from './shop.constants';

export type CartLine = {
  productId: string;
  productDescription: string;
  quantity: number;
  unitPrice: number;
};

export type CatalogProduct = { id: string; name: string; category: string };

@Injectable({ providedIn: 'root' })
export class CartService {
  readonly lines = signal<CartLine[]>([]);

  readonly itemCount = computed(() => this.lines().reduce((sum, l) => sum + l.quantity, 0));

  addProduct(product: CatalogProduct, quantity = 1) {
    const unitPrice = precoUnitarioPorCategoria(product.category);
    this.lines.update((lines) => {
      const next = [...lines];
      const idx = next.findIndex((l) => l.productId === product.id);
      if (idx >= 0) {
        next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity };
        return next;
      }
      next.push({
        productId: product.id,
        productDescription: product.name,
        quantity,
        unitPrice
      });
      return next;
    });
  }

  setQuantity(productId: string, quantity: number) {
    if (quantity < 1) {
      this.removeLine(productId);
      return;
    }
    this.lines.update((lines) => lines.map((l) => (l.productId === productId ? { ...l, quantity } : l)));
  }

  removeLine(productId: string) {
    this.lines.update((lines) => lines.filter((l) => l.productId !== productId));
  }

  clear() {
    this.lines.set([]);
  }
}
