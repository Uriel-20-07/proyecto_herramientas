import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogoService, ProductoApi, CategoriaApi } from '../../services/catalogo.service';
import { CartService } from '../../services/cart.service';

interface ProductoVista {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  categoriaNombre: string;
  imagen: string;
}

@Component({
  selector: 'app-product-carousel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-carousel.html',
  styleUrls: ['../../pages/catalogo/catalogo.css']
})
export class ProductCarouselComponent implements OnInit {
  productos: ProductoVista[] = [];
  categorias: CategoriaApi[] = [];

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
    private readonly cartService: CartService
  ) {}

  ngOnInit(): void {
    this.catalogoService.getCategorias().subscribe({
      next: (categorias) => {
        this.categorias = categorias;
        this.catalogoService.getProductos().subscribe({
          next: (productos) => {
            this.productos = productos
              .filter((p) => p.categoria?.idCategoria === 4)
              .map((p) => this.mapProducto(p));
          }
        });
      }
    });
  }

  agregarProducto(producto: ProductoVista): void {
    const productoApi: ProductoApi = {
      idProducto: producto.id,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precioVenta: producto.precio,
      categoria: this.categorias.find((c) => c.nombre === producto.categoriaNombre) ?? null
    };
    this.cartService.add(productoApi);
  }

  private mapProducto(producto: ProductoApi): ProductoVista {
    const categoriaNombre = producto.categoria?.nombre ?? 'General';
    const categoriaKey = categoriaNombre.toLowerCase();
    const imagen = producto.imgUrl || this.imagenPorCategoria[categoriaKey] || 'assets/img/placeholder-pill.png';

    return {
      id: producto.idProducto,
      nombre: producto.nombre,
      descripcion: producto.descripcion ?? 'Producto del catálogo FarmaCode',
      precio: Number(producto.precioVenta),
      categoriaNombre,
      imagen
    };
  }

  get chunkedProducts(): any[][] {
    const chunks = [];
    for (let i = 0; i < this.productos.length; i += 4) {
      chunks.push(this.productos.slice(i, i + 4));
    }
    return chunks;
  }
}