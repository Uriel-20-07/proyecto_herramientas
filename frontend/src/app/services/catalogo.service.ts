import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Interfaz que representa una marca de producto en la API.
 * Las marcas son opcionales en los productos (campo imgUrl también opcional).
 */
export interface MarcaApi {
  idMarca: number;
  nombre: string;
  imgUrl?: string; // URL de imagen de la marca (opcional)
}

/**
 * Interfaz que representa una categoría de productos en la API.
 * Ejemplo: "Analgésicos", "Antibióticos", "Vitaminas", etc.
 */
export interface CategoriaApi {
  idCategoria: number;
  nombre: string;
}

/**
 * Interfaz que representa un producto del catálogo según la respuesta de la API.
 * Algunos campos son opcionales ya que el backend podría no enviarlos siempre.
 */
export interface ProductoApi {
  idProducto: number;
  nombre: string;
  descripcion?: string;      // Descripción del producto (opcional)
  precioVenta: number;
  categoria?: CategoriaApi | null; // Categoría del producto (null si no tiene)
  imgUrl?: string;           // URL de la imagen del producto (opcional)
  fechaCaducidad?: any;
  fecha_caducidad?: any;
}

/**
 * Servicio para consumir la API del catálogo de productos, categorías y marcas.
 * Singleton compartido en toda la aplicación (providedIn: 'root').
 * 
 * Conecta con los endpoints públicos del backend:
 * - GET /api/productos  → lista de todos los productos.
 * - GET /api/categorias → lista de categorías disponibles.
 * - GET /api/marcas     → lista de marcas disponibles.
 */
@Injectable({
  providedIn: 'root'
})
export class CatalogoService {
  /** URL del endpoint de productos del backend. */
  private readonly productosUrl = 'http://localhost:8080/api/productos';

  /** URL del endpoint de categorías del backend. */
  private readonly categoriasUrl = 'http://localhost:8080/api/categorias';

  /** URL del endpoint de marcas del backend. */
  private readonly marcasUrl = 'http://localhost:8080/api/marcas';

  /**
   * @param http cliente HTTP de Angular para realizar las peticiones GET.
   */
  constructor(private readonly http: HttpClient) {}

  /**
   * Obtiene la lista completa de productos del catálogo.
   *
   * @returns Observable con array de ProductoApi.
   */
  getProductos(): Observable<ProductoApi[]> {
    return this.http.get<ProductoApi[]>(this.productosUrl);
  }

  /**
   * Obtiene la lista de categorías de productos disponibles.
   * Se usa para los filtros del catálogo y del carrito.
   *
   * @returns Observable con array de CategoriaApi.
   */
  getCategorias(): Observable<CategoriaApi[]> {
    return this.http.get<CategoriaApi[]>(this.categoriasUrl);
  }

  /**
   * Obtiene la lista de marcas de productos disponibles.
   * Se usa en la página de Marcas para mostrar las marcas disponibles.
   *
   * @returns Observable con array de MarcaApi.
   */
  getMarcas(): Observable<MarcaApi[]> {
    return this.http.get<MarcaApi[]>(this.marcasUrl);
  }
}