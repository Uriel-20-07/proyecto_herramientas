package com.example.demo.services;

import com.example.demo.dto.PagoRequest;
import com.example.demo.models.*;
import com.example.demo.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
public class PagoService {
    @Autowired private CarritoService carritoService;
    @Autowired private CuponRepository cuponRepository;
    @Autowired private PedidoRepository pedidoRepository;
    @Autowired private DetallePedidoRepository detallePedidoRepository;

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

        Pedido pedido = new Pedido();
        pedido.setUsuario(carrito.getUsuario());
        pedido.setFecha(LocalDateTime.now());
        pedido.setEstado("PAGADO");
        pedido.setTotal(totalFinal);
        pedido = pedidoRepository.save(pedido);

        for (DetalleCarrito detCart : carrito.getDetalles()) {
            DetallePedido detPed = new DetallePedido();
            detPed.setPedido(pedido);
            detPed.setProducto(detCart.getProducto());
            detPed.setCantidad(detCart.getCantidad());
            detPed.setPrecioHistorico(detCart.getProducto().getPrecioVenta());
            detallePedidoRepository.save(detPed);
        }
        carritoService.vaciarCarrito(idUsuario);
    }
}
