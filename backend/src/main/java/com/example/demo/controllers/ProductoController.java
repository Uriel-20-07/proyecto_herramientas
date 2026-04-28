package com.example.demo.controllers;

import com.example.demo.models.Producto;
import com.example.demo.services.ProductoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/productos")
@CrossOrigin(origins = "http://localhost:4200") // Permitir CORS para todas las fuentes (ajustar según necesidades)
public class ProductoController {
    @Autowired
    private ProductoService productoService;

    // Obtener todos o buscar por nombre si viene el parámetro ?nombre=...
    @GetMapping
    public List<Producto> listar(@RequestParam(required = false) String nombre) {
        if (nombre != null) {
            return productoService.buscarPorNombre(nombre);
        }
        return productoService.listarTodos();
    }

    // Endpoint para filtrar por categoría: /api/productos/categoria/1
    @GetMapping("/categoria/{id}")
    public List<Producto> filtrarPorCategoria(@PathVariable Integer id) {
        return productoService.filtrarPorCategoria(id);
    }
}
