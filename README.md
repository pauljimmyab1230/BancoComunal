# Banquito Solidario - Banco Comunal

Sistema de gestión para bancos comunitarios (bancos solidarios). Plataforma web para administrar socios, aportes, créditos, caja, tesorería, fondos, auditoría y reportes.

## Arquitectura

Monorepo con npm workspaces:

```
├── frontend/    React + TypeScript + Vite + Tailwind CSS
├── backend/     Express + TypeScript + Prisma + MySQL
```

## Módulos

| Módulo | Descripción |
|--------|-------------|
| Socios | Gestión de miembros del banco comunal |
| Aportes | Registro y control de aportes |
| Créditos | Préstamos y créditos |
| Caja | Control de caja diario |
| Fondos | Administración de fondos |
| Auditoría | Registro de auditoría |
| Reportes | Generación de reportes |
| Configuración | Settings del sistema |
| Dashboard | Panel principal con métricas |

## Stack Tecnológico

**Frontend:** React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, Zustand, React Hook Form + Zod, Framer Motion

**Backend:** Express 5, TypeScript, Prisma ORM, MySQL, JWT Auth, Multer (uploads), Helmet, CORS

## Requisitos

- Node.js >= 18
- MySQL

## Instalación

```bash
# Clonar repositorio
git clone <url-del-repositorio>
cd banquito-solidario

# Instalar dependencias
npm install

# Configurar variables de entorno
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Editar backend/.env con tus datos de MySQL

# Generar cliente de Prisma
cd backend
npx prisma generate
npx prisma db push

# Volver a la raíz
cd ..
```

## Desarrollo

```bash
# Ejecutar frontend y backend en paralelo
npm run dev

# Solo frontend
npm run dev:front

# Solo backend
npm run dev:back
```

## Build

```bash
npm run build
```

## Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Ejecutar frontend y backend |
| `npm run dev:front` | Solo frontend (Vite) |
| `npm run dev:back` | Solo backend (tsx watch) |
| `npm run build` | Build completo |
| `npm run lint` | Lint frontend |
