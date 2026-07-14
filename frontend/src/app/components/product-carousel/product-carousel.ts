import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogoService, ProductoApi, CategoriaApi } from '../../services/catalogo.service';
import { CartService } from '../../services/cart.service';

interface ProductoVista {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;          // precio final con descuento por caducidad
  precioOriginal: number;  // precio de venta normal (precioVenta)
  descuentoPct: number;    // porcentaje de descuento calculado por fecha de caducidad
  categoriaNombre: string;
  imagen: string;
}

@Component({
  selector: 'app-product-carousel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-carousel.html',
  styleUrls: ['../../pages/catalogo/catalogo.css', './product-carousel.css']
})
export class ProductCarouselComponent implements OnInit {
  productos: ProductoVista[] = [];
  categorias: CategoriaApi[] = [];

  /** Índice del slide activo (0-based) */
  slideActual = 0;

  /** Si hay animación en curso, bloquea clicks rápidos */
  animando = false;

  private readonly imagenPorCategoria: Record<string, string> = {
    medicamentos: 'assets/img/producto1.png',
    'cuidado personal': 'assets/img/producto2.png',
    belleza: 'assets/img/producto3.png',
    bebé: 'assets/img/producto4.png',
    'vitaminas / suplementos': 'assets/img/producto1.png',
    'equipo médicos': 'assets/img/producto2.png',
    'equipos médicos': 'assets/img/producto2.png'
  };

  constructor(
    private readonly catalogoService: CatalogoService,
    private readonly cartService: CartService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.catalogoService.getCategorias().subscribe({
      next: (categorias) => {
        this.categorias = categorias;
        this.catalogoService.getProductos().subscribe({
          next: (productos) => {
            // Filtrar productos que tengan descuento activo por fecha de caducidad
            // (misma lógica que el catálogo, sin depender de precioOferta del backend)
            const enOferta = productos.filter((p) => {
              const fechaCad = this.getFecha(p);
              if (!fechaCad) return false;
              const info = this.getDiscountInfo(fechaCad);
              return info.percentage > 0 && !info.isExpired;
            });
            this.productos = enOferta
              .slice(0, 8)
              .map((p) => this.mapProducto(p));

            this.slideActual = 0;
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  // ── Navegación ──────────────────────────────────────────────────────────────

  get totalSlides(): number {
    return this.chunkedProducts.length;
  }

  get puedeAnterior(): boolean {
    return this.slideActual > 0;
  }

  get puedeSiguiente(): boolean {
    return this.slideActual < this.totalSlides - 1;
  }

  anterior(): void {
    if (this.animando || !this.puedeAnterior) return;
    this.irA(this.slideActual - 1);
  }

  siguiente(): void {
    if (this.animando || !this.puedeSiguiente) return;
    this.irA(this.slideActual + 1);
  }

  irA(indice: number): void {
    if (this.animando || indice === this.slideActual) return;
    this.animando = true;
    this.slideActual = indice;
    // Desbloquear después de la transición CSS (300ms)
    setTimeout(() => { this.animando = false; }, 350);
  }

  // ── Productos ────────────────────────────────────────────────────────────────

  agregarProducto(producto: ProductoVista): void {
    const productoApi: ProductoApi = {
      idProducto: producto.id,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precioVenta: producto.precioOriginal,
      categoria: this.categorias.find((c) => c.nombre === producto.categoriaNombre) ?? null
    };
    this.cartService.add(productoApi);
  }

  /** Extrae la fecha de caducidad del producto (idéntico al catálogo). */
  private getFecha(producto: any): string {
    const fecha = producto.fechaCaducidad || producto.fecha_caducidad;
    if (!fecha) return '';
    if (Array.isArray(fecha)) {
      const mes = fecha[1] < 10 ? '0' + fecha[1] : fecha[1];
      const dia = fecha[2] < 10 ? '0' + fecha[2] : fecha[2];
      return `${fecha[0]}-${mes}-${dia}`;
    }
    return fecha;
  }

  /**
   * Calcula el descuento según la fecha de caducidad.
   * Lógica idéntica a CatalogoComponent.getDiscountInfo() para que
   * el carrusel muestre exactamente los mismos precios que el catálogo.
   */
  private getDiscountInfo(fechaCaducidad: string): { percentage: number; message: string; isExpired: boolean } {
    if (!fechaCaducidad) return { percentage: 0, message: '', isExpired: false };
    const expDate = new Date(fechaCaducidad);
    const today = new Date();
    const monthsLeft =
      (expDate.getFullYear() - today.getFullYear()) * 12 + (expDate.getMonth() - today.getMonth());

    if (monthsLeft < 0 || (monthsLeft === 0 && expDate.getDate() < today.getDate())) {
      return { percentage: 0, message: 'PRODUCTO VENCIDO', isExpired: true };
    }
    if (monthsLeft <= 6)  return { percentage: 0.3,  message: 'Liquidación 30% dscto.', isExpired: false };
    if (monthsLeft <= 12) return { percentage: 0.1,  message: 'Oferta 10% dscto.',      isExpired: false };
    if (monthsLeft <= 24) return { percentage: 0.05, message: 'Promo 5% dscto.',        isExpired: false };
    return { percentage: 0, message: '', isExpired: false };
  }

  private mapProducto(producto: ProductoApi): ProductoVista {
    const categoriaNombre = producto.categoria?.nombre ?? 'General';
    const categoriaKey = categoriaNombre.toLowerCase();
    const imagen = producto.imgUrl || this.imagenPorCategoria[categoriaKey] || 'assets/img/placeholder-pill.png';

    // Usar precioVenta (igual que el catálogo) y calcular el descuento por caducidad
    const precioOriginal = Number(producto.precioVenta);
    const fechaCad = this.getFecha(producto);
    const descuentoInfo = this.getDiscountInfo(fechaCad);
    const descuentoPct = Math.round(descuentoInfo.percentage * 100);
    const precio = precioOriginal * (1 - descuentoInfo.percentage);

    return {
      id: producto.idProducto,
      nombre: producto.nombre,
      descripcion: producto.descripcion ?? 'Producto del catálogo FarmaCode',
      precio,
      precioOriginal,
      descuentoPct,
      categoriaNombre,
      imagen
    };
  }

  get chunkedProducts(): ProductoVista[][] {
    const chunks: ProductoVista[][] = [];
    for (let i = 0; i < this.productos.length; i += 4) {
      chunks.push(this.productos.slice(i, i + 4));
    }
    return chunks;
  }
}