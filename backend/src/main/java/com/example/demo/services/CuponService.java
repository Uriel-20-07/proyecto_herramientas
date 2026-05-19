package com.example.demo.services;

import com.example.demo.models.Cupon;
import com.example.demo.models.User;
import com.example.demo.repositories.CuponRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class CuponService {

    @Autowired
    private CuponRepository cuponRepository;

    @Autowired
    private EmailService emailService;

    /**
     * Generar un cupón de bienvenida único para un nuevo usuario
     */
    @Transactional
    public Cupon generarCuponBienvenida(User usuario) {
        // Verificar si el usuario ya tiene un cupón de bienvenida
        if (cuponRepository.tieneCuponBienvenida(usuario)) {
            throw new RuntimeException("El usuario ya posee un cupón de bienvenida");
        }

        // Generar código único
        String codigo = generarCodigoUnico();

        // Crear cupón con 30% de descuento válido por 30 días
        Cupon cupon = new Cupon();
        cupon.setCodigo(codigo);
        cupon.setUsuario(usuario);
        cupon.setTipoDescuento("PORCENTAJE");
        cupon.setValorDescuento(30.0); // 30% de descuento
        cupon.setFechaCreacion(LocalDateTime.now());
        cupon.setFechaExpiracion(LocalDateTime.now().plusDays(30));
        cupon.setUsado(false);
        cupon.setActivo(true);
        cupon.setDescripcion("Cupón de bienvenida 30% descuento - Válido por 30 días");

        return cuponRepository.save(cupon);
    }

    /**
     * Generar código único para el cupón
     */
    private String generarCodigoUnico() {
        // Formato: BVD-XXXXXX (BVD = Bienvenida, 6 caracteres aleatorios)
        String uuid = UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
        return "BVD-" + uuid;
    }

    /**
     * Validar si un cupón es válido para usar
     */
    public boolean validarCupon(String codigo) {
        Optional<Cupon> cuponOpt = cuponRepository.findCuponValido(codigo);

        if (cuponOpt.isEmpty()) {
            return false;
        }

        Cupon cupon = cuponOpt.get();
        return cupon.esValido();
    }

    /**
     * Aplicar cupón a una compra
     */
    @Transactional
    public Cupon aplicarCupon(String codigo, Integer idPedido) {
        Optional<Cupon> cuponOpt = cuponRepository.findCuponValido(codigo);

        if (cuponOpt.isEmpty()) {
            throw new RuntimeException("Cupón inválido o no disponible");
        }

        Cupon cupon = cuponOpt.get();

        if (!cupon.esValido()) {
            throw new RuntimeException("El cupón ha expirado o ya fue utilizado");
        }

        // Marcar como utilizado
        cupon.setUsado(true);
        cupon.setFechaUso(LocalDateTime.now());
        cupon.setIdPedido(idPedido);

        return cuponRepository.save(cupon);
    }

    /**
     * Obtener información de un cupón por código
     */
    public Cupon obtenerCupon(String codigo) {
        return cuponRepository.findByCodigo(codigo)
                .orElseThrow(() -> new RuntimeException("Cupón no encontrado"));
    }

    /**
     * Obtener cupones vigentes de un usuario
     */
    public List<Cupon> obtenerCuponesVigentes(User usuario) {
        return cuponRepository.findCuponesVigentesPorUsuario(usuario);
    }

    /**
     * Obtener todos los cupones de un usuario
     */
    public List<Cupon> obtenerCuponesPorUsuario(User usuario) {
        return cuponRepository.findByUsuario(usuario);
    }

    /**
     * Calcular descuento del cupón
     */
    public Double calcularDescuento(String codigo, Double montoTotal) {
        Cupon cupon = obtenerCupon(codigo);

        if (!cupon.esValido()) {
            throw new RuntimeException("El cupón no es válido");
        }

        if ("PORCENTAJE".equals(cupon.getTipoDescuento())) {
            return (montoTotal * cupon.getValorDescuento()) / 100;
        } else {
            // FIJO
            return Math.min(cupon.getValorDescuento(), montoTotal);
        }
    }

    /**
     * Enviar email con cupón al usuario
     */
    public void enviarCuponPorEmail(User usuario, Cupon cupon) {
        try {
            String asunto = "¡Bienvenido a FarmaCode! Tu cupón de 30% de descuento";
            String cuerpo = construirEmailCupon(usuario, cupon);
            emailService.sendEmail(usuario.getEmail(), asunto, cuerpo);
        } catch (Exception e) {
            System.err.println("Error al enviar email con cupón: " + e.getMessage());
        }
    }

    /**
     * Construir contenido HTML del email con el cupón
     */
    private String construirEmailCupon(User usuario, Cupon cupon) {
        return "<html>" +
                "<body style='font-family: Arial, sans-serif;'>" +
                "<h2>¡Bienvenido a FarmaCode, " + usuario.getNombre() + "!</h2>" +
                "<p>Nos alegra que te hayas registrado. Como regalo de bienvenida, " +
                "te hemos preparado un cupón especial solo para ti.</p>" +
                "<div style='background-color: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0;'>" +
                "<h3 style='color: #ff6600;'>Tu Cupón de Descuento</h3>" +
                "<p><strong>Código:</strong> <span style='font-size: 24px; color: #ff6600; font-weight: bold;'>" +
                cupon.getCodigo() + "</span></p>" +
                "<p><strong>Descuento:</strong> " + cupon.getValorDescuento() + "% en tu primera compra</p>" +
                "<p><strong>Válido hasta:</strong> " + cupon.getFechaExpiracion().toLocalDate() + "</p>" +
                "<p style='color: #666;'><em>Este cupón es de un solo uso y es exclusivo para ti.</em></p>" +
                "</div>" +
                "<h4>¿Cómo usar tu cupón?</h4>" +
                "<ol>" +
                "<li>Navega por nuestro catálogo</li>" +
                "<li>Agrega productos a tu carrito</li>" +
                "<li>En el checkout, ingresa tu código: <strong>" + cupon.getCodigo() + "</strong></li>" +
                "<li>¡Disfruta de tu descuento!</li>" +
                "</ol>" +
                "<p>Si tienes preguntas, no dudes en contactarnos.</p>" +
                "<p>Saludos,<br>Equipo FarmaCode</p>" +
                "</body>" +
                "</html>";
    }

    /**
     * Limpiar cupones expirados
     */
    @Transactional
    public void limpiarCuponesExpirados() {
        List<Cupon> expirados = cuponRepository.findCuponesExpirados();
        for (Cupon cupon : expirados) {
            cupon.setActivo(false);
            cuponRepository.save(cupon);
        }
    }
}
