# RAuth SDK

Official TypeScript SDK for integrating RAuth authentication in React and Next.js applications.

Esta es la biblioteca SDK oficial de RAuth, un paquete npm (`rauth`) para integrar autenticación en aplicaciones React y Next.js. Proporciona componentes React agnósticos, hooks y utilidades que se conectan al servicio backend de RAuth (construido en Go). Los usuarios lo instalan mediante `npm i rauth` y lo usan de manera similar al SDK de Clerk, permitiendo una integración rápida de login OAuth (Google, GitHub, Facebook, etc.) sin gestionar credenciales.

## Tech Stack

- **Lenguaje**: TypeScript 5.0+
- **Framework**: React 18+ (agnóstico, con enfoque en SSR de Next.js 14+)
- **Herramienta de Construcción**: Vite (para empaquetado rápido y servidor de desarrollo) o Rollup (para builds de producción)
- **Pruebas**: Vitest (pruebas livianas y rápidas) con React Testing Library
- **Verificación de Tipos**: TypeScript con modo estricto
- **Linting/Formateo**: ESLint + Prettier
- **Configuración**: `tsconfig.json` y `vite.config.ts` simples
- **Dependencias**: Mínimas – React, React-DOM (dependencias pares), JWT-decode para manejo de tokens

## Features

- 🔐 **OAuth Authentication** - Support for Google, GitHub, and Facebook
- ⚛️ **React Integration** - Hooks and components for easy integration
- 🚀 **Next.js Compatible** - Full SSR support with App Router
- 🔄 **Auto Token Refresh** - Automatic session management
- 📦 **Lightweight** - Minimal dependencies
- 🎨 **Customizable** - Easy to style and configure
- 🔒 **Type Safe** - Full TypeScript support

## Estructura del Proyecto (Simple y Plana)

```
/
├── src/                 # Todo el código fuente
│   ├── index.ts         # Exportaciones principales (componentes, hooks, tipos)
│   ├── components/      # Componentes React (ej., AuthComponent)
│   │   └── AuthComponent.tsx # Componente único para inicio de sesión, logout y perfil
│   ├── hooks/           # Hooks personalizados (ej., useAuth, useUser)
│   │   ├── useAuth.ts   # Hook de estado de autenticación
│   │   └── useSession.ts # Hook de gestión de sesiones
│   ├── utils/           # Funciones auxiliares
│   │   ├── api.ts       # Envolturas de fetch API (amigables con SSR)
│   │   ├── jwt.ts       # Utilidades JWT
│   │   └── types.ts     # Tipos/interfaces compartidos
│   ├── server/          # Utilidades del lado del servidor (para Next.js SSR/acciones)
│   │   ├── actions.ts   # Acciones del servidor para auth (ej., getSession)
│   │   └── middleware.ts # Middleware SSR opcional
│   └── providers/       # Proveedores de contexto
│       └── AuthProvider.tsx # Contexto de autenticación para envolver aplicaciones
├── test/                # Todas las pruebas (refleja la estructura de src/)
│   ├── components/      # Pruebas de componentes
│   │   └── AuthComponent.test.tsx
│   ├── hooks/           # Pruebas de hooks
│   │   └── useAuth.test.ts
│   ├── utils/           # Pruebas de utilidades
│   │   └── api.test.ts
│   └── server/          # Pruebas del lado del servidor
│       └── actions.test.ts
├── package.json         # Configuración del paquete NPM
├── tsconfig.json        # Configuración de TypeScript
├── vite.config.ts       # Configuración de build/dev
├── .eslintrc.json       # Configuración de ESLint
├── .prettierrc          # Configuración de Prettier
├── README.md            # Guía de uso
└── docs/                # Documentación
    └── API.md           # Referencia de API del SDK
```

## API Reference

See [docs/API.md](./docs/API.md) for detailed API documentation.

## Examples

Check the [examples/](./examples/) directory for complete example applications.

## TypeScript

This SDK is written in TypeScript and includes type definitions out of the box.

```tsx
import type { User, Session, AuthState, RAuthConfig } from 'rauth';
```

## Development

### Setup

```bash
npm install

npm link
```

### Scripts

- `npm run dev` - Start development server with Vite
- `npm run build` - Build the library for production
- `npm run test` - Run tests with Vitest
- `npm run test:watch` - Run tests in watch mode
- `npm run typecheck` - Run TypeScript type checking
- `npm run preview` - Preview the production build

### Building

The SDK is built with Vite and generates:
- ESM format (`dist/index.mjs`)
- CommonJS format (`dist/index.cjs`)
- TypeScript declarations (`dist/index.d.ts`)
- Source maps for debugging

## Contributing

Contributions are welcome! Please read our contributing guidelines.

## License

MIT

