package com.example.demo.services;

import com.example.demo.dto.PagoRequest;
import com.example.demo.models.*;
import com.example.demo.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;
import java.util.concurrent.CompletableFuture;

/**
 * Servicio que procesa las transacciones de pago y convierte carritos en pedidos.
 * 
 * Flujo completo de una compra:
 * 1. Verifica que el carrito tenga productos.
 * 2. Calcula el subtotal sumando (precio × cantidad) de cada ítem.
 * 3. Si se ingresó un código de cupón: valida y aplica el descuento porcentual.
 * 4. Crea el pedido (Pedido) con el total final.
 * 5. Crea los detalles del pedido (DetallePedido) con precio histórico.
 * 6. Vacía el carrito del usuario.
 * 
 * Todo el proceso es una sola transacción: si algo falla a mitad, se revierte.
 */
@Service
public class PagoService {

    /** Servicio del carrito para obtener items y vaciarlo tras el pago. */
    @Autowired private CarritoService carritoService;

    /** Repositorio de cupones de descuento. */
    @Autowired private CuponRepository cuponRepository;

    /** Repositorio de pedidos (cabecera de la orden). */
    @Autowired private PedidoRepository pedidoRepository;

    /** Repositorio de detalles de pedido (ítems de la orden). */
    @Autowired private DetallePedidoRepository detallePedidoRepository;

    /** Repositorio de productos del catálogo. */
    @Autowired private ProductoRepository productoRepository;


    /** Servicio de correo electrónico para notificaciones. */
    @Autowired private EmailService emailService;

    /**
     * Procesa una transacción de pago completa para un usuario.
     * 
     * @param idUsuario ID del usuario que realiza la compra.
     * @param request   datos del pago (método de pago, código de cupón opcional).
     * @throws RuntimeException si el carrito está vacío, el cupón es inválido/expirado,
     *                          o cualquier error en la persistencia.
     */
    @Transactional
    public void procesarTransaccion(Integer idUsuario, PagoRequest request) {
        // 1. Obtener el carrito del usuario y verificar que no esté vacío
        Carrito carrito = carritoService.obtenerOCrearCarrito(idUsuario);
        if (carrito.getDetalles().isEmpty()) throw new RuntimeException("Carrito vacío.");

        // 2. Calcular el subtotal sumando precio × cantidad de cada producto
        double subtotal = carrito.getDetalles().stream()
                .mapToDouble(d -> d.getProducto().getPrecioVenta().doubleValue() * d.getCantidad()).sum();
        BigDecimal totalFinal = BigDecimal.valueOf(subtotal);

        // 3. Aplicar cupón de descuento si se proporcionó uno
        if (request.getCodigoCupon() != null && !request.getCodigoCupon().trim().isEmpty()) {
            // Buscar el cupón en la BD (código en mayúsculas y sin espacios)
            Cupon cupon = cuponRepository.findByCodigo(request.getCodigoCupon().trim().toUpperCase())
                    .orElseThrow(() -> new RuntimeException("Cupón inválido."));

            // Verificar que el cupón esté activo, no haya sido usado y no haya expirado
            if (!cupon.getActivo() || cupon.getUsado() || cupon.getFechaExpiracion().isBefore(LocalDateTime.now())) {
                throw new RuntimeException("Cupón expirado o usado.");
            }

            // Calcular y aplicar el descuento porcentual
            double descuento = subtotal * (cupon.getValorDescuento().doubleValue() / 100.0);
            totalFinal = BigDecimal.valueOf(subtotal - descuento);

            // Marcar el cupón como utilizado para evitar reutilización
            cupon.setUsado(true);
            cupon.setFechaUso(LocalDateTime.now());
            cuponRepository.save(cupon);
        }

        // Aplicar coste de envío: S/ 5.00 si el subtotal de productos es <= S/ 50.00, gratis si > 50.00
        double costoEnvio = (subtotal > 50.0) ? 0.0 : 5.0;
        totalFinal = totalFinal.add(BigDecimal.valueOf(costoEnvio));

        // 4. Crear la cabecera del pedido con el total final
        Pedido pedido = new Pedido();
        pedido.setUsuario(carrito.getUsuario());
        pedido.setFecha(LocalDateTime.now());
        pedido.setEstado("PAGADO");
        pedido.setTotal(totalFinal);
        pedido = pedidoRepository.save(pedido);

        // 5. Crear los detalles del pedido (una línea por cada producto del carrito)
        List<DetallePedido> detallesGuardados = new ArrayList<>();
        for (DetalleCarrito detCart : carrito.getDetalles()) {
            Producto producto = detCart.getProducto();
            int cantidadComprada = detCart.getCantidad();

            // Disminuir el stock del producto
            if (producto.getStock() < cantidadComprada) {
                throw new RuntimeException("Stock insuficiente para el producto: " + producto.getNombre());
            }
            producto.setStock(producto.getStock() - cantidadComprada);
            productoRepository.save(producto);

            DetallePedido detPed = new DetallePedido();
            detPed.setPedido(pedido);
            detPed.setProducto(producto);
            detPed.setCantidad(cantidadComprada);
            // Guardar el precio al momento de la compra (precio histórico)
            // Importante: el precio podría cambiar en el futuro, este snapshot lo preserva
            detPed.setPrecioHistorico(producto.getPrecioVenta());
            detPed = detallePedidoRepository.save(detPed);
            detallesGuardados.add(detPed);
        }

        // 6. Vaciar el carrito una vez completado el pago
        carritoService.vaciarCarrito(idUsuario);

        // 7. Enviar correo de confirmación de compra al usuario (asíncronamente para no bloquear la transacción ni la BD)
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
