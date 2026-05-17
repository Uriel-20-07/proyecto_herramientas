import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CategoriaApi {
  idCategoria: number;
  nombre: string;
}

export interface ProductoApi {
  idProducto: number;
  nombre: string;
  descripcion?: string;
  precioVenta: number;
  categoria?: CategoriaApi | null;
}

@Injectable({
  providedIn: 'root'
})
export class CatalogoService {
  private readonly productosUrl = 'http://localhost:8080/api/productos';
  private readonly categoriasUrl = 'http://localhost:8080/api/categorias';

  constructor(private readonly http: HttpClient) {}

  getProductos(): Observable<ProductoApi[]> {
    return this.http.get<ProductoApi[]>(this.productosUrl);
  }

  getCategorias(): Observable<CategoriaApi[]> {
    return this.http.get<CategoriaApi[]>(this.categoriasUrl);
  }
}