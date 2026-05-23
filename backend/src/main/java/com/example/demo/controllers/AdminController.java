package com.example.demo.controllers;

import com.example.demo.models.Administrador;
import com.example.demo.models.Pedido;
import com.example.demo.models.Producto;
import com.example.demo.models.DetallePedido;
import com.example.demo.repositories.AdministradorRepository;
import com.example.demo.repositories.PedidoRepository;
import com.example.demo.repositories.DetallePedidoRepository;
import com.example.demo.repositories.ProductoRepository;
import com.example.demo.services.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Controlador REST para el panel de administración del sistema.
 * 
 * Ruta base: /api/admin
 * CORS: permite peticiones desde el frontend Angular (localhost:4200).
 * 
 * Endpoints disponibles:
 * - POST /api/admin/auth/login            → Login de administrador (público).
 * - GET  /api/admin/productos             → Listar todos los productos (autenticado).
 * - PUT  /api/admin/productos/{id}/stock  → Actualizar stock de un producto (solo rol admin).
 * - GET  /api/admin/ventas                → Listar todas las ventas con detalles (autenticado).
 * - GET  /api/admin/ventas/stats          → Estadísticas de ventas por día (autenticado).
 * 
 * Control de acceso:
 * - Los endpoints de administración requieren JWT válido (configurado en SecurityConfig).
 * - La actualización de stock adicionalmente verifica que el rol sea "admin".
 */
@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:4200")
public class AdminController {

    /** Repositorio para autenticar y buscar administradores. */
    @Autowired
    private AdministradorRepository administradorRepository;

    /** Repositorio de productos del catálogo. */
    @Autowired
    private ProductoRepository productoRepository;

    /** Repositorio de pedidos (órdenes de compra completadas). */
    @Autowired
    private PedidoRepository pedidoRepository;

    /** Repositorio de detalles de pedido (ítems de cada orden). */
    @Autowired
    private DetallePedidoRepository detallePedidoRepository;

    /** Servicio JWT para generar tokens de sesión de administrador. */
    @Autowired
    private JwtService jwtService;

    /** Encriptador BCrypt para verificar contraseñas de administradores. */
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    /**
     * Autenticación de administradores con correo corporativo y contraseña.
     * 
     * Los administradores tienen un sistema de login separado al de los clientes,
     * usando correo corporativo (@correo_corp.com) en lugar de email personal.
     * El token JWT generado tiene la misma estructura que el de clientes.
     * 
     * Body esperado: { "email": "admin@correo_corp.com", "password": "admin123" }
     * 
     * Respuesta exitosa:
     * { "token": "eyJ...", "usuario": { "idAdmin": 1, "nombre": "...", "rol": "admin" } }
     *
     * @param request mapa con email corporativo y contraseña.
     * @return 200 con token y datos del admin, o 401 si las credenciales son inválidas.
     */
    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");

        if (email == null || email.isEmpty() || password == null || password.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El correo y contraseña son requeridos"));
        }

        // Buscar el administrador por correo corporativo
        Optional<Administrador> adminOpt = administradorRepository.findByCorreoCorp(email);
        if (adminOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Credenciales corporativas inválidas"));
        }

        Administrador admin = adminOpt.get();
        // Verificar contraseña con BCrypt
        if (!passwordEncoder.matches(password, admin.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Credenciales corporativas inválidas"));
        }

        // Generar token JWT usando el correo corporativo como subject
        String token = jwtService.generateToken(admin.getCorreoCorp());

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("usuario", Map.of(
                "idAdmin", admin.getIdAdmin(),
                "nombre", admin.getNombre(),
                "correoCorp", admin.getCorreoCorp(),
                "rol", admin.getRol()  // "admin" o "vendedor"
        ));

        return ResponseEntity.ok(response);
    }

    /**
     * Lista todos los productos del catálogo.
     * Disponible para cualquier administrador autenticado (admin y vendedor).
     *
     * @return 200 con lista de todos los productos.
     */
    @GetMapping("/productos")
    public ResponseEntity<?> listarProductos() {
        return ResponseEntity.ok(productoRepository.findAll());
    }

    /**
     * Actualiza el stock de un producto específico.
     * 
     * RESTRICCIÓN DE ROL: Solo administradores con rol "admin" pueden modificar
     * el stock. Los vendedores tienen acceso de solo lectura.
     * 
     * El email del administrador se obtiene del SecurityContext (lo pone el filtro JWT).
     * 
     * Path variable: id → ID del producto a actualizar.
     * Body esperado: { "stock": 50 } (número entero no negativo)
     *
     * @param id      ID del producto cuyo stock se actualizará.
     * @param request mapa con el nuevo valor de stock.
     * @return 200 con el producto actualizado, 401 si no está autenticado,
     *         403 si no tiene rol admin, 400 si el stock es inválido, o 404 si no existe.
     */
    @PutMapping("/productos/{id}/stock")
    public ResponseEntity<?> actualizarStock(@PathVariable Integer id, @RequestBody Map<String, Integer> request) {
        // Obtener el email del administrador autenticado desde el SecurityContext
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<Administrador> adminOpt = administradorRepository.findByCorreoCorp(email);

        if (adminOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "No autorizado"));
        }

        // Verificar que tenga rol de administrador (no vendedor)
        Administrador admin = adminOpt.get();
        if (!"admin".equalsIgnoreCase(admin.getRol())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Acceso denegado: Solo el administrador puede modificar el stock"));
        }

        // Validar que el nuevo stock sea un número no negativo
        Integer nuevoStock = request.get("stock");
        if (nuevoStock == null || nuevoStock < 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "El stock debe ser un número entero no negativo"));
        }

        // Buscar el producto y actualizar su stock
        Optional<Producto> prodOpt = productoRepository.findById(id);
        if (prodOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Producto no encontrado"));
        }

        Producto producto = prodOpt.get();
        producto.setStock(nuevoStock);
        Producto guardado = productoRepository.save(producto);

        return ResponseEntity.ok(guardado);
    }

    /**
     * Lista todas las ventas (pedidos) con sus detalles completos.
     * 
     * Construye una respuesta enriquecida que incluye:
     * - Datos del pedido (id, fecha, estado, total).
     * - Datos del usuario que realizó la compra (nombre, apellido, email).
     * - Lista de detalles con producto, cantidad y precio histórico.
     * 
     * NOTA: Actualmente filtra los detalles en memoria (no en BD), lo cual
     * es ineficiente para grandes volúmenes de datos. Se recomienda usar
     * una query con JOIN en el repositorio para producción.
     *
     * @return 200 con lista de ventas enriquecidas.
     */
    @GetMapping("/ventas")
    public ResponseEntity<?> listarVentas() {
        List<Pedido> pedidos = pedidoRepository.findAll();
        
        // Transformar cada pedido a un mapa con todos sus datos (incluyendo detalles)
        List<Map<String, Object>> response = pedidos.stream().map(pedido -> {
            Map<String, Object> map = new HashMap<>();
            map.put("idPedido", pedido.getIdPedido());
            map.put("fecha", pedido.getFecha());
            map.put("estado", pedido.getEstado());
            map.put("total", pedido.getTotal());
            map.put("usuario", Map.of(
                "nombre", pedido.getUsuario().getNombre(),
                "apellido", pedido.getUsuario().getApellido(),
                "email", pedido.getUsuario().getEmail()
            ));
            
            // Buscar los detalles de este pedido filtrando en memoria
            // TODO: Optimizar con findByPedido_IdPedido() en el repositorio
            List<DetallePedido> detalles = detallePedidoRepository.findAll().stream()
                .filter(d -> d.getPedido().getIdPedido().equals(pedido.getIdPedido()))
                .collect(Collectors.toList());
                
            // Mapear los detalles a un formato simplificado para el frontend
            List<Map<String, Object>> detallesMap = detalles.stream().map(d -> {
                Map<String, Object> dm = new HashMap<>();
                dm.put("idDetallePedido", d.getIdDetallePedido());
                dm.put("producto", Map.of(
                    "idProducto", d.getProducto().getIdProducto(),
                    "nombre", d.getProducto().getNombre(),
                    "precioVenta", d.getProducto().getPrecioVenta()
                ));
                dm.put("cantidad", d.getCantidad());
                dm.put("precioHistorico", d.getPrecioHistorico()); // Precio al momento de la compra
                return dm;
            }).collect(Collectors.toList());
            
            map.put("detalles", detallesMap);
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    /**
     * Calcula estadísticas agregadas de ventas agrupadas por día.
     * 
     * Para cada día devuelve:
     * - fecha: la fecha en formato "YYYY-MM-DD".
     * - totalVentas: suma de los totales de todos los pedidos de ese día.
     * - cantidadPedidos: número de pedidos realizados ese día.
     * 
     * Los resultados se ordenan cronológicamente por fecha.
     * Estos datos se usan en el dashboard de administración para las gráficas.
     *
     * @return 200 con lista de estadísticas diarias ordenadas por fecha.
     */
    @GetMapping("/ventas/stats")
    public ResponseEntity<?> obtenerStats() {
        List<Pedido> pedidos = pedidoRepository.findAll();

        // Agrupar pedidos por fecha y sumar los totales de cada día
        Map<String, BigDecimal> dailySum = pedidos.stream()
                .collect(Collectors.groupingBy(
                        p -> p.getFecha().toLocalDate().toString(), // Clave: "YYYY-MM-DD"
                        Collectors.reducing(BigDecimal.ZERO, Pedido::getTotal, BigDecimal::add)
                ));

        // Agrupar por fecha y contar la cantidad de pedidos por día
        Map<String, Long> dailyCount = pedidos.stream()
                .collect(Collectors.groupingBy(
                        p -> p.getFecha().toLocalDate().toString(),
                        Collectors.counting()
                ));

        // Ordenar las fechas cronológicamente para presentarlas en orden
        List<String> sortedDates = dailySum.keySet().stream().sorted().collect(Collectors.toList());

        // Construir la lista de estadísticas combinando suma y conteo
        List<Map<String, Object>> stats = new ArrayList<>();
        for (String date : sortedDates) {
            Map<String, Object> statItem = new HashMap<>();
            statItem.put("fecha", date);
            statItem.put("totalVentas", dailySum.get(date));
            statItem.put("cantidadPedidos", dailyCount.get(date));
            stats.add(statItem);
        }

        return ResponseEntity.ok(stats);
    }
}
