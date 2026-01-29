# Build Process - Avianca Frontend Site

## Descripción

Este proyecto utiliza AEM Edge Delivery Service (EDS) con dropins de Adobe. Los archivos JavaScript compilados en `scripts/__dropins__/` deben estar commitidos en el repositorio para que funcionen correctamente en producción.

## Problema Resuelto

**Error en producción:**
```
Failed to load resource: the server responded with a status of 404
scripts/__dropins__/tools/preact.js
```

**Causa:** Los archivos de dropins no estaban siendo compilados y commitidos al repositorio, causando errores 404 en producción cuando AEM EDS intentaba cargarlos.

## Scripts de Build

### `npm run build`
Ejecuta el build completo del proyecto:
- Compila los archivos JSON de componentes
- Copia y procesa los dropins desde `node_modules/@dropins/` a `scripts/__dropins__/`
- Compila el CSS de Tailwind

### `npm run build:dropins`
Solo ejecuta el proceso de instalación de dropins:
- Ejecuta `build.mjs` para procesar operaciones GraphQL
- Ejecuta `postinstall.js` para copiar dropins y htm.js

### `npm run tw:build`
Compila el CSS de Tailwind (versión minificada para producción)

## Desarrollo Local

Para desarrollo local con hot-reload:

```bash
npm run dev
```

Este comando ejecuta en paralelo:
- `aem up` - Servidor de desarrollo de AEM
- `tw:watch` - Compilación de Tailwind en modo watch

## Build para Producción

Antes de hacer deploy o commit de cambios importantes:

```bash
# 1. Limpiar e instalar dependencias
npm install

# 2. Ejecutar build completo
npm run build

# 3. Verificar que los archivos se generaron
ls scripts/__dropins__/tools/preact.js

# 4. Commitear los cambios
git add .
git commit -m "build: update compiled dropins"
git push
```

## Archivos Importantes

- `scripts/__dropins__/` - Archivos compilados de dropins (DEBE estar en el repo)
- `scripts/htm.js` - Biblioteca HTM copiada desde node_modules
- `styles/tw.css` - CSS de Tailwind compilado
- `build.mjs` - Procesa operaciones GraphQL extendidas
- `postinstall.js` - Copia dropins de node_modules a scripts/

## Notas

- Los archivos en `scripts/__dropins__/` son generados automáticamente durante `npm install` (hook postinstall)
- **IMPORTANTE:** Estos archivos DEBEN estar commitidos en el repositorio para que funcionen en producción
- AEM Edge Delivery Service sirve los archivos directamente desde el repositorio GitHub
- Los archivos en `node_modules/` NO están disponibles en producción

## Troubleshooting

### Error: "Failed to load module for design-system-block"

**Solución:**
```bash
npm run build
git add scripts/__dropins__/
git commit -m "fix: update compiled dropins"
git push
```

### Error: "Cannot find module preact.js"

**Causa:** El archivo no está en el repositorio

**Solución:**
```bash
npm install
npm run build
git add scripts/__dropins__/tools/preact.js
git commit -m "fix: add preact.js to repository"
git push
```

### Los cambios locales funcionan pero producción falla

**Causa:** Los archivos compilados no fueron commitidos

**Solución:** Siempre ejecutar `npm run build` antes de hacer push y verificar que los archivos estén staged:
```bash
git status
# Debe mostrar archivos en scripts/__dropins__/ si hubo cambios
```
