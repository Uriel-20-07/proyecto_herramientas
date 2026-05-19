package com.example.demo.services;

import com.example.demo.models.Cupon;
import com.example.demo.models.PasswordResetToken;
import com.example.demo.models.User;
import com.example.demo.repositories.CuponRepository;
import com.example.demo.repositories.PasswordResetTokenRepository;
import com.example.demo.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private CuponRepository cuponRepository;

    @Value("${app.frontend.url:http://localhost:4200}")
    private String frontendUrl;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // Registro de nuevo usuario
    public User registrar(String email, String password, String nombre, String apellido, String telefono) {
        // Validar que el email no exista
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("El email ya está registrado");
        }

        // Validar que la contraseña sea válida
        if (password == null || password.length() < 6) {
            throw new RuntimeException("La contraseña debe tener al menos 6 caracteres");
        }

        // Crear nuevo usuario
        User usuario = new User();
        usuario.setEmail(email);
        usuario.setPassword(passwordEncoder.encode(password));
        usuario.setNombre(nombre);
        usuario.setApellido(apellido);
        usuario.setTelefono(telefono);
        usuario.setActivo(true);
        usuario.setEmailVerificado(false);

        User usuarioGuardado = userRepository.save(usuario);

        // Crear cupón de bienvenida y enviar código por email
        Cupon cuponBienvenida = crearCuponBienvenida(usuarioGuardado);
        emailService.sendWelcomeCouponEmail(email, nombre, cuponBienvenida.getCodigo());

        return usuarioGuardado;
    }

    private Cupon crearCuponBienvenida(User usuario) {
        Cupon cupon = new Cupon();
        cupon.setCodigo(generarCodigoCupon());
        cupon.setUsuario(usuario);
        cupon.setTipoDescuento("PORCENTAJE");
        cupon.setValorDescuento(BigDecimal.valueOf(30));
        cupon.setFechaCreacion(LocalDateTime.now());
        cupon.setFechaExpiracion(LocalDateTime.now().plusDays(30));
        cupon.setUsado(false);
        cupon.setDescripcion("Cupón de bienvenida 30% descuento");
        cupon.setActivo(true);

        return cuponRepository.save(cupon);
    }

    private String generarCodigoCupon() {
        return "BIENVENIDA-" + UUID.randomUUID().toString().replaceAll("[-]", "").substring(0, 10).toUpperCase();
    }

    // Login
    public String login(String email, String password) {
        Optional<User> usuarioOpt = userRepository.findByEmail(email);

        if (usuarioOpt.isEmpty()) {
            throw new RuntimeException("Usuario no encontrado");
        }

        User usuario = usuarioOpt.get();

        if (!usuario.getActivo()) {
            throw new RuntimeException("Usuario inactivo");
        }

        if (!passwordEncoder.matches(password, usuario.getPassword())) {
            throw new RuntimeException("Contraseña incorrecta");
        }

        usuario.setUltimaConexion(LocalDateTime.now());
        userRepository.save(usuario);

        // Generar y retornar token JWT
        return jwtService.generateToken(email);
    }

    // Solicitar recuperación de contraseña
    public void solicitarRecuperacionContraseña(String email) {
        Optional<User> usuarioOpt = userRepository.findByEmail(email);

        if (usuarioOpt.isEmpty()) {
            // No revelar si el email existe o no
            return;
        }

        User usuario = usuarioOpt.get();

        // Generar token único
        String token = UUID.randomUUID().toString();

        // Crear registro de reset token
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUser(usuario);
        resetToken.setFechaCreacion(LocalDateTime.now());
        resetToken.setFechaExpiracion(LocalDateTime.now().plusHours(1));
        resetToken.setUtilizado(false);

        passwordResetTokenRepository.save(resetToken);

        // Construir enlace de reset
        String resetLink = frontendUrl + "/reset-password/" + token;

        // Enviar email con enlace
        emailService.sendPasswordResetEmail(email, resetLink);
    }

    // Validar token de recuperación
    public boolean validarTokenRecuperacion(String token) {
        Optional<PasswordResetToken> resetTokenOpt = passwordResetTokenRepository.findByToken(token);

        if (resetTokenOpt.isEmpty()) {
            return false;
        }

        PasswordResetToken resetToken = resetTokenOpt.get();
        return !resetToken.isExpired();
    }

    // Cambiar contraseña con token
    public void cambiarContraseña(String token, String nuevaContraseña) {
        Optional<PasswordResetToken> resetTokenOpt = passwordResetTokenRepository.findByToken(token);

        if (resetTokenOpt.isEmpty()) {
            throw new RuntimeException("Token inválido");
        }

        PasswordResetToken resetToken = resetTokenOpt.get();

        if (resetToken.isExpired()) {
            throw new RuntimeException("Token expirado");
        }

        // Validar nueva contraseña
        if (nuevaContraseña == null || nuevaContraseña.length() < 6) {
            throw new RuntimeException("La contraseña debe tener al menos 6 caracteres");
        }

        // Actualizar contraseña del usuario
        User usuario = resetToken.getUser();
        usuario.setPassword(passwordEncoder.encode(nuevaContraseña));
        userRepository.save(usuario);

        // Marcar token como utilizado
        resetToken.setUtilizado(true);
        resetToken.setFechaUtilizacion(LocalDateTime.now());
        passwordResetTokenRepository.save(resetToken);
    }

    // Cambiar contraseña (usuario autenticado)
    public void cambiarContraseñaAutenticado(String email, String contraseñaActual, String nuevaContraseña) {
        Optional<User> usuarioOpt = userRepository.findByEmail(email);

        if (usuarioOpt.isEmpty()) {
            throw new RuntimeException("Usuario no encontrado");
        }

        User usuario = usuarioOpt.get();

        if (!passwordEncoder.matches(contraseñaActual, usuario.getPassword())) {
            throw new RuntimeException("Contraseña actual incorrecta");
        }

        if (nuevaContraseña == null || nuevaContraseña.length() < 6) {
            throw new RuntimeException("La contraseña debe tener al menos 6 caracteres");
        }

        usuario.setPassword(passwordEncoder.encode(nuevaContraseña));
        userRepository.save(usuario);
    }

    // Obtener usuario por email
    public User obtenerUsuarioPorEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }
}
