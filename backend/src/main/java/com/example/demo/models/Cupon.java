package com.example.demo.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "cupones")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Cupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_cupon")
    private Integer id;

    @Column(nullable = false, unique = true)
    private String codigo;

    @ManyToOne
    @JoinColumn(name = "id_usuario", nullable = false)
    private User usuario;

    @Column(name = "tipo_descuento", nullable = false)
    private String tipoDescuento;

    @Column(name = "valor_descuento", nullable = false)
    private BigDecimal valorDescuento;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    @Column(name = "fecha_expiracion", nullable = false)
    private LocalDateTime fechaExpiracion;

    @Column(nullable = false)
    private Boolean usado = false;

    @Column(name = "fecha_uso")
    private LocalDateTime fechaUso;

    @Column(name = "id_pedido")
    private Integer idPedido;

    @Column(nullable = false)
    private String descripcion;

    @Column(nullable = false)
    private Boolean activo = true;
}
