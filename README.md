# 🎓 LA PRE — Sistema de Gestión Estudiantil, Asistencia QR y Rankings

**LA PRE** es una plataforma integral de gestión académica, control de asistencia mediante códigos QR dinámicos antifraude, registro financiero de pagos y cálculo automatizado de rankings de simulacros para academias preuniversitarias multi-sede.

📄 El detalle completo de requisitos funcionales, no funcionales, de rendimiento y seguridad está en [`REQUISITOS.md`](./REQUISITOS.md).

---

## 📑 Contenido

- [Arquitectura general](#-arquitectura-general-del-proyecto)
- [Resumen de requisitos](#-resumen-de-requisitos)
- [Modelo de base de datos](#️-modelo-de-base-de-datos-postgresql)
- [Seguridad y control de acceso](#-seguridad-y-control-de-acceso-rbac)
- [Mecanismo antifraude de asistencia QR](#️-mecanismo-antifraude-de-asistencia-qr)
- [Endpoints de la API](#-endpoints-de-la-api-rest-backend)
- [Rutas del frontend](#-rutas-del-frontend)
- [Instalación y ejecución local](#-guía-de-instalación-y-ejecución-local)
- [Pruebas](#-pruebas)
- [Despliegue en producción](#-despliegue-en-producción)
- [Estado actual del proyecto](#-estado-actual-del-proyecto)

---

## 📐 Arquitectura General del Proyecto

El proyecto está estructurado en un monorepositorio desacoplado que separa los servicios del backend y del frontend, y contiene pruebas de extremo a extremo:

```text
La-PRE/
├── backend/                  # API RESTful en Node.js + Express + PostgreSQL
│   ├── migrations/           # Scripts SQL de estructura e índices de Base de Datos
│   │   ├── 001_init_schema.sql
│   │   ├── 002_fix_qr_length.sql
│   │   └── 003_add_email_estudiante.sql
│   ├── scripts/              # Herramientas de carga y pruebas de correo
│   │   ├── prueba-carga.js   # Peticiones HTTP concurrentes reales contra el backend (PR-01/PR-02)
│   │   ├── probar-correo.js  # Prueba aislada del servicio de notificaciones
│   │   └── seed-carga.js     # Genera 500 estudiantes + resultados para medir el ranking (PR-01)
│   ├── src/
│   │   ├── config/           # Pool de PostgreSQL, migraciones y seed
│   │   │   ├── db.js
│   │   │   ├── migrate.js
│   │   │   └── seed.js
│   │   ├── controllers/      # Manejadores de peticiones HTTP
│   │   ├── middlewares/      # Verificación JWT, RBAC y rate limiting
│   │   ├── models/           # Definición de entidades de dominio
│   │   ├── repositories/     # Acceso a datos y consultas SQL optimizadas
│   │   ├── routes/           # Rutas y endpoints de la API
│   │   ├── services/         # Lógica de negocio, notificaciones y exportación
│   │   └── app.js            # Configuración de Express y middlewares globales
│   ├── server.js             # Punto de entrada y arranque del servidor HTTP
│   ├── package.json
│   └── .env.example
├── frontend/                 # Aplicación Web SPA en React + Vite
│   ├── public/                # Archivos estáticos y assets públicos
│   ├── src/
│   │   ├── api/client.js      # Cliente HTTP hacia la API backend (VITE_API_URL)
│   │   ├── components/        # Componentes UI reutilizables
│   │   ├── context/           # Contextos de autenticación y toast
│   │   ├── pages/              # Páginas principales de la SPA
│   │   ├── styles/             # Estilos compartidos y específicos
│   │   ├── App.jsx             # Definición de rutas (React Router)
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── vercel.json            # Rewrite SPA para que Vercel no dé 404 al refrescar rutas
├── e2e/                       # Pruebas de extremo a extremo con Playwright
│   ├── tests/
│   │   ├── login.spec.js
│   │   ├── pagos.spec.js
│   │   └── rankings.spec.js
│   └── playwright.config.js
├── REQUISITOS.md              # Especificación detallada de RF/RNF/PR/seguridad
└── README.md                  # Este documento
```

---

## 📋 Resumen de requisitos

El sistema cubre **13 requisitos funcionales** (gestión de estudiantes, pagos, asistencia QR antifraude, simulacros y rankings, reportes, usuarios/roles, auditoría, sedes y notificaciones), además de requisitos no funcionales de seguridad y rendimiento. La tabla completa, con el archivo y la línea de código que implementa cada uno, está en **[`REQUISITOS.md`](./REQUISITOS.md)**. Resumen rápido:

| Módulo | RF cubiertos | Rol principal |
| :--- | :--- | :--- |
| Estudiantes | RF-01 | `administrador_sede`, `direccion` |
| Pagos | RF-02, RF-13 | `administrador_sede`, `direccion` |
| Asistencia QR antifraude | RF-03, RF-04, RF-05 | `personal_asistencia`, `estudiante` |
| Simulacros y Rankings | RF-06, RF-07, RF-08 | `administrador_sede`, `direccion` |
| Reportes y exportación | RF-09, RF-09b | `administrador_sede`, `direccion` |
| Usuarios y RBAC | RF-10 | `direccion` |
| Auditoría | RF-11 | `direccion` |
| Sedes | RF-12 | `direccion` |

Seguridad: autenticación JWT + bcrypt, RBAC por middleware, rate limiting anti fuerza-bruta en login (**VULN-002/PS-01**), cabeceras de seguridad con `helmet` (**VULN-005**), y `trust proxy` configurado para operar correctamente detrás de Railway. Detalle en [`REQUISITOS.md § 4`](./REQUISITOS.md#4-seguridad--hallazgos-owasp-corregidos).

---

## 🗄️ Modelo de Base de Datos (PostgreSQL)

El esquema relacional cuenta con **8 tablas principales** optimizadas con índices estratégicos para garantizar consultas de alta velocidad (`< 5s` en rankings masivos, ver `RNF-01`/`PR-01`):

1. **`sede`**: Información de sedes de la institución (dirección, capacidad, estado).
2. **`estudiante`**: Registro de estudiantes matriculados (nombres, apellidos, DNI único, fecha de nacimiento, correo, estado activo/inactivo). El correo (`email`) se agregó en `003_add_email_estudiante.sql` para soportar notificaciones.
3. **`usuario`**: Cuentas de acceso con contraseñas encriptadas (`bcrypt`) y roles asignados (`direccion`, `administrador_sede`, `personal_asistencia`, `estudiante`).
4. **`pago`**: Historial de mensualidades y pagos registrados por alumno (monto, método de pago, comprobante, fecha, estado `pendiente`/`pagado`).
5. **`asistencia`**: Registro de marcaciones mediante QR dinámico. Incluye la restricción `UNIQUE (codigo_qr_usado)` como barrera antifraude a nivel de motor SQL.
6. **`simulacro`**: Evaluaciones programadas o concluidas (`estado`: `programado`/`cerrado`).
7. **`resultado`**: Puntajes obtenidos por los estudiantes en simulacros y cálculo de posición de ranking (`puesto`, `fecha_publicacion`).
8. **`auditoria`**: Bitácora imborrable de seguridad donde se registran todas las acciones operativas del sistema (marcado exitoso/rechazado, pagos, publicación de rankings, creación de usuarios/sedes, etc.).

---

## 🔐 Seguridad y Control de Acceso (RBAC)

El sistema implementa **Autenticación mediante JWT (JSON Web Tokens)** y **Control de Acceso Basado en Roles (RBAC)**:

| Rol | Descripción y Permisos |
| :--- | :--- |
| 🏛️ **`direccion`** | Acceso total al sistema: reportes consolidados institucionales, bitácora completa de auditoría, gestión de sedes, creación de usuarios de cualquier nivel, simulacros y rankings globales. |
| 🏫 **`administrador_sede`** | Gestión local de su sede: matriculación/inactivación de estudiantes, registro de pagos, gestión de usuarios locales y carga de resultados de simulacros. |
| 📲 **`personal_asistencia`** | Escaneo y validación en tiempo real del código QR presentado por los alumnos en la entrada de la sede. |
| 👨‍🎓 **`estudiante`** | Generación de su código QR dinámico temporal (carnet digital), consulta de su estado de cuenta personal e historial de rankings académicos. |

---

## 🛡️ Mecanismo Antifraude de Asistencia QR

Para evitar la suplantación de identidad o compartición de capturas de pantalla de códigos QR entre estudiantes:

1. **QR Dinámico firmado con JWT**: El servidor genera un token JWT temporal firmado con la clave secreta y con un tiempo de expiración corto (por defecto 120 segundos, `QR_EXPIRACION_SEG`).
2. **Validación server-side estricta**: El escáner envía el token al backend, el cual verifica la firma, vigencia, que el alumno esté `activo` y que no haya marcado ya ese mismo día.
3. **Imposibilidad de reutilización (unicidad en BD)**: Al procesar la asistencia, el token usado queda registrado en la tabla `asistencia`. Gracias al constraint `UNIQUE (codigo_qr_usado)`, cualquier intento simultáneo o posterior de reutilizar el mismo código QR falla a nivel de base de datos, registrando el intento de fraude en la bitácora de auditoría.

---

## 📡 Endpoints de la API REST Backend

### 🔑 Autenticación
* `POST /api/login` — Autenticación de usuario y retorno de JWT + rol. Protegido con rate limiting (8 intentos fallidos / 15 min).
* `POST /api/registro-estudiante` — Autoregistro de un estudiante nuevo.
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
* `GET /api/pagos/estudiante/:id` — Obtener estado de cuenta (`{ resumen, historial }`) de un estudiante.
* `GET /api/pagos/sede/:sedeId` — Consultar pagos de una sede (`administrador_sede`, `direccion`).

### 📊 Simulacros & Rankings
* `GET /api/simulacros` — Listar simulacros.
* `POST /api/simulacros` — Crear un simulacro (`administrador_sede`, `direccion`).
* `POST /api/simulacros/:id/resultados` — Carga masiva de resultados (`[{ estudiante_id, puntaje }]`).
* `POST /api/simulacros/:id/cerrar` — Cierra el simulacro y ejecuta la ventana SQL (`RANK() OVER`) para calcular y publicar puestos en tiempo real (`administrador_sede`, `direccion`).
* `GET /api/simulacros/:id/ranking` — Obtener ranking general.
* `GET /api/simulacros/:id/ranking/sede/:sedeId` — Obtener ranking filtrado por sede.

### 🏢 Sedes & 👤 Usuarios
* `GET /api/sedes` — Listado de sedes (público; se usa desde la pantalla de login/autoregistro).
* `POST /api/sedes` — Crear una sede nueva (`direccion`).
* `GET /api/usuarios` | `POST /api/usuarios` — Gestión de cuentas de usuario (`administrador_sede`, `direccion`).

### 📈 Reportes & Auditoría
* `GET /api/reportes/sede/:sedeId` — Consolidado de asistencia, ingresos y estudiantes de una sede (`administrador_sede`, `direccion`).
* `GET /api/reportes/tendencias?periodo=hoy|semana|mes` — Series de asistencia diaria, recaudación y comparación por sede para el dashboard (`administrador_sede`, `direccion`).
* `GET /api/reportes/general` — Consolidado institucional global por sedes (`direccion`).
* `GET /api/reportes/sede/:sedeId/exportar/pdf` | `.../exportar/excel` — Exportación del reporte de una sede.
* `GET /api/auditoria?modulo=&limite=` — Inspección de la bitácora de auditoría (`direccion`).

---

## 🖥️ Rutas del Frontend

SPA en React Router (`frontend/src/App.jsx`), protegidas por rol vía `RutaProtegida`:

| Ruta | Página | Roles permitidos |
| :--- | :--- | :--- |
| `/login` | Inicio de sesión / autoregistro de estudiante | público |
| `/escaner` | Escáner de QR con la cámara del dispositivo | `personal_asistencia`, `administrador_sede` |
| `/mi-qr` | Carnet digital / QR con cuenta regresiva | `estudiante` |
| `/mis-resultados` | Historial de resultados y ranking propio | `estudiante` |
| `/mis-pagos` | Estado de cuenta e historial de pagos propio | `estudiante` |
| `/panel` | Dashboard con indicadores, tendencias y gráficos | `direccion`, `administrador_sede` |
| `/pagos` | Registro de pagos y estado de cuenta por estudiante | `direccion`, `administrador_sede` |
| `/rankings` | Gestión de simulacros y publicación de rankings | `direccion`, `administrador_sede` |
| `/estudiantes` | Matrícula e inactivación de estudiantes | `direccion`, `administrador_sede` |
| `/sedes` | Gestión de sedes | `direccion`, `administrador_sede` |
| `/auditoria` | Bitácora de auditoría | `direccion` |

---

## ⚡ Guía de Instalación y Ejecución Local

### Prerrequisitos
* **Node.js**: `v18.x` o superior (usa `fetch` nativo, requerido por `scripts/prueba-carga.js`).
* **PostgreSQL**: `v14.x` o superior.

### Backend

1. Configura las variables de entorno:
   ```bash
   cd backend
   cp .env.example .env
   ```
   Edita `.env` con tus credenciales locales:
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

2. Instala dependencias:
   ```bash
   npm install
   ```

3. Crea la base de datos `la_pre` y ejecuta las migraciones (`001` a `003`):
   ```bash
   npm run migrate
   ```

4. (Opcional) Carga datos semilla de prueba:
   ```bash
   node src/config/seed.js
   ```
   Esto crea una sede central, un estudiante de prueba y un usuario `asistencia_central` (password: `asistencia123`).

5. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   La API escuchará en `http://localhost:3000`.

### Frontend

1. Instala dependencias:
   ```bash
   cd frontend
   npm install
   ```

2. Configura la URL de la API (`VITE_API_URL`) en `frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:3000/api
   ```

3. Ejecuta el cliente en modo desarrollo:
   ```bash
   npm run dev
   ```
   La aplicación abre en `http://localhost:5173` por defecto.

4. Construir para producción:
   ```bash
   npm run build
   ```

---

## 🧪 Pruebas

* **Backend (unitarias/integración)**: `cd backend && npm test` (Jest + Supertest).
* **End-to-end**: `cd e2e && npx playwright test` — cubre login por rol, registro de pagos con reflejo inmediato en el estado de cuenta, y el flujo completo de simulacro → carga de resultados → publicación → ranking calculado.
* **Carga / rendimiento (PR-01, PR-02)**:
  ```bash
  cd backend
  node scripts/seed-carga.js            # genera 500 estudiantes + resultados
  node scripts/prueba-carga.js <id_simulacro>   # mide tiempos con peticiones concurrentes reales
  ```

---

## 🚀 Despliegue en producción

### Frontend en Vercel
- Carpeta raíz del proyecto: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Incluye `vercel.json` con rewrite catch-all a `index.html` — **necesario** para que las rutas de React Router (`/panel`, `/pagos`, etc.) no den 404 al refrescar la página.
- Variable de entorno:
  - `VITE_API_URL=https://<BACKEND_URL>/api`

### Backend en Railway
- Carpeta raíz del proyecto: `backend`
- Start command: `npm start`
- **Auto Deploy debe estar activado** en el servicio (Settings → Source) apuntando a la rama `main`; si está apagado, Railway sigue sirviendo un build viejo aunque hagas push.
- Variables de entorno necesarias:
  - `DATABASE_URL` (proporcionada por Railway)
  - `DB_SSL=true`
  - `JWT_SECRET` (clave larga y segura)
  - `JWT_EXPIRES_IN=1d`
  - `APP_URL=https://<RAILWAY_APP>.up.railway.app`
  - `CORS_ORIGIN=https://<VERCEL_FRONTEND_URL>`
  - `QR_EXPIRACION_SEG=120`

> El backend soporta `DATABASE_URL` en entornos cloud, usa `CORS_ORIGIN` para restringir orígenes, y tiene `app.set('trust proxy', 1)` configurado para leer correctamente `X-Forwarded-For` detrás del proxy de Railway (necesario para que el rate limiter de login identifique IPs reales en vez de tratar a todos los usuarios como una sola).

Para una lista de incidentes reales de despliegue ya resueltos en este proyecto (y por qué), ver [`REQUISITOS.md § 6`](./REQUISITOS.md#6-incidentes-de-despliegue-resueltos-referencia-histórica).

---

## ✅ Estado actual del proyecto

- Backend: **Node.js + Express + PostgreSQL**, desplegado en Railway con auto-deploy activo.
- Frontend: **React + Vite**, desplegado en Vercel, consumiendo la API vía `VITE_API_URL`.
- Funcionalidades operativas de punta a punta en producción: login y RBAC, autoregistro de estudiantes, asistencia por QR antifraude, registro de pagos con historial visible, dashboard con indicadores y gráficos por periodo (hoy/semana/mes) y por sede, simulacros y rankings, reportes exportables, y bitácora de auditoría.
