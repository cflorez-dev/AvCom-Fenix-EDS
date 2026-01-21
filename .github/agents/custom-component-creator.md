# Component Creator Chatmode
 
Este chatmode te ayuda a crear componentes del design system de Avianca siguiendo los patrones establecidos y las mejores prácticas del proyecto.
 
## Principios Fundamentales
 
### 1. Atomic Design
- **Átomos**: Componentes básicos e indivisibles (botones, inputs, labels, etc.)
- **Moléculas**: Combinaciones simples de átomos (formularios, cards simples, dropdowns, modals básicos)
- **Organismos**: Componentes complejos que combinan moléculas y/o átomos (headers, footers, modales complejos)
 
**Regla importante**: Si un componente solo es la estructura básica (ventana, contenedor) y renderiza `children`, debe ser una **molécula**. Si incluye contenido complejo o múltiples secciones, debe ser un **organismo**.
 
### 2. Tecnología Stack
- **Framework**: Preact (usando `@dropins/tools/preact.js`)
- **Hooks**: Preact Hooks (usando `@dropins/tools/preact-hooks.js`)
- **Template**: htm (usando `htm.bind(h)`)
- **Estilos**: **Tailwind CSS al máximo posible** + Variables CSS del sistema de diseño (NO archivos CSS separados)
  - Usar clases de Tailwind para layout, spacing, tipografía, etc.
  - Usar variables CSS de `styles/variables/` para colores y espaciado específicos del design system
  - Estilos inline solo para valores dinámicos específicos (colores de variantes, sombras personalizadas, etc.)
 
### 3. Estructura de Archivos
 
Para cada componente nuevo, crear:
 
```
design-system/{tipo}/{nombre-componente}/
  ├── {nombre-componente}.js          # Componente principal
  └── {nombre-componente}.sample.js   # Ejemplos de uso
```
 
Donde `{tipo}` puede ser:
- `atoms/` - Componentes básicos
- `molecules/` - Componentes compuestos simples
- `organisms/` - Componentes complejos
 
## Patrón de Componente Base
 
### Estructura del archivo principal
 
```javascript
import { h } from '@dropins/tools/preact.js';
import { useState, useRef, useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
 
const html = htm.bind(h);
 
/**
* ComponentName - Descripción del componente
*
* ## Props
* - `variant`: `"default" | "primary"` – Variante visual (por defecto: `"default"`).
* - `customClassName`: Clases CSS adicionales.
* - `children`: Contenido que se renderiza (puede ser cualquier componente o HTML).
* - `...rest`: Otras propiedades válidas.
*/
export const ComponentName = ({
  variant = 'default',
  customClassName = '',
  children,
  ...rest
}) => {
  // Estados y hooks
  const [state, setState] = useState(initialValue);
  const componentRef = useRef(null);
 
  // Efectos
  useEffect(() => {
    // Lógica de efectos
    return () => {
      // Cleanup
    };
  }, [dependencies]);
 
  // Handlers
  const handleAction = (e) => {
    e.preventDefault();
    // Lógica del handler
  };
 
  // Base classes usando Tailwind (layout, spacing, tipografía básica)
  const baseClasses = 'inline-flex items-center box-border '
    + 'px-[var(--spacing-x-small)] py-[var(--spacing-tiny)] '
    + 'rounded-[var(--border-radius-large)]';
 
  // Clases específicas por variante (usando Tailwind)
  const variantClasses = {
    default: 'justify-start gap-[var(--spacing-tiny)]',
    primary: 'justify-center gap-[var(--spacing-small)]',
  };
 
  // Estilos inline solo para valores dinámicos específicos (colores, sombras personalizadas)
  const variantStyles = {
    default: {
      backgroundColor: 'var(--bg-page-light)',
      color: 'var(--text-normal-primary)',
    },
    primary: {
      backgroundColor: 'var(--brand-primary)',
      color: 'var(--text-normal-lighter)',
      boxShadow: '0px 0px 6px rgba(90, 90, 90, 0.2)',
    },
  };
 
  const currentVariant = variantStyles[variant];
  const currentVariantClasses = variantClasses[variant];
  const finalClasses = `${baseClasses} ${currentVariantClasses} ${customClassName}`.trim();
 
  return html`
    <div
      class=${finalClasses}
      data-name="componentName"
      data-variant=${variant}
      style=${currentVariant}
      ...${rest}
    >
      ${children}
    </div>
  `;
};
 
export default ComponentName;
```
 
## Variables CSS Disponibles
 
### Colores (`styles/variables/colors.css`)
- `--text-normal-primary`, `--text-normal-secondary`, `--text-normal-lighter`, `--text-normal-light`
- `--text-link-default`, `--text-link-hover`
- `--bg-brand-primary-lighter`, `--bg-brand-secondary-default`
- `--bg-page-light`, `--bg-page-lighter`
- `--border-stroke-default`
- `--modal-overlay-bg`
- `--dropdown-item-hover-bg`, `--dropdown-link-hover`
 
### Tipografía (`styles/variables/typography.css`)
- `--heading-h300-*`, `--heading-h400-*`, `--heading-h500-*`, `--heading-h600-*`, `--heading-h800-*`
  - `family`, `weight`, `size`, `line-height`, `letter-spacing`
- `--paragraph-p100-*`, `--paragraph-p200-*`, `--paragraph-p300-*`, `--paragraph-p400-*`
- `--button-b100-*`, `--button-b200-*`
- `--link-l150-*`, `--link-l200-*`
 
### Espaciado (`styles/variables/spacing.css`)
- `--spacing-tiny` (4px), `--spacing-x-small` (8px), `--spacing-small` (12px)
- `--spacing-medium` (16px), `--spacing-large` (20px), `--spacing-x-large` (24px)
- `--spacing-x-x-large` (32px), `--spacing-huge` (32px), `--spacing-x-huge` (48px)
- `--border-radius-small` (4px), `--border-radius-large` (16px), `--border-radius-x-large` (32px)
- `--height-32`, `--height-48`, `--height-52`, `--height-64`
 
### Transiciones (`styles/variables/transitions.css`)
- `--transition-fast` (0.15s), `--transition-normal` (0.2s), `--transition-slow` (0.3s)
- `--transition-all`, `--transition-colors`, `--transition-transform`, `--transition-opacity`
- `--ease-in-out`, `--ease-in`, `--ease-out`
 
### Sombras (`styles/variables/shadows.css`)
- `--shadow-small`, `--shadow-medium`
 
## Reglas de Estilos
 
### ✅ HACER
1. **Usar Tailwind CSS al máximo posible** para layout, spacing, tipografía, etc.
   - Ejemplo: `inline-flex items-center gap-[var(--spacing-tiny)]`
   - Usar clases de Tailwind para propiedades comunes (display, flex, padding, margin, etc.)
2. **Usar variables CSS de `styles/variables/`** para valores del design system:
   - Colores: `var(--text-normal-primary)`, `var(--brand-primary)`, etc.
   - Espaciado: `var(--spacing-tiny)`, `var(--spacing-x-small)`, etc.
   - Tipografía: `var(--font-size-tiny)`, `var(--font-weight-bold)`, etc.
   - Border radius: `var(--border-radius-large)`, etc.
3. **Estilos inline solo para valores dinámicos específicos**:
   - Colores de variantes que no están en variables CSS
   - Sombras personalizadas específicas del componente
   - Valores calculados dinámicamente
4. **Usar prefijo `!` en Tailwind** cuando necesites sobrescribir estilos globales:
   - Ejemplo: `!m-0` para eliminar márgenes cuando hay estilos globales
5. **Usar camelCase** para propiedades de estilo en objetos JavaScript (ej: `fontSize`, `lineHeight`)
6. **Documentar props** con JSDoc
7. **Incluir `data-name`** para identificación del componente
8. **Soportar `customClassName`** y `...rest` props
9. **Agregar nuevas variables** en `styles/variables/` si no existen y son parte del design system
 
### ❌ NO HACER
1. **NO crear archivos CSS separados** para componentes
2. **NO usar valores hardcodeados** (colores, tamaños, etc.) - usar variables CSS o Tailwind
3. **NO usar solo estilos inline** - preferir Tailwind cuando sea posible
4. **NO usar ternarios anidados** (usar if/else para evitar errores de linting)
5. **NO usar comillas dobles** en strings (usar comillas simples)
6. **NO crear variables CSS nuevas** para valores que Tailwind puede manejar (ej: `display: flex` → usar `flex` de Tailwind)
 
## Patrones Específicos
 
### Componentes con Estado
```javascript
const [isOpen, setIsOpen] = useState(false);
const [hoveredIndex, setHoveredIndex] = useState(null);
```
 
### Componentes con Referencias
```javascript
const componentRef = useRef(null);
 
// En el JSX
<div ref=${componentRef} ...>
```
 
### Manejo de Eventos
```javascript
const handleClick = (e) => {
  e.preventDefault();
  e.stopPropagation();
  // Lógica
};
 
// En el JSX
<button onClick=${handleClick} ...>
```
 
### Renderizado Condicional
```javascript
${isOpen && html`
  <div>Contenido</div>
`}
```
 
### Mapeo de Arrays
```javascript
${items.map((item, index) => html`
  <div key=${index}>
    ${item}
  </div>
`)}
```
 
### Estilos Dinámicos con Tailwind y Variables CSS
```javascript
// Para estilos que cambian según condición, combinar Tailwind con estilos inline
const getVariantClasses = (variant) => {
  const base = 'inline-flex items-center px-[var(--spacing-x-small)]';
  if (variant === 'primary') {
    return `${base} justify-center`;
  }
  return `${base} justify-start`;
};
 
const getVariantStyles = (variant) => {
  if (variant === 'primary') {
    return {
      backgroundColor: 'var(--brand-primary)',
      color: 'var(--text-normal-lighter)',
    };
  }
  return {
    backgroundColor: 'var(--bg-page-light)',
    color: 'var(--text-normal-primary)',
  };
};
 
// En el JSX
<div class=${getVariantClasses(variant)} style=${getVariantStyles(variant)}>
```
 
## Crear Archivo Sample
 
Cada componente debe tener un archivo `.sample.js` con ejemplos de uso:
 
```javascript
import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { ComponentName } from './component-name.js';
 
const html = htm.bind(h);
 
export const ComponentNameSample = () => {
  const [state, setState] = useState(initialValue);
 
  return html`
    <div style=${{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Component Name Examples</h1>
      
      <section style=${{ marginBottom: 'var(--spacing-x-large)' }}>
        <h2>Ejemplo 1: Uso Básico</h2>
        <${ComponentName}
          prop1="value1"
          prop2="value2"
        >
          Contenido
        </${ComponentName}>
      </section>
    </div>
  `;
};
 
export default ComponentNameSample;
```
 
## Integración con Design System Block
 
Después de crear el componente, agregarlo a `blocks/design-system-block/ds-arquitecture/{tipo}.samples.js`:
# Component Creator Chatmode
 
Este chatmode te ayuda a crear componentes del design system de Avianca siguiendo los patrones establecidos y las mejores prácticas del proyecto.
 
## Principios Fundamentales
 
### 1. Atomic Design
- **Átomos**: Componentes básicos e indivisibles (botones, inputs, labels, etc.)
- **Moléculas**: Combinaciones simples de átomos (formularios, cards simples, dropdowns, modals básicos)
- **Organismos**: Componentes complejos que combinan moléculas y/o átomos (headers, footers, modales complejos)
 
**Regla importante**: Si un componente solo es la estructura básica (ventana, contenedor) y renderiza `children`, debe ser una **molécula**. Si incluye contenido complejo o múltiples secciones, debe ser un **organismo**.
 
### 2. Tecnología Stack
- **Framework**: Preact (usando `@dropins/tools/preact.js`)
- **Hooks**: Preact Hooks (usando `@dropins/tools/preact-hooks.js`)
- **Template**: htm (usando `htm.bind(h)`)
- **Estilos**: **Tailwind CSS al máximo posible** + Variables CSS del sistema de diseño (NO archivos CSS separados)
  - Usar clases de Tailwind para layout, spacing, tipografía, etc.
  - Usar variables CSS de `styles/variables/` para colores y espaciado específicos del design system
  - Estilos inline solo para valores dinámicos específicos (colores de variantes, sombras personalizadas, etc.)
 
### 3. Estructura de Archivos
 
Para cada componente nuevo, crear:
 
```
design-system/{tipo}/{nombre-componente}/
  ├── {nombre-componente}.js          # Componente principal
  └── {nombre-componente}.sample.js   # Ejemplos de uso
```
 
Donde `{tipo}` puede ser:
- `atoms/` - Componentes básicos
- `molecules/` - Componentes compuestos simples
- `organisms/` - Componentes complejos
 
## Patrón de Componente Base
 
### Estructura del archivo principal
 
```javascript
import { h } from '@dropins/tools/preact.js';
import { useState, useRef, useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
 
const html = htm.bind(h);
 
/**
* ComponentName - Descripción del componente
*
* ## Props
* - `variant`: `"default" | "primary"` – Variante visual (por defecto: `"default"`).
* - `customClassName`: Clases CSS adicionales.
* - `children`: Contenido que se renderiza (puede ser cualquier componente o HTML).
* - `...rest`: Otras propiedades válidas.
*/
export const ComponentName = ({
  variant = 'default',
  customClassName = '',
  children,
  ...rest
}) => {
  // Estados y hooks
  const [state, setState] = useState(initialValue);
  const componentRef = useRef(null);
 
  // Efectos
  useEffect(() => {
    // Lógica de efectos
    return () => {
      // Cleanup
    };
  }, [dependencies]);
 
  // Handlers
  const handleAction = (e) => {
    e.preventDefault();
    // Lógica del handler
  };
 
  // Base classes usando Tailwind (layout, spacing, tipografía básica)
  const baseClasses = 'inline-flex items-center box-border '
    + 'px-[var(--spacing-x-small)] py-[var(--spacing-tiny)] '
    + 'rounded-[var(--border-radius-large)]';
 
  // Clases específicas por variante (usando Tailwind)
  const variantClasses = {
    default: 'justify-start gap-[var(--spacing-tiny)]',
    primary: 'justify-center gap-[var(--spacing-small)]',
  };
 
  // Estilos inline solo para valores dinámicos específicos (colores, sombras personalizadas)
  const variantStyles = {
    default: {
      backgroundColor: 'var(--bg-page-light)',
      color: 'var(--text-normal-primary)',
    },
    primary: {
      backgroundColor: 'var(--brand-primary)',
      color: 'var(--text-normal-lighter)',
      boxShadow: '0px 0px 6px rgba(90, 90, 90, 0.2)',
    },
  };
 
  const currentVariant = variantStyles[variant];
  const currentVariantClasses = variantClasses[variant];
  const finalClasses = `${baseClasses} ${currentVariantClasses} ${customClassName}`.trim();
 
  return html`
    <div
      class=${finalClasses}
      data-name="componentName"
      data-variant=${variant}
      style=${currentVariant}
      ...${rest}
    >
      ${children}
    </div>
  `;
};
 
export default ComponentName;
```
 
## Variables CSS Disponibles
 
### Colores (`styles/variables/colors.css`)
- `--text-normal-primary`, `--text-normal-secondary`, `--text-normal-lighter`, `--text-normal-light`
- `--text-link-default`, `--text-link-hover`
- `--bg-brand-primary-lighter`, `--bg-brand-secondary-default`
- `--bg-page-light`, `--bg-page-lighter`
- `--border-stroke-default`
- `--modal-overlay-bg`
- `--dropdown-item-hover-bg`, `--dropdown-link-hover`
 
### Tipografía (`styles/variables/typography.css`)
- `--heading-h300-*`, `--heading-h400-*`, `--heading-h500-*`, `--heading-h600-*`, `--heading-h800-*`
  - `family`, `weight`, `size`, `line-height`, `letter-spacing`
- `--paragraph-p100-*`, `--paragraph-p200-*`, `--paragraph-p300-*`, `--paragraph-p400-*`
- `--button-b100-*`, `--button-b200-*`
- `--link-l150-*`, `--link-l200-*`
 
### Espaciado (`styles/variables/spacing.css`)
- `--spacing-tiny` (4px), `--spacing-x-small` (8px), `--spacing-small` (12px)
- `--spacing-medium` (16px), `--spacing-large` (20px), `--spacing-x-large` (24px)
- `--spacing-x-x-large` (32px), `--spacing-huge` (32px), `--spacing-x-huge` (48px)
- `--border-radius-small` (4px), `--border-radius-large` (16px), `--border-radius-x-large` (32px)
- `--height-32`, `--height-48`, `--height-52`, `--height-64`
 
### Transiciones (`styles/variables/transitions.css`)
- `--transition-fast` (0.15s), `--transition-normal` (0.2s), `--transition-slow` (0.3s)
- `--transition-all`, `--transition-colors`, `--transition-transform`, `--transition-opacity`
- `--ease-in-out`, `--ease-in`, `--ease-out`
 
### Sombras (`styles/variables/shadows.css`)
- `--shadow-small`, `--shadow-medium`
 
## Reglas de Estilos
 
### ✅ HACER
1. **Usar Tailwind CSS al máximo posible** para layout, spacing, tipografía, etc.
   - Ejemplo: `inline-flex items-center gap-[var(--spacing-tiny)]`
   - Usar clases de Tailwind para propiedades comunes (display, flex, padding, margin, etc.)
2. **Usar variables CSS de `styles/variables/`** para valores del design system:
   - Colores: `var(--text-normal-primary)`, `var(--brand-primary)`, etc.
   - Espaciado: `var(--spacing-tiny)`, `var(--spacing-x-small)`, etc.
   - Tipografía: `var(--font-size-tiny)`, `var(--font-weight-bold)`, etc.
   - Border radius: `var(--border-radius-large)`, etc.
3. **Estilos inline solo para valores dinámicos específicos**:
   - Colores de variantes que no están en variables CSS
   - Sombras personalizadas específicas del componente
   - Valores calculados dinámicamente
4. **Usar prefijo `!` en Tailwind** cuando necesites sobrescribir estilos globales:
   - Ejemplo: `!m-0` para eliminar márgenes cuando hay estilos globales
5. **Usar camelCase** para propiedades de estilo en objetos JavaScript (ej: `fontSize`, `lineHeight`)
6. **Documentar props** con JSDoc
7. **Incluir `data-name`** para identificación del componente
8. **Soportar `customClassName`** y `...rest` props
9. **Agregar nuevas variables** en `styles/variables/` si no existen y son parte del design system
 
### ❌ NO HACER
1. **NO crear archivos CSS separados** para componentes
2. **NO usar valores hardcodeados** (colores, tamaños, etc.) - usar variables CSS o Tailwind
3. **NO usar solo estilos inline** - preferir Tailwind cuando sea posible
4. **NO usar ternarios anidados** (usar if/else para evitar errores de linting)
5. **NO usar comillas dobles** en strings (usar comillas simples)
6. **NO crear variables CSS nuevas** para valores que Tailwind puede manejar (ej: `display: flex` → usar `flex` de Tailwind)
 
## Patrones Específicos
 
### Componentes con Estado
```javascript
const [isOpen, setIsOpen] = useState(false);
const [hoveredIndex, setHoveredIndex] = useState(null);
```
 
### Componentes con Referencias
```javascript
const componentRef = useRef(null);
 
// En el JSX
<div ref=${componentRef} ...>
```
 
### Manejo de Eventos
```javascript
const handleClick = (e) => {
  e.preventDefault();
  e.stopPropagation();
  // Lógica
};
 
// En el JSX
<button onClick=${handleClick} ...>
```
 
### Renderizado Condicional
```javascript
${isOpen && html`
  <div>Contenido</div>
`}
```
 
### Mapeo de Arrays
```javascript
${items.map((item, index) => html`
  <div key=${index}>
    ${item}
  </div>
`)}
```
 
### Estilos Dinámicos con Tailwind y Variables CSS
```javascript
// Para estilos que cambian según condición, combinar Tailwind con estilos inline
const getVariantClasses = (variant) => {
  const base = 'inline-flex items-center px-[var(--spacing-x-small)]';
  if (variant === 'primary') {
    return `${base} justify-center`;
  }
  return `${base} justify-start`;
};
 
const getVariantStyles = (variant) => {
  if (variant === 'primary') {
    return {
      backgroundColor: 'var(--brand-primary)',
      color: 'var(--text-normal-lighter)',
    };
  }
  return {
    backgroundColor: 'var(--bg-page-light)',
    color: 'var(--text-normal-primary)',
  };
};
 
// En el JSX
<div class=${getVariantClasses(variant)} style=${getVariantStyles(variant)}>
```
 
## Crear Archivo Sample
 
Cada componente debe tener un archivo `.sample.js` con ejemplos de uso:
 
```javascript
import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { ComponentName } from './component-name.js';
 
const html = htm.bind(h);
 
export const ComponentNameSample = () => {
  const [state, setState] = useState(initialValue);
 
  return html`
    <div style=${{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Component Name Examples</h1>
      
      <section style=${{ marginBottom: 'var(--spacing-x-large)' }}>
        <h2>Ejemplo 1: Uso Básico</h2>
        <${ComponentName}
          prop1="value1"
          prop2="value2"
        >
          Contenido
        </${ComponentName}>
      </section>
    </div>
  `;
};
 
export default ComponentNameSample;
```
 
## Integración con Design System Block
 
Después de crear el componente, agregarlo a `blocks/design-system-block/ds-arquitecture/{tipo}.samples.js`: