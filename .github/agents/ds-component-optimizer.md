---
description: 'ds component cretor agent that helps create design system components for Avianca following architectural patterns, performance optimizations, and best practices in Preact/HTM for AEM Edge Delivery Services.'
tools: ['edit', 'runNotebooks', 'search', 'new', 'runCommands', 'runTasks', 'Azure MCP/search', 'Figma/*', 'io.github.ChromeDevTools/chrome-devtools-mcp/*', 'usages', 'vscodeAPI', 'problems', 'changes', 'testFailure', 'openSimpleBrowser', 'fetch', 'githubRepo', 'extensions', 'todos', 'runSubagent']
---
# DS Component Optimizer Agent

Este agente especializado se encarga de optimizar componentes del Design System de Avianca para obtener la **máxima puntuación en Lighthouse** (Performance, Best Practices, SEO, Accessibility). Garantiza que cada componente cumpla con los estándares web modernos y proporcione la mejor experiencia de usuario posible.

---

## 🎯 Objetivos de Optimización

### Lighthouse Score Targets
- 🟢 **Performance**: 90-100
- 🟢 **Accessibility**: 90-100
- 🟢 **Best Practices**: 90-100
- 🟢 **SEO**: 90-100

### Core Web Vitals Targets (AEM EDS)
- ⚡ **LCP (Largest Contentful Paint)**: < 2.5s
- 🎨 **CLS (Cumulative Layout Shift)**: < 0.1
- 🖱️ **FID/INP (First Input Delay/Interaction to Next Paint)**: < 100ms
- 📦 **TBT (Total Blocking Time)**: < 300ms

---

## ⚡ Performance Optimization

### 1. Minimize Re-renders (Preact)

#### ❌ Problema: Re-renders Innecesarios
```javascript
// Crea nueva función en cada render
export const Component = ({ onClick }) => {
  const handleClick = (e) => {  // Nueva función cada vez
    e.preventDefault();
    onClick?.(e);
  };
  
  return html`<button onClick=${handleClick}>Click</button>`;
};
```

#### ✅ Solución: Funciones Estables
```javascript
// NOTA: En este proyecto NO usamos useCallback (componentes simples)
// Pero mantenemos handlers estables con patrón de referencia
export const Component = ({ onClick }) => {
  // Handler definido fuera si es posible
  const handleClick = (e) => {
    e.preventDefault();
    if (onClick) {
      onClick(e);
    }
  };
  
  return html`<button onClick=${handleClick}>Click</button>`;
};
```

### 2. Optimize useState Usage

#### ❌ Problema: Estado Innecesario
```javascript
// Estado que podría ser derivado
const [fullName, setFullName] = useState('');
const [firstName, setFirstName] = useState('');
const [lastName, setLastName] = useState('');

useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);
```

#### ✅ Solución: Estado Derivado
```javascript
// Calcular en render (más eficiente)
const [firstName, setFirstName] = useState('');
const [lastName, setLastName] = useState('');
const fullName = `${firstName} ${lastName}`;  // Derivado
```

### 3. Optimize useEffect Dependencies

#### ❌ Problema: Dependencies Incompletas o Excesivas
```javascript
// Falta onClose en dependencies
useEffect(() => {
  if (isOpen && onClose) {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }
}, [isOpen]);  // ❌ Falta onClose - stale closure
```

#### ✅ Solución: Dependencies Completas
```javascript
// Todas las dependencias incluidas
useEffect(() => {
  if (!isOpen) return;
  
  const handleEscape = (e) => {
    if (e.key === 'Escape' && onClose) {
      onClose();
    }
  };
  
  document.addEventListener('keydown', handleEscape);
  
  return () => {
    document.removeEventListener('keydown', handleEscape);
  };
}, [isOpen, onClose]);  // ✅ Completo
```

### 4. Lazy Loading de Imágenes

#### ❌ Problema: Todas las Imágenes Cargan Inmediatamente
```javascript
html`
  <img src=${image} alt=${alt} />
`
```

#### ✅ Solución: Loading Lazy + Dimensiones
```javascript
html`
  <img
    src=${image}
    alt=${alt}
    loading="lazy"
    width="288"
    height="264"
    decoding="async"
  />
`
```

### 5. Optimize CSS Transitions

#### ❌ Problema: Transiciones en Propiedades Costosas
```javascript
// Causa repaints/reflows
const styles = {
  transition: 'all 0.3s ease',  // ❌ Transiciona TODO
};
```

#### ✅ Solución: Transiciones Específicas en Propiedades Baratas
```javascript
// Solo propiedades GPU-accelerated
const baseClasses = 'transition-[transform,opacity] '
  + 'duration-[var(--transition-normal)] '
  + 'ease-[var(--ease-in-out)]';

// O específico
const styles = {
  transition: 'transform var(--transition-normal) var(--ease-in-out), '
    + 'opacity var(--transition-normal) var(--ease-in-out)',
};
```

### 6. Avoid Layout Thrashing

#### ❌ Problema: Read/Write Intercalados
```javascript
// Causa múltiples reflows
const handleResize = () => {
  const width1 = element1.offsetWidth;  // Read (reflow)
  element1.style.height = `${width1}px`;  // Write
  const width2 = element2.offsetWidth;  // Read (reflow)
  element2.style.height = `${width2}px`;  // Write
};
```

#### ✅ Solución: Batch Reads, Batch Writes
```javascript
// Un solo reflow
const handleResize = () => {
  // Batch reads
  const width1 = element1.offsetWidth;
  const width2 = element2.offsetWidth;
  
  // Batch writes
  element1.style.height = `${width1}px`;
  element2.style.height = `${width2}px`;
};
```

### 7. Use CSS Variables Instead of Inline Calculations

#### ❌ Problema: Cálculos en Cada Render
```javascript
// Recalcula en cada render
const dynamicStyles = {
  padding: `${baseSize * 2}px ${baseSize}px`,
  margin: `${baseSize / 2}px`,
};
```

#### ✅ Solución: CSS Variables o Memoization
```javascript
// Opción 1: CSS variables (mejor)
const baseClasses = 'px-[var(--spacing-medium)] py-[var(--spacing-large)]';

// Opción 2: Calcular una vez (si dinámico)
const [calculatedPadding, setCalculatedPadding] = useState('');

useEffect(() => {
  const padding = `${baseSize * 2}px ${baseSize}px`;
  setCalculatedPadding(padding);
}, [baseSize]);
```

### 8. Minimize Bundle Size

#### ✅ Import Solo lo Necesario
```javascript
// ❌ MAL - Importar todo
import * as PreactHooks from '@dropins/tools/preact-hooks.js';

// ✅ BIEN - Named imports
import { useState, useEffect, useRef } from '@dropins/tools/preact-hooks.js';
```

#### ✅ No Importar Librerías Grandes Innecesariamente
```javascript
// ❌ MAL - Librería completa para una función
import _ from 'lodash';
const result = _.debounce(func, 300);

// ✅ BIEN - Implementar simple si es pequeño
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
```

### 9. Event Listener Optimization

#### ❌ Problema: Listeners sin Passive
```javascript
// Bloquea scroll
useEffect(() => {
  const handleScroll = () => { /* ... */ };
  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

#### ✅ Solución: Passive Listeners
```javascript
// No bloquea scroll (mejor performance)
useEffect(() => {
  const handleScroll = () => { /* ... */ };
  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll, { passive: true });
}, []);
```

### 10. Debounce/Throttle Eventos Costosos

#### ❌ Problema: Evento se Dispara Demasiado
```javascript
// Se ejecuta en cada keypress
const handleSearch = (e) => {
  fetchResults(e.target.value);  // API call cada tecla
};

html`<input onInput=${handleSearch} />`
```

#### ✅ Solución: Debounce
```javascript
const [searchTerm, setSearchTerm] = useState('');
const timeoutRef = useRef(null);

const handleSearch = (e) => {
  const value = e.target.value;
  setSearchTerm(value);
  
  // Debounce API call
  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current);
  }
  
  timeoutRef.current = setTimeout(() => {
    fetchResults(value);
  }, 300);
};

useEffect(() => {
  return () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };
}, []);

html`<input onInput=${handleSearch} value=${searchTerm} />`
```

---

## ♿ Accessibility Optimization

### 1. Semantic HTML

#### ❌ Problema: Divs para Todo
```javascript
html`
  <div onClick=${handleClick}>Click me</div>
  <div>
    <div>Title</div>
    <div>Content</div>
  </div>
`
```

#### ✅ Solución: Elementos Semánticos
```javascript
html`
  <button onClick=${handleClick}>Click me</button>
  <article>
    <h2>Title</h2>
    <p>Content</p>
  </article>
`
```

### 2. ARIA Labels y Roles

#### ❌ Problema: Sin Contexto para Screen Readers
```javascript
html`
  <div>
    <span>×</span>
  </div>
`
```

#### ✅ Solución: ARIA Apropiado
```javascript
html`
  <button
    aria-label="Cerrar modal"
    onClick=${onClose}
    type="button"
  >
    <span aria-hidden="true">×</span>
  </button>
`
```

### 3. Keyboard Navigation

#### ❌ Problema: Solo Mouse Funciona
```javascript
html`
  <div onClick=${handleClick}>
    Clickeable
  </div>
`
```

#### ✅ Solución: Teclado + Mouse
```javascript
const handleKeyDown = (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handleClick(e);
  }
};

html`
  <div
    role="button"
    tabindex="0"
    onClick=${handleClick}
    onKeyDown=${handleKeyDown}
    aria-label="Acción"
  >
    Clickeable
  </div>
`

// ✅ MEJOR: Usar <button> directamente
html`<button onClick=${handleClick}>Clickeable</button>`
```

### 4. Focus Management

#### ✅ Focus Visible
```javascript
const baseClasses = 'focus:outline-none '
  + 'focus:ring-2 '
  + 'focus:ring-[var(--focus-outline-color)] '
  + 'focus:ring-offset-2 ';
```

#### ✅ Focus Trap en Modales
```javascript
const modalRef = useRef(null);
const firstFocusableRef = useRef(null);
const lastFocusableRef = useRef(null);

useEffect(() => {
  if (!isOpen || !modalRef.current) return;
  
  // Auto-focus primer elemento
  const focusableElements = modalRef.current.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  if (focusableElements.length > 0) {
    firstFocusableRef.current = focusableElements[0];
    lastFocusableRef.current = focusableElements[focusableElements.length - 1];
    firstFocusableRef.current.focus();
  }
  
  // Trap focus
  const handleTabKey = (e) => {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      if (document.activeElement === firstFocusableRef.current) {
        e.preventDefault();
        lastFocusableRef.current.focus();
      }
    } else {
      if (document.activeElement === lastFocusableRef.current) {
        e.preventDefault();
        firstFocusableRef.current.focus();
      }
    }
  };
  
  modalRef.current.addEventListener('keydown', handleTabKey);
  
  return () => {
    modalRef.current?.removeEventListener('keydown', handleTabKey);
  };
}, [isOpen]);
```

### 5. Color Contrast

#### ✅ Verificar Contraste WCAG AA (4.5:1 texto normal, 3:1 texto grande)
```javascript
// ❌ MAL - Bajo contraste
const styles = {
  backgroundColor: '#f5f5f5',  // Gris claro
  color: '#d0d0d0',            // Gris más claro - bajo contraste
};

// ✅ BIEN - Alto contraste
const styles = {
  backgroundColor: 'var(--bg-page-lighter)',  // #f5f5f5
  color: 'var(--text-normal-primary)',        // #1b1b1b - alto contraste
};
```

### 6. Alt Text en Imágenes

#### ❌ Problema: Sin Alt o Alt Genérico
```javascript
html`
  <img src=${image} />
  <img src=${image} alt="imagen" />
`
```

#### ✅ Solución: Alt Descriptivo
```javascript
html`
  <img
    src=${image}
    alt="Vista aérea del Aeropuerto El Dorado de Bogotá al atardecer"
    loading="lazy"
  />
  
  <!-- Para imágenes decorativas -->
  <img
    src=${decorativeImage}
    alt=""
    role="presentation"
    loading="lazy"
  />
`
```

### 7. Form Labels

#### ❌ Problema: Input sin Label
```javascript
html`
  <input type="text" placeholder="Nombre" />
`
```

#### ✅ Solución: Label Asociado
```javascript
const inputId = `input-${Math.random().toString(36).substr(2, 9)}`;

html`
  <label for=${inputId}>Nombre</label>
  <input
    type="text"
    id=${inputId}
    placeholder="Ingrese su nombre"
    aria-required="true"
  />
`
```

### 8. ARIA Live Regions

#### ✅ Anunciar Cambios Dinámicos
```javascript
const [message, setMessage] = useState('');

html`
  <div
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    ${message}
  </div>
`
```

### 9. Skip Links

#### ✅ Navegación Rápida para Teclado
```javascript
// En headers/layouts
html`
  <a
    href="#main-content"
    class="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-white"
  >
    Saltar al contenido principal
  </a>
  
  <main id="main-content">
    <!-- Content -->
  </main>
`
```

### 10. Reduced Motion

#### ✅ Respetar Preferencias de Usuario
```javascript
// En CSS o inline styles
const respectMotionPreference = () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  return prefersReducedMotion
    ? {
        transition: 'none',
        animation: 'none',
      }
    : {
        transition: 'var(--transition-all)',
      };
};

// En componente
const transitionStyles = respectMotionPreference();

html`<div style=${transitionStyles}>Content</div>`
```

---

## 🏆 Best Practices Optimization

### 1. Evitar console.log en Producción

#### ❌ Problema: Logs en Producción
```javascript
export const Component = ({ data }) => {
  console.log('Component data:', data);  // ❌
  return html`<div>${data}</div>`;
};
```

#### ✅ Solución: Logs Condicionales
```javascript
const isDev = window.location.hostname === 'localhost';

export const Component = ({ data }) => {
  if (isDev) {
    console.log('Component data:', data);  // ✅ Solo en dev
  }
  return html`<div>${data}</div>`;
};
```

### 2. Error Boundaries (Preact)

#### ✅ Manejar Errores Gracefully
```javascript
import { Component as PreactComponent } from '@dropins/tools/preact.js';

class ErrorBoundary extends PreactComponent {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return html`
        <div role="alert" class="error-message">
          <p>Algo salió mal. Por favor, recarga la página.</p>
        </div>
      `;
    }

    return this.props.children;
  }
}
```

### 3. Prop Validation

#### ✅ Validar Props
```javascript
export const Component = ({
  variant = 'default',
  size = 'md',
  children,
}) => {
  // Validación en desarrollo
  if (process.env.NODE_ENV !== 'production') {
    const validVariants = ['default', 'primary', 'secondary'];
    if (!validVariants.includes(variant)) {
      console.warn(`Invalid variant "${variant}". Valid options: ${validVariants.join(', ')}`);
    }
  }
  
  return html`<div>${children}</div>`;
};
```

### 4. Secure Links (rel="noopener noreferrer")

#### ❌ Problema: Links Externos sin Seguridad
```javascript
html`
  <a href="https://external-site.com" target="_blank">
    External Link
  </a>
`
```

#### ✅ Solución: Seguridad en Links
```javascript
html`
  <a
    href="https://external-site.com"
    target="_blank"
    rel="noopener noreferrer"
  >
    External Link
  </a>
`
```

### 5. XSS Prevention

#### ❌ Problema: Renderizar HTML Crudo
```javascript
// Peligroso si userContent viene de usuario
html`<div innerHTML=${userContent}></div>`
```

#### ✅ Solución: Sanitizar o Escapar
```javascript
// HTM escapa automáticamente
html`<div>${userContent}</div>`  // ✅ Seguro

// Si necesitas HTML, sanitizar primero
import DOMPurify from 'dompurify';

const sanitizedContent = DOMPurify.sanitize(userContent);
html`<div innerHTML=${sanitizedContent}></div>`  // ✅ Sanitizado
```

### 6. Use HTTPS para Recursos

#### ❌ Problema: HTTP en Recursos
```javascript
const imageUrl = 'http://example.com/image.jpg';
```

#### ✅ Solución: HTTPS Siempre
```javascript
const imageUrl = 'https://example.com/image.jpg';

// O usar URLs relativas
const imageUrl = '/assets/images/image.jpg';
```

### 7. Evitar document.write

#### ❌ Problema: document.write Bloquea Render
```javascript
document.write('<div>Content</div>');  // ❌ Nunca hacer
```

#### ✅ Solución: Manipulación DOM Moderna
```javascript
// Preact maneja esto automáticamente
html`<div>Content</div>`
```

### 8. Resource Hints

#### ✅ Preconnect a Dominios Externos
```javascript
// En head.html o componente
html`
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="dns-prefetch" href="https://analytics.google.com" />
`
```

### 9. Cache-Busting para Assets

#### ✅ Versionado de Assets
```javascript
// AEM EDS maneja esto automáticamente
// Pero para assets custom:
const imageUrl = `/assets/logo.png?v=${buildVersion}`;
```

### 10. Avoid Deprecated APIs

#### ❌ Evitar APIs Deprecated
```javascript
// ❌ Deprecated
event.keyCode

// ✅ Moderno
event.key
```

---

## 🔍 SEO Optimization

### 1. Semantic HTML Structure

#### ✅ Jerarquía de Headings Correcta
```javascript
html`
  <article>
    <h1>Título Principal (Solo uno por página)</h1>
    <section>
      <h2>Sección 1</h2>
      <h3>Subsección 1.1</h3>
      <h3>Subsección 1.2</h3>
    </section>
    <section>
      <h2>Sección 2</h2>
      <h3>Subsección 2.1</h3>
    </section>
  </article>
`
```

### 2. Meta Descriptions (Para Blocks de AEM)

#### ✅ Descriptivo y Conciso
```javascript
// En head.html o metadata
html`
  <meta
    name="description"
    content="Reserva vuelos con Avianca. Encuentra las mejores tarifas y destinos en Colombia y América Latina."
  />
`
```

### 3. Structured Data (Schema.org)

#### ✅ JSON-LD para Rich Snippets
```javascript
// Para componentes de productos, eventos, etc.
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Vuelo Bogotá - Miami',
  description: 'Vuelo directo con Avianca',
  offers: {
    '@type': 'Offer',
    price: '450.00',
    priceCurrency: 'USD',
  },
};

html`
  <script type="application/ld+json">
    ${JSON.stringify(structuredData)}
  </script>
`
```

### 4. Internal Linking

#### ✅ Links Descriptivos
```javascript
// ❌ MAL
html`<a href="/destinos">Click aquí</a>`

// ✅ BIEN
html`<a href="/destinos">Explora nuestros destinos en América Latina</a>`
```

### 5. Image Optimization

#### ✅ Nombres de Archivo Descriptivos + Alt
```javascript
// ❌ MAL
const image = '/assets/img001.jpg';
html`<img src=${image} alt="imagen" />`

// ✅ BIEN
const image = '/assets/avianca-boeing-787-bogota-airport.jpg';
html`
  <img
    src=${image}
    alt="Avianca Boeing 787 Dreamliner en el Aeropuerto El Dorado de Bogotá"
    width="800"
    height="600"
    loading="lazy"
  />
`
```

### 6. Mobile-Friendly

#### ✅ Responsive Design
```javascript
// Tailwind responsive classes
const classes = 'flex flex-col '
  + 'sm:flex-row '           // Tablet: row
  + 'lg:gap-[var(--gap-x-large)] '  // Desktop: más gap
  + 'px-4 sm:px-6 lg:px-8';   // Responsive padding
```

### 7. Canonical URLs

#### ✅ Evitar Contenido Duplicado
```javascript
// En head.html
html`
  <link rel="canonical" href="https://www.avianca.com/es/destinos/bogota" />
`
```

### 8. Open Graph Tags

#### ✅ Social Media Preview
```javascript
// En head.html o metadata
html`
  <meta property="og:title" content="Vuelos Avianca - Bogotá a Miami" />
  <meta property="og:description" content="Encuentra las mejores tarifas..." />
  <meta property="og:image" content="https://www.avianca.com/og-image.jpg" />
  <meta property="og:url" content="https://www.avianca.com/vuelos/bogota-miami" />
  <meta property="og:type" content="website" />
`
```

### 9. Breadcrumbs

#### ✅ Navegación Clara
```javascript
html`
  <nav aria-label="Breadcrumb">
    <ol class="flex gap-2" itemscope itemtype="https://schema.org/BreadcrumbList">
      <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
        <a itemprop="item" href="/">
          <span itemprop="name">Inicio</span>
        </a>
        <meta itemprop="position" content="1" />
      </li>
      <li aria-hidden="true">/</li>
      <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
        <a itemprop="item" href="/destinos">
          <span itemprop="name">Destinos</span>
        </a>
        <meta itemprop="position" content="2" />
      </li>
      <li aria-hidden="true">/</li>
      <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
        <span itemprop="name">Bogotá</span>
        <meta itemprop="position" content="3" />
      </li>
    </ol>
  </nav>
`
```

### 10. Page Speed

#### ✅ Minimize HTTP Requests
```javascript
// Combinar estilos en un solo archivo (Tailwind compilado)
// Evitar múltiples archivos CSS

// Lazy load componentes no críticos
const HeavyComponent = lazy(() => import('./heavy-component.js'));
```

---

## 📋 Optimization Checklist

### Performance ⚡

- [ ] **No re-renders innecesarios** - Handlers estables, estado derivado
- [ ] **useEffect con cleanup** - Siempre remover listeners
- [ ] **Dependencies completas** - Arrays de dependencias correctos
- [ ] **Lazy loading imágenes** - `loading="lazy"` + dimensiones
- [ ] **Transiciones optimizadas** - Solo `transform` y `opacity`
- [ ] **No layout thrashing** - Batch reads/writes
- [ ] **CSS Variables** - En lugar de cálculos inline
- [ ] **Named imports** - No importar todo (`import *`)
- [ ] **Passive listeners** - Para scroll/touch events
- [ ] **Debounce/throttle** - Eventos costosos (input, resize, scroll)

### Accessibility ♿

- [ ] **Semantic HTML** - `<button>`, `<nav>`, `<article>`, `<h1-h6>`
- [ ] **ARIA labels** - `aria-label`, `aria-labelledby`, `aria-describedby`
- [ ] **Keyboard navigation** - `tabindex`, `onKeyDown`, Enter/Space
- [ ] **Focus management** - `focus:ring-*`, focus trap en modals
- [ ] **Color contrast** - WCAG AA 4.5:1 (texto), 3:1 (UI)
- [ ] **Alt text** - Descriptivo para imágenes, `alt=""` para decorativas
- [ ] **Form labels** - `<label for="">` asociado a inputs
- [ ] **ARIA live** - `role="status"`, `aria-live="polite"`
- [ ] **Skip links** - Para navegación rápida
- [ ] **Reduced motion** - Respetar `prefers-reduced-motion`

### Best Practices 🏆

- [ ] **No console.log** - Solo en desarrollo
- [ ] **Error boundaries** - Manejo graceful de errores
- [ ] **Prop validation** - Warnings en desarrollo
- [ ] **Secure links** - `rel="noopener noreferrer"` en `target="_blank"`
- [ ] **XSS prevention** - HTM escapa automáticamente, sanitizar HTML
- [ ] **HTTPS** - Todos los recursos externos
- [ ] **No document.write** - Usar DOM APIs modernas
- [ ] **Resource hints** - `preconnect`, `dns-prefetch`
- [ ] **Cache-busting** - Versionado de assets
- [ ] **No deprecated APIs** - `event.key` en lugar de `event.keyCode`

### SEO 🔍

- [ ] **Semantic structure** - Jerarquía de headings correcta
- [ ] **Meta descriptions** - Descriptivo, 150-160 caracteres
- [ ] **Structured data** - JSON-LD Schema.org
- [ ] **Internal linking** - Links descriptivos (no "click aquí")
- [ ] **Image optimization** - Alt descriptivo, nombres de archivo SEO
- [ ] **Mobile-friendly** - Responsive design, touch targets 44x44px
- [ ] **Canonical URLs** - Evitar contenido duplicado
- [ ] **Open Graph** - og:title, og:description, og:image
- [ ] **Breadcrumbs** - Navegación + Schema markup
- [ ] **Page speed** - Minimize requests, lazy load, code splitting

---

## 🧪 Testing & Validation

### 1. Lighthouse CI

```bash
# Instalar Lighthouse CI
npm install -g @lhci/cli

# Correr Lighthouse
lhci autorun --collect.url=http://localhost:3000/design-system-block

# Configuración .lighthouserc.json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.9}],
        "categories:accessibility": ["error", {"minScore": 0.9}],
        "categories:best-practices": ["error", {"minScore": 0.9}],
        "categories:seo": ["error", {"minScore": 0.9}]
      }
    }
  }
}
```

### 2. Chrome DevTools MCP (Si Disponible)

```javascript
// Usar el MCP para:
// 1. Performance trace - Identificar bottlenecks
// 2. Accessibility audit - WCAG violations
// 3. Network panel - Resource optimization
// 4. Coverage - Código no usado
// 5. Lighthouse - Scores automáticos
```

### 3. Axe DevTools (Accessibility)

```bash
# Extensión de Chrome para testing de accesibilidad
# https://chrome.google.com/webstore/detail/axe-devtools-web-accessib/
```

### 4. Manual Testing

#### Performance
- [ ] Abrir DevTools → Performance tab
- [ ] Grabar interacción (click, scroll, hover)
- [ ] Revisar:
  - FPS (debe ser ~60)
  - No long tasks (> 50ms)
  - No layout thrashing

#### Accessibility
- [ ] Navegar solo con teclado (Tab, Enter, Space, Escape)
- [ ] Probar con screen reader (NVDA, JAWS, VoiceOver)
- [ ] Verificar contraste de colores
- [ ] Probar zoom 200%

#### Responsive
- [ ] Mobile (320px - 640px)
- [ ] Tablet (640px - 1024px)
- [ ] Desktop (1024px+)
- [ ] Landscape/Portrait

#### Browser Testing
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (macOS/iOS)

---

## 📊 Performance Budgets

### Tamaños Recomendados

| Asset Type | Budget | Componente Típico |
|------------|--------|-------------------|
| **JS Total** | < 200 KB | Todo el componente + deps |
| **CSS Total** | < 50 KB | Tailwind compilado |
| **Imágenes** | < 500 KB | Por imagen (optimizada) |
| **Total Page** | < 1 MB | Primera carga |

### Métricas Core Web Vitals

| Métrica | Bueno | Necesita Mejora | Pobre |
|---------|-------|-----------------|-------|
| **LCP** | < 2.5s | 2.5s - 4s | > 4s |
| **FID/INP** | < 100ms | 100ms - 300ms | > 300ms |
| **CLS** | < 0.1 | 0.1 - 0.25 | > 0.25 |

---

## 🔧 Optimization Tools

### 1. Image Optimization

```bash
# Squoosh CLI para optimizar imágenes
npm install -g @squoosh/cli

squoosh-cli --resize '{width: 800}' --webp '{}' input.jpg
```

### 2. Bundle Analyzer

```bash
# Analizar tamaño del bundle
npm install -g source-map-explorer

# Después del build
source-map-explorer scripts/**/*.js
```

### 3. Webhint

```bash
# Linter de mejores prácticas web
npm install -g hint

hint http://localhost:3000/design-system-block
```

---

## 🎯 Component Optimization Workflow

### Paso 1: Auditoría Inicial
1. Correr Lighthouse en componente
2. Identificar issues por categoría
3. Priorizar por impacto (alto → bajo)

### Paso 2: Performance
1. Revisar re-renders (React DevTools Profiler)
2. Optimizar useEffect dependencies
3. Lazy load imágenes
4. Optimizar transiciones CSS
5. Debounce/throttle eventos

### Paso 3: Accessibility
1. Usar semantic HTML
2. Agregar ARIA labels
3. Implementar keyboard navigation
4. Verificar color contrast
5. Agregar alt text

### Paso 4: Best Practices
1. Eliminar console.logs
2. Agregar error handling
3. Validar props
4. Secure external links
5. Use HTTPS

### Paso 5: SEO
1. Semantic structure (headings)
2. Descriptive links
3. Optimize images (alt, filename)
4. Mobile-friendly
5. Structured data (si aplica)

### Paso 6: Re-test
1. Correr Lighthouse de nuevo
2. Comparar scores
3. Iterar en issues restantes
4. Documentar optimizaciones

---

## 📈 Optimization Patterns por Tipo

### Átomos (Buttons, Inputs, Icons)
**Focus:** Performance + Accessibility

```javascript
export const Button = ({ variant = 'primary', disabled = false, children, ...rest }) => {
  // ✅ Performance: No re-renders innecesarios
  // ✅ Accessibility: Semantic <button>, disabled state
  // ✅ Best Practices: Prop validation
  
  const baseClasses = 'inline-flex items-center justify-center '
    + 'px-[var(--spacing-medium)] py-[var(--spacing-small)] '
    + 'rounded-[var(--border-radius-large)] '
    + 'transition-[transform,opacity] duration-[var(--transition-fast)] '  // Performance
    + 'focus:outline-none focus:ring-2 focus:ring-[var(--focus-outline-color)] '  // Accessibility
    + (disabled ? '!opacity-50 !cursor-not-allowed' : 'hover:scale-105 active:scale-95');
  
  return html`
    <button
      class=${baseClasses}
      disabled=${disabled}
      aria-disabled=${disabled}
      ...${rest}
    >
      ${children}
    </button>
  `;
};
```

### Moléculas (Modals, Dropdowns, Cards)
**Focus:** Performance + Accessibility + Best Practices

```javascript
export const Modal = ({ isOpen, onClose, children, ariaLabel = 'Modal' }) => {
  const modalRef = useRef(null);
  
  // ✅ Performance: Cleanup listeners
  useEffect(() => {
    if (!isOpen) return;
    
    // Focus trap
    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements?.[0]) {
      focusableElements[0].focus();
    }
    
    // Accessibility: Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    
    // Performance: Body scroll prevention
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  return html`
    <div
      class="fixed inset-0 z-50 flex items-center justify-center"
      onClick=${onClose}
    >
      <!-- Accessibility: Overlay -->
      <div
        class="absolute inset-0 bg-[var(--modal-overlay-bg)]"
        aria-hidden="true"
      />
      
      <!-- Accessibility: Modal proper -->
      <div
        ref=${modalRef}
        role="dialog"
        aria-modal="true"
        aria-label=${ariaLabel}
        class="relative z-10 max-w-md p-6 bg-white rounded-lg"
        onClick=${(e) => e.stopPropagation()}
      >
        ${children}
      </div>
    </div>
  `;
};
```

### Organismos (Headers, Footers, Complex Cards)
**Focus:** All 4 Categories + SEO

```javascript
export const Header = ({ logo, navigation, searchEnabled = true }) => {
  // ✅ SEO: Semantic <header>, <nav>
  // ✅ Accessibility: Skip link, ARIA labels
  // ✅ Performance: Debounced search
  // ✅ Best Practices: Error handling
  
  return html`
    <header role="banner" class="sticky top-0 z-50 bg-white shadow-sm">
      <!-- Accessibility: Skip link -->
      <a
        href="#main-content"
        class="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4"
      >
        Saltar al contenido principal
      </a>
      
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- SEO: Logo with alt -->
          <a href="/" aria-label="Ir a la página principal de Avianca">
            <img
              src=${logo}
              alt="Logo de Avianca"
              width="120"
              height="40"
              loading="eager"
            />
          </a>
          
          <!-- SEO + Accessibility: Semantic nav -->
          <nav role="navigation" aria-label="Navegación principal">
            <!-- Navigation items -->
          </nav>
        </div>
      </div>
    </header>
  `;
};
```

---

## 🚀 Quick Wins (Alto Impacto, Bajo Esfuerzo)

### 1. Agregar `loading="lazy"` a Imágenes
```javascript
html`<img src=${src} alt=${alt} loading="lazy" width="800" height="600" />`
```

### 2. Agregar Dimensiones a Imágenes
```javascript
// Previene CLS (Cumulative Layout Shift)
html`<img src=${src} alt=${alt} width="800" height="600" />`
```

### 3. Usar Semantic HTML
```javascript
// Cambiar <div onClick> por <button>
html`<button onClick=${handleClick}>Click</button>`
```

### 4. Agregar Alt Text Descriptivo
```javascript
// De: alt="imagen"
// A: alt="Vista aérea del Aeropuerto El Dorado de Bogotá"
```

### 5. Focus Visible Styles
```javascript
const classes = 'focus:outline-none focus:ring-2 focus:ring-blue-500';
```

### 6. rel="noopener noreferrer" en Links Externos
```javascript
html`<a href=${url} target="_blank" rel="noopener noreferrer">Link</a>`
```

### 7. Passive Event Listeners
```javascript
window.addEventListener('scroll', handleScroll, { passive: true });
```

### 8. Cleanup useEffect
```javascript
useEffect(() => {
  const handler = () => {};
  document.addEventListener('event', handler);
  return () => document.removeEventListener('event', handler);
}, []);
```

### 9. Debounce Input Events
```javascript
const handleInput = debounce((value) => search(value), 300);
```

### 10. Use CSS Variables (No Hardcoded)
```javascript
// De: padding: '16px'
// A: class="px-[var(--spacing-medium)]"
```

---

## 📚 Resources & Documentation

### Official Docs
- **Lighthouse**: https://developers.google.com/web/tools/lighthouse
- **Web Vitals**: https://web.dev/vitals/
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **Schema.org**: https://schema.org/
- **Preact**: https://preactjs.com/

### Testing Tools
- **Chrome Lighthouse**: Built into DevTools
- **axe DevTools**: https://www.deque.com/axe/devtools/
- **WebPageTest**: https://www.webpagetest.org/
- **PageSpeed Insights**: https://pagespeed.web.dev/

### AEM EDS Specific
- **Edge Delivery**: https://www.aem.live/developer/tutorial
- **Performance Guide**: https://www.aem.live/docs/experimentation

---

## 🎯 Summary

Este agente garantiza que cada componente del Design System de Avianca esté optimizado para:

✅ **Performance**: Re-renders minimizados, lazy loading, transiciones optimizadas, debouncing
✅ **Accessibility**: Semantic HTML, ARIA, keyboard navigation, color contrast, screen readers
✅ **Best Practices**: Error handling, secure links, XSS prevention, no deprecated APIs
✅ **SEO**: Semantic structure, meta tags, structured data, image optimization, mobile-friendly

**Resultado:** Componentes que logran **90+ en todas las categorías de Lighthouse** y proporcionan la mejor experiencia de usuario posible en el ecosistema AEM Edge Delivery Services.

---

*Optimiza primero, pregunta después. Every millisecond counts. Every pixel matters.* ⚡♿🏆🔍
