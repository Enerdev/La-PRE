# 🎓 LA PRE — Sistema de Gestión Estudiantil, Asistencia QR y Rankings

**LA PRE** es una plataforma integral de gestión académica, control de asistencia mediante códigos QR dinámicos antifraude, registro financiero de pagos y cálculo automatizado de rankings de simulacros para academias preuniversitarias multi-sede.

---

## 📐 Arquitectura General del Proyecto

El proyecto está estructurado en un monorepositorio desacoplado (**Backend API REST** + **Frontend SPA**):

```text
La-PRE/
├── backend/                  # API RESTful en Node.js + Express + PostgreSQL
│   ├── migrations/           # Scripts SQL de estructura e índices de Base de Datos
│   │   ├── 001_init_schema.sql
│   │   └── 002_fix_qr_length.sql
│   ├── src/
│   │   ├── config/           # Pool de PostgreSQL, scripts de migración y seed
│   │   │   ├── db.js
│   │   │   ├── migrate.js
│   │   │   └── seed.js
│   │   ├── controllers/      # Manejadores de peticiones HTTP
│   │   ├── middlewares/      # Verificación JWT y RBAC (Control de acceso por rol)
│   │   ├── repositories/     # Capa de acceso a datos y consultas SQL optimizadas
│   │   ├── routes/           # Rutas y definición de endpoints de la API
│   │   ├── services/         # Lógica de negocio, firmas JWT y auditoría
│   │   └── app.js            # Configuración de Express y middlewares globales
│   ├── server.js             # Punto de entrada y arranque del servidor HTTP
│   ├── package.json
│   └── .env.example
├── frontend/                 # Aplicación Web SPA (React + Vite)
└── README.md                 # Documentación general del proyecto
```

---

## 🗄️ Modelo de Base de Datos (PostgreSQL)

El esquema relacional cuenta con **8 tablas principales** optimizadas con índices estratégicos para garantizar consultas de alta velocidad (`< 5s` en rankings masivos):

1. **`sede`**: Información de sedes de la institución (Dirección, capacidad, estado).
2. **`estudiante`**: Registro de estudiantes matriculados (nombres, apellidos, DNI único, fecha de nacimiento, estado activo/inactivo).
3. **`usuario`**: Cuentas de acceso con contraseñas encriptadas (`bcrypt`) y roles asignados.
4. **`pago`**: Historial de mensualidades y pagos registrados por alumno (monto, comprobante, fecha, estado).
5. **`asistencia`**: Registro de marcaciones mediante QR dinámico. Incluye la restricción `UNIQUE (codigo_qr_usado)` como barrera antifraude a nivel de motor SQL.
6. **`simulacro`**: Evaluaciones programadas o concluidas.
7. **`resultado`**: Puntajes obtenidos por los estudiantes en simulacros y cálculo de posición de ranking (`puesto`).
8. **`auditoria`**: Bitácora imborrable de seguridad donde se registran todas las acciones operativas del sistema (marcado exitoso/rechazado, pagos, creación de usuarios, etc.).

---

## 🔐 Seguridad y Control de Acceso (RBAC)

El sistema implementa **Autenticación mediante JWT (JSON Web Tokens)** y **Control de Acceso Basado en Roles (RBAC)**:

| Rol | Descripción y Permisos |
| :--- | :--- |
| 🏛️ **`direccion`** | Acceso total al sistema: reportes consolidados institucionales, bitácora completa de auditoría, gestión de sedes, creación de usuarios de cualquier nivel, simulacros y rankings globales. |
| 🏫 **`administrador_sede`** | Gestión local de su sede: matriculación/inactivación de estudiantes, registro de pagos, gestión de usuarios locales y carga de resultados de simulacros. |
| 📲 **`personal_asistencia`** | Escaneo y validación en tiempo real del código QR presentados por los alumnos en la entrada de la sede. |
| 👨‍🎓 **`estudiante`** | Generación de su código QR dinámico temporal (carnet digital), consulta de su estado de cuenta personal e historial de rankings académicos. |

---

## 🛡️ Mecanismo Antifraude de Asistencia QR

Para evitar la suplantación de identidad o compartición de capturas de pantalla de códigos QR entre estudiantes:

1. **QR Dinámico firmado con JWT**: El servidor genera un token JWT temporal firmado con la clave secreta y con un tiempo de expiración corto (por defecto 120 segundos).
2. **Validación server-side estricta**: El escáner envía el token al backend, el cual verifica la firma, vigencia y que el alumno esté en estado `activo`.
3. **Imposibilidad de Reutilización (Unicidad en BD)**: Al procesar la asistencia, el token usado queda registrado en la tabla `asistencia`. Gracias al constraint `UNIQUE (codigo_qr_usado)`, cualquier intento simultáneo o posterior de reutilizar el mismo código QR falla a nivel de base de datos (HTTP 409 Conflict), registrando el intento de fraude en la bitácora de auditoría.

---

## 📡 Endpoints de la API REST Backend

### 🔑 Autenticación
* `POST /api/login` — Autenticación de usuario y retorno de JWT + Rol.
* `GET /api/health` — Health check de la API.

### 👨‍🎓 Estudiantes
* `GET /api/estudiantes` — Listado de estudiantes (filtro opcional por `?sede_id=`).
* `GET /api/estudiantes/:id` — Obtener detalle de un estudiante por ID.
* `POST /api/estudiantes` — Registrar nuevo estudiante (`administrador_sede`, `direccion`).
* `PATCH /api/estudiantes/:id/inactivar` — Inactivación lógica de estudiante (`administrador_sede`, `direccion`).

### 📲 Asistencia QR
* `GET /api/asistencia/qr/:estudianteId` — Genera el QR dinámico (JWT firmado con data URL) para el estudiante.
* `POST /api/asistencia` — Registrar marcación enviando `{ token }` escaneado (`personal_asistencia`, `administrador_sede`).

### 💳 Pagos
* `POST /api/pagos` — Registrar pago de pensión/inscripción (`administrador_sede`, `direccion`).
* `GET /api/pagos/estudiante/:id` — Obtener estado de cuenta e historial de pagos de un estudiante.
* `GET /api/pagos/sede/:sedeId` — Consultar pagos de una sede (`administrador_sede`, `direccion`).

### 📊 Simulacros & Rankings
* `GET /api/simulacros` — Listar simulacros.
* `POST /api/simulacros` — Crear un simulacro (`administrador_sede`, `direccion`).
* `POST /api/simulacros/:id/resultados` — Carga masiva de resultados (`[{ estudiante_id, puntaje }]`).
* `POST /api/simulacros/:id/cerrar` — Cierra el simulacro y ejecuta la ventana SQL (`RANK() OVER`) para calcular y publicar puestos en tiempo real.
* `GET /api/simulacros/:id/ranking` — Obtener ranking general.
* `GET /api/simulacros/:id/ranking/sede/:sedeId` — Obtener ranking filtrado/re-calculado por sede.

### 🏢 Sedes & 👤 Usuarios
* `GET /api/sedes` | `POST /api/sedes` — Gestión de sedes (`direccion`).
* `GET /api/usuarios` | `POST /api/usuarios` — Gestión de cuentas de usuario (`administrador_sede`, `direccion`).

### 📈 Reportes & Auditoría
* `GET /api/reportes/sede/:sedeId` — Consolidado de asistencia y recaudación de una sede.
* `GET /api/reportes/general` — Consolidado institucional global por sedes (`direccion`).
* `GET /api/auditoria` — Inspección de la bitácora de auditoría (`direccion`).

---

## ⚡ Guía de Instalación y Ejecución Local

### Prerrequisitos
* **Node.js**: `v18.x` o superior.
* **PostgreSQL**: `v14.x` o superior.

### 1. Clonar el repositorio y configurar variables de entorno
```bash
cd backend
cp .env.example .env
```
Edita `.env` con las credenciales de tu base de datos local:
```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=la_pre
DB_USER=postgres
DB_PASSWORD=tu_contraseña
JWT_SECRET=clave_secreta_super_segura_la_pre
JWT_EXPIRES_IN=1d
QR_EXPIRACION_SEG=120
```

### 2. Instalar dependencias del Backend
```bash
npm install
```

### 3. Crear la Base de Datos y ejecutar Migraciones
En tu terminal PostgreSQL / psql / pgAdmin crea la base de datos `la_pre` y corre la migración:
```bash
npm run migrate
```

### 4. Cargar datos semilla de prueba (Seed)
```bash
node src/config/seed.js
```
*Esto creará una Sede Central, un Estudiante de prueba y un usuario `asistencia_central` (password: `asistencia123`).*

### 5. Iniciar el Servidor de Desarrollo
```bash
npm run dev
```
La API escuchará en `http://localhost:3000`.

---

## 🛣️ Próximos Pasos en el Desarrollo

1. **Construcción del Frontend (SPA)**:
   - Inicializar el cliente React en `/frontend` con **Vite**.
   - Implementar el diseño visual responsive con variables CSS y UI moderna.
   - Conectar módulos de Login, Carnet QR del alumno, Lector de cámara QR para asistencia, Tablas de Ranking y Paneles Financieros.
2. **Pruebas de Integración y Carga**:
   - Automatizar pruebas de estrés sobre la consulta de Ranking (`RANK()`) simulando 500+ estudiantes simultáneos.
