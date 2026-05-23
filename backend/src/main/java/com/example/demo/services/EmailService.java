package com.example.demo.services;

import com.example.demo.models.Pedido;
import com.example.demo.models.DetallePedido;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Servicio para el envío de correos electrónicos transaccionales.
 * 
 * Utiliza {@link JavaMailSender} de Spring Mail, configurado en application.properties
 * con los datos del servidor SMTP (host, puerto, credenciales).
 * 
 * Los correos son de tipo "texto plano" (SimpleMailMessage). Para emails HTML
 * más elaborados se usaría MimeMessage/MimeMessageHelper.
 * 
 * Los errores de envío son capturados y registrados en consola sin lanzar
 * excepción, para que un fallo de email no interrumpa el flujo principal.
 * 
 * Tipos de correos soportados:
 * - Recuperación de contraseña.
 * - Verificación de email.
 * - Bienvenida simple.
 * - Bienvenida con cupón de descuento del 30%.
 */
@Service
public class EmailService {

    /** Componente de Spring Mail para enviar correos mediante SMTP. */
    @Autowired
    private JavaMailSender mailSender;

    /**
     * Envía un correo con el enlace de recuperación de contraseña.
     * 
     * El enlace incluye un token UUID único que expira en 1 hora.
     * El formato del enlace es: http://localhost:4200/reset-password/{token}
     *
     * @param destinatario email del usuario que olvidó su contraseña.
     * @param resetLink    URL completa con el token de recuperación.
     */
    public void sendPasswordResetEmail(String destinatario, String resetLink) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@mifarmacode.com");  // Remitente de la plataforma
            message.setTo(destinatario);
            message.setSubject("Recuperación de Contraseña - MiFarmaCode");
            
            String contenido = "Hola,\n\n" +
                    "Hemos recibido una solicitud para recuperar tu contraseña. " +
                    "Haz clic en el siguiente enlace para crear una nueva contraseña:\n\n" +
                    resetLink + "\n\n" +
                    "Este enlace expirará en 1 hora.\n\n" +
                    "Si no solicitaste esta recuperación, por favor ignora este correo.\n\n" +
                    "Saludos,\nEquipo MiFarmaCode";
            
            message.setText(contenido);
            mailSender.send(message);
        } catch (Exception e) {
            // No se interrumpe el flujo principal si el email falla
            System.out.println("Error enviando email: " + e.getMessage());
        }
    }

    /**
     * Envía un correo para verificar la dirección de email del usuario.
     * 
     * Nota: La verificación de email está preparada pero no está completamente
     * integrada en el flujo de registro actual (emailVerificado siempre es false
     * al registrarse, pero no se envía este email automáticamente).
     *
     * @param destinatario     email a verificar.
     * @param verificationLink URL con el token de verificación.
     */
    public void sendVerificationEmail(String destinatario, String verificationLink) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@mifarmacode.com");
            message.setTo(destinatario);
            message.setSubject("Verifica tu Correo - MiFarmaCode");
            
            String contenido = "Hola,\n\n" +
                    "Gracias por registrarte en MiFarmaCode. " +
                    "Haz clic en el siguiente enlace para verificar tu correo:\n\n" +
                    verificationLink + "\n\n" +
                    "Saludos,\nEquipo MiFarmaCode";
            
            message.setText(contenido);
            mailSender.send(message);
        } catch (Exception e) {
            System.out.println("Error enviando email de verificación: " + e.getMessage());
        }
    }

    /**
     * Envía un correo de bienvenida simple al usuario recién registrado.
     * 
     * Nota: actualmente no se invoca en el flujo de registro. En su lugar
     * se usa {@link #sendWelcomeCouponEmail} que incluye el cupón de descuento.
     *
     * @param destinatario email del nuevo usuario.
     * @param nombre       nombre del usuario para personalizar el saludo.
     */
    public void sendWelcomeEmail(String destinatario, String nombre) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@mifarmacode.com");
            message.setTo(destinatario);
            message.setSubject("Bienvenido a MiFarmaCode");
            
            String contenido = "Hola " + nombre + ",\n\n" +
                    "Te damos la bienvenida a MiFarmaCode. " +
                    "Tu cuenta ha sido creada exitosamente.\n\n" +
                    "Ahora puedes acceder a nuestras herramientas y servicios.\n\n" +
                    "Saludos,\nEquipo MiFarmaCode";
            
            message.setText(contenido);
            mailSender.send(message);
        } catch (Exception e) {
            System.out.println("Error enviando email de bienvenida: " + e.getMessage());
        }
    }

    /**
     * Envía un correo de bienvenida que incluye el código de cupón de descuento del 30%.
     * 
     * Este es el email principal enviado al registrarse un nuevo usuario.
     * Explica cómo usar el cupón y su vigencia (30 días, un solo uso).
     *
     * @param destinatario email del nuevo usuario.
     * @param nombre       nombre del usuario para personalizar el saludo.
     * @param codigoCupon  código único del cupón (formato: "BIENVENIDA-XXXXXXXXXX").
     */
    public void sendWelcomeCouponEmail(String destinatario, String nombre, String codigoCupon) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@mifarmacode.com");
            message.setTo(destinatario);
            message.setSubject("¡Bienvenido a MiFarmaCode! Tu cupón de 30% ya está listo");

            String contenido = "Hola " + nombre + ",\n\n" +
                    "Gracias por unirte a MiFarmaCode. Como bienvenida, te hemos creado un cupón exclusivo con 30% de descuento para tu primera compra.\n\n"
                    +
                    "Tu código es: " + codigoCupon + "\n" +
                    "Es válido por 30 días y solo puede usarse una vez.\n\n" +
                    "Instrucciones:\n" +
                    "1. Agrega productos a tu carrito.\n" +
                    "2. Ingresa el código al finalizar la compra.\n" +
                    "3. Disfruta del 30% de descuento.\n\n" +
                    "Si tienes dudas, responde a este correo.\n\n" +
                    "Saludos,\nEquipo MiFarmaCode";

            message.setText(contenido);
            mailSender.send(message);
        } catch (Exception e) {
            System.out.println("Error enviando email de cupón de bienvenida: " + e.getMessage());
        }
    }

    /**
     * Envía un correo de confirmación de compra al usuario con los detalles de su pedido.
     *
     * @param destinatario email del usuario.
     * @param nombre       nombre completo del usuario.
     * @param pedido       pedido creado con el total y fecha.
     * @param detalles     lista de detalles del pedido.
     * @param codigoCupon  código de cupón usado (opcional).
     */
    public void sendOrderConfirmationEmail(String destinatario, String nombre, Pedido pedido, List<DetallePedido> detalles, String codigoCupon) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@mifarmacode.com");
            message.setTo(destinatario);
            message.setSubject("Confirmación de tu compra #" + pedido.getIdPedido() + " - MiFarmaCode");

            StringBuilder contenido = new StringBuilder();
            contenido.append("Hola ").append(nombre).append(",\n\n")
                    .append("¡Muchas gracias por tu compra! Tu pago ha sido procesado con éxito.\n\n")
                    .append("Detalles de tu pedido:\n")
                    .append("--------------------------------------------------\n")
                    .append("Código de pedido: #").append(pedido.getIdPedido()).append("\n")
                    .append("Fecha de compra: ").append(pedido.getFecha().toString()).append("\n\n")
                    .append("Productos:\n");

            double subtotalProductos = 0.0;
            for (DetallePedido det : detalles) {
                BigDecimal subtotalProducto = det.getPrecioHistorico().multiply(BigDecimal.valueOf(det.getCantidad()));
                subtotalProductos += subtotalProducto.doubleValue();
                contenido.append("- ")
                        .append(det.getProducto().getNombre())
                        .append(" x")
                        .append(det.getCantidad())
                        .append(" : S/ ")
                        .append(subtotalProducto)
                        .append("\n");
            }

            double costoEnvio = (subtotalProductos > 50.0) ? 0.0 : 5.0;

            contenido.append("\n");
            contenido.append("Costo de envío: ").append(costoEnvio == 0.0 ? "Gratis" : "S/ 5.00").append("\n");
            if (codigoCupon != null && !codigoCupon.trim().isEmpty()) {
                contenido.append("Cupón aplicado: ").append(codigoCupon.toUpperCase()).append("\n");
            }
            contenido.append("Total pagado: S/ ").append(pedido.getTotal()).append("\n")
                    .append("--------------------------------------------------\n\n")
                    .append("Tu pedido ya está siendo preparado para su envío.\n\n")
                    .append("Si tienes alguna duda o consulta, puedes responder a este correo o escribir a soporte@mifarmacode.com.\n\n")
                    .append("Saludos,\nEquipo MiFarmaCode");

            message.setText(contenido.toString());
            mailSender.send(message);
        } catch (Exception e) {
            System.out.println("Error enviando email de confirmación de pedido: " + e.getMessage());
        }
    }
}
