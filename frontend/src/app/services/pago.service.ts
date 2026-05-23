import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Servicio para procesar pagos enviando los datos al backend.
 * Singleton compartido (providedIn: 'root').
 * 
 * Conecta con el endpoint POST /api/pago/procesar del backend Spring Boot.
 * El backend valida el carrito, aplica cupones si los hay, crea el pedido
 * y vacía el carrito del usuario.
 * 
 * NOTA: Las peticiones a /api/pago/* requieren autenticación JWT.
 */
@Injectable({
  providedIn: 'root'
})
export class PagoService {
  /**
   * URL del endpoint de procesamiento de pagos.
   * Asegúrate de que el puerto coincida con el del backend (8080 por defecto).
   */
  private readonly apiUrl = 'http://localhost:8080/api/pago/procesar';

  /**
   * @param http cliente HTTP de Angular.
   * @param authService servicio de autenticación para obtener el token.
   */
  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService
  ) {}

  /**
   * Envía los datos del pago al backend para su procesamiento.
   * 
   * El backend:
   * 1. Verifica que el usuario esté autenticado.
   * 2. Obtiene el carrito del usuario.
   * 3. Valida y aplica el cupón si se proporcionó.
   * 4. Crea el pedido con el total final.
   * 5. Vacía el carrito.
   * 
   * @param datosPago objeto con los datos del pago:
   *   - metodoPago: 'TARJETA' | 'YAPE'
   *   - codigoCupon: string (opcional, puede ser vacío)
   * @returns Observable con { message: "Pago procesado con éxito" } o error.
   */
  procesarPago(datosPago: any): Observable<any> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.post(this.apiUrl, datosPago, { headers });
  }
}