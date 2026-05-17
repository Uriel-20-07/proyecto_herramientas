import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth';
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private tokenSubject = new BehaviorSubject<string | null>(null);
  public token$ = this.tokenSubject.asObservable();

  constructor(private http: HttpClient) {
    // Recuperar datos del localStorage al iniciar
    const token = localStorage.getItem('token');
    const usuario = localStorage.getItem('usuario');
    
    if (token) {
      this.tokenSubject.next(token);
    }
    if (usuario) {
      this.currentUserSubject.next(JSON.parse(usuario));
    }
  }

  registro(
    email: string,
    password: string,
    nombre: string,
    apellido: string,
    telefono: string
  ): Observable<any> {
    return this.http.post(`${this.apiUrl}/registro`, {
      email,
      password,
      nombre,
      apellido,
      telefono
    });
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((response: any) => {
        if (response.token) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('usuario', JSON.stringify(response.usuario));
          this.tokenSubject.next(response.token);
          this.currentUserSubject.next(response.usuario);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
  }

  solicitarRecuperacion(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/solicitar-recuperacion`, { email });
  }

  validarToken(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/validar-token/${token}`);
  }

  cambiarContraseña(token: string, nuevaContraseña: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/cambiar-contrasena`, {
      token,
      nuevaContraseña
    });
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }
}
