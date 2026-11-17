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

## Primera entrega: estudiante

La primera interfaz será la vista de estudiante, optimizada para móvil. Se recomienda comenzar por inicio de sesión, resumen de próximas clases, avisos, pagos/renovación y rankings con inscripción. El diseño visual y el orden final de los módulos se ajustarán a los prototipos que comparta el cliente antes de implementar esas pantallas.

## Próximos pasos

1. Recibir el primer prototipo de la vista estudiante y definir sus flujos.
2. Crear el esqueleto de la aplicación y el diseño responsive.
3. Definir el modelo inicial de usuarios, academias, membresías, clases y anuncios.
4. Preparar las políticas RLS y el entorno de desarrollo; mantener secretos fuera del repositorio.
5. Configurar el dominio comodín, correo y despliegue al confirmar el plan de Hostinger.
