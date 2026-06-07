package com.example.demo.models;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

/**
 * Entidad JPA que representa un producto del catálogo de la farmacia.
 * 
 * Tabla en BD: "productos"
 * 
 * Cada producto pertenece a una categoría (relación ManyToOne) y
 * tiene un precio de venta, stock disponible y una imagen asociada.
 * 
 * @Data de Lombok genera: getters, setters, equals, hashCode y toString.
 */
@Entity
@Table(name = "productos")
@Data
public class Producto {

    /** Identificador único del producto (autoincremental). */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idProducto;

    /** Nombre del producto. Máximo 100 caracteres, obligatorio. */
    @Column(nullable = false, length = 100)
    private String nombre;

    /** Descripción detallada del producto (usos, presentación, etc.). */
    private String descripcion;

    /**
     * Precio de venta al público.
     * precision=10, scale=2: admite hasta 99,999,999.99 con 2 decimales.
     * Se usa BigDecimal para evitar errores de redondeo con double.
     */
    @Column(name = "precio_venta", precision = 10, scale = 2)
    private BigDecimal precioVenta;

    /**
     * Categoría a la que pertenece el producto (Analgésicos, Antibióticos, etc.).
     * Relación ManyToOne: muchos productos pueden pertenecer a una misma categoría.
     * JoinColumn define la columna de clave foránea en la tabla "productos".
     */
    @ManyToOne
    @JoinColumn(name = "id_categoria")
    private Categoria categoria;

    /** URL de la imagen del producto (puede ser externa o ruta local). */
    @Column(name = "img_url", length = 500)
    private String imgUrl;

    /**
     * Unidades disponibles en inventario.
     * Stock mínimo = 0 (no puede ser negativo).
     * Valor por defecto: 0 (sin stock al crear el producto).
     */
    @Column(name = "stock", nullable = false, columnDefinition = "integer default 0")
    private Integer stock = 0;
}
