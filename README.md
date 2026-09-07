# Financial Risk Score

MVP de consulta de riesgo financiero (challenge técnico): API Node.js + TypeScript + Express y SPA React + TypeScript.

Login con JWT y consulta de score por RUT. `admin` puede consultar cualquier RUT; `user` solo el suyo.

## Stack

- **Backend:** Node.js 24, TypeScript, Express, JWT (HS256), Helmet, CORS
- **Frontend:** React, TypeScript, Vite
- **Tests:** runner nativo de Node (`node --test`)

## Requisitos

- Node.js 24.20.0 (`nvm use` si usas el `.nvmrc`)
- npm

## Cómo ejecutar

La API **no carga** un archivo `.env`. Hay que pasar las variables en el comando (o hacer `source` de un `.env` exportado). El frontend sí lee `frontend/.env` vía Vite.

### 1. Backend

```bash
cd backend
npm install
npm run build
PORT=3000 \
FRONTEND_ORIGIN=http://localhost:5173 \
JWT_SECRET='local-dev-only-placeholder-32chars-min' \
npm start
```

API: `http://localhost:3000`

`JWT_SECRET` debe tener **≥ 32 bytes**. El valor `replace-me` de `.env.example` es corto a propósito y no sirve para arrancar.

`FRONTEND_ORIGIN` debe coincidir **exactamente** con la URL de la SPA (`http://localhost:5173`, no `127.0.0.1`).

### 2. Frontend (otra terminal)

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

SPA: **`http://localhost:5173`** (usa `localhost`, no `127.0.0.1`).

### Variables

| Variable | Dónde | Para qué |
| --- | --- | --- |
| `PORT` | API | Puerto (ej. `3000`) |
| `FRONTEND_ORIGIN` | API | Origen CORS allowlist |
| `JWT_SECRET` | API | Firma/verificación JWT (≥ 32 bytes) |
| `VITE_API_URL` | SPA (`frontend/.env`) | Base URL de la API |

Referencias: `.env.example` (raíz) y `frontend/.env.example`.

### Tests

```bash
cd backend
npm test
```

## Credenciales mock

| Rol | Usuario | Contraseña | RUT |
| --- | --- | --- | --- |
| Admin | `admin` | `adminpass` | — |
| User | `user` | `userpass` | `12345678-5` |

Admin: cualquier RUT. User: solo el suyo (`12.345.678-5` ≡ `12345678-5`).

## API

### `POST /login`

```json
{ "username": "user", "password": "userpass" }
```

```json
{ "token": "<jwt>" }
```

JWT: `sub`, `role`, y `rut` solo si `role = user`. Expira en 15 minutos. Sin `username`/`password` en el token.

- `400` body inválido · `401` credenciales incorrectas

### `GET /score/:rut`

```http
Authorization: Bearer <token>
```

```json
{
  "rut": "12.345.678-5",
  "score": 87,
  "fecha": "2026-09-07T20:40:00.000Z"
}
```

`score` 0–100, determinista por RUT normalizado. `rut` en la respuesta siempre en formato chileno legible. `fecha` = momento de la consulta (ISO).

- `400` RUT inválido · `401` token inválido/expirado · `403` sin permiso para ese RUT

Authz solo en backend. La SPA guarda el token **en memoria** (reload → login de nuevo).

## Alcance

MVP del challenge: mocks, score simulado (no modelo crediticio), sin DB ni refresh tokens.

## Uso de IA

Usé **Cursor y ChatGPT** como apoyo (alternativas, seguridad, tests, UI y docs). Revisé cada sugerencia; las decisiones finales fueron mías según el alcance del challenge.
