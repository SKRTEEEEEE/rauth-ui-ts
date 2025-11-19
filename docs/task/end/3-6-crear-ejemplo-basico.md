# feat(examples): Crear Ejemplo Básico React. Closes #3

## 📋 Resumen de Cambios

Este PR implementa un ejemplo completo de React que demuestra el uso del SDK de RAuth, incluyendo infraestructura de testing exhaustiva y soporte completo para Docker. Este cambio completa el **Milestone 3: Componentes Core - UI Básica** del SDK.

## ✨ Características Implementadas

### 1. Ejemplo Básico React (`examples/basic-react/`)

Se ha creado una aplicación completa de ejemplo que demuestra:

- **Inicialización del SDK**: Uso correcto de `initRauth()` con configuración
- **Setup de AuthProvider**: Envolviendo la aplicación con contexto de autenticación
- **Variaciones de AuthComponent**:
  - Modo default (usa todos los providers configurados)
  - Modo de provider único
  - Múltiples providers específicos
  - Customización con props (texto, callbacks, estilos)

**Archivos principales:**
- `src/App.tsx`: Aplicación de ejemplo con 4 secciones demostrativas
- `src/App.css`: Estilos pulidos con diseño responsive
- `src/main.tsx`: Entry point de React 18+ con StrictMode
- `package.json`: Configurado con dependencia local del SDK (`file:../../`)
- `README.md`: Documentación completa con guías de uso

### 2. Testing Comprehensivo

Se añadieron **26 nuevos tests** en dos archivos:

**`test/examples/basic-react.integration.test.tsx`** (13 tests):
- Validación de configuración del SDK
- Integración con AuthProvider
- Renderizado de AuthComponent en diferentes modos
- Estructura de la aplicación de ejemplo
- Integración de TypeScript
- Manejo de errores

**`test/examples/basic-react.validation.test.ts`** (13 tests):
- Validación de estructura de configuración
- Validación de nombres de providers
- Validación de formatos de URL y API keys
- Verificación de exports del SDK
- Validación de exports de tipos
- Best practices de React y TypeScript
- Patterns seguros para SSR
- Elementos de documentación requeridos
- Scripts de desarrollo disponibles

**Cobertura de tests:**
- ✅ SDK initialization y configuración
- ✅ Integración AuthProvider/AuthComponent
- ✅ Renderizado en diferentes modos
- ✅ TypeScript type safety
- ✅ Error handling
- ✅ Best practices validation

### 3. Soporte Docker Completo

**Dockerfile multi-stage** (`examples/basic-react/Dockerfile`):
- Stage 1: Builder - Compila el SDK
- Stage 2: Example Builder - Compila la aplicación de ejemplo
- Stage 3: Production - Sirve con nginx
- Optimizado para mínimo tamaño de imagen
- Health checks incluidos

**Configuración nginx** (`nginx.conf`):
- Compresión gzip
- Headers de seguridad
- Caching agresivo para assets estáticos
- Endpoint de health check
- Fallback a index.html para SPA routing

**Docker Compose** (`docker-compose.yml`):
- Servicio configurado para el ejemplo
- Puerto 5173 mapeado
- Health checks automáticos
- Red dedicada rauth-network
- Restart policy configurado

### 4. Documentación

**README principal actualizado:**
- Nueva sección "Examples" con quick start
- Enlaces al ejemplo básico
- Instrucciones de ejecución

**README del ejemplo** (`examples/basic-react/README.md`):
- Guía de Quick Start
- Instrucciones de configuración
- Ejemplos de código para cada patrón
- Features demostradas
- Estructura del proyecto
- Workflow de desarrollo
- Troubleshooting
- Enlaces a documentación principal

**Archivos de configuración:**
- `.env.example`: Template para variables de entorno
- `.gitignore`: Ignores estándar para Node.js/Vite
- `.dockerignore`: Optimización del contexto de build

## 🔧 Cambios Técnicos

### Archivos Modificados:
- `README.md`: +15 líneas - Añadida sección de Examples
- `src/components/AuthComponent.tsx`: Actualización menor de documentación

### Archivos Nuevos:
- `examples/basic-react/*`: 18 archivos (aplicación completa)
- `test/examples/*`: 2 archivos de tests
- `docker-compose.yml`: Orquestación de servicios
- `commit-message.txt`: Mensaje de commit preparado

### Dependencias:
- El ejemplo usa `"rauth": "file:../../"` para desarrollo local
- Compatible con React 18.3.1
- Vite 7.2.2 como bundler
- TypeScript 5.9.3 en modo strict

## 🎯 Propósito del Ejemplo

El ejemplo sirve tres objetivos clave:

1. **Testing Manual**: Probar el SDK durante desarrollo sin publicar a npm
2. **Documentación Viva**: Mostrar uso real del SDK con código ejecutable
3. **Referencia**: Punto de partida para usuarios que implementan RAuth

## 🚀 Cómo Usar

### Desarrollo Local:
```bash
cd examples/basic-react
npm install
npm run dev
# Abre http://localhost:5173
```

### Con Docker:
```bash
docker-compose up -d
# Abre http://localhost:5173
```

### Para Usuarios:
Los usuarios pueden copiar el directorio `examples/basic-react` como base para su
propia implementación, modificando la configuración según sus necesidades.

## ✅ Validación

### Tests:
```bash
npm test
# 26 nuevos tests pasando
# 306 tests totales en el SDK
```

### Type Checking:
```bash
npm run typecheck
# ✅ Sin errores de TypeScript
```

### Build:
```bash
npm run build
# ✅ SDK compila correctamente
cd examples/basic-react && npm run build
# ✅ Ejemplo compila correctamente
```

## 📊 Métricas

- **Archivos creados**: 20+
- **Líneas de código**: ~800 (ejemplo + tests)
- **Tests añadidos**: 26
- **Cobertura de features**: 100% de funcionalidades core demostradas
- **Documentación**: 3 README actualizados/creados

## 🎉 Milestone 3 Completado

Con este PR se completa el **Milestone 3: Componentes Core - UI Básica**:

- ✅ Sistema de tipos TypeScript definido
- ✅ AuthProvider con Context API implementado
- ✅ Hook useAuth funcional
- ✅ Sistema de configuración (initRauth) robusto
- ✅ AuthComponent adaptativo implementado
- ✅ **Ejemplo básico React creado** ← Este PR

### Criterios de Éxito del Milestone:
- ✅ Ejecutar `npm run build` en raíz (SDK compila)
- ✅ Ejecutar `npm run dev` en examples/basic-react
- ✅ Ver AuthComponent renderizado con botones de providers
- ✅ Ver que estado de loading funciona
- ✅ Ver que TypeScript funciona sin errores

## 🔜 Próximos Pasos

**Milestone 4: Integración API - Flujo OAuth**
- Implementar flujo completo OAuth
- Conectar con backend RAuth
- Manejo de callbacks y redirects
- Refresh token automation
- Error handling robusto

## 📝 Notas Adicionales

### Para Revisores:
- El ejemplo usa API keys placeholder (ej: `'example-api-key-12345'`)
- Todos los valores sensibles están claramente marcados como "EXAMPLE ONLY"
- Tests usan mocking completo, sin llamadas API reales
- Docker build probado localmente
- Compatible con Windows, Linux y macOS

### Seguridad:
- No hay secrets reales en el código
- Todos los API keys son valores de ejemplo
- `.env.example` provee template seguro
- `.gitignore` configurado para prevenir commits de `.env`

### Deployment:
- Ejemplo listo para producción con Docker
- Nginx configurado con best practices
- Health checks funcionando
- Logs configurados correctamente

---

**Estado**: ✅ Listo para merge
**Testing**: ✅ Todos los tests pasando
**Documentación**: ✅ Completa
**Docker**: ✅ Funcionando

**Cierra**: #3 - Crear Ejemplo Básico React
**Milestone**: Milestone 3 - Componentes Core ✅ COMPLETADO
