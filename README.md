

# RAuth SDK

Official TypeScript SDK for integrating RAuth authentication in React and Next.js applications.

This is the official SDK library for RAuth, published as the npm package **`rauth`**. It provides framework-agnostic React components, hooks, and utilities that connect to the RAuth backend service (built in Go). Developers can install it with `npm i rauth` and use it similarly to Clerk’s SDK, enabling quick integration of OAuth login (Google, GitHub, traditional email/password, etc.) without managing credentials manually.

## Tech Stack

* **Language**: TypeScript 5.0+
* **Framework**: React 18+ (agnostic, optimized for Next.js 14+ SSR)
* **Build Tool**: Vite (fast dev server and bundling) or Rollup (production builds)
* **Testing**: Vitest with React Testing Library
* **Type Checking**: Strict TypeScript mode
* **Linting/Formatting**: ESLint + Prettier
* **Config**: Simple `tsconfig.json` and `vite.config.ts`
* **Dependencies**: Minimal — React, React-DOM (peer deps), JWT-decode for token handling

## Features

* 🔐 **OAuth Authentication** — Support for Google, GitHub, and Facebook
* ⚛️ **React Integration** — Hooks and components for seamless usage
* 🚀 **Next.js Compatible** — Full SSR support with App Router
* 🔄 **Auto Token Refresh** — Automatic session and token lifecycle management
* 📦 **Lightweight** — Very few dependencies
* 🎨 **Customizable** — Easy to style and configure
* 🔒 **Type Safe** — Complete TypeScript support

## Project Structure (Flat & Simple)

```
/
├── src/                 # All source code
│   ├── index.ts         # Main exports (components, hooks, types)
│   ├── components/      # React components (e.g., AuthComponent)
│   │   └── AuthComponent.tsx # Unified login, logout, and profile component
│   ├── hooks/           # Custom hooks (e.g., useAuth, useUser)
│   │   ├── useAuth.ts   # Authentication state hook
│   │   └── useSession.ts # Session management hook
│   ├── utils/           # Helper utilities
│   │   ├── api.ts       # Fetch wrappers (SSR-friendly)
│   │   ├── jwt.ts       # JWT utilities
│   │   └── types.ts     # Shared types/interfaces
│   ├── server/          # Server-side utilities (Next.js SSR/actions)
│   │   ├── actions.ts   # Server actions for auth (e.g., getSession)
│   │   └── middleware.ts # Optional SSR middleware
│   └── providers/       # Context providers
│       └── AuthProvider.tsx # Authentication context wrapper
├── test/                # Test files (mirrors src/)
│   ├── components/
│   │   └── AuthComponent.test.tsx
│   ├── hooks/
│   │   └── useAuth.test.ts
│   ├── utils/
│   │   └── api.test.ts
│   └── server/
│       └── actions.test.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .eslintrc.json
├── .prettierrc
├── README.md
└── docs/
    └── API.md           # Full API reference
```

## API Reference

See **[docs/API.md](./docs/API.md)** for complete API documentation.

## Examples

See the **[examples/](./examples/)** directory for fully working application examples.

## TypeScript

This SDK is written in TypeScript and includes type definitions out of the box.

```tsx
import type { User, Session, AuthState, RAuthConfig } from 'rauth';
```

## Development

### Setup

```bash
npm install
npm run build
# npm link # Optional, depending on your setup
```

### Scripts

* `npm run dev` — Start Vite development server
* `npm run build` — Build the library for production
* `npm run test` — Run tests using Vitest
* `npm run test:watch` — Run tests in watch mode
* `npm run typecheck` — Run TypeScript type checking
* `npm run preview` — Preview the production build

### Building

The SDK is built using Vite and generates:

* **ESM output:** `dist/index.mjs`
* **CommonJS output:** `dist/index.cjs`
* **TypeScript declarations:** `dist/index.d.ts`
* **Source maps:** included for debugging

## Contributing

Contributions are welcome! Please read the contribution guidelines before submitting PRs.

## License

MIT

