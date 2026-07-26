# 📋 Especificaciones y Requisitos — LA PRE

Este documento detalla los requisitos funcionales (RF), no funcionales (RNF), de seguridad (VULN/PS) y de rendimiento (PR) implementados en el sistema, con referencia directa al código que los cumple. Es el complemento técnico del [`README.md`](./README.md).

---

## 1. Requisitos Funcionales (RF)

| ID | Requisito | Descripción | Implementación |
| :--- | :--- | :--- | :--- |
| **RF-01** | Gestión de estudiantes sin borrado físico | Los estudiantes nunca se eliminan de la base de datos (tienen pagos, asistencias y resultados asociados); solo se marcan `estado = 'inactivo'`. | `estudiante.repository.js` (`inactivar`), `PATCH /api/estudiantes/:id/inactivar` |
| **RF-02** | Registro de pagos | Permite registrar pagos de pensión/inscripción por estudiante, con monto, método de pago y comprobante, y consultar estado de cuenta e historial. | `pago.service.js`, `pago.repository.js`, `POST /api/pagos`, `GET /api/pagos/estudiante/:id` |
| **RF-03** | Generación de QR dinámico de asistencia | Cada estudiante genera un código QR temporal (JWT firmado) que actúa como carnet digital de asistencia. | `qr.service.js` (`generarQR`), `GET /api/asistencia/qr/:estudianteId` |
| **RF-04** | No reutilización de códigos QR | Un código QR ya usado no puede volver a marcar asistencia, ni siquiera en una condición de carrera entre dos sedes escaneando al mismo tiempo. | Restricción `UNIQUE (codigo_qr_usado)` en `asistencia` (`001_init_schema.sql:54`), verificación aplicativa en `asistencia.repository.js` (`codigoYaUsado`) y manejo del error `23505` en `asistencia.service.js` |
| **RF-05** | Validación estricta de marcado de asistencia | El marcado verifica, en este orden: firma/vigencia del QR, que el estudiante exista y esté activo, que no haya marcado ya ese día, y que el código no esté usado. Cada intento (éxito o rechazo) queda en la bitácora. | `asistencia.service.js` (`marcarAsistencia`) |
| **RF-06** | Gestión de simulacros y carga de resultados | Creación de simulacros y carga (masiva) de resultados por estudiante antes de publicar el ranking. | `academico.service.js` (`crearSimulacro`, `registrarResultados`), `POST /api/simulacros`, `POST /api/simulacros/:id/resultados` |
| **RF-07** | Cálculo de ranking en una sola operación | El puesto de todos los resultados de un simulacro se calcula con una única sentencia SQL usando la función de ventana `RANK() OVER`, no fila por fila desde el backend, para soportar cientos de estudiantes en segundos. | `resultado.repository.js` (`calcularYPublicarRanking`) |
| **RF-08** | Cierre y publicación de ranking | Al cerrar un simulacro se calcula y publica el ranking de forma atómica, se marca el simulacro como `cerrado` y se registra el evento en auditoría. | `academico.service.js` (`cerrarYPublicarRanking`), `POST /api/simulacros/:id/cerrar` |
| **RF-09** | Reportes consolidados por sede | Consolida en una sola respuesta el total de ingresos, asistencias y estudiantes activos de una sede, más tendencias por periodo (hoy/semana/mes) y comparación entre sedes. | `reporte.repository.js` (`consolidadoPorSede`, `tendencias`), `GET /api/reportes/sede/:sedeId`, `GET /api/reportes/tendencias` |
| **RF-09b** | Exportación de reportes | Exporta el reporte consolidado de una sede a PDF o Excel. | `exportacion.service.js`, `GET /api/reportes/sede/:sedeId/exportar/pdf`, `.../exportar/excel` |
| **RF-10** | Gestión de usuarios y control de acceso por rol | Creación de cuentas de acceso (`direccion`, `administrador_sede`, `personal_asistencia`, `estudiante`) y restricción de cada endpoint según el rol autenticado (RBAC). | `usuario.controller.js`, `auth.middleware.js` (`permitirRoles`) |
| **RF-11** | Bitácora de auditoría | Registro inmutable de acciones críticas del sistema (marcados de asistencia exitosos/rechazados, pagos, publicación de rankings, creación de usuarios/sedes), consultable solo por `direccion`. | `auditoria.service.js`, `auditoria.repository.js`, `GET /api/auditoria` |
| **RF-12** | Alta de nuevas sedes sin afectar las existentes | Abrir una sede nueva es solo un `INSERT` adicional; ninguna sede activa ni sus datos se ven afectados. | `sede.controller.js` (`crear`), `POST /api/sedes` |
| **RF-13** | Notificaciones por correo | Envío de confirmación por correo al estudiante tras registrar un pago, y notificación al publicarse un ranking. No bloquea el flujo principal si el envío falla o tarda. | `notificacion.service.js`, migración `003_add_email_estudiante.sql` |

---

## 2. Requisitos No Funcionales (RNF)

| ID | Requisito | Descripción | Implementación |
| :--- | :--- | :--- | :--- |
| **RNF-01** | Consultas de alto volumen indexadas | Los accesos más frecuentes (asistencia por estudiante/fecha, resultados por simulacro ordenados por puntaje, pagos por estudiante) están respaldados por índices dedicados. | Índices en `001_init_schema.sql:86-88` |
| **RNF-02** | Contraseñas nunca en texto plano | Las contraseñas de usuario se almacenan con hash `bcrypt`, nunca en texto plano. | `usuario.controller.js`, `auth.service.js` |
| **RNF-03** | Sesión basada en JWT con expiración | Las sesiones se manejan con JWT firmado y expiración configurable (`JWT_EXPIRES_IN`), sin estado de sesión en el servidor. | `auth.middleware.js`, variable `JWT_EXPIRES_IN` |
| **RNF-04** | Portabilidad de entorno (local / nube) | La app corre igual en local (variables `DB_HOST`/`DB_USER`/...) y en la nube (`DATABASE_URL` de Railway con SSL), sin cambiar código. | `backend/src/config/db.js` |
| **RNF-05** | Notificaciones no bloquean flujos críticos | Un fallo o demora en el envío de correo (pago o ranking) nunca impide que la operación principal se complete y responda al usuario. | `pago.service.js`, `academico.service.js`, `notificacion.service.js` (try/catch interno) |

---

## 3. Requisitos de Rendimiento (PR)

| ID | Requisito | Descripción | Cómo se verifica |
| :--- | :--- | :--- | :--- |
| **PR-01** | Publicación de ranking en menos de 5 segundos | Con 500 estudiantes y 500 resultados, `cerrarYPublicarRanking` debe completarse en menos de 5 segundos gracias al `RANK() OVER` en una sola sentencia. | `backend/scripts/seed-carga.js` genera los datos; `academico.service.js` mide y registra la duración real (`duracionMs`) en la auditoría de cada publicación. |
| **PR-02** | Comportamiento bajo carga concurrente | El backend debe responder de forma estable ante peticiones HTTP concurrentes reales (no simuladas), incluyendo el escenario de doble marcado de un mismo QR. | `backend/scripts/prueba-carga.js` (usa `fetch` real contra el backend desplegado) |

---

## 4. Seguridad — hallazgos OWASP corregidos

| ID | Vulnerabilidad detectada | Corrección aplicada | Implementación |
| :--- | :--- | :--- | :--- |
| **VULN-002** | Autenticación débil: sin límite de intentos, permitía fuerza bruta sobre `/api/login`. | Rate limiting: máximo 8 intentos fallidos por IP en 15 minutos (`PS-01`); solo cuentan los intentos fallidos, para no bloquear a usuarios legítimos que comparten IP de sede. | `middlewares/rateLimit.middleware.js` (`limitadorLogin`) |
| **VULN-005** | Cabeceras de seguridad HTTP ausentes (`X-Frame-Options`, CSP, etc.), detectado con OWASP ZAP. | `helmet()` agrega automáticamente cabeceras de seguridad sensatas por defecto a toda respuesta. | `backend/src/app.js` |
| **PS-01** | Bloqueo temporal tras múltiples intentos fallidos (requisito de seguridad derivado de VULN-002). | Ver `VULN-002`. | `middlewares/rateLimit.middleware.js` |
| — | Identificación de IP incorrecta detrás de un proxy inverso (Railway), que hacía que el rate limiter tratara a todos los usuarios como una sola IP. | `app.set('trust proxy', 1)` para que Express confíe en el primer salto de `X-Forwarded-For`. | `backend/src/app.js` |
| — | CORS abierto (`*`) por defecto. | En producción se restringe con `CORS_ORIGIN` a la URL exacta del frontend en Vercel. | `backend/src/app.js` |

---

## 5. Trazabilidad rápida (RF → endpoint → rol)

| Endpoint | RF | Roles permitidos |
| :--- | :--- | :--- |
| `POST /api/login` | RF-10 | público |
| `POST /api/registro-estudiante` | RF-01 | público (autoregistro) |
| `GET/POST /api/estudiantes` | RF-01 | lectura: cualquier autenticado · escritura: `administrador_sede`, `direccion` |
| `PATCH /api/estudiantes/:id/inactivar` | RF-01 | `administrador_sede`, `direccion` |
| `GET /api/asistencia/qr/:estudianteId` | RF-03 | cualquier autenticado |
| `POST /api/asistencia` | RF-04, RF-05 | `personal_asistencia`, `administrador_sede` |
| `POST /api/pagos` | RF-02 | `administrador_sede`, `direccion` |
| `GET /api/pagos/estudiante/:id` | RF-02 | cualquier autenticado |
| `GET /api/pagos/sede/:sedeId` | RF-02, RF-09 | `administrador_sede`, `direccion` |
| `POST /api/simulacros` | RF-06 | `administrador_sede`, `direccion` |
| `POST /api/simulacros/:id/resultados` | RF-06 | `administrador_sede`, `direccion` |
| `POST /api/simulacros/:id/cerrar` | RF-07, RF-08 | `administrador_sede`, `direccion` |
| `GET /api/simulacros/:id/ranking[/sede/:sedeId]` | RF-07 | cualquier autenticado |
| `GET /api/reportes/sede/:sedeId` | RF-09 | `administrador_sede`, `direccion` |
| `GET /api/reportes/tendencias` | RF-09 | `administrador_sede`, `direccion` |
| `GET /api/reportes/general` | RF-09 | `direccion` |
| `GET /api/reportes/sede/:sedeId/exportar/{pdf,excel}` | RF-09b | `administrador_sede`, `direccion` |
| `GET/POST /api/sedes` | RF-12 | lectura: público · escritura: `direccion` |
| `GET/POST /api/usuarios` | RF-10 | `administrador_sede`, `direccion` |
| `GET /api/auditoria` | RF-11 | `direccion` |

---

## 6. Incidentes de despliegue resueltos (referencia histórica)

Documentado porque son errores fáciles de repetir en este tipo de stack (Vercel + Railway + Postgres):

1. **Alias SQL en camelCase sin comillas → datos en cero en el dashboard.** PostgreSQL pliega a minúsculas los alias sin comillas (`AS ingresosTotales` se guarda como `ingresostotales`), así que el backend/frontend leían `row.ingresosTotales` (`undefined`) y todo caía a `0`. Fix: comillas dobles en los alias (`AS "ingresosTotales"`) en `reporte.repository.js`.
2. **404 en Vercel al refrescar cualquier ruta que no sea `/`.** Al ser una SPA con `BrowserRouter`, rutas como `/panel` no existen como archivos reales; sin un rewrite, Vercel devuelve 404 antes de dejar que React Router las maneje. Fix: `frontend/vercel.json` con rewrite catch-all a `index.html`.
3. **Historial de pagos vacío tras registrar un pago.** El frontend leía `cuenta.pagos` y `p.fecha_pago`, pero el backend devuelve `{ resumen, historial }` con la columna `fecha`. Fix en `PagosPage.jsx`.
4. **Railway servía una versión vieja del backend.** El auto-deploy estaba desactivado en el servicio de Railway, así que los últimos commits nunca se desplegaban aunque estuvieran en `main`. Se verificó comparando qué rutas respondían 401 (existen) vs. 404 (no existen en el build corriendo).
5. **Rate limiter contando a todos los usuarios como una sola IP.** Sin `app.set('trust proxy', 1)`, Express no confía en `X-Forwarded-For` detrás del proxy de Railway. Fix en `backend/src/app.js`.
