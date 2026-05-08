package com.example.demo.controllers;

import com.example.demo.models.User;
import com.example.demo.services.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    // Endpoint para registro
    @PostMapping("/registro")
    public ResponseEntity<?> registro(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String password = request.get("password");
            String nombre = request.get("nombre");
            String apellido = request.get("apellido");
            String telefono = request.get("telefono");

            // Validaciones básicas
            if (email == null || email.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "El email es requerido"));
            }
            if (password == null || password.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "La contraseña es requerida"));
            }
            if (nombre == null || nombre.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "El nombre es requerido"));
            }

            User usuario = authService.registrar(email, password, nombre, apellido, telefono);

            Map<String, Object> response = new HashMap<>();
            response.put("mensaje", "Usuario registrado exitosamente");
            response.put("usuario", Map.of(
                    "id", usuario.getId(),
                    "email", usuario.getEmail(),
                    "nombre", usuario.getNombre(),
                    "apellido", usuario.getApellido()
            ));

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // Endpoint para login
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String password = request.get("password");

            if (email == null || email.isEmpty() || password == null || password.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Email y contraseña son requeridos"));
            }

            String token = authService.login(email, password);
            User usuario = authService.obtenerUsuarioPorEmail(email);

            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("usuario", Map.of(
                    "id", usuario.getId(),
                    "email", usuario.getEmail(),
                    "nombre", usuario.getNombre(),
                    "apellido", usuario.getApellido()
            ));

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // Endpoint para solicitar recuperación de contraseña
    @PostMapping("/solicitar-recuperacion")
    public ResponseEntity<?> solicitarRecuperacion(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");

            if (email == null || email.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "El email es requerido"));
            }

            authService.solicitarRecuperacionContraseña(email);

            return ResponseEntity.ok(Map.of("mensaje", 
                    "Si el email existe en nuestro sistema, recibirás un enlace para recuperar tu contraseña"));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al procesar la solicitud"));
        }
    }

    // Endpoint para validar token de recuperación
    @GetMapping("/validar-token/{token}")
    public ResponseEntity<?> validarToken(@PathVariable String token) {
        try {
            boolean valido = authService.validarTokenRecuperacion(token);

            if (valido) {
                return ResponseEntity.ok(Map.of("valido", true));
            } else {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Token inválido o expirado"));
            }

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Error al validar el token"));
        }
    }

    // Endpoint para cambiar contraseña con token
    @PostMapping("/cambiar-contrasena")
    public ResponseEntity<?> cambiarContraseña(@RequestBody Map<String, String> request) {
        try {
            String token = request.get("token");
            String nuevaContraseña = request.get("nuevaContraseña");

            if (token == null || token.isEmpty() || nuevaContraseña == null || nuevaContraseña.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Token y nueva contraseña son requeridos"));
            }

            authService.cambiarContraseña(token, nuevaContraseña);

            return ResponseEntity.ok(Map.of("mensaje", "Contraseña cambiada exitosamente"));

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // Endpoint para cambiar contraseña (usuario autenticado)
    @PostMapping("/cambiar-contrasena-autenticado")
    public ResponseEntity<?> cambiarContraseñaAutenticado(@RequestBody Map<String, String> request,
                                                          @RequestHeader("Authorization") String authHeader) {
        try {
            String contraseñaActual = request.get("contraseñaActual");
            String nuevaContraseña = request.get("nuevaContraseña");

            if (contraseñaActual == null || nuevaContraseña == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Ambas contraseñas son requeridas"));
            }

            // Extraer email del token (simplificado, en producción usar servicio JWT completo)
            String token = authHeader.replace("Bearer ", "");
            // Aquí normalmente validarías el token y extraerías el email
            // Por ahora, retornamos error
            
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Esta funcionalidad requiere validación adicional"));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
