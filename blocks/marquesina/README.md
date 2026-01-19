# Marquesina Block - Documentación

## Descripción General

El **Marquesina Block** es un componente de alerta global que se muestra en la parte superior de la página, antes del header. Soporta diferentes variantes (informativo, advertencia, éxito, promocional), puede ser descartable, sticky al hacer scroll, y tiene modo marquesina automático para contenido largo.

## Arquitectura del Componente

### Componentes Involucrados

```
blocks/marquesina/marquesina.js (Block Decorator)
    ↓
design-system/organisms/marquesina/marquesina.js (Organism - Lógica de marquesina + sticky)
    ↓
design-system/atoms/alert/alert.js (Atom - UI base de la alerta)
```

### Tecnologías

- **Preact + HTM**: Componentes reactivos sin JSX
- **Tailwind CSS + CSS Variables**: Estilos híbridos
- **AEM Edge Delivery Services**: Sistema de bloques
- **Universal Editor**: Autoría de contenido

---

## Funcionamiento Exacto

### 1. Autoría en Universal Editor

El autor crea un bloque de tipo **"Marquesina"** en cualquier parte del documento (típicamente al inicio). El bloque genera una tabla HTML con esta estructura:

```html
<div class="marquesina block">
  <div>
    <div><p><!-- Contenido HTML del mensaje --></p></div>
  </div>
  <div>
    <div><p>success</p></div> <!-- Fila 1: variant -->
  </div>
  <div>
    <div><p>warning</p></div> <!-- Fila 2: icon -->
  </div>
  <div>
    <div><p>true</p></div> <!-- Fila 3: dismissible -->
  </div>
  <!-- Más filas para otras configuraciones -->
</div>
```

**⚠️ IMPORTANTE**: Universal Editor genera filas **sin encabezados** (sin keys), solo valores. El orden de las filas es fijo.

### 2. Orden de Filas en Universal Editor

| Fila | Campo                | Valores Posibles                                  | Valor por Defecto |
|------|----------------------|---------------------------------------------------|-------------------|
| 0    | Content              | HTML rico (texto, enlaces, formato)              | (requerido)       |
| 1    | Variant (Alert Type) | `informative`, `warning`, `success`, `promotional` | `informative`     |
| 2    | Icon                 | `auto`, `info`, `warning`, `success`, `promo`, `clock`, `plane`, `none` | `auto` |
| 3    | Show Dismiss Button  | `true`, `false`                                  | `true`            |
| 4    | Dismiss Strategy     | `session`, `permanent`, `none`                   | `session`         |
| 5    | Alert ID             | Cualquier string único                           | (auto-generado)   |
| 6    | Sticky Position      | `true`, `false`                                  | `true`            |
| 7    | Marquee Mode         | `auto`, `always`, `never`                        | `auto`            |
| 8    | Marquee Speed        | Número (píxeles por segundo)                     | `50`              |

### 3. Proceso de Renderizado

#### Paso 1: Detección de Entorno
```javascript
if (window.xwalk?.isAuthorEnv) {
  // Modo autor: no transformar, mantener editable
  return;
}
```

#### Paso 2: Lectura de Configuración
```javascript
const config = readBlockConfig(block); // Devuelve {} en Universal Editor

// Si config está vacío, leer por posición de fila
if (Object.keys(config).length === 0 && rows.length > 0) {
  contentHTML = rows[0].children[0].innerHTML;
  variant = rows[1]?.children[0]?.textContent?.trim().toLowerCase();
  icon = rows[2]?.children[0]?.textContent?.trim().toLowerCase();
  // ...etc
}
```

**Lógica clave**: 
- `readBlockConfig()` busca pares key-value en la tabla
- Si no hay keys (Universal Editor), devuelve `{}`
- En ese caso, leemos por **índice de fila**

#### Paso 3: Validación de Targeting
```javascript
if (!shouldShowMarquesina(config)) {
  block.remove(); // No cumple reglas de targeting
  return;
}
```

Verifica:
- Rango de fechas (`publishStart`, `publishEnd`)
- Mercados objetivo (`targetMarkets`: "CO,PA,EC")
- Idiomas objetivo (`targetLanguages`: "es,en")
- Tipos de página (`targetPageTypes`: "home,destinations")

#### Paso 4: Renderizado del Componente Preact
```javascript
const marquesinaWrapper = document.createElement('div');
marquesinaWrapper.className = 'marquesina-global-container';

render(
  html`<${Marquesina} variant=${variant} contentHTML=${contentHTML} ... />`,
  marquesinaWrapper
);
```

#### Paso 5: Inyección Global
```javascript
const header = document.querySelector('header');
if (header) {
  header.parentElement.insertBefore(marquesinaWrapper, header);
} else {
  document.body.insertBefore(marquesinaWrapper, document.body.firstChild);
}

block.remove(); // Eliminar bloque original
```

**Resultado**: El marquesina se muestra **antes del `<header>`**, en la parte superior de la página, sin importar dónde esté el bloque en el documento.

---

## ¿Se Necesita la Sección `.marquesina-container`?

### Respuesta: **NO** ❌

La implementación actual **NO requiere** una sección con clase `.marquesina-container`. 

### Razones

1. **Inyección Directa**: El bloque busca el `<header>` (que siempre existe) y se inyecta antes de él
2. **Independencia**: No depende de que otro componente cree un contenedor específico
3. **Simplicidad**: Evita problemas de orden de carga entre bloques

### Historia del Diseño

Inicialmente se consideró usar un contenedor creado por el header:

```javascript
// ❌ Approach anterior (descartado)
const globalContainer = document.querySelector('.marquesina-container');
globalContainer.appendChild(marquesinaWrapper);
```

**Problemas**:
- El header se carga en fase `loadLazy()`, después del marquesina
- Requiere polling/espera asíncrona con `waitForMarquesinaContainer()`
- Dependencia innecesaria entre bloques

**Solución actual**:
```javascript
// ✅ Approach actual (funcional)
const header = document.querySelector('header');
header.parentElement.insertBefore(marquesinaWrapper, header);
```

**Ventajas**:
- Sincrónico, no requiere espera
- `<header>` siempre existe en el DOM
- Independiente de otros bloques

---

## Flujo Completo de Carga

### Ciclo de Vida AEM EDS

```
1. loadEager() [scripts/scripts.js]
   ├─ decorateMain(main)
   │  ├─ decorateBlocks(main)
   │  │  └─ marquesina/marquesina.js:decorate(block) ← EJECUTA AQUÍ
   │  └─ loadSection() [primera sección]
   │
2. loadLazy()
   ├─ loadSections() [resto de secciones]
   ├─ loadHeader() ← El header se carga DESPUÉS
   └─ loadFooter()
   
3. loadDelayed() [3 segundos después]
```

### Timing

| Evento                      | Timing     | Estado del Marquesina                              |
|-----------------------------|------------|---------------------------------------------------|
| `marquesina.js:decorate()`  | ~50ms      | Lee config, renderiza componente                  |
| `<header>` disponible       | ~100ms     | Inyecta marquesina antes del header               |
| `loadHeader()`              | ~200ms     | Header se decora, marquesina ya está visible      |
| Usuario ve página           | ~300ms     | Marquesina sticky + animación marquee activas     |

---

## Variantes y Comportamiento

### Variantes Visuales

| Variant       | Color de Fondo          | Ícono por Defecto | Caso de Uso                          |
|---------------|-------------------------|-------------------|--------------------------------------|
| `informative` | `var(--bg-informative)` | Info (ℹ️)         | Información general, anuncios        |
| `warning`     | `var(--bg-warning)`     | Warning (⚠️)      | Advertencias, alertas importantes    |
| `success`     | `var(--bg-success)`     | Success (✓)       | Confirmaciones, mensajes positivos   |
| `promotional` | `var(--bg-promotional)` | Promo (🎁)        | Promociones, ofertas especiales      |

### Comportamiento Sticky

```javascript
isSticky={true} // Default
```

- **true**: Se fija al top al hacer scroll, siempre visible
- **false**: Desaparece al hacer scroll hacia abajo

### Modo Marquesina

```javascript
marqueeMode="auto" // Default
marqueeSpeed={50}  // px/segundo
```

| Modo     | Comportamiento                                           |
|----------|----------------------------------------------------------|
| `auto`   | Activa marquee solo si el contenido desborda el ancho   |
| `always` | Siempre anima, incluso si el contenido cabe             |
| `never`  | Nunca anima, muestra scroll horizontal si es necesario  |

### Persistencia de Descarte

```javascript
dismissStrategy="session" // Default
```

| Estrategia  | Comportamiento                                                  |
|-------------|-----------------------------------------------------------------|
| `session`   | Se oculta hasta cerrar pestaña (sessionStorage)                |
| `permanent` | Se oculta para siempre en este navegador (localStorage)        |
| `none`      | Se oculta solo visualmente, reaparece al refrescar             |

---

## Reglas de Targeting

### Fechas de Publicación

```javascript
publishStart: "2025-12-01T00:00:00"
publishEnd: "2025-12-31T23:59:59"
```

El marquesina solo se muestra dentro de este rango de fechas.

### Mercados (Markets)

```javascript
targetMarkets: "CO,PA,EC" // Colombia, Panamá, Ecuador
```

Compara con `window.aviancaMarket` (default: "CO").

### Idiomas

```javascript
targetLanguages: "es,en"
```

Compara con `document.documentElement.lang`.

### Tipos de Página

```javascript
targetPageTypes: "home,destinations"
```

Compara con `document.body.dataset.pageType`.

---

## Imports y Dependencias

### Preact (Rutas Relativas)

```javascript
// ✅ CORRECTO - Rutas relativas a scripts/__dropins__/
import { h, render } from '../../scripts/__dropins__/tools/preact.js';
import { useState } from '../../scripts/__dropins__/tools/preact-hooks.js';
import htm from '../../scripts/htm.js';

// ❌ INCORRECTO - Aliases no funcionan en bloques
import { h } from '@dropins/tools/preact.js';
```

**Razón**: AEM EDS sirve archivos directamente desde GitHub. Los aliases `@dropins/*` solo funcionan en Node.js, no en el navegador.

### Componentes del Design System

```javascript
import { Marquesina } from '../../design-system/organisms/marquesina/marquesina.js';
// Marquesina importa Alert:
// import { Alert } from '../../atoms/alert/alert.js';
```

---

## Solución de Problemas

### Marquesina no se muestra

**Checklist**:
1. ✅ ¿El bloque existe en el documento?
2. ✅ ¿Pasa las reglas de targeting? (fechas, mercado, idioma)
3. ✅ ¿`<header>` existe en el DOM?
4. ✅ ¿Consola muestra errores de Preact imports?

**Debugging**:
```javascript
// Descomentar en blocks/marquesina/marquesina.js
console.log('🔍 Config:', config);
console.log('🔍 Content:', contentHTML);
console.log('🔍 Header exists:', !!document.querySelector('header'));
```

### Muestra variante incorrecta

**Causa común**: Valor en fila 1 no coincide con opciones válidas.

**Solución**:
```javascript
// Valores válidos (case-insensitive):
'informative', 'warning', 'success', 'promotional'
```

### No persiste el descarte

**Causa**: `alertId` no único o `dismissStrategy` no configurado.

**Solución**:
- Asegurar que cada marquesina tenga un `alertId` único
- Verificar que `dismissStrategy` sea `"session"` o `"permanent"`

### Contenido vacío

**Causa**: Fila 0 no tiene contenido HTML.

**Solución**: En Universal Editor, el primer campo "Alert Content" debe tener texto.

---

## Testing en Local

### Flujo de Pruebas

1. **Levantar servidor**:
   ```bash
   npm run dev
   # Abre http://localhost:3000/co/es/
   ```

2. **Crear página de prueba** en Universal Editor con bloque Marquesina

3. **Verificar renderizado**:
   - ✅ Aparece antes del header
   - ✅ Colores correctos según variant
   - ✅ Botón X funciona y persiste
   - ✅ Sticky al hacer scroll
   - ✅ Marquee activa para contenido largo

4. **Probar targeting**:
   - Cambiar fechas en modelo
   - Cambiar `window.aviancaMarket` en consola
   - Refrescar y verificar visibilidad

---

## Próximos Pasos / Mejoras Futuras

### Posibles Extensiones

1. **Múltiples Marquesinas**: Soportar varios bloques simultáneos (stack vertical)
2. **Animaciones de Entrada**: Slide-down al aparecer
3. **A/B Testing**: Integración con sistema de experimentos
4. **Analytics**: Tracking de vistas, descartes, clicks en enlaces
5. **Responsive Icons**: Diferentes íconos para mobile/desktop
6. **RTL Support**: Soporte para idiomas de derecha a izquierda

### Optimizaciones

- **Lazy Load**: Cargar Preact components solo si marquesina pasa targeting
- **Service Worker**: Cache de configuraciones de marquesina
- **Prefetch**: Pre-cargar marquesinas programadas para días futuros

---

## Resumen Ejecutivo

### ✅ Requiere

- Bloque "Marquesina" en documento AEM
- Elemento `<header>` en el HTML (siempre presente)
- Configuración en filas según orden especificado

### ❌ NO Requiere

- Sección `.marquesina-container` en el HTML
- Modificaciones en `blocks/header/header.js`
- Configuración adicional en `scripts/scripts.js`
- Dependencias externas adicionales

### 🎯 Resultado

Un componente de alerta global, autónomo, que:
- Se posiciona antes del header
- Lee configuración de Universal Editor por índice de fila
- Soporta targeting avanzado
- Funciona en mobile y desktop
- Es descartable con persistencia configurable
- Tiene modo marquesina automático

---

## Contacto y Soporte

Para dudas o issues:
- **Desarrollador Original**: (Tu nombre/equipo)
- **Documentación Componentes**: `/design-system/README.md`
- **Guía AEM EDS**: `BUILD.md`

**Última Actualización**: 11 de diciembre, 2025
**Versión**: 1.0.0
