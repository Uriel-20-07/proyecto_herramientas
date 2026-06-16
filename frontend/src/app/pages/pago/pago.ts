import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

// Servicios de tu proyecto
import { CartService } from '../../services/cart.service';
import { PagoService } from '../../services/pago.service';
import { AuthService } from '../../services/auth.service';

// Stripe Elements para el diseño profesional
import { loadStripe, Stripe, StripeCardNumberElement, StripeCardExpiryElement, StripeCardCvcElement } from '@stripe/stripe-js';

const EMAILJS_SERVICE_ID  = 'service_rcioayq';
const EMAILJS_TEMPLATE_ID = 'template_stu3jvw';
const EMAILJS_PUBLIC_KEY  = 'HDwamrH2SgIFGUpNw';

@Component({
  selector: 'app-pago',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './pago.html',
  styleUrl: './pago.css'
})
export class PagoComponent implements OnInit, AfterViewChecked {

  metodoSeleccionado: 'TARJETA' | 'YAPE' = 'TARJETA';
  subtotal: number = 0;
  descuento: number = 0;
  total: number = 0;
  costoEnvio: number = 0;
  productosCarrito: { producto: any; cantidad: number }[] = [];

  codigoCupon: string = '';
  cuponAplicado: boolean = false;
  codigoAplicado: string = '';

  mensajeError: string = '';
  mensajeExito: string = '';
  enviandoCodigo: boolean = false;
  pagoExitoso: boolean = false;
  folioGenerado: string = '';
  direccionFinal: string = '';

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
    nombreTarjeta: '',
    numeroCelular: '',
    correoYape: '',
    tokenYape: ''
  };

  // --- VARIABLES DE STRIPE ---
  stripe: Stripe | null = null;
  cardNumberElement: StripeCardNumberElement | null = null;
  cardExpiryElement: StripeCardExpiryElement | null = null;
  cardCvcElement: StripeCardCvcElement | null = null;
  stripeInicializado: boolean = false; 
  procesandoPago: boolean = false; 

  constructor(
    private readonly cartService: CartService,
    private readonly router: Router,
    private readonly pagoService: PagoService,
    private readonly authService: AuthService
  ) {}

  async ngOnInit() {
    // 1. Verificar si el usuario está autenticado, si no, redirigir al login
    const token = this.authService.getToken();
    if (!token) {
      this.router.navigate(['/login']); // Redirigir si no hay sesión
      return;
    }

    this.subtotal = this.cartService.getTotal();
    this.productosCarrito = this.cartService.getItems();
    this.calcularTotales();

    // 2. Si el carrito está vacío, no hay nada que pagar
    if (this.subtotal === 0) {
      this.router.navigate(['/catalogo']);
      return;
    }

    // 3. Inicializamos Stripe con tu clave pública
    // ¡REEMPLAZA ESTO CON TU CLAVE REAL!
    this.stripe = await loadStripe('pk_test_51Tiip2Lnmv4gKqcemmOezxhr7kH03Q8SYcwKjfOeM2PeH2HRd8xUqQQyAHrtCDGGFEPlummaXaoXkv6u0HuCEImF00JaBwW6Dd');
  }

  ngAfterViewChecked() {
    if (this.metodoSeleccionado === 'TARJETA' && this.stripe && !this.stripeInicializado) {
      const elements = this.stripe.elements();
      
      const style = {
        base: {
          color: '#334155',
          fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          fontSmoothing: 'antialiased',
          fontSize: '14px',
          '::placeholder': { color: '#94a3b8' }
        },
        invalid: { color: '#e11d48', iconColor: '#e11d48' }
      };

      // Creamos los 3 elementos por separado
      this.cardNumberElement = elements.create('cardNumber', { style, showIcon: true });
      this.cardExpiryElement = elements.create('cardExpiry', { style });
      this.cardCvcElement = elements.create('cardCvc', { style });

      const numDiv = document.getElementById('stripe-card-number');
      if (numDiv) {
        // Inyectamos cada elemento en su respectivo DIV del HTML
        this.cardNumberElement.mount('#stripe-card-number');
        this.cardExpiryElement.mount('#stripe-card-expiry');
        this.cardCvcElement.mount('#stripe-card-cvc');
        this.stripeInicializado = true;

        // Escuchar errores en cualquiera de los 3 campos
        const handleChange = (event: any) => {
          const displayError = document.getElementById('card-errors');
          if (event.error) {
            displayError!.textContent = event.error.message;
          } else {
            displayError!.textContent = '';
          }
        };

        this.cardNumberElement.on('change', handleChange);
        this.cardExpiryElement.on('change', handleChange);
        this.cardCvcElement.on('change', handleChange);
      }
    }
  }

  seleccionarMetodo(metodo: 'TARJETA' | 'YAPE') {
    this.metodoSeleccionado = metodo;
    this.mensajeError = '';
    this.mensajeExito = '';
    this.yapePaso = 1;
    
    // Desmontar los 3 elementos si se cambia a Yape
    if (metodo !== 'TARJETA') {
        this.stripeInicializado = false;
        if (this.cardNumberElement) { this.cardNumberElement.destroy(); this.cardNumberElement = null; }
        if (this.cardExpiryElement) { this.cardExpiryElement.destroy(); this.cardExpiryElement = null; }
        if (this.cardCvcElement) { this.cardCvcElement.destroy(); this.cardCvcElement = null; }
    }
  }

  // --- MÉTODOS YAPE Y CUPÓN MANTENIDOS INTACTOS ---
  async enviarCodigoYape() {
    this.mensajeError = '';
    this.mensajeExito = '';
    const cel = this.formPago.numeroCelular;
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
          template_params: { to_email: correo, celular: cel, codigo: this.codigoYapeGenerado }
        })
      });

      if (res.ok) {
        this.mensajeExito = `Código enviado a ${correo}. Revisa tu bandeja.`;
        this.yapePaso = 2;
      } else {
        const err = await res.text();
        this.mensajeError = `No se pudo enviar el código (${err}).`;
      }
    } catch {
      this.mensajeError = 'Error de conexión. Intenta nuevamente.';
    } finally {
      this.enviandoCodigo = false;
    }
  }

  aplicarCupon() {
    const cod = this.codigoCupon.trim().toUpperCase();
    if (cod.startsWith('BIENVENIDA-') && cod.length > 15 && !this.cuponAplicado) {
      this.descuento = this.subtotal * 0.30;
      this.cuponAplicado = true;
      this.codigoAplicado = cod;
      this.mensajeError = '';
      this.calcularTotales();
    } else {
      this.mensajeError = 'Código de promoción no válido o expirado.';
    }
  }

  calcularTotales() {
    this.costoEnvio = this.subtotal > 50 ? 0 : 5;
    this.total = this.subtotal - this.descuento + this.costoEnvio;
  }

  // --- PAGO PRINCIPAL ---
  async ejecutarPago() {
    if (this.procesandoPago) return;
    this.mensajeError = '';

    if (!this.formPago.distrito) { this.mensajeError = 'Selecciona el distrito.'; return; }
    if (!this.formPago.direccionDetalle.trim()) { this.mensajeError = 'Ingresa la dirección.'; return; }

    if (this.metodoSeleccionado === 'TARJETA') {
        if (!this.formPago.nombreTarjeta.trim()) {
            this.mensajeError = 'Ingresa el nombre del titular de la tarjeta.';
            return;
        }
        if (!this.stripe || !this.cardNumberElement) {
            this.mensajeError = 'Stripe no está inicializado. Recarga la página.';
            return;
        }

        this.procesandoPago = true;

        try {
            // 1. Crear el intento de pago en el servidor
            const datosParaIntent = {
                monto: this.total,
                moneda: 'pen',
                codigoCupon: this.cuponAplicado ? this.codigoAplicado : null,
                direccionEnvio: `${this.formPago.direccionDetalle}, ${this.formPago.distrito}`
            };

            const intentResponse: any = await firstValueFrom(this.pagoService.crearPaymentIntent(datosParaIntent));
            
            // 2. Stripe procesa la tarjeta de forma segura en el frontend
            const confirmResult = await this.stripe.confirmCardPayment(intentResponse.clientSecret, {
                payment_method: {
                    card: this.cardNumberElement,
                    billing_details: { name: this.formPago.nombreTarjeta }
                }
            });

            if (confirmResult.error) {
                this.mensajeError = confirmResult.error.message || 'Error al procesar la tarjeta.';
                this.procesandoPago = false;
                return;
            }

            // 3. Confirmación exitosa, guardamos en la Base de Datos
            if (confirmResult.paymentIntent?.status === 'succeeded') {
                this.finalizarPedidoEnBackend();
            }

        } catch (error: any) {
            this.mensajeError = error.error?.error || 'Error de comunicación con el servidor.';
            this.procesandoPago = false;
        }

    } else {
        // Lógica de Yape intacta
        if (this.yapePaso === 1) { this.mensajeError = 'Verifica tu código Yape.'; return; }
        if (this.formPago.tokenYape !== this.codigoYapeGenerado) {
            this.mensajeError = 'Código Yape incorrecto.'; return;
        }
        this.procesandoPago = true;
        this.finalizarPedidoEnBackend();
    }
  }

  // Finaliza el proceso y muestra la pantalla de éxito
  private finalizarPedidoEnBackend() {
      const datosPago = {
          metodoPago: this.metodoSeleccionado,
          codigoCupon: this.cuponAplicado ? this.codigoAplicado : null,
          direccionEnvio: `${this.formPago.direccionDetalle}, ${this.formPago.distrito}`
      };

      this.pagoService.procesarPago(datosPago).subscribe({
          next: () => {
              this.folioGenerado = `FC-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;
              this.direccionFinal = `${this.formPago.direccionDetalle}, ${this.formPago.distrito}, Lima`;
              this.pagoExitoso = true;
              this.procesandoPago = false;

              this.cartService.clear();
              setTimeout(() => { this.router.navigate(['/catalogo']); }, 4000);
          },
          error: (err) => {
              this.mensajeError = err.error?.error || 'Error al crear el pedido final.';
              this.procesandoPago = false;
          }
      });
  }
}
