package com.example.demo.models;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "cupones", indexes = {
        @Index(name = "idx_codigo", columnList = "codigo"),
        @Index(name = "idx_usuario", columnList = "id_usuario"),
        @Index(name = "idx_usado", columnList = "usado")
})
public class Cupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_cupon")
    private Integer id;

    @Column(nullable = false, unique = true, length = 50)
    private String codigo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", nullable = false)
    @JsonBackReference
    private User usuario;

    @Column(name = "tipo_descuento", nullable = false, length = 20)
    private String tipoDescuento; // PORCENTAJE o FIJO

    @Column(name = "valor_descuento", nullable = false)
    private Double valorDescuento; // 30 para 30% o monto fijo

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_expiracion", nullable = false)
    private LocalDateTime fechaExpiracion;

    @Column(nullable = false)
    private Boolean usado = false;

    @Column(name = "fecha_uso")
    private LocalDateTime fechaUso;

    @Column(name = "id_pedido")
    private Integer idPedido;

    @Column(length = 255)
    private String descripcion;

    @Column(nullable = false)
    private Boolean activo = true;

    // Constructores
    public Cupon() {
    }

    public Cupon(String codigo, User usuario, Double valorDescuento,
            LocalDateTime fechaCreacion, LocalDateTime fechaExpiracion) {
        this.codigo = codigo;
        this.usuario = usuario;
        this.valorDescuento = valorDescuento;
        this.tipoDescuento = "PORCENTAJE";
        this.fechaCreacion = fechaCreacion;
        this.fechaExpiracion = fechaExpiracion;
        this.usado = false;
        this.activo = true;
        this.descripcion = "Cupón de bienvenida 30% descuento";
    }

    // Getters y Setters
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public User getUsuario() {
        return usuario;
    }

    public void setUsuario(User usuario) {
        this.usuario = usuario;
    }

    public String getTipoDescuento() {
        return tipoDescuento;
    }

    public void setTipoDescuento(String tipoDescuento) {
        this.tipoDescuento = tipoDescuento;
    }

    public Double getValorDescuento() {
        return valorDescuento;
    }

    public void setValorDescuento(Double valorDescuento) {
        this.valorDescuento = valorDescuento;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }

    public LocalDateTime getFechaExpiracion() {
        return fechaExpiracion;
    }

    public void setFechaExpiracion(LocalDateTime fechaExpiracion) {
        this.fechaExpiracion = fechaExpiracion;
    }

    public Boolean getUsado() {
        return usado;
    }

    public void setUsado(Boolean usado) {
        this.usado = usado;
    }

    public LocalDateTime getFechaUso() {
        return fechaUso;
    }

    public void setFechaUso(LocalDateTime fechaUso) {
        this.fechaUso = fechaUso;
    }

    public Integer getIdPedido() {
        return idPedido;
    }

    public void setIdPedido(Integer idPedido) {
        this.idPedido = idPedido;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }

    // Método para verificar si el cupón es válido
    public boolean esValido() {
        return activo && !usado &&
                fechaExpiracion.isAfter(LocalDateTime.now());
    }

    // Método para verificar si ha expirado
    public boolean haExpirado() {
        return fechaExpiracion.isBefore(LocalDateTime.now());
    }

    @Override
    public String toString() {
        return "Cupon{" +
                "id=" + id +
                ", codigo='" + codigo + '\'' +
                ", valorDescuento=" + valorDescuento +
                ", usado=" + usado +
                ", activo=" + activo +
                '}';
    }
}
