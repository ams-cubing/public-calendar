# Calendario Público - Asociación Mexicana de Speedcubing

![Logo AMS](apps/web/public/icon.png)

## Descripción

Calendario público para consultar y gestionar competencias de speedcubing en México. Permite a delegados y organizadores crear y administrar competencias, registrar disponibilidad y solicitar fechas.

## Características

- Visualización pública de competencias y disponibilidad.
- Panel privado para delegados: crear/editar competencias, ver actividad.
- Solicitud de fechas con asignación automática de delegado.
- Notificaciones por correo (Resend) para delegados y organizadores.
- Integración con WCA para buscar usuarios.

## Requisitos

- Node.js 24+
- pnpm
- PostgreSQL
- Variables de entorno en apps/web/.env.local (p. ej. DATABASE_URL, RESEND_API_KEY)

## Instalación

```sh
pnpm install
cp apps/web/.env.local.example apps/web/.env.local
# Ajusta variables en apps/web/.env.local
```

## Desarrollo

Arrancar la aplicación web:

```sh
pnpm --filter @workspace/web dev
```

## Scripts útiles (desde la raíz)

- pnpm dev — inicia todos los workspaces en modo desarrollo
- pnpm --filter @workspace/web build — construir app web
- pnpm --filter @workspace/web start — iniciar app web en producción

## Estructura relevante

- apps/web — aplicación Next.js
  - apps/web/app — rutas y componentes de la app
  - apps/web/public/icon.png — logo usado en la app (colócalo aquí para que se muestre en el README y la UI)
- packages/ui — componentes compartidos

## Colocar el logo AMS

Guarda el archivo del logo como `apps/web/public/icon.png`. El README y la interfaz ya apuntan a `apps/web/public/icon.png` (ver [AppSidebar](apps/web/components/app-sidebar.tsx)).

## Contribuir

1. Crea un issue describiendo tu propuesta.
2. Abre un fork y un PR con cambios claros y tests si aplica.

## Licencia

Proyecto bajo la licencia del repositorio (ver archivo LICENSE).
