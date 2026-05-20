import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PagoService {
  // Asegúrate de que este puerto coincida con tu backend (suele ser 8080)
  private readonly apiUrl = 'http://localhost:8080/api/pago/procesar';

  constructor(private readonly http: HttpClient) {}

  procesarPago(datosPago: any): Observable<any> {
    return this.http.post(this.apiUrl, datosPago);
  }
}