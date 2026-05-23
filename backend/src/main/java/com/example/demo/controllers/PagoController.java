package com.example.demo.controllers;

import com.example.demo.dto.PagoRequest;
import com.example.demo.models.User;
import com.example.demo.services.AuthService;
import com.example.demo.services.PagoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.Map;

/**
 * Controlador REST para el procesamiento de pagos.
 * 
 * Ruta base: /api/pago
 * CORS: permite peticiones desde Angular (localhost:4200).
 * 
 * Todos los endpoints requieren autenticación JWT (el usuario debe
 * estar logueado para poder realizar un pago).
 * 
 * Endpoints disponibles:
 * - POST /api/pago/procesar → Procesar el pago del carrito actual.
 */
@RestController
@RequestMapping("/api/pago")
@CrossOrigin(origins = "http://localhost:4200")
public class PagoController {

    /** Servicio que procesa las transacciones de pago. */
    @Autowired private PagoService pagoService;

    /** Servicio de autenticación para obtener el usuario por email. */
    @Autowired private AuthService authService;

    /**
     * Procesa el pago del carrito del usuario autenticado.
     * 
     * Flujo:
     * 1. Verifica que el usuario esté autenticado.
     * 2. Obtiene el usuario a partir del email del Principal (JWT).
     * 3. Delega el procesamiento al PagoService (valida carrito, aplica cupón,
     *    crea pedido, vacía carrito).
     * 
     * Body esperado (PagoRequest):
     * {
     *   "metodoPago": "TARJETA" | "YAPE",
     *   "codigoCupon": "BIENVENIDA-XXXX" (opcional)
     * }
     *
     * @param request   datos del pago (método y cupón opcional).
     * @param principal usuario autenticado inyectado por Spring Security.
     * @return 200 con mensaje de éxito, 401 si no está autenticado,
     *         o 400 si hay error (carrito vacío, cupón inválido, etc.).
     */
    @PostMapping("/procesar")
    public ResponseEntity<?> procesarPago(@RequestBody PagoRequest request, Principal principal) {
        // Verificar autenticación
        if (principal == null) return ResponseEntity.status(401).body(Map.of("error", "Usuario no autenticado"));
        try {
            // Obtener el usuario a partir del email (extraído del JWT)
            User usuario = authService.obtenerUsuarioPorEmail(principal.getName());
            pagoService.procesarTransaccion(usuario.getId(), request);
            return ResponseEntity.ok(Map.of("message", "Pago procesado con éxito"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
