package com.example.demo.services;

import com.example.demo.dto.PagoRequest;
import com.example.demo.models.*;
import com.example.demo.repositories.*;
import com.stripe.Stripe;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;
import java.util.concurrent.CompletableFuture;

@Service
public class PagoService {

    @Autowired private CarritoService carritoService;
    @Autowired private CuponRepository cuponRepository;
    @Autowired private PedidoRepository pedidoRepository;
    @Autowired private DetallePedidoRepository detallePedidoRepository;
    @Autowired private ProductoRepository productoRepository;
    @Autowired private EmailService emailService;

    // Inyección de la clave de Stripe desde application.properties
    @Value("${stripe.api.key}")
    private String stripeApiKey;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeApiKey;
    }

    /**
     * NUEVO MÉTODO PARA STRIPE:
     * Calcula el total real desde la BD y le pide a Stripe que genere un PaymentIntent.
     */
    public PaymentIntent crearPaymentIntent(Integer idUsuario, PagoRequest request) throws Exception {
        Carrito carrito = carritoService.obtenerOCrearCarrito(idUsuario);
        if (carrito.getDetalles().isEmpty()) throw new RuntimeException("Carrito vacío.");

        double subtotal = carrito.getDetalles().stream()
                .mapToDouble(d -> d.getProducto().getPrecioVenta().doubleValue() * d.getCantidad()).sum();

        // Verificación de cupón idéntica a la transacción final para asegurar el mismo monto
        if (request.getCodigoCupon() != null && !request.getCodigoCupon().trim().isEmpty()) {
            Cupon cupon = cuponRepository.findByCodigo(request.getCodigoCupon().trim().toUpperCase())
                    .orElseThrow(() -> new RuntimeException("Cupón inválido."));
            
            if (cupon.getActivo() && !cupon.getUsado() && cupon.getFechaExpiracion().isAfter(LocalDateTime.now())) {
                double descuento = subtotal * (cupon.getValorDescuento().doubleValue() / 100.0);
                subtotal -= descuento;
            }
        }

        double costoEnvio = (subtotal > 50.0) ? 0.0 : 5.0;
        double totalFinal = subtotal + costoEnvio;

        // Stripe procesa pagos en la unidad mínima (centavos). S/ 50.50 -> 5050
        long amountInCents = Math.round(totalFinal * 100);
        String moneda = (request.getMoneda() != null) ? request.getMoneda() : "pen";

        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(amountInCents)
                .setCurrency(moneda)
                .build();

        return PaymentIntent.create(params);
    }

    /**
     * Método original intacto.
     */
    @Transactional
    public void procesarTransaccion(Integer idUsuario, PagoRequest request) {
        Carrito carrito = carritoService.obtenerOCrearCarrito(idUsuario);
        if (carrito.getDetalles().isEmpty()) throw new RuntimeException("Carrito vacío.");

        double subtotal = carrito.getDetalles().stream()
                .mapToDouble(d -> d.getProducto().getPrecioVenta().doubleValue() * d.getCantidad()).sum();
        BigDecimal totalFinal = BigDecimal.valueOf(subtotal);

        if (request.getCodigoCupon() != null && !request.getCodigoCupon().trim().isEmpty()) {
            Cupon cupon = cuponRepository.findByCodigo(request.getCodigoCupon().trim().toUpperCase())
                    .orElseThrow(() -> new RuntimeException("Cupón inválido."));

            if (!cupon.getActivo() || cupon.getUsado() || cupon.getFechaExpiracion().isBefore(LocalDateTime.now())) {
                throw new RuntimeException("Cupón expirado o usado.");
            }

            double descuento = subtotal * (cupon.getValorDescuento().doubleValue() / 100.0);
            totalFinal = BigDecimal.valueOf(subtotal - descuento);

            cupon.setUsado(true);
            cupon.setFechaUso(LocalDateTime.now());
            cuponRepository.save(cupon);
        }

        double costoEnvio = (subtotal > 50.0) ? 0.0 : 5.0;
        totalFinal = totalFinal.add(BigDecimal.valueOf(costoEnvio));

        Pedido pedido = new Pedido();
        pedido.setUsuario(carrito.getUsuario());
        pedido.setFecha(LocalDateTime.now());
        pedido.setEstado("PAGADO");
        pedido.setTotal(totalFinal);
        pedido = pedidoRepository.save(pedido);

        List<DetallePedido> detallesGuardados = new ArrayList<>();
        for (DetalleCarrito detCart : carrito.getDetalles()) {
            Producto producto = detCart.getProducto();
            int cantidadComprada = detCart.getCantidad();

            if (producto.getStock() < cantidadComprada) {
                throw new RuntimeException("Stock insuficiente para el producto: " + producto.getNombre());
            }
            producto.setStock(producto.getStock() - cantidadComprada);
            productoRepository.save(producto);

            DetallePedido detPed = new DetallePedido();
            detPed.setPedido(pedido);
            detPed.setProducto(producto);
            detPed.setCantidad(cantidadComprada);
            detPed.setPrecioHistorico(producto.getPrecioVenta());
            detPed = detallePedidoRepository.save(detPed);
            detallesGuardados.add(detPed);
        }

        carritoService.vaciarCarrito(idUsuario);

        User usuario = carrito.getUsuario();
        String emailDestinatario = usuario.getEmail();
        String nombreUsuario = usuario.getNombre() + " " + usuario.getApellido();
        Pedido pedidoFinal = pedido;
        List<DetallePedido> detallesFinales = detallesGuardados;
        String codigoCupon = request.getCodigoCupon();

        CompletableFuture.runAsync(() -> {
            try {
                emailService.sendOrderConfirmationEmail(
                        emailDestinatario,
                        nombreUsuario,
                        pedidoFinal,
                        detallesFinales,
                        codigoCupon
                );
            } catch (Exception e) {
                System.out.println("Error al enviar el correo de confirmación de compra (asíncrono): " + e.getMessage());
            }
        });
    }
}
