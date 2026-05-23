package com.example.demo.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entidad JPA que representa un pedido (orden de compra) de un usuario.
 * 
 * Tabla en BD: "pedidos"
 * 
 * Un pedido es la cabecera de una compra completada. Los productos
 * específicos que se compraron se almacenan en DetallePedido.
 * 
 * Estados posibles:
 * - "PAGADO": pago procesado exitosamente.
 * - "COMPLETADO": pedido entregado (usado en datos históricos del seeder).
 * - (otros estados como "CANCELADO", "EN_CAMINO" podrían agregarse).
 */
@Entity
@Table(name = "pedidos")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Pedido {

    /** Identificador único del pedido (autoincremental). */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_pedido")
    private Integer idPedido;

    /**
     * Usuario que realizó el pedido.
     * ManyToOne: un usuario puede tener múltiples pedidos.
     * La FK "id_usuario" referencia la PK "id_usuario" de la tabla "usuarios".
     */
    @ManyToOne
    @JoinColumn(name = "id_usuario", referencedColumnName = "id_usuario")
    private User usuario;

    /** Fecha y hora en que se realizó el pedido. */
    private LocalDateTime fecha;

    /** Estado actual del pedido ("PAGADO", "COMPLETADO", etc.). */
    private String estado;

    /**
     * Total monetario del pedido (puede incluir descuentos por cupón).
     * Se usa BigDecimal para evitar errores de precisión con montos monetarios.
     */
    private BigDecimal total;
}
