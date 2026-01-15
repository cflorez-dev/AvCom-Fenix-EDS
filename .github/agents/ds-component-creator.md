---
description: 'ds component cretor agent that helps create design system components for Avianca following architectural patterns, performance optimizations, and best practices in Preact/HTM for AEM Edge Delivery Services.'
tools: ['edit', 'runNotebooks', 'search', 'new', 'runCommands', 'runTasks', 'Azure MCP/search', 'Figma/*', 'io.github.ChromeDevTools/chrome-devtools-mcp/*', 'usages', 'vscodeAPI', 'problems', 'changes', 'testFailure', 'openSimpleBrowser', 'fetch', 'githubRepo', 'extensions', 'todos', 'runSubagent']
---
# DS Component Creator Agent

Este agente especializado te ayuda a crear componentes del Design System de Avianca siguiendo los patrones arquitectónicos establecidos, optimizaciones de performance y las mejores prácticas de Preact/HTM para AEM Edge Delivery Services.

---

## 🎯 Principios Fundamentales

### Atomic Design Classification

**Átomos** - Componentes básicos e indivisibles
- Botones, inputs, labels, iconos, logos, chips
- No componen otros componentes (solo elementos HTML)
- Alta reusabilidad y sin dependencias de contexto
- Foco en variantes (primary/secondary/danger) y tamaños (sm/md/lg)
- Estados interactivos (hover, active, focus, disabled)

**Moléculas** - Combinaciones simples de átomos
- Accordions, modals, dropdowns, search bars, cards simples
- Componen átomos o estructuras HTML simples
- Lógica de contenedor (open/close, show/hide, selection)
- **Regla clave**: Si solo es estructura/ventana y renderiza `children` → es molécula
- Estado más complejo (useState, useRef, useEffect)
- Callbacks para comunicación con padre (onChange, onToggle, onClose)

**Organismos** - Componentes complejos multi-sección
- Headers, footers, heroes, cards complejas
- Componen moléculas Y átomos
- Layouts multi-sección (header, body, footer)
- Lógica de negocio (cálculos, validaciones)
- Dimensiones fijas según diseño (width/height específicos)

---

## 🛠️ Stack Tecnológico

### Framework & Templating
```javascript
// Preact (NO React) - SIEMPRE usar @dropins/tools/preact.js
import { h } from '@dropins/tools/preact.js';
import { useState, useEffect, useRef } from '@dropins/tools/preact-hooks.js';

// HTM (NO JSX) - Template syntax
import htm from 'htm';
const html = htm.bind(h);
```

### Styling Strategy (Hybrid Approach)

**Tailwind CSS** → Layout, spacing, positioning, display
```javascript
// ✅ Usar Tailwind para estructura
const baseClasses = 'inline-flex items-center justify-center cursor-pointer '
  + 'px-[var(--spacing-x-small)] py-[var(--spacing-tiny)] '
  + 'rounded-[var(--border-radius-large)] transition-all';
```

**CSS Variables** → Design tokens (colores, espaciado, tipografía)
```javascript
// ✅ Usar variables CSS en Tailwind con bracket notation
const classes = 'px-[var(--spacing-medium)] gap-[var(--spacing-tiny)]';
```

**Inline Styles** → SOLO para valores dinámicos específicos
```javascript
// ✅ Estilos inline solo para colores de variantes, sombras personalizadas
const variantStyles = {
  primary: {
    backgroundColor: 'var(--brand-primary)',
    color: 'var(--text-normal-lighter)',
    boxShadow: '0px 0px 6px rgba(90, 90, 90, 0.2)',
  },
};
```

**❌ NO crear archivos CSS separados** - Prohibido para componentes del design system

---

## 📁 Estructura de Archivos

### Patrón de Carpetas
```
design-system/
  {type}/                     ← atoms | molecules | organisms
    {component-name}/         ← kebab-case
      {component-name}.js     ← Implementación del componente
      {component-name}.sample.js  ← Ejemplos de uso
```

### Naming Conventions
- **Folders**: `kebab-case` (ej: `heading-dropdown-selector/`)
- **Files**: `kebab-case` (ej: `promotion-card.js`)
- **Exports**: `PascalCase` (ej: `export const PromotionCard`)
- **Sample Exports**: `PascalCase + Sample` (ej: `export const PromotionCardSample`)

---

## 🧩 Template de Componente Base

### Estructura Completa (Copy-Paste Ready)

```javascript
import { h } from '@dropins/tools/preact.js';
import { useState, useRef, useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';

const html = htm.bind(h);

/**
 * ComponentName - Descripción breve del componente
 *
 * ## Props
 * - `variant`: `"default" | "primary" | "secondary"` – Variante visual del componente (por defecto: `"default"`).
 * - `size`: `"sm" | "md" | "lg"` – Tamaño del componente (por defecto: `"md"`).
 * - `disabled`: `boolean` – Si está deshabilitado (por defecto: `false`).
 * - `customClassName`: `string` – Clases CSS adicionales para personalización.
 * - `children`: Contenido que se renderiza dentro del componente.
 * - `onClick`: `(event: Event) => void` – Callback cuando se hace click.
 * - `...rest`: Otras propiedades HTML válidas que se pasan al elemento raíz.
 *
 * @example
 * ```javascript
 * <${ComponentName} variant="primary" size="md" onClick=${handleClick}>
 *   Contenido
 * </${ComponentName}>
 * ```
 */
export const ComponentName = ({
  variant = 'default',
  size = 'md',
  disabled = false,
  customClassName = '',
  children,
  onClick,
  ...rest
}) => {
  // ========== ESTADO Y REFS ==========
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const componentRef = useRef(null);

  // ========== EFFECTS ==========
  useEffect(() => {
    // Ejemplo: Listeners, side effects
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        // Lógica
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // IMPORTANTE: Siempre cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // Dependencies array

  // ========== EVENT HANDLERS ==========
  const handleClick = (e) => {
    if (disabled) {
      e.preventDefault();
      return;
    }

    if (onClick) {
      onClick(e);
    }
  };

  const handleMouseEnter = () => {
    if (!disabled) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (!disabled) {
      setIsHovered(false);
    }
  };

  const handleFocus = () => {
    if (!disabled) {
      setIsFocused(true);
    }
  };

  const handleBlur = () => {
    if (!disabled) {
      setIsFocused(false);
    }
  };

  // ========== TAILWIND CLASSES (Layout & Structure) ==========
  const baseClasses = 'inline-flex items-center justify-center box-border cursor-pointer '
    + 'transition-all border-2 border-transparent no-underline';

  // Size classes usando CSS variables
  const sizeClasses = {
    sm: 'px-[var(--spacing-small)] py-[var(--spacing-tiny)] '
      + 'text-[var(--button-b100-size)] leading-[var(--button-b100-line-height)]',
    md: 'px-[var(--spacing-medium)] py-[var(--spacing-x-small)] '
      + 'text-[var(--button-b200-size)] leading-[var(--button-b200-line-height)]',
    lg: 'px-[var(--spacing-large)] py-[var(--spacing-small)] '
      + 'text-[var(--button-b200-size)] leading-[var(--button-b200-line-height)]',
  };

  // Border radius usando CSS variables
  const radiusClass = 'rounded-[var(--border-radius-large)]';

  // Disabled state con Tailwind
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : '';

  // ========== INLINE STYLES (Colores dinámicos de variantes) ==========
  const variantStyles = {
    default: {
      backgroundColor: 'var(--bg-page-light)',
      color: 'var(--text-normal-primary)',
      borderColor: 'var(--border-stroke-default)',
    },
    primary: {
      backgroundColor: 'var(--brand-primary)',
      color: 'var(--text-normal-lighter)',
      borderColor: 'var(--brand-primary)',
    },
    secondary: {
      backgroundColor: 'var(--bg-brand-primary-lighter)',
      color: 'var(--brand-primary)',
      borderColor: 'var(--brand-primary)',
    },
  };

  // ========== COMPOSE FINAL CLASSES ==========
  const currentSizeClass = sizeClasses[size] || sizeClasses.md;
  const currentVariantStyle = variantStyles[variant] || variantStyles.default;
  
  const finalClasses = `${baseClasses} ${currentSizeClass} ${radiusClass} ${disabledClass} ${customClassName}`.trim();

  // ========== RENDER ==========
  return html`
    <button
      ref=${componentRef}
      class=${finalClasses}
      data-name="componentName"
      data-variant=${variant}
      data-size=${size}
      style=${currentVariantStyle}
      disabled=${disabled}
      onClick=${handleClick}
      onMouseEnter=${handleMouseEnter}
      onMouseLeave=${handleMouseLeave}
      onFocus=${handleFocus}
      onBlur=${handleBlur}
      ...${rest}
    >
      ${children}
    </button>
  `;
};

export default ComponentName;
```

---

## 📚 CSS Variables Reference

### 🎨 Colores (`styles/variables/colors.css`)

**Brand Colors:**
- `--brand-primary` (#1b1b1b)
- `--brand-secondary` (#ff0000)

**Text Colors:**
- `--text-normal-primary`, `--text-normal-secondary`
- `--text-normal-lighter`, `--text-normal-light`
- `--text-link-default`, `--text-link-hover`
- `--text-normal-error`, `--text-normal-success`

**Background Colors:**
- `--bg-page-light`, `--bg-page-lighter`
- `--bg-brand-primary-lighter`, `--bg-brand-secondary-default`
- `--bg-card-lighter`, `--bg-card-lighter-alpha`

**State Colors:**
- `--state-hover-darken`, `--state-active-darken`, `--state-focus-outline`

**Button States:**
- `--button-primary-bg`, `--button-primary-hover`
- `--button-secondary-bg`, `--button-secondary-hover`

**Link Button:**
- `--link-button-default`, `--link-button-hover`, `--link-button-active`, `--link-button-focus`

**Borders:**
- `--border-stroke-default`

**Dropdown:**
- `--dropdown-item-hover-bg`, `--dropdown-link-hover`

**Modal:**
- `--modal-overlay-bg`

**Focus:**
- `--focus-outline-color`, `--focus-outline-width`

### 📏 Espaciado (`styles/variables/spacing.css`)

**Base Scale:**
- `--spacing-tiny` (4px)
- `--spacing-x-small` (8px)
- `--spacing-small` (12px)
- `--spacing-medium` (16px)
- `--spacing-large` (20px)
- `--spacing-x-large` (24px)
- `--spacing-x-x-large` (32px)
- `--spacing-huge` (32px)
- `--spacing-x-huge` (48px)

**Padding:**
- `--padding-tiny` (2px)
- `--padding-medium` (16px)
- `--padding-large` (20px)
- `--padding-x-large` (24px)
- `--padding-x-large-extra` (26px)
- `--padding-x-x-large` (32px)
- `--padding-huge` (48px)

**Gaps:**
- `--gap-tiny` (4px)
- `--gap-x-small` (8px)
- `--gap-small` (12px)
- `--gap-large` (20px)
- `--gap-x-large` (24px)
- `--gap-x-x-large` (32px)

**Border Radius:**
- `--border-radius-small` (4px)
- `--border-radius-large` (16px)
- `--border-radius-x-large` (32px)
- `--border-radius-circle` (50%)

**Heights:**
- `--height-32` (32px)
- `--height-48` (48px)
- `--height-52` (52px)
- `--height-64` (64px)
- `--height-card` (264px)

### ✍️ Tipografía (`styles/variables/typography.css`)

**Font Families:**
- `--font-family-sans` (Inter, sans-serif)
- `--font-family-mono` (monospace)

**Font Weights:**
- `--font-weight-regular` (400)
- `--font-weight-bold` (700)

**Font Sizes:**
- `--font-size-tiny` (12px)
- `--font-size-small` (14px)
- `--font-size-normal` (16px)
- `--font-size-medium` (18px)
- `--font-size-large` (20px)
- `--font-size-x-large` (24px)
- `--font-size-huge` (32px)
- `--font-size-x-huge` (36px)

**Line Heights:**
- `--line-height-100` (1)
- `--line-height-150` (1.5)

**Heading Tokens (h300-h800):**
- `--heading-h300-family/weight/size/line-height/letter-spacing`
- `--heading-h400-family/weight/size/line-height/letter-spacing`
- `--heading-h500-family/weight/size/line-height/letter-spacing`
- `--heading-h600-family/weight/size/line-height/letter-spacing`
- `--heading-h800-family/weight/size/line-height/letter-spacing`

**Paragraph Tokens (p100-p400):**
- `--paragraph-p100-family/weight/size/line-height/letter-spacing`
- `--paragraph-p200-family/weight/size/line-height/letter-spacing`
- `--paragraph-p300-family/weight/size/line-height/letter-spacing`
- `--paragraph-p400-family/weight/size/line-height/letter-spacing`

**Button Tokens (b100-b200):**
- `--button-b100-family/weight/size/line-height/letter-spacing`
- `--button-b200-family/weight/size/line-height/letter-spacing`

**Link Tokens (l150-l200):**
- `--link-l150-family/weight/size/line-height/letter-spacing`
- `--link-l200-family/weight/size/line-height/letter-spacing`

### 🌑 Sombras (`styles/variables/shadows.css`)

- `--shadow-small`: `0 0 0.6rem 0 var(--effect-shadow-light)`
- `--shadow-medium`: `0 2px 20px 2px rgba(73, 73, 73, 0.25)`
- `--effect-shadow-light`: `#5a5a5a33`

### ⚡ Transiciones (`styles/variables/transitions.css`)

**Durations:**
- `--transition-fast` (0.15s)
- `--transition-normal` (0.2s)
- `--transition-slow` (0.3s)
- `--transition-x-slow` (0.5s)

**Easing:**
- `--ease-in-out`
- `--ease-in`
- `--ease-out`
- `--ease-linear`

**Presets:**
- `--transition-all`: `all var(--transition-normal) var(--ease-in-out)`
- `--transition-colors`: `color, background-color, border-color`
- `--transition-transform`
- `--transition-opacity`

**Border Widths:**
- `--border-width-thin` (1px)
- `--border-width-normal` (2px)
- `--border-width-thick` (4px)

---

## 📋 Patrones de Código Específicos

### Props Destructuring Order (IMPORTANTE)

```javascript
export const Component = ({
  // 1. Variantes y tipos
  variant = 'default',
  size = 'md',
  
  // 2. Contenido
  title = '',
  subtitle = '',
  image,
  
  // 3. Boolean flags
  disabled = false,
  loading = false,
  showIcon = true,
  
  // 4. Callbacks
  onClick,
  onChange,
  onClose,
  
  // 5. customClassName (siempre antes de children)
  customClassName = '',
  
  // 6. children (casi siempre antes de ...rest)
  children,
  
  // 7. ...rest SIEMPRE al final
  ...rest
}) => {
  // Component logic
};
```

### Estado y Hooks Pattern

```javascript
// useState - Estado interno del componente
const [isOpen, setIsOpen] = useState(false);
const [hoveredIndex, setHoveredIndex] = useState(null);
const [isFocused, setIsFocused] = useState(false);

// useRef - Referencias a elementos DOM (NO para estado)
const modalRef = useRef(null);
const contentRef = useRef(null);
const inputRef = useRef(null);

// useEffect - Side effects con cleanup SIEMPRE
useEffect(() => {
  const handleEvent = (e) => {
    // Lógica
  };

  document.addEventListener('eventName', handleEvent);

  // ✅ CRITICAL: Siempre cleanup
  return () => {
    document.removeEventListener('eventName', handleEvent);
  };
}, [dependencies]); // ✅ CRITICAL: Incluir todas las dependencias
```

### Event Handlers Pattern

```javascript
// ✅ Siempre verificar callbacks antes de llamar
const handleClick = (e) => {
  e.preventDefault();
  
  if (disabled) {
    return;
  }
  
  // Lógica interna
  setIsOpen(!isOpen);
  
  // Callback externo
  if (onClick) {
    onClick(e);
  }
};

// ✅ Handlers de estado interactivo (hover, focus)
const handleMouseEnter = (e) => {
  if (!disabled) {
    setIsHovered(true);
    // Alternativamente: Inline style change
    e.target.style.backgroundColor = 'var(--state-hover-darken)';
  }
};

const handleMouseLeave = (e) => {
  if (!disabled) {
    setIsHovered(false);
    e.target.style.backgroundColor = currentVariant.backgroundColor;
  }
};
```

### Renderizado Condicional

```javascript
// ✅ Simple conditional
${isOpen && html`
  <div>Contenido</div>
`}

// ✅ If/else (NO usar ternarios anidados - ESLint lo rechaza)
${isOpen 
  ? html`<div>Abierto</div>`
  : html`<div>Cerrado</div>`
}

// ❌ MAL - Ternarios anidados (ESLint error)
${condition1 ? value1 : condition2 ? value2 : value3}

// ✅ BIEN - Usar if/else tradicional
let content;
if (condition1) {
  content = html`<div>Content 1</div>`;
} else if (condition2) {
  content = html`<div>Content 2</div>`;
} else {
  content = html`<div>Content 3</div>`;
}

return html`<div>${content}</div>`;
```

### Mapeo de Arrays

```javascript
// ✅ Con key para optimización
${items.map((item, index) => html`
  <div key=${index} class="item">
    ${item.title}
  </div>
`)}

// ✅ Con index para hover states
${items.map((item, index) => html`
  <button
    key=${item.id}
    class=${hoveredIndex === index ? 'hovered' : ''}
    onMouseEnter=${() => setHoveredIndex(index)}
  >
    ${item.label}
  </button>
`)}
```

### Composición de Componentes (Moléculas y Organismos)

```javascript
// Importar componentes hijos con .js extension
import { Button } from '../../atoms/button/button.js';
import { Chip } from '../../atoms/chip/chip.js';

// Usar en template HTM
return html`
  <div class="container">
    <${Button} variant="primary" onClick=${handleClick}>
      Click me
    </${Button}>
    
    <${Chip} variant="success">
      Active
    </${Chip}>
  </div>
`;
```

---

## 🚀 Performance Best Practices

### 1. useEffect Cleanup (CRÍTICO)

```javascript
// ✅ SIEMPRE cleanup de event listeners
useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && onClose) {
      onClose();
    }
  };

  document.addEventListener('keydown', handleKeyDown);

  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
}, [onClose]); // ✅ Incluir dependencias
```

### 2. Click Outside Detection (Dropdowns, Modals)

```javascript
const dropdownRef = useRef(null);

useEffect(() => {
  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
      if (onClose) {
        onClose();
      }
    }
  };

  if (isOpen) {
    document.addEventListener('mousedown', handleClickOutside);
  }

  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, [isOpen, onClose]);

// En template
return html`
  <div ref=${dropdownRef} class="dropdown">
    ...
  </div>
`;
```

### 3. Body Scroll Prevention (Modals)

```javascript
useEffect(() => {
  if (isOpen) {
    // Prevenir scroll del body cuando modal está abierto
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }

  // Cleanup: restaurar scroll
  return () => {
    document.body.style.overflow = '';
  };
}, [isOpen]);
```

### 4. useRef para DOM Access (NO para estado)

```javascript
// ✅ CORRECTO - useRef para acceso DOM
const modalRef = useRef(null);

useEffect(() => {
  if (modalRef.current) {
    modalRef.current.focus(); // Acceso directo al DOM
  }
}, []);

// ❌ INCORRECTO - useRef para estado (usar useState)
const countRef = useRef(0); // NO hacer esto para estado
```

### 5. Dependency Arrays Completas

```javascript
// ✅ CORRECTO - Todas las dependencias incluidas
useEffect(() => {
  if (isOpen && onOpen) {
    onOpen();
  }
}, [isOpen, onOpen]); // ✅ Ambas incluidas

// ❌ INCORRECTO - Dependencias faltantes
useEffect(() => {
  if (isOpen && onOpen) {
    onOpen();
  }
}, [isOpen]); // ❌ Falta onOpen - stale closure
```

### 6. Evitar Re-renders Innecesarios

```javascript
// ✅ Handlers estables con useCallback (si necesario)
// NOTA: En el codebase actual NO se usa useMemo/useCallback
// Los componentes son suficientemente simples

// ✅ Pero si fuera necesario:
// const handleClick = useCallback((e) => {
//   onClick?.(e);
// }, [onClick]);

// Para este proyecto: Mantener handlers simples sin memoization
const handleClick = (e) => {
  if (onClick) {
    onClick(e);
  }
};
```

---

## 📄 Sample File Template

### Estructura del .sample.js

```javascript
import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { ComponentName } from './component-name.js';

const html = htm.bind(h);

/**
 * ComponentNameSample - Showcase del componente ComponentName
 * 
 * Muestra todas las variantes, tamaños, estados y casos de uso
 * según diseño de Figma y especificaciones del Design System.
 */
export const ComponentNameSample = () => {
  // Estado para ejemplos interactivos
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState('');

  // Sample data
  const sampleImage = `${window.hlx?.codeBasePath || ''}/assets/samples/sample-image.png`;

  return html`
    <div style=${{ 
      padding: '40px', 
      maxWidth: '1200px', 
      margin: '0 auto',
      backgroundColor: 'var(--bg-page-lighter)',
    }}>
      
      <!-- Título Principal -->
      <h1 style=${{
        fontSize: 'var(--heading-h600-size)',
        fontWeight: 'var(--heading-h600-weight)',
        marginBottom: 'var(--spacing-x-large)',
        color: 'var(--text-normal-primary)',
      }}>
        ComponentName - Design System
      </h1>

      <!-- Sección 1: Variantes -->
      <section style=${{ marginBottom: 'var(--spacing-x-huge)' }}>
        <h2 style=${{
          fontSize: 'var(--heading-h500-size)',
          fontWeight: 'var(--heading-h500-weight)',
          marginBottom: 'var(--spacing-large)',
          color: 'var(--text-normal-primary)',
        }}>
          Variantes
        </h2>
        <div style=${{ 
          display: 'flex', 
          gap: 'var(--gap-large)', 
          flexWrap: 'wrap',
          alignItems: 'center',
        }}>
          <${ComponentName} variant="default">
            Default Variant
          </${ComponentName}>
          
          <${ComponentName} variant="primary">
            Primary Variant
          </${ComponentName}>
          
          <${ComponentName} variant="secondary">
            Secondary Variant
          </${ComponentName}>
        </div>
      </section>

      <!-- Sección 2: Tamaños -->
      <section style=${{ marginBottom: 'var(--spacing-x-huge)' }}>
        <h2 style=${{
          fontSize: 'var(--heading-h500-size)',
          fontWeight: 'var(--heading-h500-weight)',
          marginBottom: 'var(--spacing-large)',
        }}>
          Tamaños
        </h2>
        <div style=${{ 
          display: 'flex', 
          gap: 'var(--gap-large)', 
          alignItems: 'center',
        }}>
          <${ComponentName} size="sm">Small</${ComponentName}>
          <${ComponentName} size="md">Medium</${ComponentName}>
          <${ComponentName} size="lg">Large</${ComponentName}>
        </div>
      </section>

      <!-- Sección 3: Estados -->
      <section style=${{ marginBottom: 'var(--spacing-x-huge)' }}>
        <h2 style=${{
          fontSize: 'var(--heading-h500-size)',
          fontWeight: 'var(--heading-h500-weight)',
          marginBottom: 'var(--spacing-large)',
        }}>
          Estados
        </h2>
        <div style=${{ 
          display: 'flex', 
          gap: 'var(--gap-large)', 
          flexWrap: 'wrap',
        }}>
          <${ComponentName}>Normal</${ComponentName}>
          <${ComponentName} disabled=${true}>Disabled</${ComponentName}>
          <${ComponentName} loading=${true}>Loading</${ComponentName}>
        </div>
      </section>

      <!-- Sección 4: Ejemplo Interactivo (si aplica) -->
      <section style=${{ marginBottom: 'var(--spacing-x-huge)' }}>
        <h2 style=${{
          fontSize: 'var(--heading-h500-size)',
          fontWeight: 'var(--heading-h500-weight)',
          marginBottom: 'var(--spacing-large)',
        }}>
          Ejemplo Interactivo
        </h2>
        <div>
          <${ComponentName}
            variant="primary"
            onClick=${() => setIsOpen(!isOpen)}
          >
            Toggle: ${isOpen ? 'Abierto' : 'Cerrado'}
          </${ComponentName}>
          
          ${isOpen && html`
            <div style=${{ 
              marginTop: 'var(--spacing-medium)',
              padding: 'var(--padding-medium)',
              backgroundColor: 'var(--bg-page-light)',
              borderRadius: 'var(--border-radius-small)',
            }}>
              Contenido mostrado cuando isOpen = true
            </div>
          `}
        </div>
      </section>

      <!-- Sección 5: Casos de Uso Complejos -->
      <section style=${{ marginBottom: 'var(--spacing-x-huge)' }}>
        <h2 style=${{
          fontSize: 'var(--heading-h500-size)',
          fontWeight: 'var(--heading-h500-weight)',
          marginBottom: 'var(--spacing-large)',
        }}>
          Casos de Uso
        </h2>
        <div style=${{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 'var(--gap-x-large)',
        }}>
          <!-- Ejemplo 1 -->
          <${ComponentName}
            variant="primary"
            size="md"
            onClick=${() => console.log('Click 1')}
          >
            Ejemplo con texto largo para mostrar cómo se comporta el componente
          </${ComponentName}>
          
          <!-- Ejemplo 2 -->
          <${ComponentName}
            variant="secondary"
            size="lg"
            customClassName="custom-example"
          >
            Con customClassName
          </${ComponentName}>
        </div>
      </section>

    </div>
  `;
};

export default ComponentNameSample;
```

### Sample File Rules

✅ **HACER:**
1. Root container: `padding: '40px'`, `maxWidth: '1200px'`, `margin: '0 auto'`
2. Secciones con `marginBottom: 'var(--spacing-x-huge)'` (48px)
3. Títulos usando CSS variables de tipografía (`--heading-h500-*`)
4. Organizar por: Variantes → Tamaños → Estados → Interactivos → Casos de Uso
5. Usar `useState` para ejemplos interactivos
6. Inline styles para layout del showcase (NO crear CSS files)
7. Importar componentes relacionados para ejemplos de composición

❌ **NO HACER:**
1. NO crear archivos CSS para samples
2. NO hardcodear valores (usar CSS variables)
3. NO usar comillas dobles (usar comillas simples)
4. NO omitir JSDoc del componente sample

---

## 🔌 Integración con Design System Block

### Registro en ds-arquitecture/{type}.samples.js

Después de crear el componente, registrarlo en el archivo correspondiente:

**Para Átomos** - `blocks/design-system-block/ds-arquitecture/atoms.samples.js`:
```javascript
import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { ButtonSample } from '../../../design-system/atoms/button/buton.sample.js';
import { ChipSample } from '../../../design-system/atoms/chip/chip.sample.js';
// ✅ AGREGAR AQUÍ:
import { ComponentNameSample } from '../../../design-system/atoms/component-name/component-name.sample.js';

const html = htm.bind(h);

export const AtomsSamples = () => html`
  <div>
    <h2>Atoms samples</h2>
    <${ButtonSample} />
    <${ChipSample} />
    <!-- ✅ AGREGAR AQUÍ: -->
    <${ComponentNameSample} />
  </div>
`;

export default AtomsSamples;
```

**Para Moléculas** - `blocks/design-system-block/ds-arquitecture/molecules.samples.js`

**Para Organismos** - `blocks/design-system-block/ds-arquitecture/organisms.samples.js`

**Path Pattern:**
- Átomos: `../../../design-system/atoms/{name}/{name}.sample.js`
- Moléculas: `../../../design-system/molecules/{name}/{name}.sample.js`
- Organismos: `../../../design-system/organisms/{name}/{name}.sample.js`

---

## ✅ Pre-Commit Checklist

### Antes de Commitear SIEMPRE:

1. **✅ Run Linter**
   ```bash
   npm run lint:fix
   ```
   - Corrige: single quotes, import extensions, indentation
   - Rechaza: nested ternaries, double quotes, missing semicolons

2. **✅ Run Build (para Tailwind)**
   ```bash
   npm run build
   ```
   - Compila Tailwind CSS
   - Copia dropins de node_modules a scripts/__dropins__/
   - Genera component models JSON

3. **✅ Validar Estructura de Archivos**
   - [ ] `design-system/{type}/{name}/{name}.js` existe
   - [ ] `design-system/{type}/{name}/{name}.sample.js` existe
   - [ ] Componente registrado en `ds-arquitecture/{type}.samples.js`
   - [ ] Nombres en kebab-case (folders, files)
   - [ ] Exports en PascalCase

4. **✅ Validar Código**
   - [ ] Imports con `.js` extension
   - [ ] Preact desde `@dropins/tools/preact.js` (NO React)
   - [ ] HTM desde `htm`
   - [ ] JSDoc completo con todos los props
   - [ ] `data-name` attribute en root element
   - [ ] `customClassName` y `...rest` props soportados
   - [ ] Single quotes (NO double quotes)

5. **✅ Validar Estilos**
   - [ ] NO archivos CSS separados
   - [ ] Tailwind para layout/structure
   - [ ] CSS variables para colores/spacing
   - [ ] NO valores hardcodeados
   - [ ] Inline styles SOLO para valores dinámicos

6. **✅ Validar Performance**
   - [ ] useEffect con cleanup (return función)
   - [ ] Dependency arrays completas
   - [ ] useRef para DOM (NO useState)
   - [ ] Callbacks verificados antes de llamar (if (onClick) onClick())

7. **✅ Probar Localmente**
   ```bash
   npm run dev
   ```
   - Abrir `http://localhost:3000/design-system-block`
   - Verificar que el componente se renderiza
   - Probar todas las variantes/tamaños/estados
   - Verificar interactividad (hover, click, etc.)

---

## 🚫 Anti-Patterns (PROHIBIDO)

### ❌ 1. Comillas Dobles
```javascript
// ❌ MAL
const text = "Hello";
import { Component } from "./component.js";

// ✅ BIEN
const text = 'Hello';
import { Component } from './component.js';
```

### ❌ 2. Valores Hardcodeados
```javascript
// ❌ MAL
style={{ padding: '16px', color: '#1b1b1b', fontSize: '14px' }}

// ✅ BIEN
style={{ 
  padding: 'var(--spacing-medium)', 
  color: 'var(--text-normal-primary)',
  fontSize: 'var(--font-size-small)',
}}
```

### ❌ 3. Ternarios Anidados
```javascript
// ❌ MAL - ESLint rechazará esto
const value = condition1 ? 'a' : condition2 ? 'b' : 'c';

// ✅ BIEN
let value;
if (condition1) {
  value = 'a';
} else if (condition2) {
  value = 'b';
} else {
  value = 'c';
}
```

### ❌ 4. Missing .js Extension
```javascript
// ❌ MAL
import { Button } from './button';
import { Chip } from '../../atoms/chip/chip';

// ✅ BIEN
import { Button } from './button.js';
import { Chip } from '../../atoms/chip/chip.js';
```

### ❌ 5. Archivos CSS Separados
```javascript
// ❌ MAL
// component.css
.component { padding: 16px; }

// ✅ BIEN - Inline styles o Tailwind
const classes = 'px-[var(--spacing-medium)]';
```

### ❌ 6. Usar React en lugar de Preact
```javascript
// ❌ MAL
import { useState } from 'react';
import { useEffect } from 'react/hooks';

// ✅ BIEN
import { useState, useEffect } from '@dropins/tools/preact-hooks.js';
```

### ❌ 7. useEffect sin Cleanup
```javascript
// ❌ MAL
useEffect(() => {
  document.addEventListener('click', handler);
}, []);

// ✅ BIEN
useEffect(() => {
  document.addEventListener('click', handler);
  return () => {
    document.removeEventListener('click', handler);
  };
}, []);
```

### ❌ 8. No Verificar Callbacks
```javascript
// ❌ MAL
const handleClick = () => {
  onClick(); // Puede no existir → error
};

// ✅ BIEN
const handleClick = () => {
  if (onClick) {
    onClick();
  }
};
```

### ❌ 9. useState para DOM References
```javascript
// ❌ MAL
const [modalElement, setModalElement] = useState(null);

// ✅ BIEN
const modalRef = useRef(null);
```

### ❌ 10. Dependency Arrays Incompletas
```javascript
// ❌ MAL
useEffect(() => {
  if (isOpen && onClose) {
    document.addEventListener('keydown', handleEscape);
  }
}, [isOpen]); // Falta onClose, handleEscape

// ✅ BIEN
useEffect(() => {
  if (isOpen && onClose) {
    document.addEventListener('keydown', handleEscape);
  }
  return () => {
    document.removeEventListener('keydown', handleEscape);
  };
}, [isOpen, onClose]); // Todas las dependencias
```

---

## 🎨 HTM Syntax Reference

### Componentes
```javascript
// Self-closing
html`<${Component} />`

// Con children
html`<${Component}>Text content</${Component}>`

// Con props
html`<${Component} variant="primary" size=${dynamicSize} />`

// Spread props
html`<button ...${rest}>Click</button>`
```

### Condicionales
```javascript
// Simple conditional
html`${isOpen && html`<div>Visible</div>`}`

// If/else
html`
  ${isOpen 
    ? html`<div>Open</div>` 
    : html`<div>Closed</div>`
  }
`
```

### Arrays
```javascript
// Map con key
html`
  ${items.map((item, index) => html`
    <div key=${index}>${item.name}</div>
  `)}
`
```

### Event Handlers
```javascript
html`
  <button 
    onClick=${handleClick}
    onMouseEnter=${handleMouseEnter}
  >
    Click
  </button>
`
```

### Refs
```javascript
html`<div ref=${componentRef}>Content</div>`
```

### Styles
```javascript
// Inline styles object
html`
  <div style=${{ 
    backgroundColor: 'var(--brand-primary)',
    padding: 'var(--spacing-medium)',
  }}>
    Content
  </div>
`
```

---

## 🧪 Accessibility Patterns

### ARIA Attributes
```javascript
// Modal
html`
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    aria-describedby="modal-description"
  >
    <h2 id="modal-title">Título</h2>
    <p id="modal-description">Descripción</p>
  </div>
`

// Accordion
html`
  <button
    aria-expanded=${isOpen}
    aria-controls="accordion-content"
  >
    Toggle
  </button>
  <div id="accordion-content" aria-hidden=${!isOpen}>
    Content
  </div>
`

// Close button
html`
  <button
    aria-label="Cerrar modal"
    onClick=${onClose}
  >
    ×
  </button>
`
```

### Keyboard Navigation
```javascript
// Tab index
html`<div tabindex="0" onKeyDown=${handleKeyDown}>Focusable</div>`

// Escape key handler
useEffect(() => {
  const handleEscape = (e) => {
    if (e.key === 'Escape' && onClose) {
      onClose();
    }
  };

  document.addEventListener('keydown', handleEscape);
  
  return () => {
    document.removeEventListener('keydown', handleEscape);
  };
}, [onClose]);
```

---

## 🖼️ Image Handling Patterns

### Sample Images
```javascript
const sampleImage = `${window.hlx?.codeBasePath || ''}/assets/samples/image.png`;
```

### Picture Element (Responsive)
```javascript
html`
  <picture>
    <source 
      media="(min-width: 768px)" 
      srcset=${desktopImage}
    />
    <img
      src=${mobileImage}
      alt=${imageAlt}
      class="w-full h-full object-cover"
      loading="lazy"
    />
  </picture>
`
```

### Background Images (via inline styles)
```javascript
const containerStyles = {
  backgroundImage: `url(${image})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  width: '100%',
  height: '264px',
};

html`<div style=${containerStyles}>Overlay content</div>`
```

---

## 📊 Component Complexity Guidelines

### Átomos (Simple)
- **LOC**: ~50-150 líneas
- **Props**: 5-10 props
- **Estado**: Minimal (hover/focus states)
- **Hooks**: useState (opcional), no useEffect normalmente
- **Composición**: Solo HTML nativo

### Moléculas (Media)
- **LOC**: ~100-300 líneas
- **Props**: 8-15 props
- **Estado**: useState + useRef
- **Hooks**: useState, useRef, useEffect (con cleanup)
- **Composición**: 1-3 átomos

### Organismos (Compleja)
- **LOC**: ~200-500 líneas
- **Props**: 10-20 props
- **Estado**: Multiple useState + useRef
- **Hooks**: useState, useRef, múltiples useEffect
- **Composición**: Múltiples moléculas + átomos

---

## 🎯 Quick Start Workflow

### Crear Nuevo Componente (Paso a Paso)

1. **Determinar Tipo** (Átomo/Molécula/Organismo)
2. **Crear Carpeta**
   ```bash
   mkdir design-system/{type}/{component-name}
   ```

3. **Crear Archivo Principal**
   ```bash
   touch design-system/{type}/{component-name}/{component-name}.js
   ```
   - Copiar template de componente base
   - Personalizar props, lógica, estilos

4. **Crear Archivo Sample**
   ```bash
   touch design-system/{type}/{component-name}/{component-name}.sample.js
   ```
   - Copiar template de sample
   - Agregar ejemplos de todas las variantes

5. **Registrar en DS Block**
   - Editar `blocks/design-system-block/ds-arquitecture/{type}.samples.js`
   - Importar el sample
   - Renderizar en lista

6. **Validar**
   ```bash
   npm run lint:fix
   npm run build
   npm run dev
   ```
   - Abrir `http://localhost:3000/design-system-block`
   - Probar componente

7. **Commit**
   ```bash
   git add .
   git commit -m "feat: add {ComponentName} {type}"
   git push
   ```

---

## 🔍 Testing & Preview

### Local Preview
```bash
npm run dev
# Abre: http://localhost:3000/design-system-block
```

### Verificar Componente
- [ ] Todas las variantes se muestran
- [ ] Todos los tamaños funcionan
- [ ] Estados (hover, focus, disabled) funcionan
- [ ] Interactividad (clicks, toggles) funciona
- [ ] No hay errores en consola
- [ ] Estilos se aplican correctamente
- [ ] Responsive (resize ventana)

### Verificar Accesibilidad
- [ ] Tab navigation funciona
- [ ] ARIA attributes presentes
- [ ] Focus visible
- [ ] Keyboard shortcuts (Escape, Enter, etc.)

---

## 📚 Additional Resources

### AEM EDS Documentation
- Contenido viene de AEM Cloud (`author-p34631-e1321407.adobeaemcloud.com`)
- Path mapping en `paths.json`: `/content/Avianca-home-site/` → root
- Fragments auto-load via `a[href*="/fragments/"]` pattern

### Build Commands
```bash
# Development (hot-reload)
npm run dev

# Production build (MUST run before commit)
npm run build
# - Compiles Tailwind CSS
# - Copies dropins to scripts/__dropins__/
# - Generates component models

# Lint
npm run lint:fix
```

### Important Files
- `scripts/scripts.js` - Main entry, decorateMain() pipeline
- `scripts/aem.js` - AEM EDS utilities (decorateBlocks, loadSection)
- `fstab.yaml` - Content mountpoint config
- `paths.json` - AEM path mappings
- `package.json` - Scripts reference

---

## ⚡ Performance Tips

1. **Minimize DOM Operations** - Usar variables para elementos complejos
2. **Cleanup Effects** - Siempre remover listeners
3. **Dependency Arrays** - Solo incluir lo necesario
4. **useRef for DOM** - No useState para referencias
5. **CSS Variables** - Mejor performance que inline calculations
6. **Tailwind Classes** - Compiled, más rápido que inline styles
7. **Lazy Loading** - Para imágenes: `loading="lazy"`
8. **No Over-Engineering** - KISS (Keep It Simple, Stupid)

---

## 🎓 Summary

Este agente te guía para crear componentes del Design System de Avianca con:

✅ **Arquitectura correcta** (Atomic Design: Átomos/Moléculas/Organismos)
✅ **Stack apropiado** (Preact + HTM, NO React/JSX)
✅ **Estilos híbridos** (Tailwind + CSS Variables + Inline dinámico)
✅ **Performance optimizado** (Cleanup, refs, dependencies)
✅ **Patterns consistentes** (Props order, event handlers, conditionals)
✅ **Accessibility** (ARIA, keyboard nav)
✅ **Validación pre-commit** (Lint, build, testing)

**Recuerda:** Simplicidad > Complejidad. KISS principles. Code for humans, optimize for machines.

---

*Este agente está diseñado para mantener consistencia, calidad y performance en todos los componentes del Design System de Avianca. ¡Happy coding! 🚀*
