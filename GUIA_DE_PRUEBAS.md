# 🧪 Guía Completa de Pruebas — LA PRE

Esta guía detalla el protocolo de pruebas manuales y automatizadas para verificar el correcto funcionamiento del sistema **LA PRE** (Backend API REST, Seguridad RBAC, Mecanismo Antifraude de Asistencia QR y Rankings).

---

## 📋 Tabla de Contenidos
1. [Requisitos Previos y Preparación del Entorno](#1-requisitos-previos-y-preparación-del-entorno)
2. [Pruebas Automatizadas (Jest + Supertest)](#2-pruebas-automatizadas-jest--supertest)
3. [Pruebas Manuales de Endpoints (cURL / Postman)](#3-pruebas-manuales-de-endpoints-curl--postman)
   - [Módulo 1: Autenticación y JWT](#módulo-1-autenticación-y-jwt)
   - [Módulo 2: Gestión de Sedes y Usuarios (RBAC)](#módulo-2-gestión-de-sedes-y-usuarios-rbac)
   - [Módulo 3: Gestión de Estudiantes](#módulo-3-gestión-de-estudiantes)
   - [Módulo 4: Asistencia QR y Validación Antifraude](#módulo-4-asistencia-qr-y-validación-antifraude)
   - [Módulo 5: Registro Financiero de Pagos](#módulo-5-registro-financiero-de-pagos)
   - [Módulo 6: Simulacros, Carga Masiva y Rankings (`RANK()`)](#módulo-6-simulacros-carga-masiva-y-rankings-rank)
   - [Módulo 7: Consolidados y Bitácora de Auditoría](#módulo-7-consolidados-y-bitácora-de-auditoría)
4. [Matriz de Casos de Prueba Borde y Seguridad](#4-matriz-de-casos-de-prueba-borde-y-seguridad)

---

## 1. Requisitos Previos y Preparación del Entorno

Asegúrate de que la base de datos de pruebas esté migrada y poblada con los datos semilla (`seed.js`):

```bash
cd backend

# 1. Ejecutar migraciones SQL
npm run migrate

# 2. Cargar datos de prueba (Sede Central, Estudiante José Ramos, Usuario de asistencia)
node src/config/seed.js

# 3. Iniciar el servidor
npm run dev
```
El servidor escuchará en `http://localhost:3000`.

---

## 2. Pruebas Automatizadas (Jest + Supertest)

Para ejecutar la suite de pruebas unitarias e integración en Jest:

```bash
cd backend
npm test
```

---

## 3. Pruebas Manuales de Endpoints (cURL / Postman)

### Módulo 1: Autenticación y JWT

#### CP-AUTH-01: Login Exitoso con Personal de Asistencia
```bash
curl -i -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"asistencia_central","password":"asistencia123"}'
```
* **Resultado Esperado**: `HTTP/1.1 200 OK`. Retorna `token` (JWT) y `rol: "personal_asistencia"`. Guardar este token como `TOKEN_ASISTENCIA`.

#### CP-AUTH-02: Login Fallido (Credenciales Incorrectas)
```bash
curl -i -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"asistencia_central","password":"password_errado"}'
```
* **Resultado Esperado**: `HTTP/1.1 401 Unauthorized` con mensaje genérico: `{"error": "Usuario o contraseña incorrectos."}`.

---

### Módulo 2: Gestión de Sedes y Usuarios (RBAC)

#### CP-SEDE-01: Crear una Nueva Sede (Dirección)
*Primero genera un token con rol `direccion` o usa el seed predeterminado.*
```bash
curl -i -X POST http://localhost:3000/api/sedes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_DIRECCION>" \
  -d '{"nombre":"Sede Juliaca","direccion":"Jr. San Román 456","capacidad":300}'
```
* **Resultado Esperado**: `HTTP/1.1 201 Created` devuelve el objeto de la nueva sede creada con `id_sede: 2`.

---

### Módulo 3: Gestión de Estudiantes

#### CP-EST-01: Listar Estudiantes de la Sede
```bash
curl -i http://localhost:3000/api/estudiantes?sede_id=1 \
  -H "Authorization: Bearer <TOKEN_ASISTENCIA>"
```
* **Resultado Esperado**: `HTTP/1.1 200 OK` devuelve el arreglo de estudiantes activos.

---

### Módulo 4: Asistencia QR y Validación Antifraude

#### CP-QR-01: Generación de QR Dinámico por el Estudiante
```bash
# El id_estudiante 1 fue generado en el seed
curl -i http://localhost:3000/api/asistencia/qr/1 \
  -H "Authorization: Bearer <TOKEN_ESTUDIANTE>"
```
* **Resultado Esperado**: `HTTP/1.1 200 OK`. Retorna `{ token, qrImageDataUrl, expiraEnSegundos: 120 }`. Guardar el `token` del QR como `TOKEN_QR`.

#### CP-QR-02: Escaneo y Marcado Exitoso de Asistencia
```bash
curl -i -X POST http://localhost:3000/api/asistencia \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_ASISTENCIA>" \
  -d "{\"token\":\"<TOKEN_QR>\"}"
```
* **Resultado Esperado**: `HTTP/1.1 201 Created` con `{"exito": true, "mensaje": "Asistencia registrada."}`.

#### CP-QR-03: Intento de Reutilización del Mismo QR (Prueba Antifraude)
*Vuelve a ejecutar la misma petición del paso CP-QR-02 con el mismo `TOKEN_QR`.*
```bash
curl -i -X POST http://localhost:3000/api/asistencia \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_ASISTENCIA>" \
  -d "{\"token\":\"<TOKEN_QR>\"}"
```
* **Resultado Esperado**: `HTTP/1.1 409 Conflict` con `{"exito": false, "mensaje": "Este código ya fue utilizado."}`. Además se registra la infracción en la tabla `auditoria`.

---

### Módulo 5: Registro Financiero de Pagos

#### CP-PAGO-01: Registrar Pago de Pensión
```bash
curl -i -X POST http://localhost:3000/api/pagos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_ADMIN_SEDE>" \
  -d '{"estudiante_id":1,"monto":250.00,"metodo_pago":"efectivo","comprobante":"REC-00123"}'
```
* **Resultado Esperado**: `HTTP/1.1 201 Created` retorna los datos del pago registrado en estado `pagado`.

#### CP-PAGO-02: Consultar Estado de Cuenta del Estudiante
```bash
curl -i http://localhost:3000/api/pagos/estudiante/1 \
  -H "Authorization: Bearer <TOKEN_ESTUDIANTE>"
```
* **Resultado Esperado**: `HTTP/1.1 200 OK` retorna resumen con `total_pagado: "250.00"` e historial de comprobantes.

---

### Módulo 6: Simulacros, Carga Masiva y Rankings (`RANK()`)

#### CP-SIM-01: Crear Simulacro de Admisión
```bash
curl -i -X POST http://localhost:3000/api/simulacros \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_DIRECCION>" \
  -d '{"nombre":"Simulacro General I 2026","fecha":"2026-08-15","tipo":"general","descripcion":"Primer examen de evaluación global"}'
```
* **Resultado Esperado**: `HTTP/1.1 201 Created` con `id_simulacro: 1`.

#### CP-SIM-02: Carga Masiva de Resultados
```bash
curl -i -X POST http://localhost:3000/api/simulacros/1/resultados \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_DIRECCION>" \
  -d '{"resultados":[{"estudiante_id":1,"puntaje":85.50}]}'
```
* **Resultado Esperado**: `HTTP/1.1 201 Created` con `{"ok": true, "cantidadProcesada": 1}`.

#### CP-SIM-03: Cierre de Simulacro y Publicación de Rankings
```bash
curl -i -X POST http://localhost:3000/api/simulacros/1/cerrar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_DIRECCION>"
```
* **Resultado Esperado**: `HTTP/1.1 200 OK` retorna `duracionMs` (`< 5000 ms`) y cantidad de puestos calculados vía `RANK() OVER`.

#### CP-SIM-04: Consultar Ranking General Publicado
```bash
curl -i http://localhost:3000/api/simulacros/1/ranking \
  -H "Authorization: Bearer <TOKEN_ESTUDIANTE>"
```
* **Resultado Esperado**: `HTTP/1.1 200 OK` retorna la lista ordenada por `puesto ASC`.

---

### Módulo 7: Consolidados y Bitácora de Auditoría

#### CP-AUD-01: Inspección de la Bitácora de Auditoría (Dirección)
```bash
curl -i "http://localhost:3000/api/auditoria?limite=10" \
  -H "Authorization: Bearer <TOKEN_DIRECCION>"
```
* **Resultado Esperado**: `HTTP/1.1 200 OK` retorna los eventos registrados (`marcado_exitoso`, `marcado_rechazado_duplicado`, `registrar_pago`, etc.).

---

## 4. Matriz de Casos de Prueba Borde y Seguridad

| ID Caso | Escenario de Prueba | Acción / Payload | Resultado Esperado |
| :--- | :--- | :--- | :--- |
| **SEC-01** | Petición sin Header Authorization | `GET /api/estudiantes` sin token | `401 Unauthorized` (`Token no proporcionado.`) |
| **SEC-02** | Token manipulado o alterado | Bearer con firma falsa | `401 Unauthorized` (`Token inválido o expirado.`) |
| **SEC-03** | Estudiante intenta crear otro usuario | `POST /api/usuarios` con token estudiante | `403 Forbidden` (`No tienes permiso para esta acción.`) |
| **SEC-04** | QR expirado (> 120 segundos) | `POST /api/asistencia` con token de QR viejo | `409 Conflict` (`Código QR inválido o expirado.`) |
| **SEC-05** | Intento de reutilización de QR | Enviar token QR 2 veces | 1° Marcado `201 Created`, 2° Marcado `409 Conflict` (Garantizado por Unique Key en Postgres) |
| **VAL-01** | Monto de pago negativo o nulo | `POST /api/pagos` con `monto: -50` | `400 Bad Request` (`El monto debe ser mayor a 0.`) |
| **VAL-02** | Inactivación de estudiante con historial | `PATCH /api/estudiantes/1/inactivar` | Cambia `estado = 'inactivo'`, no borra referencias en pagos ni asistencia |
