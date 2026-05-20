import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';

// ─── CONFIGURACIÓN EMAILJS ────────────────────────────────────────────────────
const EMAILJS_SERVICE_ID  = 'service_rcioayq';
const EMAILJS_TEMPLATE_ID = 'template_stu3jvw';
const EMAILJS_PUBLIC_KEY  = 'HDwamrH2SgIFGUpNw';
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-pago',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './pago.html',
  styleUrl: './pago.css'
})
export class PagoComponent implements OnInit {

  metodoSeleccionado: 'TARJETA' | 'YAPE' = 'TARJETA';
  subtotal: number = 0;
  descuento: number = 0;
  total: number = 0;

  // Los items tienen estructura { producto: {...}, cantidad: number }
  productosCarrito: { producto: any; cantidad: number }[] = [];

  // Cupón
  codigoCupon: string = '';
  cuponAplicado: boolean = false;
  codigoAplicado: string = '';

  // Mensajes UI
  mensajeError: string = '';
  mensajeExito: string = '';
  enviandoCodigo: boolean = false;

  // Pantalla de éxito
  pagoExitoso: boolean = false;
  folioGenerado: string = '';
  direccionFinal: string = '';

  // Tarjeta
  tipoTarjeta: string = '';

  // Yape
  yapePaso: 1 | 2 = 1;
  codigoYapeGenerado: string = '';
  correoDestino: string = '';

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

  formPago: any = {
    distrito: '',
    direccionDetalle: '',
    referencia: '',
    numeroTarjeta: '',
    nombreTarjeta: '',
    expiracion: '',
    cvv: '',
    numeroCelular: '',
    correoYape: '',
    tokenYape: ''
  };

  constructor(
    private readonly cartService: CartService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.subtotal = this.cartService.getTotal();
    this.productosCarrito = this.cartService.getItems();
    this.calcularTotales();
    if (this.subtotal === 0) {
      this.router.navigate(['/catalogo']);
    }
  }

  seleccionarMetodo(metodo: 'TARJETA' | 'YAPE') {
    this.metodoSeleccionado = metodo;
    this.mensajeError = '';
    this.mensajeExito = '';
    this.yapePaso = 1;
  }

  // ── TARJETA ──────────────────────────────────────────────────────────────────
  detectarTarjeta() {
    const num = this.formPago.numeroTarjeta.replace(/\s+/g, '');
    if (num.startsWith('4'))                               this.tipoTarjeta = 'Visa';
    else if (/^5[1-5]/.test(num) || /^2[2-7]/.test(num)) this.tipoTarjeta = 'Mastercard';
    else if (/^3[47]/.test(num))                          this.tipoTarjeta = 'American Express';
    else if (/^6/.test(num))                              this.tipoTarjeta = 'Discover';
    else if (/^3(?:0[0-5]|[68])/.test(num))              this.tipoTarjeta = 'Diners Club';
    else                                                   this.tipoTarjeta = '';
  }

  // ── YAPE + EMAILJS ───────────────────────────────────────────────────────────
  async enviarCodigoYape() {
    this.mensajeError = '';
    this.mensajeExito = '';

    const cel    = this.formPago.numeroCelular;
    const correo = this.formPago.correoYape.trim();

    if (cel.length !== 9 || !cel.startsWith('9')) {
      this.mensajeError = 'Ingresa un número de 9 dígitos que empiece con 9.';
      return;
    }
    if (!correo || !correo.includes('@')) {
      this.mensajeError = 'Ingresa un correo válido donde recibirás el código.';
      return;
    }

    this.enviandoCodigo = true;
    this.codigoYapeGenerado = Math.floor(100000 + Math.random() * 900000).toString();
    this.correoDestino = correo;

    try {
      const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id:  EMAILJS_SERVICE_ID,
          template_id: EMAILJS_TEMPLATE_ID,
          user_id:     EMAILJS_PUBLIC_KEY,
          template_params: {
            to_email: correo,
            celular:  cel,
            codigo:   this.codigoYapeGenerado
          }
        })
      });

      if (res.ok) {
        this.mensajeExito = `Código enviado a ${correo}. Revisa tu bandeja (y spam).`;
        this.yapePaso = 2;
      } else {
        const err = await res.text();
        this.mensajeError = `No se pudo enviar el código (${err}). Verifica tu configuración de EmailJS.`;
      }
    } catch {
      this.mensajeError = 'Error de conexión. Intenta nuevamente.';
    } finally {
      this.enviandoCodigo = false;
    }
  }

  // ── CUPÓN ─────────────────────────────────────────────────────────────────────
  aplicarCupon() {
    const cod = this.codigoCupon.trim().toUpperCase();
    if (cod.startsWith('BIENVENIDA-') && cod.length > 15 && !this.cuponAplicado) {
      this.descuento      = this.subtotal * 0.30;
      this.cuponAplicado  = true;
      this.codigoAplicado = cod;
      this.mensajeError   = '';
      this.calcularTotales();
    } else {
      this.mensajeError = 'Código de promoción no válido o expirado.';
    }
  }

  calcularTotales() {
    this.total = this.subtotal - this.descuento;
  }

  // ── PAGO ──────────────────────────────────────────────────────────────────────
  ejecutarPago(): void {
    this.mensajeError = '';

    if (!this.formPago.distrito) {
      this.mensajeError = 'Selecciona el distrito de entrega.';
      return;
    }
    if (!this.formPago.direccionDetalle.trim()) {
      this.mensajeError = 'Ingresa la dirección detallada.';
      return;
    }

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
      if (this.formPago.cvv.length < 3) {
        this.mensajeError = 'CVV inválido.';
        return;
      }
    } else {
      if (this.yapePaso === 1) {
        this.mensajeError = 'Primero envía y verifica tu código Yape.';
        return;
      }
      if (this.formPago.tokenYape.length !== 6) {
        this.mensajeError = 'El código de aprobación debe tener 6 dígitos.';
        return;
      }
      if (this.formPago.tokenYape !== this.codigoYapeGenerado) {
        this.mensajeError = 'Código incorrecto. Revisa el correo que recibiste.';
        return;
      }
    }

    // Mostrar pantalla de éxito
    this.folioGenerado = `FC-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;
    this.direccionFinal = `${this.formPago.direccionDetalle}, ${this.formPago.distrito}, Lima`;
    this.pagoExitoso = true;

    // Limpiar carrito y redirigir tras 4 segundos
    this.cartService.clear();
    setTimeout(() => {
      this.router.navigate(['/catalogo']);
    }, 4000);
  }
}