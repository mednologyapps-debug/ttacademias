# TT Academias — portal de estudiante

Primera versión responsive del portal de estudiante para academias de tenis de mesa, con una maqueta de inicio de sesión. Está construida con Next.js, React y TypeScript. Los datos que se muestran son de demostración; todavía no hay autenticación, base de datos, pagos ni correos conectados.

## Ejecutar en Visual Studio Code

Requisitos: Node.js 20.9 o superior (se recomienda Node.js 22) y npm.

```bash
git clone https://github.com/mednologyapps-debug/ttacademias.git
cd ttacademias
npm install
npm run dev
```

Abre `http://localhost:3000` en el navegador. Para generar una compilación local de producción:

```bash
npm run build
npm run start
```

## Pantallas incluidas

- **Inicio:** aviso de sede, clase de hoy, membresía y próximo torneo.
- **Mis Clases:** calendario semanal, sesiones, historial/filtros visuales y recuperación de clase.
- **Rankings:** torneo, grupo asignado y tabla de clasificación.
- **Mi Perfil:** datos de cuenta, pagos, notificaciones, ayuda y seguridad.
- **Login:** diseño responsive con campos de correo y contraseña, mostrar/ocultar contraseña, recordar dispositivo y ayuda de acceso.

La navegación inferior funciona en móvil; los botones principales muestran sus estados de interacción localmente. La información es de muestra y se reinicia al recargar.

## Paleta y tipografía actuales

- Azul principal: `#0B50C8`
- Azul brillante: `#2563EB`
- Blanco: `#FFFFFF`
- Azules muy claros y grises neutros para superficies, divisiones y texto secundario
- Inter Variable, autoalojada en el proyecto para que la tipografía no dependa de Google Fonts en tiempo de ejecución

El color de marca está definido como variable CSS `--brand` en `app/globals.css`. Más adelante, el administrador de cada academia podrá cargar su logo y paleta; el portal leerá esos valores según el subdominio y los aplicará al tema completo de esa academia.

## Estructura

```text
app/
  globals.css       Estilos responsive y tema
  layout.tsx        Metadata y layout raíz
  page.tsx          Página de entrada
  student-portal.tsx Vistas interactivas del estudiante
  login/            Maqueta responsive del inicio de sesión
```
