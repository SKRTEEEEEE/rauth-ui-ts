## Características Principales a Implementar

### 1. Componente de Autenticación Único
- `<AuthComponent provider="google" />`: Este componente único maneja el inicio de sesión, logout y visualización de perfil. Detecta automáticamente si el usuario ha iniciado sesión (usando hooks como `useAuth`), y se adapta basado en la configuración del SDK (por ejemplo, proveedores habilitados, URL base, etc.). 
  - Si no hay sesión: Muestra opciones de login OAuth (ej., botones para Google, GitHub), activando el flujo hacia el backend `/api/v1/oauth/authorize`.
  - Si hay sesión: Muestra un botón de perfil/menú (obtiene datos de `/api/v1/users/me`) con opción de logout (llama a `/api/v1/sessions/:id`).
  - Adaptación a configuración: Lee la configuración global del SDK (ej., proveedores disponibles, temas personalizados) para renderizar dinámicamente.

El componente es amigable con SSR: Usa `Suspense` para estados de carga, compatibles con componentes `async` de Next.js.

### 2. Hooks
- `useAuth()`: Devuelve { isAuthenticated, user, loading } – Usa contexto y almacenamiento local para hidratación SSR. Ayuda al componente único a detectar el estado de sesión.
- `useSession()`: Gestiona la actualización de JWT mediante el backend `/api/v1/sessions/refresh`.

Los hooks se centran en SSR: Hidratan desde cookies/headers en Next.js.

### 3. Utilidades del Lado del Servidor
- Acciones del servidor: `getSessionAction()` – Obtiene y valida la sesión del lado del servidor.
- Middleware: Middleware de autenticación opcional para rutas de Next.js.

### 4. Integración de API
- Todas las llamadas API usan `fetch` con la URL del backend desde env/config.
- Maneja JWT en headers: `Authorization: Bearer {token}`.
- Enfoque SSR: Usa `cookies()` en Next.js para gestión de tokens.

### 5. Tipos y Configuración
- Exporta tipos: `User`, `Session`, `Provider` (coinciden con modelos del backend).
- Configuración: `initRauth({ apiKey: string, baseUrl: string, providers: ['google', 'github'] })` – Establece configuración global, que el componente único usa para adaptar su comportamiento (ej., mostrar solo proveedores configurados).
