import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ProductoApi } from './catalogo.service';

export interface CartItem {
  producto: ProductoApi;
  cantidad: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly storageKey = 'carrito';
  private readonly itemsSubject = new BehaviorSubject<CartItem[]>(this.loadItems());

  readonly items$ = this.itemsSubject.asObservable();

  add(producto: ProductoApi): void {
    const items = [...this.itemsSubject.value];
    const existing = items.find((item) => item.producto.idProducto === producto.idProducto);

    if (existing) {
      existing.cantidad += 1;
    } else {
      items.push({ producto, cantidad: 1 });
    }

    this.saveItems(items);
    this.itemsSubject.next(items);
  }

  decrease(productoId: number): void {
    const items = [...this.itemsSubject.value];
    const existing = items.find((item) => item.producto.idProducto === productoId);

    if (!existing) {
      return;
    }

    if (existing.cantidad > 1) {
      existing.cantidad -= 1;
    } else {
      this.remove(productoId);
      return;
    }

    this.saveItems(items);
    this.itemsSubject.next(items);
  }

  remove(productoId: number): void {
    const items = this.itemsSubject.value.filter((item) => item.producto.idProducto !== productoId);
    this.saveItems(items);
    this.itemsSubject.next(items);
  }

  clear(): void {
    this.saveItems([]);
    this.itemsSubject.next([]);
  }

  getCount(): number {
    return this.itemsSubject.value.reduce((total, item) => total + item.cantidad, 0);
  }

  getTotal(): number {
    return this.itemsSubject.value.reduce(
      (total, item) => total + Number(item.producto.precioVenta) * item.cantidad,
      0
    );
  }

  getItems(): CartItem[] {
    return [...this.itemsSubject.value];
  }

  private loadItems(): CartItem[] {
    const stored = localStorage.getItem(this.storageKey);

    if (!stored) {
      return [];
    }

    try {
      return JSON.parse(stored) as CartItem[];
    } catch {
      return [];
    }
  }

  private saveItems(items: CartItem[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }
}