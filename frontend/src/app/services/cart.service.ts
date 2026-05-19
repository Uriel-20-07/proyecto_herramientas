import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { ProductoApi } from './catalogo.service';
import { AuthService } from './auth.service';
import { AuthModalService } from './auth-modal.service';

export interface CartItem {
  idDetalleCarrito?: number;
  producto: ProductoApi;
  cantidad: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly apiUrl = 'http://localhost:8080/api/carrito';
  private readonly storageKey = 'carrito';
  private readonly itemsSubject = new BehaviorSubject<CartItem[]>([]);

  readonly items$ = this.itemsSubject.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService,
    private readonly authModalService: AuthModalService
  ) {
    // Escuchar cambios de autenticación para cargar o limpiar el carrito
    this.authService.token$.subscribe((token) => {
      if (token) {
        this.cargarCarritoServidor();
      } else {
        this.clearLocalState();
      }
    });
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  private cargarCarritoServidor(): void {
    this.http.get<any>(this.apiUrl, { headers: this.getHeaders() }).subscribe({
      next: (carrito) => {
        if (carrito && carrito.detalles) {
          this.itemsSubject.next(carrito.detalles);
          this.saveItemsToStorage(carrito.detalles);
        }
      },
      error: (err) => {
        console.error('Error al cargar el carrito del servidor:', err);
        this.itemsSubject.next(this.loadItemsFromStorage());
      }
    });
  }

  add(producto: ProductoApi): void {
    if (!this.authService.isAuthenticated()) {
      this.authModalService.open('login');
      return;
    }

    const url = `${this.apiUrl}/agregar?idProducto=${producto.idProducto}&cantidad=1`;
    this.http.post<any>(url, {}, { headers: this.getHeaders() }).subscribe({
      next: (carrito) => {
        if (carrito && carrito.detalles) {
          this.itemsSubject.next(carrito.detalles);
          this.saveItemsToStorage(carrito.detalles);
        }
      },
      error: (err) => {
        console.error('Error al agregar producto al carrito:', err);
      }
    });
  }

  decrease(productoId: number): void {
    if (!this.authService.isAuthenticated()) {
      this.authModalService.open('login');
      return;
    }

    const url = `${this.apiUrl}/disminuir?idProducto=${productoId}`;
    this.http.post<any>(url, {}, { headers: this.getHeaders() }).subscribe({
      next: (carrito) => {
        if (carrito && carrito.detalles) {
          this.itemsSubject.next(carrito.detalles);
          this.saveItemsToStorage(carrito.detalles);
        }
      },
      error: (err) => {
        console.error('Error al disminuir producto del carrito:', err);
      }
    });
  }

  remove(productoId: number): void {
    if (!this.authService.isAuthenticated()) {
      this.authModalService.open('login');
      return;
    }

    const url = `${this.apiUrl}/eliminar?idProducto=${productoId}`;
    this.http.delete<any>(url, { headers: this.getHeaders() }).subscribe({
      next: (carrito) => {
        if (carrito && carrito.detalles) {
          this.itemsSubject.next(carrito.detalles);
          this.saveItemsToStorage(carrito.detalles);
        }
      },
      error: (err) => {
        console.error('Error al eliminar producto del carrito:', err);
      }
    });
  }

  clear(): void {
    if (!this.authService.isAuthenticated()) {
      this.clearLocalState();
      return;
    }

    const url = `${this.apiUrl}/vaciar`;
    this.http.delete<any>(url, { headers: this.getHeaders() }).subscribe({
      next: (carrito) => {
        if (carrito && carrito.detalles) {
          this.itemsSubject.next(carrito.detalles);
          this.saveItemsToStorage(carrito.detalles);
        }
      },
      error: (err) => {
        console.error('Error al vaciar el carrito:', err);
      }
    });
  }

  private clearLocalState(): void {
    this.saveItemsToStorage([]);
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

  private loadItemsFromStorage(): CartItem[] {
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) return [];
    try {
      return JSON.parse(stored) as CartItem[];
    } catch {
      return [];
    }
  }

  private saveItemsToStorage(items: CartItem[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }
}