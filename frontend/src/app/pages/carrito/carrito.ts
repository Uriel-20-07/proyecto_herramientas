import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './carrito.html',
  styleUrl: './carrito.css'
})
export class CarritoComponent {
  constructor(private readonly cartService: CartService) {}

  getItems() {
    return this.cartService.getItems();
  }

  getSubtotal(): number {
    return this.cartService.getTotal();
  }

  getCount(): number {
    return this.cartService.getCount();
  }

  increase(productoId: number): void {
    const item = this.getItems().find((entry) => entry.producto.idProducto === productoId);
    if (item) {
      this.cartService.add(item.producto);
    }
  }

  decrease(productoId: number): void {
    this.cartService.decrease(productoId);
  }

  remove(productoId: number): void {
    this.cartService.remove(productoId);
  }

  clear(): void {
    this.cartService.clear();
  }

  pagar(): void {
    if (this.getCount() === 0) {
      return;
    }

    alert(`Pago simulado realizado por S/ ${this.getSubtotal().toFixed(2)}`);
    this.clear();
  }
}
