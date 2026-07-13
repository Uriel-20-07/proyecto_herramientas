package com.example.demo.controllers;

import com.example.demo.models.InventarioLote;
import com.example.demo.models.Pedido;
import com.example.demo.models.DetallePedido;
import com.example.demo.repositories.PedidoRepository;
import com.example.demo.repositories.DetallePedidoRepository;
import com.example.demo.repositories.InventarioLoteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestMethod;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/reportes")
public class ReporteController {

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private DetallePedidoRepository detallePedidoRepository;

    @Autowired
    private InventarioLoteRepository loteRepository;

    /**
     * GET /api/admin/reportes
     * Retorna los 4 reportes unificados en un solo JSON.
     */
    @GetMapping
    public ResponseEntity<?> obtenerReportes() {

        LocalDateTime ahora = LocalDateTime.now();
        LocalDateTime inicioSemana = ahora.minusDays(7);
        LocalDateTime inicioMes = ahora.minusDays(30);
        LocalDateTime inicioAnio = ahora.minusYears(1);

        List<Pedido> todosLosPedidos = pedidoRepository.findAll();

        // ─────────────────────────────────────────────────────────
        // REPORTE 1: Ventas por Período (semana, mes y año)
        // ─────────────────────────────────────────────────────────
        BigDecimal totalSemana = BigDecimal.ZERO;
        long pedidosSemana = 0;
        BigDecimal totalMes = BigDecimal.ZERO;
        long pedidosMes = 0;
        BigDecimal totalAnio = BigDecimal.ZERO;
        long pedidosAnio = 0;

        for (Pedido p : todosLosPedidos) {
            if (p.getFecha() == null || p.getTotal() == null) continue;
            if (p.getFecha().isAfter(inicioAnio)) {
                totalAnio = totalAnio.add(p.getTotal());
                pedidosAnio++;
            }
            if (p.getFecha().isAfter(inicioMes)) {
                totalMes = totalMes.add(p.getTotal());
                pedidosMes++;
            }
            if (p.getFecha().isAfter(inicioSemana)) {
                totalSemana = totalSemana.add(p.getTotal());
                pedidosSemana++;
            }
        }

        Map<String, Object> ventasPeriodo = new LinkedHashMap<>();
        ventasPeriodo.put("semana", Map.of("total", totalSemana, "numeroPedidos", pedidosSemana));
        ventasPeriodo.put("mes", Map.of("total", totalMes, "numeroPedidos", pedidosMes));
        ventasPeriodo.put("anio", Map.of("total", totalAnio, "numeroPedidos", pedidosAnio));

        // ─────────────────────────────────────────────────────────
        // REPORTE 2: Top 10 Productos Más Vendidos (últimos 30 días)
        // ─────────────────────────────────────────────────────────
        Set<Integer> pedidosMesIds = todosLosPedidos.stream()
                .filter(p -> p.getFecha() != null && p.getFecha().isAfter(inicioMes))
                .map(Pedido::getIdPedido)
                .collect(Collectors.toSet());

        List<DetallePedido> detallesMes = pedidosMesIds.isEmpty() ? new ArrayList<>() : detallePedidoRepository.findByPedido_IdPedidoIn(pedidosMesIds).stream()
                .filter(d -> d.getProducto() != null)
                .collect(Collectors.toList());


        // Calcular conteo de unidades vendidas e ingresos por producto
        Map<String, long[]> conteoProductos = new LinkedHashMap<>();
        Map<String, BigDecimal> ingresosProductos = new LinkedHashMap<>();
        detallesMes.forEach(d -> {
            String nombre = d.getProducto().getNombre();
            int cant = d.getCantidad() != null ? d.getCantidad() : 0;
            BigDecimal ingreso = d.getPrecioHistorico() != null
                    ? d.getPrecioHistorico().multiply(BigDecimal.valueOf(cant))
                    : BigDecimal.ZERO;
            conteoProductos.merge(nombre, new long[]{cant}, (old, n) -> { old[0] += cant; return old; });
            ingresosProductos.merge(nombre, ingreso, BigDecimal::add);
        });

        List<Map<String, Object>> topProductos = conteoProductos.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue()[0], a.getValue()[0]))
                .limit(10)
                .map(e -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("nombre", e.getKey());
                    m.put("cantidadVendida", e.getValue()[0]);
                    m.put("ingresoGenerado", ingresosProductos.getOrDefault(e.getKey(), BigDecimal.ZERO));
                    return m;
                })
                .collect(Collectors.toList());

        // ─────────────────────────────────────────────────────────
        // REPORTE 3: Lotes Próximos a Vencer (≤ 6 meses)
        // ─────────────────────────────────────────────────────────
        LocalDate hoy = LocalDate.now();
        LocalDate limite6Meses = hoy.plusMonths(6);

        List<Map<String, Object>> lotesVencer = loteRepository.findAll().stream()
                .filter(l -> l.getFechaVencimiento() != null
                        && l.getCantidadActual() != null
                        && l.getCantidadActual() > 0
                        && !l.getFechaVencimiento().isBefore(hoy)
                        && !l.getFechaVencimiento().isAfter(limite6Meses))
                .sorted(Comparator.comparing(InventarioLote::getFechaVencimiento))
                .map(l -> {
                    long diasRestantes = ChronoUnit.DAYS.between(hoy, l.getFechaVencimiento());
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("codigoLote", l.getCodigoLote());
                    m.put("producto", l.getProducto() != null ? l.getProducto().getNombre() : "—");
                    m.put("stock", l.getCantidadActual());
                    m.put("fechaVencimiento", l.getFechaVencimiento().toString());
                    m.put("diasRestantes", diasRestantes);
                    String alerta = diasRestantes <= 30 ? "CRÍTICO" : diasRestantes <= 90 ? "ALTO" : "MEDIO";
                    m.put("nivelAlerta", alerta);
                    return m;
                })
                .collect(Collectors.toList());

        // ─────────────────────────────────────────────────────────
        // REPORTE 4: Top 5 Clientes por Gasto Total Histórico
        // ─────────────────────────────────────────────────────────
        Map<String, BigDecimal> gastoCliente = new LinkedHashMap<>();
        Map<String, String> emailCliente = new LinkedHashMap<>();
        Map<String, Long> pedidosCliente = new LinkedHashMap<>();

        for (Pedido p : todosLosPedidos) {
            if (p.getUsuario() == null || p.getTotal() == null) continue;
            String nombre = p.getUsuario().getNombre() + " " + p.getUsuario().getApellido();
            gastoCliente.merge(nombre, p.getTotal(), BigDecimal::add);
            emailCliente.putIfAbsent(nombre, p.getUsuario().getEmail());
            pedidosCliente.merge(nombre, 1L, Long::sum);
        }

        List<Map<String, Object>> clientesTop = gastoCliente.entrySet().stream()
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .limit(5)
                .map(e -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("nombre", e.getKey());
                    m.put("email", emailCliente.getOrDefault(e.getKey(), "—"));
                    m.put("totalGastado", e.getValue());
                    m.put("numeroPedidos", pedidosCliente.getOrDefault(e.getKey(), 0L));
                    return m;
                })
                .collect(Collectors.toList());

        // ─────────────────────────────────────────────────────────
        // Respuesta unificada
        // ─────────────────────────────────────────────────────────
        Map<String, Object> respuesta = new LinkedHashMap<>();
        respuesta.put("ventasPeriodo", ventasPeriodo);
        respuesta.put("topProductos", topProductos);
        respuesta.put("lotesProximosVencer", lotesVencer);
        respuesta.put("clientesTop", clientesTop);

        // Lista de distritos disponibles (de pedidos que tienen distrito registrado)
        List<String> distritos = todosLosPedidos.stream()
                .map(Pedido::getDistrito)
                .filter(d -> d != null && !d.isBlank())
                .distinct()
                .sorted()
                .collect(Collectors.toList());
        respuesta.put("distritos", distritos);

        return ResponseEntity.ok(respuesta);
    }

    /**
     * GET /api/admin/reportes/por-distrito?distrito=Yanahuara
     *
     * Retorna el Top 10 productos más vendidos filtrando por el distrito
     * del pedido. Incluye el método de pago predominante por producto.
     *
     * Si no se pasa parámetro (o es vacío), devuelve datos de todos los distritos.
     */
    @GetMapping("/por-distrito")
    public ResponseEntity<?> topProductosPorDistrito(
            @RequestParam(value = "distrito", required = false) String distrito) {

        List<Pedido> pedidosFiltrados = pedidoRepository.findAll().stream()
                .filter(p -> {
                    if (distrito == null || distrito.isBlank()) return true;
                    return distrito.equalsIgnoreCase(p.getDistrito());
                })
                .collect(Collectors.toList());

        if (pedidosFiltrados.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        Set<Integer> pedidoIds = pedidosFiltrados.stream()
                .map(Pedido::getIdPedido)
                .collect(Collectors.toSet());

        // Mapa pedidoId → metodoPago para joinear luego
        Map<Integer, String> metodoPagoPorPedido = pedidosFiltrados.stream()
                .filter(p -> p.getMetodoPago() != null)
                .collect(Collectors.toMap(
                        Pedido::getIdPedido,
                        Pedido::getMetodoPago,
                        (a, b) -> a
                ));

        List<DetallePedido> detalles = pedidoIds.isEmpty()
                ? new ArrayList<>()
                : detallePedidoRepository.findByPedido_IdPedidoIn(pedidoIds).stream()
                        .filter(d -> d.getProducto() != null)
                        .collect(Collectors.toList());

        // Agrupar por producto
        Map<String, long[]> conteo = new LinkedHashMap<>();
        Map<String, BigDecimal> ingresos = new LinkedHashMap<>();
        // Contar votos de método de pago por producto
        Map<String, Map<String, Long>> metodoVotos = new LinkedHashMap<>();

        for (DetallePedido d : detalles) {
            String nombre = d.getProducto().getNombre();
            int cant = d.getCantidad() != null ? d.getCantidad() : 0;
            BigDecimal ingreso = d.getPrecioHistorico() != null
                    ? d.getPrecioHistorico().multiply(BigDecimal.valueOf(cant))
                    : BigDecimal.ZERO;

            conteo.merge(nombre, new long[]{cant}, (old, n) -> { old[0] += cant; return old; });
            ingresos.merge(nombre, ingreso, BigDecimal::add);

            // Acumular método de pago del pedido correspondiente
            int pedidoId = d.getPedido().getIdPedido();
            String metodo = metodoPagoPorPedido.getOrDefault(pedidoId, "N/A");
            metodoVotos.computeIfAbsent(nombre, k -> new LinkedHashMap<>())
                    .merge(metodo, 1L, Long::sum);
        }

        List<Map<String, Object>> resultado = conteo.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue()[0], a.getValue()[0]))
                .limit(10)
                .map(e -> {
                    String nombre = e.getKey();
                    // Método de pago predominante para este producto en el distrito
                    String metodoPredominante = metodoVotos.getOrDefault(nombre, Map.of())
                            .entrySet().stream()
                            .max(Map.Entry.comparingByValue())
                            .map(Map.Entry::getKey)
                            .orElse("N/A");

                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("nombre", nombre);
                    m.put("cantidadVendida", e.getValue()[0]);
                    m.put("ingresoGenerado", ingresos.getOrDefault(nombre, BigDecimal.ZERO));
                    m.put("metodoPago", metodoPredominante);
                    return m;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(resultado);
    }

    /**
     * GET /api/admin/reportes/top-por-fecha?dia=YYYY-MM-DD
     * GET /api/admin/reportes/top-por-fecha?mes=YYYY-MM
     *
     * Retorna el Top 10 productos más vendidos filtrados por día exacto o mes.
     */
    @GetMapping("/top-por-fecha")
    public ResponseEntity<?> topProductosPorFecha(
            @RequestParam(value = "dia", required = false) String dia,
            @RequestParam(value = "mes", required = false) String mes) {

        List<Pedido> pedidosFiltrados = pedidoRepository.findAll().stream()
                .filter(p -> {
                    if (p.getFecha() == null) return false;
                    LocalDate fecha = p.getFecha().toLocalDate();
                    if (dia != null && !dia.isBlank()) {
                        return fecha.toString().equals(dia);
                    }
                    if (mes != null && !mes.isBlank()) {
                        // mes = "YYYY-MM"
                        String pedidoMes = String.format("%04d-%02d", fecha.getYear(), fecha.getMonthValue());
                        return pedidoMes.equals(mes);
                    }
                    return true;
                })
                .collect(Collectors.toList());

        if (pedidosFiltrados.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        Set<Integer> pedidoIds = pedidosFiltrados.stream()
                .map(Pedido::getIdPedido)
                .collect(Collectors.toSet());

        List<DetallePedido> detalles = detallePedidoRepository
                .findByPedido_IdPedidoIn(pedidoIds).stream()
                .filter(d -> d.getProducto() != null)
                .collect(Collectors.toList());

        Map<String, long[]> conteo = new LinkedHashMap<>();
        Map<String, BigDecimal> ingresos = new LinkedHashMap<>();

        for (DetallePedido d : detalles) {
            String nombre = d.getProducto().getNombre();
            int cant = d.getCantidad() != null ? d.getCantidad() : 0;
            BigDecimal ingreso = d.getPrecioHistorico() != null
                    ? d.getPrecioHistorico().multiply(BigDecimal.valueOf(cant))
                    : BigDecimal.ZERO;
            conteo.merge(nombre, new long[]{cant}, (old, n) -> { old[0] += cant; return old; });
            ingresos.merge(nombre, ingreso, BigDecimal::add);
        }

        List<Map<String, Object>> resultado = conteo.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue()[0], a.getValue()[0]))
                .limit(10)
                .map(e -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("nombre", e.getKey());
                    m.put("cantidadVendida", e.getValue()[0]);
                    m.put("ingresoGenerado", ingresos.getOrDefault(e.getKey(), BigDecimal.ZERO));
                    return m;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(resultado);
    }
}
