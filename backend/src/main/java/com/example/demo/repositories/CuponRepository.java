package com.example.demo.repositories;

import com.example.demo.models.Cupon;
import com.example.demo.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CuponRepository extends JpaRepository<Cupon, Integer> {

    // Buscar cupón por código
    Optional<Cupon> findByCodigo(String codigo);

    // Buscar cupón por código y que esté activo
    @Query("SELECT c FROM Cupon c WHERE c.codigo = ?1 AND c.activo = true AND c.usado = false")
    Optional<Cupon> findCuponValido(String codigo);

    // Obtener todos los cupones de un usuario
    List<Cupon> findByUsuario(User usuario);

    // Obtener cupones no usados de un usuario
    @Query("SELECT c FROM Cupon c WHERE c.usuario = ?1 AND c.usado = false AND c.activo = true")
    List<Cupon> findCuponesVigentesPorUsuario(User usuario);

    // Verificar si un usuario ya tiene un cupón de bienvenida
    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END " +
            "FROM Cupon c WHERE c.usuario = ?1 AND c.descripcion LIKE '%bienvenida%'")
    boolean tieneCuponBienvenida(User usuario);

    // Obtener cupones expirados
    @Query("SELECT c FROM Cupon c WHERE c.fechaExpiracion < NOW() AND c.usado = false")
    List<Cupon> findCuponesExpirados();

    // Contar cupones utilizados por usuario
    @Query("SELECT COUNT(c) FROM Cupon c WHERE c.usuario = ?1 AND c.usado = true")
    long countCuponesUsados(User usuario);
}
