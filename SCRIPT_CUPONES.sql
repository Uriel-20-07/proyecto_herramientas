-- =========================================================================
-- TABLAS PARA SISTEMA DE CUPONES DE BIENVENIDA
-- =========================================================================

-- Tabla de cupones de descuento
CREATE TABLE IF NOT EXISTS cupones (
    id_cupon INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    id_usuario INT NOT NULL,
    tipo_descuento VARCHAR(20) NOT NULL DEFAULT 'PORCENTAJE', -- PORCENTAJE o FIJO
    valor_descuento DECIMAL(10,2) NOT NULL, -- 30 para 30% o monto fijo
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion DATETIME NOT NULL,
    usado BOOLEAN DEFAULT FALSE,
    fecha_uso DATETIME,
    id_pedido INT,
    descripcion VARCHAR(255) DEFAULT 'Cupón de bienvenida 30% descuento',
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido) ON DELETE SET NULL,
    INDEX idx_codigo (codigo),
    INDEX idx_usuario (id_usuario),
    INDEX idx_usado (usado)
);

-- Tabla de historial de uso de cupones (para auditoría)
CREATE TABLE IF NOT EXISTS historial_cupones (
    id_historial INT AUTO_INCREMENT PRIMARY KEY,
    id_cupon INT NOT NULL,
    id_usuario INT NOT NULL,
    id_pedido INT,
    monto_descuento DECIMAL(10,2),
    fecha_uso DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(50) DEFAULT 'EXITOSO', -- EXITOSO, FALLIDO, CANCELADO
    razon VARCHAR(255),
    FOREIGN KEY (id_cupon) REFERENCES cupones(id_cupon) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido) ON DELETE SET NULL,
    INDEX idx_cupon (id_cupon),
    INDEX idx_usuario (id_usuario),
    INDEX idx_fecha (fecha_uso)
);

-- Tabla de tipos de cupones (para futuros cupones de otras promociones)
CREATE TABLE IF NOT EXISTS tipos_cupones (
    id_tipo INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    porcentaje_descuento DECIMAL(5,2),
    monto_descuento DECIMAL(10,2),
    usos_permitidos INT DEFAULT 1,
    dias_validez INT DEFAULT 30,
    activo BOOLEAN DEFAULT TRUE
);

-- =========================================================================
-- INSERTS INICIALES
-- =========================================================================

-- Insertar tipo de cupón de bienvenida
INSERT INTO tipos_cupones (nombre, descripcion, porcentaje_descuento, usos_permitidos, dias_validez, activo)
VALUES ('BIENVENIDA', 'Cupón de bienvenida para nuevos usuarios - 30% descuento', 30.00, 1, 30, TRUE);
