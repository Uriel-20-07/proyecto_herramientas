package com.example.demo.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

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

    /**
     * Enviar email con contenido HTML
     */
    public void sendEmail(String destinatario, String asunto, String contenidoHtml) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("noreply@farmacode.com");
            helper.setTo(destinatario);
            helper.setSubject(asunto);
            helper.setText(contenidoHtml, true); // true para indicar que es HTML

            mailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("Error enviando email HTML: " + e.getMessage());
        }
    }
}
