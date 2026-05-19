package com.example.demo.services;

import com.example.demo.models.Carrito;
import com.example.demo.models.DetalleCarrito;
import com.example.demo.models.Producto;
import com.example.demo.models.User;
import com.example.demo.repositories.CarritoRepository;
import com.example.demo.repositories.DetalleCarritoRepository;
import com.example.demo.repositories.ProductoRepository;
import com.example.demo.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Optional;

@Service
public class CarritoService {

    @Autowired
    private CarritoRepository carritoRepository;

    @Autowired
    private DetalleCarritoRepository detalleCarritoRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Transactional
    public Carrito obtenerOCrearCarrito(Integer idUsuario) {
        return carritoRepository.findByUsuario_Id(idUsuario).orElseGet(() -> {
            User usuario = userRepository.findById(idUsuario).orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            Carrito nuevoCarrito = new Carrito();
            nuevoCarrito.setUsuario(usuario);
            nuevoCarrito.setDetalles(new ArrayList<>());
            return carritoRepository.save(nuevoCarrito);
        });
    }

    @Transactional
    public Carrito agregarProductoAlCarrito(Integer idUsuario, Integer idProducto, Integer cantidad) {
        Carrito carrito = obtenerOCrearCarrito(idUsuario);
        Producto producto = productoRepository.findById(idProducto).orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        // Buscar si el producto ya está en el carrito
        Optional<DetalleCarrito> detalleExistente = carrito.getDetalles().stream()
                .filter(d -> d.getProducto().getIdProducto().equals(idProducto))
                .findFirst();

        if (detalleExistente.isPresent()) {
            // Actualizar cantidad
            DetalleCarrito detalle = detalleExistente.get();
            detalle.setCantidad(detalle.getCantidad() + cantidad);
            detalleCarritoRepository.save(detalle);
        } else {
            // Crear nuevo detalle
            DetalleCarrito nuevoDetalle = new DetalleCarrito();
            nuevoDetalle.setCarrito(carrito);
            nuevoDetalle.setProducto(producto);
            nuevoDetalle.setCantidad(cantidad);
            carrito.getDetalles().add(nuevoDetalle);
            detalleCarritoRepository.save(nuevoDetalle);
        }

        return carritoRepository.save(carrito);
    }

    @Transactional
    public Carrito disminuirProductoDelCarrito(Integer idUsuario, Integer idProducto) {
        Carrito carrito = obtenerOCrearCarrito(idUsuario);

        Optional<DetalleCarrito> detalleExistente = carrito.getDetalles().stream()
                .filter(d -> d.getProducto().getIdProducto().equals(idProducto))
                .findFirst();

        if (detalleExistente.isPresent()) {
            DetalleCarrito detalle = detalleExistente.get();
            if (detalle.getCantidad() > 1) {
                detalle.setCantidad(detalle.getCantidad() - 1);
                detalleCarritoRepository.save(detalle);
            } else {
                carrito.getDetalles().remove(detalle);
                detalleCarritoRepository.delete(detalle);
            }
        }

        return carritoRepository.save(carrito);
    }

    @Transactional
    public Carrito eliminarProductoDelCarrito(Integer idUsuario, Integer idProducto) {
        Carrito carrito = obtenerOCrearCarrito(idUsuario);

        Optional<DetalleCarrito> detalleExistente = carrito.getDetalles().stream()
                .filter(d -> d.getProducto().getIdProducto().equals(idProducto))
                .findFirst();

        if (detalleExistente.isPresent()) {
            DetalleCarrito detalle = detalleExistente.get();
            carrito.getDetalles().remove(detalle);
            detalleCarritoRepository.delete(detalle);
        }

        return carritoRepository.save(carrito);
    }

    @Transactional
    public Carrito vaciarCarrito(Integer idUsuario) {
        Carrito carrito = obtenerOCrearCarrito(idUsuario);
        detalleCarritoRepository.deleteAll(carrito.getDetalles());
        carrito.getDetalles().clear();
        return carritoRepository.save(carrito);
    }
}
