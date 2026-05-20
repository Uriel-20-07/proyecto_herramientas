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

@RestController
@RequestMapping("/api/pago")
@CrossOrigin(origins = "http://localhost:4200")
public class PagoController {
    @Autowired private PagoService pagoService;
    @Autowired private AuthService authService;

    @PostMapping("/procesar")
    public ResponseEntity<?> procesarPago(@RequestBody PagoRequest request, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).body(Map.of("error", "Usuario no autenticado"));
        try {
            User usuario = authService.obtenerUsuarioPorEmail(principal.getName());
            pagoService.procesarTransaccion(usuario.getId(), request);
            return ResponseEntity.ok(Map.of("message", "Pago procesado con éxito"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
