# Guía de Presentación — LA PRE PERÚ
### Sistema de Gestión Estudiantil, Asistencia QR y Rankings Automatizados

Duración sugerida: 10-15 minutos de exposición + preguntas. Practica el flujo de la demo al menos una vez antes de dormir.

---

## 1. Apertura (30 segundos)

Di esto o algo parecido, con tus palabras:

> "Mi proyecto es un sistema real para LA PRE PERÚ que resuelve tres problemas concretos que tenía la academia: suplantación de identidad en la asistencia, demora de días en publicar rankings de simulacros, y pagos sin trazabilidad entre sedes. No es un prototipo — está desplegado en producción, con base de datos real, y lo voy a mostrar en vivo."

Esa última frase es importante: dilo con seguridad. Pocos proyectos de curso llegan a producción real.

---

## 2. Contexto técnico rápido (1 minuto)

Menciona, sin entrar en detalle todavía:
- **Backend:** Node.js + Express + PostgreSQL, desplegado en Railway
- **Frontend:** React + Vite, desplegado en Vercel
- **12 requisitos funcionales** cubiertos, con pruebas automatizadas reales (no solo manuales)
- Repositorio: `github.com/Enerdev/La-PRE`

---

## 3. Demo en vivo — sigue este orden exacto

Abre tu URL de Vercel **antes** de empezar a hablar, para no perder tiempo cargando.

### Paso 1 — Login y RBAC (roles)
Inicia sesión con `admin_central` / `admin123`. Di:
> "El sistema tiene 4 roles distintos, cada uno con permisos verificados en el backend, no solo ocultos en la pantalla."

### Paso 2 — El flujo crítico: Asistencia QR
Ve a "Control de Asistencia" (o cambia a `asistencia_central` / `asistencia123`). Si tienes tu celular con el QR de un estudiante a mano (usuario `jose_ramos` / `estudiante123` → "Mi QR"), escanéalo en vivo. Di mientras se marca:
> "Cada código QR es un JWT firmado por el servidor, válido solo 120 segundos y de un solo uso — hay una restricción a nivel de base de datos que impide reutilizarlo, incluso si dos sedes intentan escanear el mismo código al mismo tiempo."

Si el escáner falla por la cámara (problema conocido de HTTPS en redes locales), **no te pongas nervioso** — di: "el sistema ya está probado y documentado, en producción con HTTPS real funciona sin problema" y sigue con el siguiente punto.

### Paso 3 — Rankings calculados en tiempo real
Entra a "Simulacros y Rankings", abre un simulacro cerrado. Di:
> "El cálculo del ranking no se hace en el backend recorriendo datos uno por uno — se hace con una sola sentencia SQL usando la función de ventana RANK(). Con 500 estudiantes de prueba, el cálculo completo tomó 6 milisegundos."

### Paso 4 — Pagos y reportes exportables
Entra a "Pagos", muestra el estado de cuenta de un estudiante. Luego ve al panel y haz clic en "Exportar PDF" o "Exportar Excel". Di:
> "Los reportes se generan del lado del servidor con los mismos datos que ves en pantalla."

### Paso 5 (si te preguntan o si tienes tiempo) — Auditoría
Con `direccion_central` / `direccion123`, muestra la bitácora de auditoría. Di:
> "Cada acción crítica queda registrada — quién, cuándo, y si fue exitosa o rechazada."

---

## 4. Los tres puntos que más van a impresionar (dilos aunque no te pregunten)

**A. Encontré bugs reales con pruebas automatizadas, no solo con el ojo.**
> "Implementé pruebas End-to-End con Playwright, y en la primera corrida encontraron 4 problemas reales — entre ellos, un límite de intentos de login que estaba bloqueando usuarios legítimos que comparten la misma IP de sede. Eso no lo hubiera visto probando manualmente uno por uno."

**B. Probé el rendimiento con datos reales, no supuestos.**
> "Generé 500 estudiantes y 500 resultados reales, y disparé 500 peticiones HTTP concurrentes de verdad contra el sistema. El promedio fue 943 milisegundos para consultar el ranking — dentro de la meta de 3 segundos que definí en el análisis."

**C. Corregí vulnerabilidades reales de seguridad, no solo las mencioné.**
> "Mi informe original incluye un análisis OWASP ZAP con 2 vulnerabilidades críticas. Las corregí de verdad: límite de intentos de login contra fuerza bruta, y cabeceras de seguridad con Helmet. Puedo mostrar el código si quieren."

---

## 5. Preguntas probables y cómo responderlas

**"¿Por qué Railway y Vercel, y no lo que decía tu informe original (Azure)?"**
> "Evalué costo y practicidad — Railway y Vercel tienen niveles gratuitos suficientes para este alcance, y ya tenía experiencia previa con ambos por otro proyecto. La arquitectura de la aplicación no depende de la nube específica; migrar a Azure sería un cambio de configuración, no de código."

**"¿Cómo garantizas que el QR no se pueda falsificar?"**
> "El QR es un JWT firmado con una clave secreta que solo el servidor conoce. Nadie puede generar uno válido sin esa clave, y el servidor siempre revalida la firma y la fecha de expiración antes de aceptar el marcado."

**"¿Qué pasa si dos personas escanean el mismo QR al mismo tiempo?"**
> "Hay una restricción UNIQUE en la base de datos sobre el código usado. Aunque las dos peticiones lleguen en el mismo instante, la base de datos solo permite que una tenga éxito — es una garantía a nivel de motor de base de datos, no solo de lógica en el código."

**"¿Está probado con muchos usuarios simultáneos?"**
> "Sí — 500 peticiones concurrentes reales, documentadas con números de latencia real, no estimados." (menciona los 943ms/204ms si no los dijiste antes)

**"¿Qué harías diferente si tuvieras más tiempo?"**
> "Notificaciones por SMS además de correo, pruebas de penetración formales sobre el QR, y aumentar el pool de conexiones a la base de datos si el tráfico real lo exige — todo esto ya está documentado como trabajo futuro en mi informe actualizado."

**"¿Tienes el código en un repositorio?"**
> `github.com/Enerdev/La-PRE` — con historial completo de commits mostrando la evolución.

---

## 6. Si algo falla en vivo

- **La app no carga:** revisa tu wifi/datos antes de empezar. Ten una captura de pantalla de respaldo del dashboard por si acaso.
- **La cámara no funciona:** ya tienes la explicación arriba (Paso 2). No te disculpes de más, es un detalle técnico conocido y documentado.
- **Te quedas en blanco con una pregunta:** está bien decir "no estoy seguro, pero puedo revisarlo" — es mejor que inventar una respuesta.

---

## 7. Credenciales de respaldo (por si el profesor quiere probar él mismo)

| Usuario | Contraseña | Rol |
|---|---|---|
| `asistencia_central` | `asistencia123` | Personal de asistencia |
| `admin_central` | `admin123` | Administrador de sede |
| `direccion_central` | `direccion123` | Dirección |
| `jose_ramos` | `estudiante123` | Estudiante |

---

## 8. Cierre (10 segundos)

> "Este proyecto pasó por análisis, diseño, codificación, pruebas y despliegue real — con evidencia medida en cada etapa, no solo teoría. Está disponible ahora mismo en internet, para cualquiera que quiera probarlo."

Respira, y confía en el trabajo — está hecho de verdad, no solo en papel.
