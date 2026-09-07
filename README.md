# Financial Risk Score

MVP de consulta de riesgo financiero desarrollado como parte del challenge técnico.

La aplicación permite autenticarse y consultar un score simulado a partir de un RUT chileno. El acceso está controlado por roles: un administrador puede consultar cualquier RUT, mientras que un usuario solo puede consultar el asociado a su cuenta.

El proyecto está dividido en una API REST construida con Node.js, TypeScript y Express, y una SPA en React + TypeScript.

## Stack

- **Backend:** Node.js 24, TypeScript, Express, JSON Web Tokens, Helmet y CORS
- **Frontend:** React, TypeScript y Vite
- **Testing:** test runner nativo de Node.js

## Requisitos

- Node.js 24.20.0
- npm

El repositorio incluye un `.nvmrc`, por lo que con `nvm` puedes utilizar directamente la versión esperada:

```bash
nvm use
```

## Configuración

El proyecto utiliza variables de entorno tanto para la API como para la SPA.

En la raíz del repositorio se encuentra `.env.example`, con las variables necesarias para el backend:

| Variable | Descripción |
| --- | --- |
| `PORT` | Puerto en el que se ejecutará la API |
| `FRONTEND_ORIGIN` | Origen permitido por CORS |
| `JWT_SECRET` | Secret utilizado para firmar y verificar los JWT |

El `JWT_SECRET` debe tener al menos 32 bytes. El valor incluido en `.env.example` es solamente un placeholder y debe reemplazarse al ejecutar la aplicación.

El frontend utiliza:

```text
VITE_API_URL
```

Puedes configurarlo copiando su archivo de ejemplo:

```bash
cd frontend
cp .env.example .env
```

Para desarrollo local, los valores esperados son:

```env
VITE_API_URL=http://localhost:3000
```

y:

```text
FRONTEND_ORIGIN=http://localhost:5173
```

## Ejecución local

### Backend

Desde la raíz del repositorio:

```bash
cd backend
npm install
npm run build
```

Luego inicia la API proporcionando las variables de entorno:

```bash
PORT=3000 \
FRONTEND_ORIGIN=http://localhost:5173 \
JWT_SECRET='local-development-secret-al-menos-32-bytes' \
npm start
```

La API quedará disponible en:

```text
http://localhost:3000
```

### Frontend

En otra terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

La SPA quedará disponible en:

```text
http://localhost:5173
```

## Credenciales de prueba

La autenticación utiliza cuentas mock, tal como se solicita para el MVP.

| Rol | Usuario | Contraseña | RUT |
| --- | --- | --- | --- |
| Admin | `admin` | `adminpass` | — |
| User | `user` | `userpass` | `12345678-5` |

El administrador puede consultar cualquier RUT.

El usuario puede consultar únicamente su propio RUT. La comparación se realiza sobre una representación normalizada, por lo que, por ejemplo, `12.345.678-5` y `12345678-5` se consideran la misma identidad.

## API

### Login

```http
POST /login
Content-Type: application/json
```

Ejemplo:

```json
{
  "username": "user",
  "password": "userpass"
}
```

Respuesta:

```json
{
  "token": "<jwt>"
}
```

El token contiene el rol del usuario y, para cuentas con rol `user`, su RUT. Los access tokens expiran después de 15 minutos.

Posibles respuestas:

- `400` — request inválido
- `401` — credenciales incorrectas

### Consultar score

```http
GET /score/:rut
Authorization: Bearer <token>
```

Ejemplo:

```http
GET /score/12345678-5
Authorization: Bearer <token>
```

Respuesta:

```json
{
  "rut": "12345678-5",
  "score": 87,
  "fecha": "2026-09-07T20:40:00.000Z"
}
```

El score es un entero entre `0` y `100`. Su generación es determinista: un mismo RUT normalizado siempre produce el mismo score.

`fecha` corresponde al momento en que se realizó la consulta y no interviene en el cálculo.

Posibles respuestas:

- `400` — RUT con una estructura no válida
- `401` — token ausente, inválido o expirado
- `403` — usuario autenticado sin autorización para consultar ese RUT

## Autenticación y autorización

La autenticación y la autorización se resuelven completamente en el backend.

Los JWT se verifican antes de acceder al recurso, incluyendo firma, algoritmo permitido, expiración y estructura de los claims.

Una vez autenticada la request:

- `admin` puede consultar cualquier RUT.
- `user` solo puede consultar el RUT asociado a su token.

La SPA no decodifica el JWT para tomar decisiones de autorización. Simplemente envía el access token en cada consulta y reacciona al resultado entregado por la API.

En el frontend el token se mantiene únicamente en memoria. No se utiliza `localStorage`, `sessionStorage` ni cookies, por lo que una recarga completa de la página requiere iniciar sesión nuevamente.

## Score determinista

El score utilizado en este MVP es una simulación.

Primero se normaliza el RUT para que distintas representaciones de una misma identidad tengan el mismo resultado. A partir de ese valor se genera un hash SHA-256 y se obtiene un número dentro del rango `0–100`.

Esto permite cumplir la propiedad requerida por el challenge:

```text
mismo RUT → mismo score
```

sin introducir persistencia ni una fuente de datos externa.

El valor no representa un modelo de evaluación crediticia real y, por la misma razón, la interfaz no asigna categorías como riesgo alto, medio o bajo.

## Tests

Los tests del backend se ejecutan con el test runner incluido en Node.js.

```bash
cd backend
npm test
```

El comando compila primero el proyecto y posteriormente ejecuta la suite.

La cobertura se concentra especialmente en los comportamientos sensibles del flujo:

- login y credenciales;
- contenido y expiración de JWT;
- tokens inválidos;
- autorización por rol y RUT;
- diferencias entre `401` y `403`;
- normalización de RUT;
- generación determinista del score;
- acceso protegido a `GET /score/:rut`.

El frontend se validó mediante TypeScript, build de producción y pruebas manuales del flujo completo en navegador.

## Decisiones de alcance

El objetivo fue mantener la solución pequeña y fácil de revisar, respetando el alcance de un MVP y el tiempo definido para el challenge.

Por eso no se agregó base de datos, refresh tokens, un proveedor externo de identidad ni un modelo crediticio real. Las credenciales son mock y el score se genera localmente.

La estructura permite que esas piezas puedan reemplazarse posteriormente sin cambiar el contrato principal de la aplicación.

## Uso de IA

Durante el desarrollo utilicé **Cursor y ChatGPT como herramientas de apoyo**.

Principalmente los usé para contrastar algunas alternativas de implementación, revisar consideraciones de seguridad, pensar casos de prueba y pulir detalles de la interfaz y de la documentación.

Las sugerencias se fueron revisando antes de incorporarlas y las decisiones finales se tomaron en función del alcance y los requisitos del challenge.
