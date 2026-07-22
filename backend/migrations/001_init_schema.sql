-- ============================================================
-- LA PRE - Sistema de Gestión Estudiantil, Asistencia QR y Rankings
-- Migración inicial: esquema base (PostgreSQL)
-- ============================================================

CREATE TABLE IF NOT EXISTS sede (
    id_sede      SERIAL PRIMARY KEY,
    nombre       VARCHAR(100) NOT NULL,
    direccion    VARCHAR(200),
    capacidad    INTEGER,
    estado       VARCHAR(20) NOT NULL DEFAULT 'activo'
);

CREATE TABLE IF NOT EXISTS estudiante (
    id_estudiante   SERIAL PRIMARY KEY,
    nombres         VARCHAR(100) NOT NULL,
    apellidos       VARCHAR(100) NOT NULL,
    dni             VARCHAR(15) UNIQUE,
    fecha_nacimiento DATE,
    sede_id         INTEGER NOT NULL REFERENCES sede(id_sede),
    estado          VARCHAR(20) NOT NULL DEFAULT 'activo', -- activo / inactivo (nunca se elimina)
    fecha_registro  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usuario (
    id_usuario     SERIAL PRIMARY KEY,
    username       VARCHAR(50) UNIQUE NOT NULL,
    password_hash  VARCHAR(255) NOT NULL,
    rol            VARCHAR(30) NOT NULL CHECK (rol IN ('direccion','administrador_sede','personal_asistencia','estudiante')),
    sede_id        INTEGER REFERENCES sede(id_sede),
    estudiante_id  INTEGER REFERENCES estudiante(id_estudiante),
    estado         VARCHAR(20) NOT NULL DEFAULT 'activo',
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pago (
    id_pago        SERIAL PRIMARY KEY,
    estudiante_id  INTEGER NOT NULL REFERENCES estudiante(id_estudiante),
    monto          NUMERIC(10,2) NOT NULL,
    fecha          TIMESTAMP NOT NULL DEFAULT NOW(),
    metodo_pago    VARCHAR(30),
    estado         VARCHAR(20) NOT NULL DEFAULT 'pendiente', -- pendiente / pagado
    comprobante    VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS asistencia (
    id_asistencia    SERIAL PRIMARY KEY,
    estudiante_id    INTEGER NOT NULL REFERENCES estudiante(id_estudiante),
    fecha            DATE NOT NULL DEFAULT CURRENT_DATE,
    hora             TIME NOT NULL DEFAULT CURRENT_TIME,
    codigo_qr_usado  VARCHAR(100) NOT NULL,
    estado           VARCHAR(20) NOT NULL DEFAULT 'asistio', -- asistio / rechazado
    observaciones    VARCHAR(200),
    UNIQUE (codigo_qr_usado) -- un mismo código QR jamás se puede reutilizar (RF-04)
);

CREATE TABLE IF NOT EXISTS simulacro (
    id_simulacro   SERIAL PRIMARY KEY,
    nombre         VARCHAR(100) NOT NULL,
    fecha          DATE NOT NULL,
    tipo           VARCHAR(30),
    descripcion    VARCHAR(200),
    estado         VARCHAR(20) NOT NULL DEFAULT 'programado'
);

CREATE TABLE IF NOT EXISTS resultado (
    id_resultado      SERIAL PRIMARY KEY,
    estudiante_id     INTEGER NOT NULL REFERENCES estudiante(id_estudiante),
    simulacro_id      INTEGER NOT NULL REFERENCES simulacro(id_simulacro),
    puntaje           NUMERIC(6,2) NOT NULL,
    puesto            INTEGER,
    fecha_publicacion TIMESTAMP,
    UNIQUE (estudiante_id, simulacro_id)
);

CREATE TABLE IF NOT EXISTS auditoria (
    id_auditoria   SERIAL PRIMARY KEY,
    usuario_id     INTEGER REFERENCES usuario(id_usuario),
    accion         VARCHAR(100) NOT NULL,
    modulo         VARCHAR(50),
    detalle        VARCHAR(300),
    fecha          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices que soportan las consultas críticas (RF-07, RNF-01)
CREATE INDEX IF NOT EXISTS idx_asistencia_estudiante_fecha ON asistencia(estudiante_id, fecha);
CREATE INDEX IF NOT EXISTS idx_resultado_simulacro ON resultado(simulacro_id, puntaje DESC);
CREATE INDEX IF NOT EXISTS idx_pago_estudiante ON pago(estudiante_id);
