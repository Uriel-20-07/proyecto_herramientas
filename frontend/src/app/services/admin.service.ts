import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Servicio de autenticación y gestión de sesiones para administradores.
 * Singleton compartido (providedIn: 'root').
 * 
 * Separado del AuthService de clientes porque los administradores tienen:
 * - Endpoint de login diferente (/api/admin/auth/login).
 * - Almacenamiento separado en localStorage (adminToken, adminUser).
 * - Roles específicos: "admin" o "vendedor".
 * 
 * También expone métodos para consumir los endpoints protegidos del panel admin
 * (productos, ventas, estadísticas).
 * 
 * Compatibilidad SSR: verifica typeof window !== 'undefined' antes de usar
 * localStorage (localStorage no existe en el servidor durante SSR/Angular Universal).
 */
@Injectable({
  providedIn: 'root'
})
export class AdminService {
  /** URL base de la API de administración. */
  private apiUrl = 'http://localhost:8080/api/admin';

  /** Token JWT del administrador autenticado. null = sin sesión. */
  private adminTokenSubject = new BehaviorSubject<string | null>(null);

  /** Observable del token de administrador. */
  public adminToken$ = this.adminTokenSubject.asObservable();

  /** Datos del administrador actual (id, nombre, correo, rol). null = sin sesión. */
  private adminUserSubject = new BehaviorSubject<any>(null);

  /** Observable del usuario administrador actual. */
  public adminUser$ = this.adminUserSubject.asObservable();

  /**
   * Constructor: restaura la sesión de administrador desde localStorage si existe.
   * El check typeof window !== 'undefined' evita errores durante SSR (Angular Universal).
   *
   * @param http cliente HTTP de Angular.
   */
  constructor(private http: HttpClient) {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('adminToken');
      const user = localStorage.getItem('adminUser');
      if (token) {
        this.adminTokenSubject.next(token);
      }
      if (user) {
        this.adminUserSubject.next(JSON.parse(user));
      }
    }
  }

  /**
   * Construye los headers HTTP con el token JWT del administrador.
   * Intenta primero el BehaviorSubject y luego localStorage como fallback.
   *
   * @returns HttpHeaders con "Authorization: Bearer <adminToken>".
   */
  private getHeaders() {
    let token = this.adminTokenSubject.value;
    if (!token && typeof window !== 'undefined') {
      token = localStorage.getItem('adminToken'); // Fallback a localStorage
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Autentica a un administrador con su correo corporativo y contraseña.
   * Al recibir el token, lo persiste en localStorage y actualiza los BehaviorSubjects.
   *
   * @param email    correo corporativo del administrador.
   * @param password contraseña del administrador.
   * @returns Observable con { token, usuario } del backend.
   */
  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      tap((response: any) => {
        if (response.token) {
          if (typeof window !== 'undefined') {
            // Persistir en localStorage para sobrevivir recargas de página
            localStorage.setItem('adminToken', response.token);
            localStorage.setItem('adminUser', JSON.stringify(response.usuario));
          }
          // Actualizar estado reactivo para notificar a los componentes
          this.adminTokenSubject.next(response.token);
          this.adminUserSubject.next(response.usuario);
        }
      })
    );
  }

  /**
   * Cierra la sesión del administrador.
   * Elimina el token y datos del localStorage y resetea los BehaviorSubjects.
   */
  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
    }
    this.adminTokenSubject.next(null);
    this.adminUserSubject.next(null);
  }

  /**
   * Obtiene la lista completa de productos del catálogo (con JWT de admin).
   * Requiere autenticación de administrador.
   *
   * @returns Observable con array de productos.
   */
  getProductos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/productos`, { headers: this.getHeaders() });
  }

  /**
   * Actualiza el stock de un producto específico.
   * Solo disponible para administradores con rol "admin" (verificado en backend).
   *
   * @param id    ID del producto a actualizar.
   * @param stock nuevo valor de stock (número entero no negativo).
   * @returns Observable con el producto actualizado.
   */
  actualizarStock(id: number, stock: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/productos/${id}/stock`, { stock }, { headers: this.getHeaders() });
  }

  /**
   * Obtiene la lista de todas las ventas con sus detalles completos.
   * Usada en el panel de ventas del dashboard.
   *
   * @returns Observable con array de ventas enriquecidas.
   */
  getVentas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/ventas`, { headers: this.getHeaders() });
  }

  /**
   * Obtiene estadísticas de ventas agrupadas por día.
   * Usada para las gráficas del dashboard (Chart.js).
   *
   * @returns Observable con array de { fecha, totalVentas, cantidadPedidos }.
   */
  getStats(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/ventas/stats`, { headers: this.getHeaders() });
  }

  /**
   * Verifica si el usuario administrador actual tiene rol de administrador completo.
   *
   * @returns true si el rol es "admin", false si es "vendedor" o no hay sesión.
   */
  isAdmin(): boolean {
    const user = this.adminUserSubject.value;
    return user && user.rol === 'admin';
  }

  /**
   * Verifica si el usuario administrador actual tiene rol de vendedor.
   *
   * @returns true si el rol es "vendedor", false en caso contrario.
   */
  isSeller(): boolean {
    const user = this.adminUserSubject.value;
    return user && user.rol === 'vendedor';
  }

  /**
   * Verifica si hay una sesión de administrador activa.
   * Comprueba tanto el BehaviorSubject como el localStorage.
   *
   * @returns true si hay token de administrador disponible.
   */
  isAuthenticated(): boolean {
    return !!(this.adminTokenSubject.value || (typeof window !== 'undefined' && localStorage.getItem('adminToken')));
  }

  /**
   * Obtiene los datos del administrador actual desde el BehaviorSubject o localStorage.
   *
   * @returns objeto con los datos del administrador, o null si no hay sesión.
   */
  getCurrentUser(): any {
    if (this.adminUserSubject.value) {
      return this.adminUserSubject.value;
    }
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('adminUser');
      return user ? JSON.parse(user) : null;
    }
    return null;
  }
}
