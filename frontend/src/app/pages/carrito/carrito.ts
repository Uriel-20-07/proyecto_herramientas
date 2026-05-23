import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';

/**
 * Componente de la página del Carrito de Compras.
 * 
 * Muestra los productos que el usuario ha agregado al carrito y permite:
 * - Ver el resumen de cada producto (imagen, nombre, precio, cantidad).
 * - Aumentar la cantidad de un producto.
 * - Disminuir la cantidad (si llega a 0 se elimina automáticamente en el backend).
 * - Eliminar completamente un producto del carrito.
 * - Vaciar todo el carrito.
 * - Proceder al checkout (botón "Pagar" → navega a /pago).
 * 
 * No tiene lógica de estado propia: delega todo al CartService que
 * mantiene el estado reactivo sincronizado con el backend.
 * 
 * Standalone component.
 */
@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './carrito.html',
  styleUrl: './carrito.css'
})
export class CarritoComponent {
  /**
   * Mapa de imagen local por nombre de categoría.
   * Se usa cuando el producto en el carrito no tiene URL de imagen propia.
   */
  private readonly imagenPorCategoria: Record<string, string> = {
    medicamentos: 'assets/img/producto1.png',
    'cuidado personal': 'assets/img/producto2.png',
    belleza: 'assets/img/producto3.png',
    bebé: 'assets/img/producto4.png',
    'vitaminas / suplementos': 'assets/img/producto1.png',
    'equipo médicos': 'assets/img/producto2.png',
    'equipos médicos': 'assets/img/producto2.png'
  };

  /**
   * @param cartService servicio del carrito para leer/modificar el estado del carrito.
   * @param router      servicio de navegación para redirigir al checkout.
   */
  constructor(
    private readonly cartService: CartService,
    private readonly router: Router
  ) { }

  /**
   * Retorna la lista actual de ítems del carrito.
   * Obtiene una copia del array para evitar mutaciones directas.
   */
  getItems() { return this.cartService.getItems(); }

  /**
   * Determina la imagen a mostrar para un producto del carrito.
   * Prioridad: 1) URL de la API (imgUrl), 2) imagen local por categoría, 3) placeholder.
   *
   * @param producto objeto del producto (puede tener imgUrl y categoria).
   * @returns URL de la imagen a mostrar.
   */
  getProductImage(producto: any): string {
    if (producto.imgUrl) {
      return producto.imgUrl;
    }
    const cat = producto.categoria?.nombre?.toLowerCase() || 'general';
    return this.imagenPorCategoria[cat] || 'assets/img/placeholder-pill.png';
  }

  /**
   * Retorna el subtotal del carrito (precio × cantidad de todos los ítems).
   * No incluye descuentos por cupón (esos se aplican en la página de pago).
   */
  getSubtotal(): number { return this.cartService.getTotal(); }

  /**
   * Retorna el número total de unidades en el carrito (suma de cantidades).
   * Se muestra en el badge del ícono del carrito.
   */
  getCount(): number { return this.cartService.getCount(); }

  /**
   * Incrementa en 1 la cantidad de un producto en el carrito.
   * Busca el producto en el carrito por ID y llama a cartService.add().
   *
   * @param productoId ID del producto a incrementar.
   */
  increase(productoId: number): void {
    const item = this.getItems().find((entry) => entry.producto.idProducto === productoId);
    if (item) {
      this.cartService.add(item.producto);
    }
  }

  /**
   * Disminuye en 1 la cantidad de un producto en el carrito.
   * Si la cantidad llega a 0, el backend elimina el item automáticamente.
   *
   * @param productoId ID del producto a disminuir.
   */
  decrease(productoId: number): void { this.cartService.decrease(productoId); }

  /**
   * Elimina completamente un producto del carrito, sin importar la cantidad.
   *
   * @param productoId ID del producto a eliminar.
   */
  remove(productoId: number): void { this.cartService.remove(productoId); }

  /**
   * Vacía completamente el carrito (elimina todos los productos).
   */
  clear(): void { this.cartService.clear(); }

  /**
   * Navega a la página de pago si hay productos en el carrito.
   * Si el carrito está vacío, no hace nada (botón deshabilitado en el template).
   */
  pagar(): void {
    if (this.getCount() === 0) return; // Guardia: no navegar si el carrito está vacío
    this.router.navigate(['/pago']);
  }
}
