# TT Academias

Aplicación responsive en Next.js 16 / React 19 / TypeScript, preparada para academias aisladas por subdominio. Las vistas incluyen portal de estudiante y panel de academia; autenticación inicial y recuperación de contraseña ya usan API y MySQL. **No está lista para producción todavía:** pagos, Google OAuth, permisos completos por rol y persistencia de todas las operaciones del panel aún requieren implementación/configuración.

## Desarrollo local

Requiere Node.js 20.9+ y npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abre `http://localhost:3000`. Para comprobar la compilación optimizada: `npm run build` y luego `npm run start`.

## Base de datos y primer acceso

La aplicación usa MySQL, disponible en Hostinger. Crea una base de datos y usuario en hPanel, configura su cadena `DATABASE_URL` en `.env.local`, e importa `database/schema.sql` desde phpMyAdmin. Luego configura estas variables para crear la primera academia y el administrador global:

```env
BASE_DOMAIN=ttacademias.com
BOOTSTRAP_ACADEMY_NAME=Academia de prueba
BOOTSTRAP_ACADEMY_SLUG=demo
BOOTSTRAP_ADMIN_NAME=Administrador global
BOOTSTRAP_ADMIN_EMAIL=admin@ttacademias.com
BOOTSTRAP_ADMIN_PASSWORD=una-clave-larga-y-unica
```

Ejecuta `npm run bootstrap:admin` una sola vez y elimina las variables `BOOTSTRAP_*` al terminar. En producción establece `DATABASE_URL`, `AUTH_SECRET` (reservado para integraciones posteriores), `APP_URL`, `BASE_DOMAIN` y los datos SMTP. La ruta `/api/health` informa si la base responde. Para local, establece `DEFAULT_ACADEMY_SLUG=demo` para que registro/login de academia funcionen en `localhost`.

## Rutas y estado de funciones

- `/`: inicio y secciones de estudiante; asistencia, pago, torneos y parte del perfil siguen usando datos locales/de ejemplo.
- `/login`, `/registro`, `/recuperar-clave`: login con cookie segura, registro de estudiante dentro del subdominio y cambio de contraseña mediante enlace de un solo uso. La recuperación requiere SMTP.
- `/ranking/[id]`: inscripción pública por ranking de demostración; todavía guarda datos del navegador y muestra flujo de pago no real.
- `/admin`: panel visual para gestionar alumnos, profesores, cursos, clases, rankings, pagos, anuncios y tema de marca. Las acciones actuales no se guardan en MySQL y faltan los permisos/roles de profesor y administrador global.
- `/api/health`, `/api/auth/*`: infraestructura inicial de estado, registro/login/logout/usuario actual/recuperación.

## Infraestructura implementada

- `database/schema.sql`: modelo MySQL multiacademia para usuarios, sesiones, cursos, horarios, clases, asistencia, avisos, membresías, pagos, rankings y grupos/inscripciones.
- Tenant por subdominio, relación con DNI dentro de academia, hash de contraseña bcrypt y sesión opaca en cookie `HttpOnly`.
- Plantilla de variables en `.env.example`; no contiene secretos.

## Pendiente antes de producción

1. Conectar las vistas del alumno/admin/profesor a servicios MySQL; ahora las vistas admin/ranking y otras secciones conservan datos de demostración o `localStorage`.
2. Implementar control de acceso y autorización de los cuatro roles en cada ruta/API, gestión de academias/usuarios y carga segura de logos.
3. Elegir e integrar pasarela peruana (Izipay u otra): checkout, webhooks firmados e idempotentes, estados de pago, conciliación y reembolsos. No activar cobros con el botón de demostración.
4. Configurar y probar SMTP (recuperación, verificación de correo y avisos) y Google OAuth con dominio/callback de producción.
5. Crear DNS wildcard `*.ttacademias.com`, SSL y despliegue Node.js de Next.js en Hostinger Unlimited; confirmar límites, variables de entorno y conexión MySQL del plan contratado.
6. Añadir auditoría, consentimiento/privacidad, políticas y términos, estrategia de backups/restauración, monitoreo, rate limiting, protección anti abuso y pruebas integrales de flujos en móvil/desktop.
7. Implementar actualizaciones en tiempo real (por ejemplo, disponibilidad de cupos/avisos); MySQL del hosting por sí solo no resuelve WebSockets entrantes.

## Diseño

La interfaz mantiene la paleta azul/blanco solicitada, tipografía Inter Variable autoalojada y diseño adaptable a móvil y escritorio. El panel academia tiene personalización de logo/colores como vista previa; aplicar el tema guardado a todo el subdominio requiere conectar esa configuración a MySQL.
