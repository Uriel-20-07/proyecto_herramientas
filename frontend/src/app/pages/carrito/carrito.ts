import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './carrito.html',
  styleUrl: './carrito.css',
})
export class CarritoComponent {
  private readonly imagenPorCategoria: Record<string, string> = {
    medicamentos: 'assets/img/producto1.png',
    'cuidado personal': 'assets/img/producto2.png',
    belleza: 'assets/img/producto3.png',
    bebé: 'assets/img/producto4.png',
    'vitaminas / suplementos': 'assets/img/producto1.png',
    'equipo médicos': 'assets/img/producto2.png',
    'equipos médicos': 'assets/img/producto2.png',
  };

  // Variable de seguridad para bloquear el checkout si hay productos expirados
  hasExpiredProducts = false;

  constructor(
    private readonly cartService: CartService,
    private readonly router: Router,
  ) {}

  /**
   * MÉTODO AUXILIAR: Captura la fecha sin importar si Spring Boot
   * la envía como fechaCaducidad (camelCase) o fecha_caducidad (snake_case).
   */
/**
   * MÉTODO AUXILIAR ROBUSTO: Captura la fecha y la formatea correctamente
   * sin importar cómo la envíe Spring Boot.
   */
  getFecha(producto: any): string {
    const fecha = producto.fechaCaducidad || producto.fecha_caducidad;
    if (!fecha) return '';

    // Si Spring Boot lo envía como arreglo [Año, Mes, Día]
    if (Array.isArray(fecha)) {
      const mes = fecha[1] < 10 ? '0' + fecha[1] : fecha[1];
      const dia = fecha[2] < 10 ? '0' + fecha[2] : fecha[2];
      return `${fecha[0]}-${mes}-${dia}`;
    }
    
    // Si ya es un texto normal '2026-07-10' o similar
    return fecha;
  }

  getItems() {
    const items = this.cartService.getItems();
    // Verificamos en tiempo real si hay productos vencidos en la lista
    this.hasExpiredProducts = items.some(
      (item) => this.getDiscountInfo(this.getFecha(item.producto)).isExpired,
    );
    return items;
  }

  getProductImage(producto: any): string {
    if (producto.imgUrl) return producto.imgUrl;
    const cat = producto.categoria?.nombre?.toLowerCase() || 'general';
    return this.imagenPorCategoria[cat] || 'assets/img/placeholder-pill.png';
  }

  /**
   * LÓGICA DE NEGOCIO: Calcula el descuento basado en la fecha de caducidad.
   */
  getDiscountInfo(fechaCaducidad: string): {
    percentage: number;
    message: string;
    isExpired: boolean;
  } {
    if (!fechaCaducidad) return { percentage: 0, message: '', isExpired: false };

    const expDate = new Date(fechaCaducidad);
    const today = new Date();

    // Calculamos la diferencia en meses
    const monthsLeft =
      (expDate.getFullYear() - today.getFullYear()) * 12 + (expDate.getMonth() - today.getMonth());

    // Si ya pasó la fecha
    if (monthsLeft < 0 || (monthsLeft === 0 && expDate.getDate() < today.getDate())) {
      return { percentage: 0, message: 'PRODUCTO VENCIDO - VENTA BLOQUEADA', isExpired: true };
    }

    // Escala de descuentos automáticos
    if (monthsLeft <= 6)
      return { percentage: 0.3, message: 'Liquidación 30% dscto.', isExpired: false };
    if (monthsLeft <= 12)
      return { percentage: 0.1, message: 'Oferta 10% dscto.', isExpired: false };
    if (monthsLeft <= 24) return { percentage: 0.05, message: 'Promo 5% dscto.', isExpired: false };

    return { percentage: 0, message: '', isExpired: false };
  }

  /**
   * Calcula el precio unitario aplicando el descuento de vencimiento.
   */
  getFinalPrice(producto: any): number {
    const discountInfo = this.getDiscountInfo(this.getFecha(producto));
    const discountAmount = producto.precioVenta * discountInfo.percentage;
    return producto.precioVenta - discountAmount;
  }

  getSubtotal(): number {
    return this.cartService.getTotal();
  }

  getCount(): number {
    return this.cartService.getCount();
  }

  increase(productoId: number): void {
    const item = this.getItems().find((entry) => entry.producto.idProducto === productoId);
    if (item) this.cartService.add(item.producto);
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
    // Regla estricta: No avanza a pago si hay items caducados o si está vacío
    if (this.getCount() === 0 || this.hasExpiredProducts) return;
    this.router.navigate(['/pago']);
  }
}
