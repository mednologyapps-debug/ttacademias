# TT Academias

Plataforma web para academias de tenis de mesa en Perú. La experiencia se diseña primero para celular y luego se adapta a escritorio.

## Decisiones iniciales de arquitectura

- **Aplicación:** Next.js (App Router) + TypeScript. Permite construir una PWA adaptable a celular y desplegar una aplicación Node.js en Hostinger.
- **Interfaz:** Tailwind CSS y componentes accesibles. Las animaciones serán sutiles y respetarán la preferencia del sistema por movimiento reducido.
- **Datos, acceso y tiempo real:** Supabase con PostgreSQL, Auth, Realtime y Storage. Las políticas Row Level Security (RLS) deben aislar los datos por academia.
- **Correo:** proveedor transaccional mediante API/SMTP, con dominio autenticado (SPF, DKIM y DMARC). Los envíos masivos del CRM se procesarán como campañas con consentimiento, límites y registro de entregas; no dentro de una solicitud web que pueda expirar.
- **Despliegue:** Hostinger con soporte de aplicaciones Node.js para Next.js. El plan exacto debe confirmarse antes de configurar producción; en planes VPS el runtime se configura manualmente.
- **Subdominios:** una sola aplicación y base de datos multiacademia; DNS comodín `*.ttacademias.com`, certificado SSL que cubra los subdominios y resolución del slug desde el host. Crear una academia no crea otro despliegue.
- **Pagos:** integrar una pasarela compatible con Perú cuando se definan moneda, métodos, conciliación y flujo de renovación.

## Aislamiento y roles

Cada registro de negocio pertenece a una academia mediante `academy_id`. La academia se resuelve desde el subdominio, pero **el subdominio nunca es una medida de autorización**: las políticas de base de datos validan la membresía y el rol del usuario en cada operación.

Roles previstos: administrador global, administrador de academia, profesor y estudiante. El rol de academia se asigna por membresía para permitir que una persona tenga acceso a más de una academia. Las operaciones administrativas globales se ejecutarán en servidor con permisos restringidos y auditables.

## Marca configurable por academia

El administrador de cada academia podrá cargar su logo y elegir sus colores de marca. Esta configuración se guardará por academia y se aplicará en todo su subdominio mediante variables de tema, incluyendo las vistas del estudiante, profesor y administrador. Al cambiar de subdominio, la app cargará la marca correspondiente.

Paleta inicial para los prototipos de estudiante:
- **Blanco `#FFFFFF`**: tarjetas, navegación y superficies principales.
- **Soft Blue `#B6DFED`**: fondos suaves, chips y elementos seleccionados.
- **Midnight Navy `#002941`**: texto destacado, navegación activa y botones principales.
- **Coral Orange `#FD6E6E`**: acentos y llamadas a la acción puntuales.

La paleta anterior es el tema predeterminado del producto; cada academia podrá definir el suyo. El sistema mantendrá contraste y legibilidad al aplicar colores personalizados.

## Primera entrega: estudiante

La primera interfaz será la vista de estudiante, optimizada para móvil. Se recomienda comenzar por inicio de sesión, resumen de próximas clases, avisos, pagos/renovación y rankings con inscripción. El diseño visual y el orden final de los módulos se ajustarán a los prototipos que comparta el cliente antes de implementar esas pantallas. Los prototipos actuales conservan estructura y contenido; el cambio aprobado aquí es solo de paleta.

## Próximos pasos

1. Recibir el primer prototipo de la vista estudiante y definir sus flujos.
2. Crear el esqueleto de la aplicación y el diseño responsive.
3. Definir el modelo inicial de usuarios, academias, membresías, clases y anuncios.
4. Preparar las políticas RLS y el entorno de desarrollo; mantener secretos fuera del repositorio.
5. Configurar el dominio comodín, correo y despliegue al confirmar el plan de Hostinger.
