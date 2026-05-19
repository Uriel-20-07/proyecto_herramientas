package com.example.demo.controllers;

import com.example.demo.models.Cupon;
import com.example.demo.models.User;
import com.example.demo.services.AuthService;
import com.example.demo.services.CuponService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cupones")
@CrossOrigin(origins = "*")
public class CuponController {

    @Autowired
    private CuponService cuponService;

    @Autowired
    private AuthService authService;

    /**
     * Validar si un cupón es válido
     */
    @PostMapping("/validar")
    public ResponseEntity<?> validarCupon(@RequestBody Map<String, String> request) {
        try {
            String codigo = request.get("codigo");

            if (codigo == null || codigo.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of("error", "Código de cupón requerido"));
            }

            boolean esValido = cuponService.validarCupon(codigo);

            if (!esValido) {
                return ResponseEntity.ok(
                        Map.of("valido", false, "mensaje", "Cupón inválido, expirado o ya utilizado"));
            }

            Cupon cupon = cuponService.obtenerCupon(codigo);
            return ResponseEntity.ok(
                    Map.of(
                            "valido", true,
                            "codigo", cupon.getCodigo(),
                            "descuento", cupon.getValorDescuento(),
                            "tipo", cupon.getTipoDescuento(),
                            "descripcion", cupon.getDescripcion(),
                            "fechaExpiracion", cupon.getFechaExpiracion()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", e.getMessage()));
        }
    }

    /**
     * Obtener información de un cupón
     */
    @GetMapping("/{codigo}")
    public ResponseEntity<?> obtenerCupon(@PathVariable String codigo) {
        try {
            Cupon cupon = cuponService.obtenerCupon(codigo);
            return ResponseEntity.ok(cupon);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", e.getMessage()));
        }
    }

    /**
     * Calcular descuento para un cupón
     */
    @PostMapping("/calcular-descuento")
    public ResponseEntity<?> calcularDescuento(@RequestBody Map<String, Object> request) {
        try {
            String codigo = (String) request.get("codigo");
            Double montoTotal = ((Number) request.get("montoTotal")).doubleValue();

            if (codigo == null || montoTotal == null) {
                return ResponseEntity.badRequest().body(
                        Map.of("error", "Código y monto total requeridos"));
            }

            Double descuento = cuponService.calcularDescuento(codigo, montoTotal);
            Double montoFinal = montoTotal - descuento;

            return ResponseEntity.ok(
                    Map.of(
                            "codigo", codigo,
                            "montoOriginal", montoTotal,
                            "descuento", descuento,
                            "montoFinal", montoFinal));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", e.getMessage()));
        }
    }

    /**
     * Aplicar cupón a un pedido
     */
    @PostMapping("/aplicar")
    public ResponseEntity<?> aplicarCupon(@RequestBody Map<String, Object> request) {
        try {
            String codigo = (String) request.get("codigo");
            Integer idPedido = ((Number) request.get("idPedido")).intValue();

            if (codigo == null || idPedido == null) {
                return ResponseEntity.badRequest().body(
                        Map.of("error", "Código de cupón e ID de pedido requeridos"));
            }

            Cupon cupon = cuponService.aplicarCupon(codigo, idPedido);

            return ResponseEntity.ok(
                    Map.of(
                            "exito", true,
                            "mensaje", "Cupón aplicado exitosamente",
                            "codigo", cupon.getCodigo(),
                            "descuento", cupon.getValorDescuento(),
                            "usado", cupon.getUsado()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", e.getMessage()));
        }
    }

    /**
     * Obtener cupones vigentes del usuario autenticado
     */
    @GetMapping("/mis-cupones")
    public ResponseEntity<?> misCupones(Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body(
                        Map.of("error", "Usuario no autenticado"));
            }

            String email = authentication.getName();
            User usuario = authService.obtenerUsuarioPorEmail(email);

            List<Cupon> cupones = cuponService.obtenerCuponesVigentes(usuario);

            return ResponseEntity.ok(
                    Map.of(
                            "cupones", cupones,
                            "total", cupones.size()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", e.getMessage()));
        }
    }

    /**
     * Obtener historial de cupones del usuario
     */
    @GetMapping("/historial")
    public ResponseEntity<?> historialCupones(Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body(
                        Map.of("error", "Usuario no autenticado"));
            }

            String email = authentication.getName();
            User usuario = authService.obtenerUsuarioPorEmail(email);

            List<Cupon> cupones = cuponService.obtenerCuponesPorUsuario(usuario);

            return ResponseEntity.ok(
                    Map.of(
                            "cupones", cupones,
                            "total", cupones.size()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", e.getMessage()));
        }
    }
}
