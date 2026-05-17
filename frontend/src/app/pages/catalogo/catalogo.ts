import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { CatalogoService, CategoriaApi, ProductoApi } from '../../services/catalogo.service';

interface ProductoVista {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  categoriaNombre: string;
  imagen: string;
  etiquetaPromo?: string;
  colorPromo?: 'orange' | 'red';
}

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './catalogo.html',
  styleUrls: ['./catalogo.css']
})
export class CatalogoComponent implements OnInit {
  categorias: CategoriaApi[] = [];
  productos: ProductoVista[] = [];
  productosFiltrados: ProductoVista[] = [];
  categoriaSeleccionadaId: number | null = null;
  busqueda = '';
  cargando = true;
  mensaje = '';
  private queryBusqueda = '';
  private queryCategoria = '';

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
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.queryBusqueda = params.get('q') ?? '';
      this.queryCategoria = params.get('categoria') ?? '';

      this.cargarDatos();
    });
  }

  cargarDatos(): void {
    this.cargando = true;
    this.catalogoService.getCategorias().subscribe({
      next: (categorias) => {
        this.categorias = categorias;
        this.catalogoService.getProductos().subscribe({
          next: (productos) => {
            this.productos = productos.map((producto) => this.mapProducto(producto));
            this.aplicarFiltrosDesdeUrl();
            this.cargando = false;
          },
          error: () => {
            this.mensaje = 'No se pudieron cargar los productos.';
            this.cargando = false;
          }
        });
      },
      error: () => {
        this.mensaje = 'No se pudieron cargar las categorías.';
        this.cargando = false;
      }
    });
  }

  buscar(): void {
    this.aplicarFiltros();
  }

  seleccionarCategoria(idCategoria: number | null): void {
    this.categoriaSeleccionadaId = idCategoria;
    this.aplicarFiltros();
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.categoriaSeleccionadaId = null;
    this.queryBusqueda = '';
    this.queryCategoria = '';
    this.productosFiltrados = [...this.productos];
  }

  agregarProducto(producto: ProductoVista): void {
    const productoApi: ProductoApi = {
      idProducto: producto.id,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precioVenta: producto.precio,
      categoria: this.categorias.find((categoria) => categoria.nombre === producto.categoriaNombre) ?? null
    };

    this.cartService.add(productoApi);
    this.mensaje = `${producto.nombre} agregado al carrito.`;
    window.setTimeout(() => {
      if (this.mensaje.includes(producto.nombre)) {
        this.mensaje = '';
      }
    }, 2500);
  }

  trackByProductoId(_: number, producto: ProductoVista): number {
    return producto.id;
  }

  private aplicarFiltros(): void {
    const termino = this.busqueda.trim().toLowerCase();

    this.productosFiltrados = this.productos.filter((producto) => {
      const coincideCategoria = this.categoriaSeleccionadaId === null ||
        this.categorias.find((categoria) => categoria.idCategoria === this.categoriaSeleccionadaId)?.nombre === producto.categoriaNombre;

      const coincideBusqueda = !termino ||
        producto.nombre.toLowerCase().includes(termino) ||
        producto.descripcion.toLowerCase().includes(termino) ||
        producto.categoriaNombre.toLowerCase().includes(termino);

      return coincideCategoria && coincideBusqueda;
    });
  }

  private aplicarFiltrosDesdeUrl(): void {
    this.busqueda = this.queryBusqueda;

    if (this.queryCategoria) {
      const categoriaNormalizada = this.queryCategoria.toLowerCase();
      const categoriaEncontrada = this.categorias.find(
        (item) => item.nombre.toLowerCase() === categoriaNormalizada
      );

      this.categoriaSeleccionadaId = categoriaEncontrada?.idCategoria ?? null;
    } else {
      this.categoriaSeleccionadaId = null;
    }

    this.aplicarFiltros();
  }

  private mapProducto(producto: ProductoApi): ProductoVista {
    const categoriaNombre = producto.categoria?.nombre ?? 'General';
    const categoriaKey = categoriaNombre.toLowerCase();
    const imagen = this.imagenPorCategoria[categoriaKey] ?? 'assets/img/placeholder-pill.png';

    return {
      id: producto.idProducto,
      nombre: producto.nombre,
      descripcion: producto.descripcion ?? 'Producto del catálogo FarmaCode',
      precio: Number(producto.precioVenta),
      categoriaNombre,
      imagen,
      etiquetaPromo: this.obtenerPromo(producto.nombre, categoriaNombre),
      colorPromo: categoriaNombre === 'MEDICAMENTOS' ? 'red' : 'orange'
    };
  }

  private obtenerPromo(nombre: string, categoriaNombre: string): string | undefined {
    const etiqueta = categoriaNombre.toLowerCase();
    if (etiqueta.includes('medic')) {
      return 'Oferta especial';
    }
    if (nombre.toLowerCase().includes('huggies') || nombre.toLowerCase().includes('pampers')) {
      return 'Más vendido';
    }
    if (etiqueta.includes('belleza')) {
      return 'Nuevo';
    }
    return undefined;
  }
}