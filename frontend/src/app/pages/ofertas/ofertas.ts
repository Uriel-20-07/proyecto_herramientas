import { Component } from '@angular/core';

/**
 * Componente de la página de Ofertas y Promociones.
 * 
 * Es un componente standalone (no necesita NgModule) que define su propio
 * template (ofertas.html) y estilos (ofertas.css).
 * 
 * Selector: 'app-ofertas' → se puede usar como <app-ofertas> en templates.
 * 
 * Estado actual: componente vacío (pendiente de implementación).
 * La página de ofertas mostrará productos con descuentos especiales.
 */
@Component({
  selector: 'app-ofertas',
  standalone: true,
  templateUrl: './ofertas.html',
  styleUrls: ['./ofertas.css']
})
export class OfertasComponent {
  // TODO: Implementar lógica de ofertas
  // - Cargar productos en oferta desde el backend
  // - Mostrar descuentos y precios originales
  // - Filtrar por tipo de oferta
}