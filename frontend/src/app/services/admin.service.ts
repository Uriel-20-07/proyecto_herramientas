import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private apiUrl = 'http://localhost:8080/api/admin';
  private adminTokenSubject = new BehaviorSubject<string | null>(null);
  public adminToken$ = this.adminTokenSubject.asObservable();
  private adminUserSubject = new BehaviorSubject<any>(null);
  public adminUser$ = this.adminUserSubject.asObservable();

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

  private getHeaders() {
    let token = this.adminTokenSubject.value;
    if (!token && typeof window !== 'undefined') {
      token = localStorage.getItem('adminToken');
    }
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      tap((response: any) => {
        if (response.token) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('adminToken', response.token);
            localStorage.setItem('adminUser', JSON.stringify(response.usuario));
          }
          this.adminTokenSubject.next(response.token);
          this.adminUserSubject.next(response.usuario);
        }
      }),
    );
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
    }
    this.adminTokenSubject.next(null);
    this.adminUserSubject.next(null);
  }

  getProductos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/productos`, { headers: this.getHeaders() });
  }

  actualizarStock(id: number, stock: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/productos/${id}/stock`, { stock }, { headers: this.getHeaders() });
  }

  getVentas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/ventas`, { headers: this.getHeaders() });
  }

  getStats(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/ventas/stats`, { headers: this.getHeaders() });
  }

  isAdmin(): boolean {
    const user = this.adminUserSubject.value;
    return user && user.rol === 'admin';
  }

  isSeller(): boolean {
    const user = this.adminUserSubject.value;
    return user && user.rol === 'vendedor';
  }

  isAuthenticated(): boolean {
    return !!(
      this.adminTokenSubject.value ||
      (typeof window !== 'undefined' && localStorage.getItem('adminToken'))
    );
  }

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

  getLotes(productoId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/productos/${productoId}/lotes`, { headers: this.getHeaders() });
  }

  agregarLote(productoId: number, loteData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/productos/${productoId}/lotes`, loteData, { headers: this.getHeaders() });
  }

  eliminarLote(loteId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/productos/lotes/${loteId}`, { headers: this.getHeaders() });
  }

  getTopProductos(rango: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/ventas/top-productos?rango=${rango}`, { headers: this.getHeaders() });
  }
}
