
-- ==========================================
-- PROYECTO RAM13 - MESA DE AYUDA INFORMATICA
-- Base de datos: mesa_ayuda_ram13
-- ==========================================

CREATE TABLE IF NOT EXISTS solicitudes_soporte (
    id_solicitud SERIAL PRIMARY KEY,
    nombre_trabajador VARCHAR(100) NOT NULL,
    departamento VARCHAR(80),
    tipo_problema VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    prioridad VARCHAR(20) DEFAULT 'Media',
    estado VARCHAR(30) DEFAULT 'Pendiente',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Datos iniciales de prueba
INSERT INTO solicitudes_soporte
(nombre_trabajador, departamento, tipo_problema, descripcion, prioridad, estado)
VALUES
('Juan Pérez', 'Administración', 'Internet',
 'No puedo conectarme a Internet', 'Alta', 'Pendiente'),
('Ana López', 'Contabilidad', 'Impresora',
 'La impresora no imprime', 'Media', 'En proceso'),
('Pedro Díaz', 'Ventas', 'Computador',
 'El computador funciona muy lento', 'Baja', 'Resuelto');
