# Estructura del Proyecto - MÄKA Baby CRM

## Visión General

Este proyecto sigue una arquitectura basada en características (feature-based) que organiza el código por funcionalidad en lugar de tipo de archivo, mejorando la mantenibilidad y escalabilidad.

## Estructura de Directorios

```
src/
├── app/                    # Next.js App Router - Páginas y rutas
│   ├── dashboard/         # Página principal del dashboard
│   ├── clients/           # Gestión de clientes
│   ├── sales/             # Gestión de ventas
│   ├── users/             # Gestión de usuarios
│   ├── settings/          # Configuración y perfil
│   ├── login/             # Autenticación
│   └── register/          # Registro de usuarios
│
├── components/            # Componentes React reutilizables
│   ├── ui/               # Componentes de UI base (Button, Input, Card)
│   ├── layout/           # Componentes de layout (Sidebar, DashboardLayout)
│   └── sales/            # Componentes específicos de ventas
│
├── config/               # Configuración de la aplicación
│   ├── firebase.config.ts  # Configuración de Firebase
│   └── app.config.ts       # Constantes y configuración general
│
├── context/              # Contextos de React (AuthContext)
│
├── features/             # Características organizadas por dominio
│   ├── auth/             # Autenticación y autorización
│   ├── dashboard/        # Componentes y lógica del dashboard
│   ├── clients/          # Feature de clientes
│   ├── sales/            # Feature de ventas
│   └── users/            # Feature de usuarios
│
├── hooks/                # Custom React hooks
│   └── useStore.ts       # Hook principal para gestión de datos
│
├── lib/                  # Utilidades y configuraciones de librerías
│   ├── firebase.ts       # Inicialización de Firebase
│   ├── utils.ts          # Funciones utilitarias (cn, formatCurrency, etc.)
│
├── services/             # Servicios y capa de datos
│   └── firebase.service.ts  # Operaciones CRUD centralizadas
│
└── types/                # Tipos TypeScript
    └── index.ts          # Definiciones de tipos principales
```

## Principios de Arquitectura

### 1. Separación de Responsabilidades

- **components/**: Componentes UI puros y de presentación
- **features/**: Lógica de negocio específica por dominio
- **services/**: Capa de acceso a datos (Firebase)
- **hooks/**: Estado y lógica reactiva compartida

### 2. Reutilización

- Componentes UI en `components/ui/` son genéricos y reutilizables
- Hooks personalizados encapsulan lógica compleja
- Servicios centralizan operaciones de Firebase

### 3. Tipado Fuerte

- Todos los tipos definidos en `types/index.ts`
- Uso consistente de TypeScript en todo el proyecto

### 4. Optimización de Rendimiento

- Memoización con `useMemo` y `useCallback`
- Queries optimizadas de Firestore con `orderBy`
- Carga diferida de componentes

## Migración desde Estructura Anterior

La estructura anterior era más plana:

```
# ANTES
src/
├── components/layout/
├── components/sales/
├── hooks/
├── lib/
├── context/
└── types/
```

Ahora está organizada por características para mejor escalabilidad.

## Guía Rápida

### Añadir nueva característica

1. Crear carpeta en `features/[nombre]/`
2. Añadir tipos si son necesarios en `types/`
3. Crear servicios en `services/` si necesita acceso a datos
4. Crear componentes en `components/`
5. Usar hooks para estado compartido

### Modificar componente existente

- Componentes UI → `components/ui/`
- Componentes específicos → `components/[feature]/`
- Layouts → `components/layout/`

## Convenciones de Nomenclatura

- Archivos: PascalCase para componentes, camelCase para utilidades
- Carpetas: minúsculas con guiones si es necesario
- Tipos: PascalCase interfaces y types
- Constantes: UPPER_SNAKE_CASE
