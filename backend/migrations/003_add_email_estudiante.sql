-- ============================================================
-- Agrega el correo del estudiante, necesario para notificaciones
-- (RF: "Notificaciones: envío de mensajes para confirmar pagos y publicar rankings").
-- ============================================================

ALTER TABLE estudiante ADD COLUMN IF NOT EXISTS email VARCHAR(150);
