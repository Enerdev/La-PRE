# LA PRE — Sistema de Gestión Estudiantil, Asistencia QR y Rankings

Este repositorio contiene el arranque real del sistema descrito en el informe de proyecto final.
Se construyó siguiendo el orden de dependencias reales (no el orden del documento académico),
empezando por el flujo crítico: **Asistencia QR**.

## Qué ya está construido

- Estructura de carpetas por capas (`controllers`, `services`, `repositories`, `routes`, `middlewares`, `config`).
- Migración SQL con las 7 tablas del diccionario de datos (`sede`, `estudiante`, `usuario`, `pago`, `asistencia`, `simulacro`, `resultado`, `auditoria`).
- Login con JWT y verificación de contraseña con bcrypt.
- Control de acceso por rol (RBAC) vía middleware.
- Módulo de Asistencia QR completo:
  - Generación de un QR dinámico (JWT firmado, vigencia corta configurable).
  - Validación en el servidor (nunca solo en el cliente).
  - Rechazo de códigos reutilizados, garantizado tanto en lógica como con una restricción `UNIQUE` en base de datos (para que ni una condición de carrera entre dos sedes lo pueda burlar).
  - Registro automático en la bitácora de auditoría de cada intento, exitoso o fallido.
- Módulo de Estudiantes (CRUD básico, con inactivación en vez de borrado, tal como exige la integridad referencial del diseño).

## Qué falta (próximos módulos, en orden sugerido)

1. **Pagos** (RF-02) — sigue el mismo patrón: repository → service → controller → routes.
2. **Simulacros y Rankings** (RF-06/RF-07/RF-08) — el cálculo de ranking es una consulta agregada sobre `resultado`; publícalo con `fecha_publicacion`.
3. **Reportes** (RF-09) — exportación a PDF/Excel a partir de los mismos endpoints.
4. **Gestión de sedes** (RF-12).
5. **Frontend en React** — recién aquí, cuando ya tengas 3-4 endpoints reales funcionando.

## Cómo levantarlo en tu máquina (Windows / PowerShell)

1. Instala PostgreSQL si no lo tienes, y crea la base de datos:
   ```powershell
   createdb la_pre
   ```

2. Entra al backend e instala dependencias:
   ```powershell
   cd backend
   npm install
   ```

3. Copia el archivo de variables de entorno y ajusta tu contraseña de PostgreSQL:
   ```powershell
   copy .env.example .env
   ```

4. Ejecuta la migración (crea las tablas):
   ```powershell
   npm run migrate
   ```

5. (Opcional pero recomendado para probar ya mismo) Crea datos de prueba:
   ```powershell
   node src/config/seed.js
   ```

6. Levanta el servidor:
   ```powershell
   npm run dev
   ```

7. Prueba el flujo completo con curl o Postman:
   ```powershell
   # Login
   curl -X POST http://localhost:3000/api/login -H "Content-Type: application/json" -d "{\"username\":\"asistencia_central\",\"password\":\"asistencia123\"}"

   # Generar el QR del estudiante (usa el id_estudiante que te dio el seed)
   curl http://localhost:3000/api/asistencia/qr/1 -H "Authorization: Bearer <TOKEN_DEL_LOGIN>"

   # Marcar asistencia con el token que devolvió el QR
   curl -X POST http://localhost:3000/api/asistencia -H "Content-Type: application/json" -H "Authorization: Bearer <TOKEN_DEL_LOGIN>" -d "{\"token\":\"<TOKEN_DEL_QR>\"}"

   # Repite el mismo POST con el mismo token: debe rechazarlo (409)
   ```

## Subir esto a tu repositorio (Enerdev/La-PRE)

Tu repositorio está vacío, así que desde esta carpeta:
```powershell
git init
git remote add origin https://github.com/Enerdev/La-PRE.git
git add .
git commit -m "Base del proyecto: estructura, BD y módulo de Asistencia QR"
git branch -M main
git push -u origin main
```

Luego crea la rama de integración y trabaja por funcionalidad, tal como definiste en tu propio informe:
```powershell
git checkout -b develop
git push -u origin develop
git checkout -b feature/pagos
```
