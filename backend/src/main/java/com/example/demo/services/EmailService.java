package com.example.demo.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendPasswordResetEmail(String destinatario, String resetLink) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@mifarmacode.com");
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
            System.out.println("Error enviando email: " + e.getMessage());
        }
    }

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
}
