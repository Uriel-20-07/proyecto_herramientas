import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { CatalogoService, CategoriaApi, ProductoApi } from '../../services/catalogo.service';

/**
 * Interfaz interna para representar un producto adaptado a la vista del catálogo.
 * Transforma los datos de la API (ProductoApi) al formato que necesita el template HTML.
 */
interface ProductoVista {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  categoriaNombre: string;       // Nombre de la categoría del producto
  imagen: string;                // URL de la imagen (API o imagen local por categoría)
  etiquetaPromo?: string;        // Etiqueta de promoción: "Oferta especial", "Más vendido", etc.
  colorPromo?: 'orange' | 'red'; // Color de la etiqueta de promoción
}

/**
 * Componente de la página del catálogo de productos.
 * 
 * Funcionalidades:
 * - Carga productos y categorías desde el backend al inicializar.
 * - Permite filtrar por categoría (sidebar de filtros).
 * - Permite buscar por nombre/descripción/categoría.
 * - Soporta filtros desde URL query params (?q=paracetamol&categoria=Analgésicos).
 * - Agrega productos al carrito (con modal de login si no está autenticado).
 * - Asigna imágenes locales si el producto no tiene imagen en la API.
 * - Asigna etiquetas de promoción según la categoría del producto.
 * 
 * Standalone component: no necesita NgModule, importa CommonModule directamente.
 */
@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './catalogo.html',
  styleUrls: ['./catalogo.css']
})
export class CatalogoComponent implements OnInit {
  /** Lista de todas las categorías disponibles (para el filtro de sidebar). */
  categorias: CategoriaApi[] = [];

  /** Lista completa de productos transformados al formato de vista. */
  productos: ProductoVista[] = [];

  /** Lista de productos que se muestran actualmente (tras aplicar filtros). */
  productosFiltrados: ProductoVista[] = [];

  /** ID de la categoría seleccionada en el filtro. null = "Todas las categorías". */
  categoriaSeleccionadaId: number | null = null;

  /** Término de búsqueda ingresado por el usuario en el campo de búsqueda. */
  busqueda = '';

  /** Indica si los datos están siendo cargados desde el servidor. */
  cargando = true;

  /** Mensaje de estado para el usuario (producto agregado, errores, etc.). */
  mensaje = '';

  /** Query param de búsqueda proveniente de la URL (?q=...). */
  private queryBusqueda = '';

  /** Query param de categoría proveniente de la URL (?categoria=...). */
  private queryCategoria = '';

  /**
   * Mapa de imagen local por nombre de categoría.
   * Se usa cuando el producto no tiene URL de imagen en la API.
   * Las claves son los nombres de categoría en minúsculas.
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
   * @param catalogoService servicio para cargar productos y categorías del backend.
   * @param cartService     servicio del carrito para agregar productos.
   * @param route           servicio para leer los query params de la URL.
   */
  constructor(
    private readonly catalogoService: CatalogoService,
    private readonly cartService: CartService,
    private readonly route: ActivatedRoute
  ) {}

  /**
   * Inicialización del componente.
   * Suscribe a los query params de la URL para cargar datos con filtros previos
   * cuando el usuario navega desde la navbar o la página de inicio con búsqueda/categoría.
   */
  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.queryBusqueda = params.get('q') ?? '';           // Parámetro de búsqueda
      this.queryCategoria = params.get('categoria') ?? '';  // Parámetro de categoría

      this.cargarDatos(); // Recargar datos cuando cambien los query params
    });
  }

  /**
   * Carga categorías y productos desde el backend de forma encadenada.
   * Primero carga las categorías (para poder mapear productos), luego los productos.
   * Al finalizar, aplica los filtros provenientes de la URL.
   */
  cargarDatos(): void {
    this.cargando = true;
    this.catalogoService.getCategorias().subscribe({
      next: (categorias) => {
        this.categorias = categorias;
        // Cargar productos después de tener las categorías (dependencia de datos)
        this.catalogoService.getProductos().subscribe({
          next: (productos) => {
            // Transformar cada ProductoApi al formato interno ProductoVista
            this.productos = productos.map((producto) => this.mapProducto(producto));
            this.aplicarFiltrosDesdeUrl(); // Aplicar filtros de la URL si existen
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

  /**
   * Ejecuta la búsqueda con el texto actual del campo de búsqueda.
   * Llamado por el botón "Buscar" o al presionar Enter en el template.
   */
  buscar(): void {
    this.aplicarFiltros();
  }

  /**
   * Selecciona o deselecciona una categoría para filtrar los productos.
   *
   * @param idCategoria ID de la categoría a seleccionar, o null para "Todas".
   */
  seleccionarCategoria(idCategoria: number | null): void {
    this.categoriaSeleccionadaId = idCategoria;
    this.aplicarFiltros();
  }

  /**
   * Limpia todos los filtros activos y vuelve a mostrar todos los productos.
   */
  limpiarFiltros(): void {
    this.busqueda = '';
    this.categoriaSeleccionadaId = null;
    this.queryBusqueda = '';
    this.queryCategoria = '';
    this.productosFiltrados = [...this.productos]; // Mostrar todos los productos
  }

  /**
   * Agrega un producto al carrito del usuario.
   * 
   * Convierte el ProductoVista de vuelta a ProductoApi para el CartService.
   * Si el usuario no está autenticado, el CartService abrirá el modal de login.
   * Muestra un mensaje de confirmación que desaparece tras 2.5 segundos.
   *
   * @param producto el producto de la vista a agregar al carrito.
   */
  agregarProducto(producto: ProductoVista): void {
    // Convertir ProductoVista → ProductoApi para el CartService
    const productoApi: ProductoApi = {
      idProducto: producto.id,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precioVenta: producto.precio,
      // Buscar la categoría por nombre para mantener el objeto completo
      categoria: this.categorias.find((categoria) => categoria.nombre === producto.categoriaNombre) ?? null
    };

    this.cartService.add(productoApi);
    this.mensaje = `${producto.nombre} agregado al carrito.`;

    // Limpiar el mensaje después de 2.5 segundos
    window.setTimeout(() => {
      if (this.mensaje.includes(producto.nombre)) {
        this.mensaje = '';
      }
    }, 2500);
  }

  /**
   * Función de trackBy para el *ngFor de productos.
   * Optimiza el rendimiento de Angular evitando re-renderizar ítems que no cambiaron.
   *
   * @param _       índice del item (no se usa).
   * @param producto el producto de la lista.
   * @returns ID único del producto para identificarlo en el DOM.
   */
  trackByProductoId(_: number, producto: ProductoVista): number {
    return producto.id;
  }

  /**
   * Filtra la lista de productos según la categoría seleccionada y el término de búsqueda.
   * Aplica ambos filtros en conjunto (AND lógico).
   */
  private aplicarFiltros(): void {
    const termino = this.busqueda.trim().toLowerCase();

    this.productosFiltrados = this.productos.filter((producto) => {
      // Verificar si el producto pertenece a la categoría seleccionada
      const coincideCategoria = this.categoriaSeleccionadaId === null ||
        this.categorias.find((categoria) => categoria.idCategoria === this.categoriaSeleccionadaId)?.nombre === producto.categoriaNombre;

      // Verificar si el término de búsqueda aparece en nombre, descripción o categoría
      const coincideBusqueda = !termino ||
        producto.nombre.toLowerCase().includes(termino) ||
        producto.descripcion.toLowerCase().includes(termino) ||
        producto.categoriaNombre.toLowerCase().includes(termino);

      return coincideCategoria && coincideBusqueda; // Ambos filtros deben cumplirse
    });
  }

  /**
   * Aplica los filtros provenientes de los query params de la URL.
   * Se llama después de cargar los datos para respetar filtros pre-navegación
   * (ej: usuario busca desde la navbar y llega al catálogo con ?q=paracetamol).
   */
  private aplicarFiltrosDesdeUrl(): void {
    this.busqueda = this.queryBusqueda; // Restaurar término de búsqueda de la URL

    if (this.queryCategoria) {
      // Buscar la categoría por nombre (case-insensitive)
      const categoriaNormalizada = this.queryCategoria.toLowerCase();
      const categoriaEncontrada = this.categorias.find(
        (item) => item.nombre.toLowerCase() === categoriaNormalizada
      );
      this.categoriaSeleccionadaId = categoriaEncontrada?.idCategoria ?? null;
    } else {
      this.categoriaSeleccionadaId = null;
    }

    this.aplicarFiltros(); // Aplicar los filtros restaurados
  }

  /**
   * Transforma un ProductoApi (datos de la API) a ProductoVista (datos para el template).
   * 
   * - Determina la imagen: usa imgUrl de la API o busca una imagen local por categoría.
   * - Determina la etiqueta de promoción según la categoría del producto.
   *
   * @param producto datos del producto de la API.
   * @returns objeto ProductoVista listo para renderizar en el template.
   */
  private mapProducto(producto: ProductoApi): ProductoVista {
    const categoriaNombre = producto.categoria?.nombre ?? 'General';
    const categoriaKey = categoriaNombre.toLowerCase();
    // Prioridad de imagen: 1) URL de la API, 2) imagen local por categoría, 3) placeholder
    const imagen = producto.imgUrl || this.imagenPorCategoria[categoriaKey] || 'assets/img/placeholder-pill.png';

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

  /**
   * Determina la etiqueta de promoción de un producto según su categoría o nombre.
   * 
   * Lógica:
   * - Categoría de medicamentos → "Oferta especial" (etiqueta roja).
   * - Marcas Huggies o Pampers → "Más vendido".
   * - Categoría de belleza → "Nuevo".
   * - Otros → sin etiqueta (undefined).
   *
   * @param nombre         nombre del producto.
   * @param categoriaNombre nombre de la categoría del producto.
   * @returns texto de la etiqueta de promoción, o undefined si no aplica.
   */
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