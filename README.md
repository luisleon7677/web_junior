# Barbería Francis

Aplicación de inventario y ventas. `client/` es React/Vite; `server/` es Express con PostgreSQL (Neon).

## Desarrollo local

Requiere Node.js 20 o superior.

1. En `server/`, ejecuta `npm install` y crea `.env` a partir de `.env.example`. Pon la conexión de Neon en `DATABASE_URL`. Define un usuario y contraseña propios en `API_USER` y `API_PASSWORD`.
2. Ejecuta `npm run migrate` una vez para crear las tablas. El comando es idempotente y no borra datos.
3. Ejecuta `npm run dev` en `server/`.
4. En `client/`, ejecuta `npm ci` y `npm run dev`. Vite redirige `/api` al puerto 3001.

La base comienza sin productos ni ventas de ejemplo. Los datos que se veían antes eran datos de demostración en memoria.

## Producción

- Para desplegar ambos servicios con Docker Compose, configura `server/.env` con `DATABASE_URL`, `API_USER` y `API_PASSWORD` reales. No uses la clave de ejemplo. Desde la raíz ejecuta `docker compose build`, `docker compose run --rm api npm run migrate` y `docker compose up -d`. La web queda disponible en `127.0.0.1:8080`; publica ese puerto mediante un proxy HTTPS con tu dominio. Compose instala una configuración Nginx que redirige `/api/` al servicio `api`.
- Si despliegas **solo el frontend** como imagen Docker, define el argumento de build `VITE_API_URL=https://tu-api.example.com` con la URL pública de la API, sin `/api` al final. La imagen independiente no necesita resolver el nombre interno `api`. Reconstruye la imagen cada vez que cambie esa URL; Vite la incorpora durante la compilación. En la API, establece `CLIENT_ORIGIN` con la URL HTTPS pública del frontend.
- Configura `CLIENT_ORIGIN` con el origen HTTPS público exacto (por ejemplo, `https://inventario.ejemplo.com`). Protege el acceso al proxy con TLS y mantén el puerto 8080 enlazado solo a localhost. Antes de actualizar, respalda la base de datos; luego vuelve a ejecutar la migración y reconstruye los contenedores.
- Despliega `server/` como servicio Node.js con `npm ci --omit=dev` y `npm start`. Configura `NODE_ENV=production`, `DATABASE_URL`, `API_USER`, `API_PASSWORD`, `CLIENT_ORIGIN` (origen HTTPS exacto del cliente) y `PORT` si el proveedor lo requiere.
- Ejecuta `npm run migrate` en el despliegue antes de servir tráfico.
- Compila `client/` con `npm ci` y `npm run build`; publica `client/dist/` en un hosting estático con fallback de rutas a `index.html`.
- Si cliente y API usan dominios distintos, define `VITE_API_URL=https://dominio-de-la-api` antes de compilar. Si comparten dominio, redirige `/api/*` al servidor Express y deja `VITE_API_URL` sin definir.
- Usa HTTPS en ambos servicios. No expongas `DATABASE_URL` en variables del cliente. No publiques los archivos `.env`.

La API protege todas las rutas con autenticación básica si se definen `API_USER` y `API_PASSWORD`; en producción son obligatorios. La interfaz conserva las credenciales solo durante la sesión del navegador. La comprobación de estado es `GET /api/health`.

## Datos

`products` almacena el stock y precio actuales. `sales` conserva una copia del nombre y precio al momento de vender. `stock_movements` conserva entradas y salidas manuales. `app_settings` guarda el nombre del negocio y categorías. Las ventas y movimientos bloquean la fila del producto y actualizan el stock dentro de una transacción.
