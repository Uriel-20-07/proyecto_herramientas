package com.example.demo.controllers;

import com.example.demo.models.Carrito;
import com.example.demo.models.User;
import com.example.demo.services.AuthService;
import com.example.demo.services.CarritoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/carrito")
@CrossOrigin(origins = "http://localhost:4200") // Permite peticiones desde Angular
public class CarritoController {

    @Autowired
    private CarritoService carritoService;

    @Autowired
    private AuthService authService;

    @GetMapping
    public ResponseEntity<Carrito> obtenerCarrito(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        User usuario = authService.obtenerUsuarioPorEmail(principal.getName());
        Carrito carrito = carritoService.obtenerOCrearCarrito(usuario.getId());
        return ResponseEntity.ok(carrito);
    }

    @PostMapping("/agregar")
    public ResponseEntity<Carrito> agregarProducto(
            @RequestParam Integer idProducto,
            @RequestParam Integer cantidad,
            Principal principal) {
        
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        User usuario = authService.obtenerUsuarioPorEmail(principal.getName());
        Carrito carrito = carritoService.agregarProductoAlCarrito(usuario.getId(), idProducto, cantidad);
        return ResponseEntity.ok(carrito);
    }

    @PostMapping("/disminuir")
    public ResponseEntity<Carrito> disminuirProducto(
            @RequestParam Integer idProducto,
            Principal principal) {
        
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        User usuario = authService.obtenerUsuarioPorEmail(principal.getName());
        Carrito carrito = carritoService.disminuirProductoDelCarrito(usuario.getId(), idProducto);
        return ResponseEntity.ok(carrito);
    }

    @DeleteMapping("/eliminar")
    public ResponseEntity<Carrito> eliminarProducto(
            @RequestParam Integer idProducto,
            Principal principal) {
        
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        User usuario = authService.obtenerUsuarioPorEmail(principal.getName());
        Carrito carrito = carritoService.eliminarProductoDelCarrito(usuario.getId(), idProducto);
        return ResponseEntity.ok(carrito);
    }

    @DeleteMapping("/vaciar")
    public ResponseEntity<Carrito> vaciarCarrito(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        User usuario = authService.obtenerUsuarioPorEmail(principal.getName());
        Carrito carrito = carritoService.vaciarCarrito(usuario.getId());
        return ResponseEntity.ok(carrito);
    }
}
