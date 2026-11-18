# TT Academias

Aplicación responsive en Next.js 16 / React 19 / TypeScript, preparada para academias aisladas por subdominio. Las vistas incluyen portal de estudiante y panel de academia; autenticación inicial y recuperación de contraseña ya usan API y MySQL. **Aún no está lista para producción:** las pantallas de administración de cursos/alumnos/rankings y el portal de estudiante conservan datos de demostración. Los pagos y las integraciones correo/Google quedan expresamente para una etapa posterior.

## Desarrollo local

Requiere Node.js 20.9+ y npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abre `http://localhost:3000`. En modo local puedes entrar con las cuentas de demostración `testadmin` / `test` y `testuser` / `test`. Son cuentas temporales de interfaz y solo funcionan con `npm run dev`; el servidor de producción las rechaza. Para comprobar la compilación optimizada: `npm run build` y luego `npm run start`.

## Base de datos y primer acceso

La aplicación usa MySQL, disponible en Hostinger. Crea una base de datos y usuario en hPanel, configura su cadena `DATABASE_URL` en `.env.local`, e importa `database/schema.sql` desde phpMyAdmin. Luego configura estas variables para crear la primera academia y el administrador global:

```env
BASE_DOMAIN=ttacademias.com
BOOTSTRAP_ACADEMY_NAME=Academia de prueba
BOOTSTRAP_ACADEMY_SLUG=demo
BOOTSTRAP_ADMIN_NAME=Administrador global
BOOTSTRAP_ADMIN_EMAIL=admin@ttacademias.com
BOOTSTRAP_ADMIN_PASSWORD=una-clave-larga-y-unica
BOOTSTRAP_ACADEMY_ADMIN_NAME=Admin de academia
BOOTSTRAP_ACADEMY_ADMIN_EMAIL=admin@demo.ttacademias.com
BOOTSTRAP_ACADEMY_ADMIN_PASSWORD=otra-clave-larga-y-unica
```

Ejecuta `npm run bootstrap:admin` una sola vez y elimina las variables `BOOTSTRAP_*` al terminar. Se crean un admin global y un admin de academia inicial. En producción establece `DATABASE_URL`, `APP_URL`, `BASE_DOMAIN` y `DEFAULT_ACADEMY_SLUG`; `AUTH_SECRET` queda reservado para integraciones posteriores. La ruta `/api/health` informa si la base responde. Para local, `DEFAULT_ACADEMY_SLUG=demo` permite registro/login de academia en `localhost`.

## Rutas y estado de funciones

- `/`: portada pública del portal, con acceso e inscripción; si ya hay una sesión, dirige a la vista del rol.
- `/estudiante`: portal privado del estudiante; asistencia, historial, membresía y ranking todavía usan datos de demostración.
- `/login`, `/registro`, `/recuperar-clave`: login con cookie segura, registro de estudiante dentro del subdominio y cambio de contraseña mediante enlace de un solo uso. La recuperación requiere SMTP.
- `/ranking/[id]`: inscripción pública por ranking de demostración; aún guarda datos del navegador.
- `/admin`: panel de academia con persistencia real para identidad (nombre, logo y color del subdominio); las demás operaciones del panel siguen siendo locales.
- `/global-admin`: crear academias con su admin inicial, listar, suspender/activar y ver identidad/conteos.
- `/profesor`: agenda real de clases asignadas, aceptar clase, proponer cambio de fecha y registrar asistencia.
- `/api/health`, `/api/auth/*`, `/api/global/academies`, `/api/academy/settings`, `/api/teacher/classes*`: endpoints iniciales conectados a MySQL.

## Infraestructura implementada

- `database/schema.sql`: modelo MySQL multiacademia para usuarios, sesiones, cursos, horarios, clases, asistencia, avisos, membresías, pagos, rankings y grupos/inscripciones.
- Tenant por subdominio, relación con DNI dentro de academia, hash de contraseña bcrypt y sesión opaca en cookie `HttpOnly`.
- Rutas protegidas por rol: estudiante, administrador de academia, profesor y administrador global tienen acceso a vistas separadas. Las APIs nuevas vuelven a comprobar rol y academia en servidor. Las academias suspendidas no permiten iniciar sesión ni continuar con la sesión existente.
- El admin global crea una academia y su admin inicial en una transacción; el admin de academia actualiza la identidad y esta se aplica al tema del subdominio.
- Plantilla de variables en `.env.example`; no contiene secretos.

## Pendiente antes de producción

1. Pasar alumnos, profesores, cursos, horarios, clases, avisos, rankings, grupos, pagos e historial de estudiante del estado local al CRUD MySQL. Crear endpoints transaccionales y conectar todas las tablas/acciones de las vistas.
2. Completar módulos de profesor y admin global (gestión docente/alumnos, anuncios y acciones restantes) y validar el alcance exacto de las acciones antes de abrir producción.
3. Publicar con DNS wildcard `*.ttacademias.com`, SSL, variables secretas y proceso Node.js en Hostinger Unlimited; importar esquema, bootstrap inicial y confirmar conexión MySQL del plan contratado.
4. Añadir rate limiting, auditoría de cambios, política de backups/restauración, monitoreo y revisión de seguridad/privacidad y términos.
5. Elegir e integrar la solución de actualizaciones en tiempo real para cupos y avisos. El hosting compartido no acepta WebSockets entrantes; alternativa temporal: consultas periódicas desde el cliente.

## Diseño

La interfaz mantiene la paleta azul/blanco solicitada, tipografía Inter Variable autoalojada y diseño adaptable a móvil y escritorio. Nombre, logo por URL HTTPS y color se guardan en MySQL y el color se aplica desde el layout al subdominio.
