package com.example.demo.controllers;

import com.example.demo.models.Producto;
import com.example.demo.services.ProductoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * Controlador REST para el catálogo de productos.
 * 
 * Ruta base: /api/productos
 * CORS: permite peticiones desde Angular (localhost:4200).
 * 
 * Estos endpoints son PÚBLICOS (no requieren JWT) para que cualquier
 * visitante pueda ver el catálogo sin necesidad de registrarse.
 * 
 * Endpoints disponibles:
 * - GET /api/productos               → Listar todos los productos.
 * - GET /api/productos?nombre=xxx    → Buscar productos por nombre.
 * - GET /api/productos/categoria/{id} → Filtrar productos por categoría.
 */
@RestController
@RequestMapping("/api/productos")
@CrossOrigin(origins = "http://localhost:4200") // Permitir CORS desde Angular
public class ProductoController {

    /** Servicio con la lógica de negocio de productos. */
    @Autowired
    private ProductoService productoService;

    /**
     * Lista todos los productos o filtra por nombre si se proporciona el parámetro.
     * 
     * Comportamiento:
     * - Sin parámetros → retorna todos los productos del catálogo.
     * - Con ?nombre=xxx → retorna productos cuyo nombre contiene "xxx" (búsqueda parcial).
     *
     * @param nombre parámetro de búsqueda opcional (case-insensitive recomendado).
     * @return lista de productos que coinciden con el criterio.
     */
    @GetMapping
    public List<Producto> listar(@RequestParam(required = false) String nombre) {
        if (nombre != null) {
            return productoService.buscarPorNombre(nombre);
        }
        return productoService.listarTodos();
    }

    /**
     * Filtra y retorna los productos de una categoría específica.
     * 
     * Ejemplo: GET /api/productos/categoria/1 → productos de la categoría ID 1.
     *
     * @param id ID de la categoría por la que filtrar.
     * @return lista de productos que pertenecen a la categoría indicada.
     */
    @GetMapping("/categoria/{id}")
    public List<Producto> filtrarPorCategoria(@PathVariable Integer id) {
        return productoService.filtrarPorCategoria(id);
    }
}
