import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { PagoService } from '../../services/pago.service';

// ─── CONFIGURACIÓN EMAILJS ────────────────────────────────────────────────────
// EmailJS es un servicio que permite enviar correos desde el frontend (JavaScript)
// sin necesidad de un servidor propio. Se usa para enviar el código de verificación
// de Yape al correo del usuario.
// 
// Estos valores corresponden a la cuenta de EmailJS del proyecto:
// - SERVICE_ID:  ID del servicio de email configurado (ej: Gmail).
// - TEMPLATE_ID: ID de la plantilla de email creada en EmailJS.
// - PUBLIC_KEY:  Clave pública de la cuenta de EmailJS (no es secreta).
const EMAILJS_SERVICE_ID  = 'service_rcioayq';
const EMAILJS_TEMPLATE_ID = 'template_stu3jvw';
const EMAILJS_PUBLIC_KEY  = 'HDwamrH2SgIFGUpNw';
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Componente de la página de Pago (Checkout).
 * 
 * Funcionalidades principales:
 * 1. Muestra el resumen del pedido (productos, cantidades, precios).
 * 2. Permite seleccionar método de pago: TARJETA o YAPE.
 * 3. Detecta automáticamente el tipo de tarjeta (Visa, Mastercard, etc.).
 * 4. Para YAPE: genera un código de 6 dígitos y lo envía por email via EmailJS.
 * 5. Permite ingresar un cupón de descuento (BIENVENIDA-XXX → 30% off).
 * 6. Valida todos los campos del formulario antes de procesar.
 * 7. Al confirmar el pago: genera un folio, vacía el carrito y redirige al catálogo.
 * 
 * Standalone component. Importa: CommonModule, RouterLink, FormsModule.
 */
@Component({
  selector: 'app-pago',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './pago.html',
  styleUrl: './pago.css'
})
export class PagoComponent implements OnInit {

  /** Método de pago seleccionado por el usuario. Default: TARJETA. */
  metodoSeleccionado: 'TARJETA' | 'YAPE' = 'TARJETA';

  /** Subtotal del carrito (precio × cantidad de todos los ítems, sin descuento). */
  subtotal: number = 0;

  /** Monto de descuento aplicado por cupón. */
  descuento: number = 0;

  /** Total final a pagar (subtotal - descuento). */
  total: number = 0;

  /** Costo de envío (S/ 5.00 si subtotal <= S/ 50.00, gratis si > S/ 50.00). */
  costoEnvio: number = 0;

  /** Lista de ítems del carrito con estructura { producto, cantidad }. */
  productosCarrito: { producto: any; cantidad: number }[] = [];

  // ── Estado del cupón ──────────────────────────────────────────────────────────
  /** Código del cupón ingresado por el usuario en el campo de texto. */
  codigoCupon: string = '';

  /** Indica si ya se aplicó un cupón exitosamente. Evita aplicar dos cupones. */
  cuponAplicado: boolean = false;

  /** Código del cupón que fue aplicado (para mostrar en la UI). */
  codigoAplicado: string = '';

  // ── Mensajes de UI ────────────────────────────────────────────────────────────
  /** Mensaje de error para mostrar al usuario (validaciones, errores). */
  mensajeError: string = '';

  /** Mensaje de éxito para mostrar al usuario (cupón aplicado, código enviado). */
  mensajeExito: string = '';

  /** Indica si se está enviando el código de Yape por email (loading state). */
  enviandoCodigo: boolean = false;

  // ── Pantalla de éxito tras el pago ────────────────────────────────────────────
  /** Indica si el pago fue procesado exitosamente (muestra pantalla de confirmación). */
  pagoExitoso: boolean = false;

  /** Número de folio generado para el pedido (formato FC-XXXXX). */
  folioGenerado: string = '';

  /** Dirección de entrega final formateada (dirección + distrito + Lima). */
  direccionFinal: string = '';

  // ── Tarjeta de crédito/débito ─────────────────────────────────────────────────
  /** Tipo de tarjeta detectado automáticamente (Visa, Mastercard, etc.). */
  tipoTarjeta: string = '';

  // ── Yape ──────────────────────────────────────────────────────────────────────
  /** Paso actual del flujo de Yape: 1=ingresar datos, 2=verificar código. */
  yapePaso: 1 | 2 = 1;

  /** Código de 6 dígitos generado aleatoriamente para verificación de Yape. */
  codigoYapeGenerado: string = '';

  /** Correo al que se envió el código de verificación de Yape. */
  correoDestino: string = '';

  /**
   * Lista de distritos de Lima para el selector de distrito de entrega.
   * Ordenados alfabéticamente.
   */
  readonly distritosLima: string[] = [
    'Ancón', 'Ate', 'Barranco', 'Breña', 'Carabayllo', 'Chaclacayo',
    'Chorrillos', 'Cieneguilla', 'Comas', 'El Agustino', 'Independencia',
    'Jesús María', 'La Molina', 'La Victoria', 'Lince', 'Los Olivos',
    'Lurigancho', 'Lurín', 'Magdalena del Mar', 'Miraflores', 'Pachacámac',
    'Pucusana', 'Pueblo Libre', 'Puente Piedra', 'Punta Hermosa',
    'Punta Negra', 'Rímac', 'San Bartolo', 'San Borja', 'San Isidro',
    'San Juan de Lurigancho', 'San Juan de Miraflores', 'San Luis',
    'San Martín de Porres', 'San Miguel', 'Santa Anita', 'Santa María del Mar',
    'Santa Rosa', 'Santiago de Surco', 'Surquillo', 'Villa El Salvador',
    'Villa María del Triunfo'
  ];

  /**
   * Modelo del formulario de pago con todos los campos necesarios.
   * Angular Forms (ngModel) enlaza este objeto con los inputs del template.
   */
  formPago: any = {
    distrito: '',             // Distrito de Lima para la entrega
    direccionDetalle: '',     // Dirección exacta (calle, número, piso, etc.)
    referencia: '',           // Referencia de la dirección (opcional)
    numeroTarjeta: '',        // Número de 15-16 dígitos de la tarjeta
    nombreTarjeta: '',        // Nombre del titular como aparece en la tarjeta
    expiracion: '',           // Fecha de expiración (MM/YY)
    cvv: '',                  // Código de seguridad de 3-4 dígitos
    numeroCelular: '',        // Número de celular Yape (9 dígitos, empieza con 9)
    correoYape: '',           // Correo donde se recibirá el código de Yape
    tokenYape: ''             // Código de 6 dígitos ingresado por el usuario
  };

  /**
   * @param cartService servicio del carrito para obtener ítems y vaciarlo tras el pago.
   * @param router      servicio de navegación para redirigir al catálogo tras el pago.
   * @param pagoService servicio de pago para procesar la transacción en el backend.
   */
  constructor(
    private readonly cartService: CartService,
    private readonly router: Router,
    private readonly pagoService: PagoService
  ) {}

  /**
   * Inicialización: carga los datos del carrito y redirige si está vacío.
   * Un carrito vacío en la página de pago no tiene sentido, así que redirige al catálogo.
   */
  ngOnInit(): void {
    this.subtotal = this.cartService.getTotal();
    this.productosCarrito = this.cartService.getItems();
    this.calcularTotales();

    // Si el carrito está vacío, redirigir al catálogo (no hay nada que pagar)
    if (this.subtotal === 0) {
      this.router.navigate(['/catalogo']);
    }
  }

  /**
   * Cambia el método de pago seleccionado y resetea los mensajes de UI.
   * También resetea el paso de Yape al paso 1 al cambiar de método.
   *
   * @param metodo método de pago seleccionado: 'TARJETA' o 'YAPE'.
   */
  seleccionarMetodo(metodo: 'TARJETA' | 'YAPE') {
    this.metodoSeleccionado = metodo;
    this.mensajeError = '';
    this.mensajeExito = '';
    this.yapePaso = 1; // Resetear el flujo de Yape al cambiar de método
  }

  // ── TARJETA ──────────────────────────────────────────────────────────────────

  /**
   * Detecta automáticamente el tipo de tarjeta según el número ingresado.
   * Se llama en cada cambio del campo de número de tarjeta (ngModelChange).
   * 
   * Patrones de detección:
   * - Visa: comienza con 4.
   * - Mastercard: comienza con 51-55 o 2221-2720.
   * - American Express: comienza con 34 o 37.
   * - Discover: comienza con 6.
   * - Diners Club: comienza con 300-305, 36 o 38.
   */
  detectarTarjeta() {
    const num = this.formPago.numeroTarjeta.replace(/\s+/g, ''); // Eliminar espacios
    if (num.startsWith('4'))                               this.tipoTarjeta = 'Visa';
    else if (/^5[1-5]/.test(num) || /^2[2-7]/.test(num)) this.tipoTarjeta = 'Mastercard';
    else if (/^3[47]/.test(num))                          this.tipoTarjeta = 'American Express';
    else if (/^6/.test(num))                              this.tipoTarjeta = 'Discover';
    else if (/^3(?:0[0-5]|[68])/.test(num))              this.tipoTarjeta = 'Diners Club';
    else                                                   this.tipoTarjeta = ''; // Tipo desconocido
  }

  // ── YAPE + EMAILJS ───────────────────────────────────────────────────────────

  /**
   * Genera un código de 6 dígitos y lo envía al correo del usuario via EmailJS.
   * 
   * Flujo:
   * 1. Valida el número de celular (9 dígitos, empieza con 9).
   * 2. Valida que el correo sea válido.
   * 3. Genera un código aleatorio de 6 dígitos.
   * 4. Envía el código por email via EmailJS REST API.
   * 5. Si es exitoso: avanza al paso 2 (ingresar el código recibido).
   * 6. Si falla: muestra mensaje de error.
   */
  async enviarCodigoYape() {
    this.mensajeError = '';
    this.mensajeExito = '';

    const cel    = this.formPago.numeroCelular;
    const correo = this.formPago.correoYape.trim();

    // Validar número de celular peruano (9 dígitos, empieza con 9)
    if (cel.length !== 9 || !cel.startsWith('9')) {
      this.mensajeError = 'Ingresa un número de 9 dígitos que empiece con 9.';
      return;
    }
    // Validar correo electrónico (validación básica con @)
    if (!correo || !correo.includes('@')) {
      this.mensajeError = 'Ingresa un correo válido donde recibirás el código.';
      return;
    }

    this.enviandoCodigo = true;
    // Generar código de 6 dígitos aleatorio (100000-999999)
    this.codigoYapeGenerado = Math.floor(100000 + Math.random() * 900000).toString();
    this.correoDestino = correo;

    try {
      // Llamada a la API REST de EmailJS para enviar el correo
      const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id:  EMAILJS_SERVICE_ID,
          template_id: EMAILJS_TEMPLATE_ID,
          user_id:     EMAILJS_PUBLIC_KEY,
          template_params: {
            to_email: correo,         // Destinatario
            celular:  cel,            // Número de celular para el template
            codigo:   this.codigoYapeGenerado // Código a enviar
          }
        })
      });

      if (res.ok) {
        this.mensajeExito = `Código enviado a ${correo}. Revisa tu bandeja (y spam).`;
        this.yapePaso = 2; // Avanzar al paso de verificación del código
      } else {
        const err = await res.text();
        this.mensajeError = `No se pudo enviar el código (${err}). Verifica tu configuración de EmailJS.`;
      }
    } catch {
      this.mensajeError = 'Error de conexión. Intenta nuevamente.';
    } finally {
      this.enviandoCodigo = false; // Resetear el loading state
    }
  }

  // ── CUPÓN ─────────────────────────────────────────────────────────────────────

  /**
   * Valida y aplica un código de cupón de descuento.
   * 
   * Validación:
   * - El código debe comenzar con "BIENVENIDA-" y tener más de 15 caracteres.
   * - Solo se puede aplicar un cupón por compra.
   * 
   * Si es válido: aplica el 30% de descuento sobre el subtotal.
   * 
   * NOTA: Esta validación es solo del lado del cliente. El backend también
   * valida el cupón al procesar el pago para mayor seguridad.
   */
  aplicarCupon() {
    const cod = this.codigoCupon.trim().toUpperCase();
    // Validar formato del código (BIENVENIDA-XXXXXXXXXX) y que no se haya aplicado ya
    if (cod.startsWith('BIENVENIDA-') && cod.length > 15 && !this.cuponAplicado) {
      this.descuento      = this.subtotal * 0.30; // 30% de descuento
      this.cuponAplicado  = true;
      this.codigoAplicado = cod;
      this.mensajeError   = '';
      this.calcularTotales();
    } else {
      this.mensajeError = 'Código de promoción no válido o expirado.';
    }
  }

  /**
   * Recalcula el total final deduciendo el descuento del subtotal.
   * Se llama después de aplicar/eliminar un cupón o cuando cambia el subtotal.
   */
  calcularTotales() {
    this.costoEnvio = this.subtotal > 50 ? 0 : 5;
    this.total = this.subtotal - this.descuento + this.costoEnvio;
  }

  /**
   * Formatea automáticamente el campo de vencimiento como MM/AA, auto-agregando la barra '/'
   * tras ingresar los dos primeros dígitos del mes y bloqueando cualquier caracter no numérico.
   * Evita atrapar al usuario si presiona la tecla de borrar.
   *
   * @param event objeto del evento de entrada.
   */
  formatearVencimiento(event: any) {
    let input = event.target.value;
    const isDelete = event.inputType === 'deleteContentBackward' || event.inputType === 'deleteContentForward';
    
    // Eliminar todo lo que no sea dígito
    let limpio = input.replace(/\D/g, '');
    
    // Cortar a un máximo de 4 dígitos (2 para mes y 2 para año)
    if (limpio.length > 4) {
      limpio = limpio.substring(0, 4);
    }
    
    // Aplicar formato MM/AA
    if (limpio.length > 2) {
      input = limpio.substring(0, 2) + '/' + limpio.substring(2);
    } else if (limpio.length === 2 && !isDelete) {
      input = limpio + '/';
    } else {
      input = limpio;
    }
    
    // Actualizar el modelo del formulario y el valor del input
    this.formPago.expiracion = input;
    event.target.value = input;
  }

  // ── PAGO ──────────────────────────────────────────────────────────────────────

  /**
   * Valida el formulario y procesa el pago.
   * 
   * Validaciones comunes (para ambos métodos):
   * - Distrito de entrega seleccionado.
   * - Dirección detallada ingresada.
   * 
   * Validaciones para TARJETA:
   * - Número de tarjeta de al menos 15 dígitos.
   * - Nombre del titular.
   * - CVV de al menos 3 dígitos.
   * 
   * Validaciones para YAPE:
   * - Debe haber completado el paso 1 (enviar el código).
   * - El código de 6 dígitos ingresado debe coincidir con el generado.
   * 
   * Si todas las validaciones pasan:
   * 1. Genera un folio único (FC-XXXXX).
   * 2. Muestra la pantalla de éxito.
   * 3. Vacía el carrito.
   * 4. Redirige al catálogo después de 4 segundos.
   */
  ejecutarPago(): void {
    this.mensajeError = '';

    // ── Validaciones de dirección de entrega (obligatorias para todos) ───────────
    if (!this.formPago.distrito) {
      this.mensajeError = 'Selecciona el distrito de entrega.';
      return;
    }
    if (!this.formPago.direccionDetalle.trim()) {
      this.mensajeError = 'Ingresa la dirección detallada.';
      return;
    }

    // ── Validaciones específicas según método de pago ────────────────────────────
    if (this.metodoSeleccionado === 'TARJETA') {
      const num = this.formPago.numeroTarjeta.replace(/\s+/g, '');
      if (num.length < 15 || isNaN(Number(num))) {
        this.mensajeError = 'Número de tarjeta inválido.';
        return;
      }
      if (!this.formPago.nombreTarjeta.trim()) {
        this.mensajeError = 'Ingresa el nombre del titular.';
        return;
      }
      
      // Validar fecha de vencimiento (MM/AA)
      const exp = this.formPago.expiracion;
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(exp)) {
        this.mensajeError = 'Fecha de vencimiento inválida. Formato: MM/AA';
        return;
      }

      if (this.formPago.cvv.length < 3) {
        this.mensajeError = 'CVV inválido.';
        return;
      }
    } else {
      // Validaciones de YAPE
      if (this.yapePaso === 1) {
        this.mensajeError = 'Primero envía y verifica tu código Yape.';
        return;
      }
      if (this.formPago.tokenYape.length !== 6) {
        this.mensajeError = 'El código de aprobación debe tener 6 dígitos.';
        return;
      }
      // Verificar que el código ingresado coincida con el enviado por email
      if (this.formPago.tokenYape !== this.codigoYapeGenerado) {
        this.mensajeError = 'Código incorrecto. Revisa el correo que recibiste.';
        return;
      }
    }

    // ── Enviar pago al backend ──────────────────────────────────────────────────
    const datosPago = {
      metodoPago: this.metodoSeleccionado,
      codigoCupon: this.cuponAplicado ? this.codigoAplicado : null
    };

    this.pagoService.procesarPago(datosPago).subscribe({
      next: (res) => {
        // Generar número de folio único (formato FC-XXXXX con padding de ceros)
        this.folioGenerado = `FC-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;
        this.direccionFinal = `${this.formPago.direccionDetalle}, ${this.formPago.distrito}, Lima`;
        this.pagoExitoso = true;

        // Limpiar carrito y redirigir al catálogo después de 4 segundos
        this.cartService.clear();
        setTimeout(() => {
          this.router.navigate(['/catalogo']);
        }, 4000);
      },
      error: (err) => {
        console.error('Error al procesar el pago:', err);
        this.mensajeError = err.error?.error || 'Error al procesar el pago en el servidor.';
      }
    });
  }
}