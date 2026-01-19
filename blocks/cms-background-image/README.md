# CMS Background Image Block

Componente decorativo que aplica una imagen de fondo al elemento `<main>` de la página. Soporta imágenes responsive para mobile, tablet y desktop.

## 🎯 Propósito

- Proporcionar una imagen de fondo decorativa configurable desde AEM
- Soportar diferentes imágenes para mobile (< 768px), tablet (768px-1279px) y desktop (≥ 1280px)
- No interferir con componentes funcionales (siempre en z-index más bajo)
- Cumplir criterios SEO y accesibilidad (imagen decorativa sin alt text)

## 📐 Figma Design

[Ver componente en Figma](https://www.figma.com/design/aNpEjeC8fQijo2i21zESAs/-ENTREGABLE----HOME-2026?node-id=479-33894)

## 🏗️ Estructura en AEM

```
CMS Background Image
| Mobile Image   | [Upload image]       |
| Tablet Image   | [Upload image]       |
| Desktop Image  | [Upload image]       |
| Fallback Color | #f5f5f5              |
| Position       | top right            |
| Behavior       | scroll               |
| Size           | contain              |
| Enabled        | true                 |
```

### Campos Configurables

| Campo | Descripción | Valores | Requerido |
|-------|-------------|---------|-----------|
| Mobile Image | Imagen para dispositivos móviles (< 768px) | Imagen JPG/PNG/WEBP/SVG | Sí (al menos 1 imagen) |
| Tablet Image | Imagen para tablets (768px-1279px) | Imagen JPG/PNG/WEBP/SVG | No (usa mobile si no se proporciona) |
| Desktop Image | Imagen para desktop (≥ 1280px) | Imagen JPG/PNG/WEBP/SVG | No (usa tablet/mobile si no se proporciona) |
| Fallback Color | Color de fondo mientras carga la imagen | Hex color (#f5f5f5) | No (default: #f5f5f5) |
| Position | Posición de la imagen | `center`, `top`, `bottom`, `left`, `right`, `top left`, etc. | No (default: center) |
| Behavior | Comportamiento al hacer scroll | `scroll` (se mueve con el contenido) o `fixed` (efecto parallax) | No (default: scroll) |
| Size | Tamaño de la imagen de fondo | `cover` (llena toda el área) o `contain` (ajusta imagen completa) | No (default: cover) |
| Enabled | Habilitar/deshabilitar el componente | `true` o `false` | No (default: true) |

## 🎨 Comportamientos

### Scroll (default)
La imagen se mueve con el contenido al hacer scroll.
```
| Behavior | scroll |
```

### Fixed (parallax)
La imagen permanece fija mientras el contenido hace scroll, creando un efecto parallax.
```
| Behavior | fixed |
```

## 🚀 Feature Flags

El componente soporta dos niveles de feature flags:

### 1. Feature Flag Global (Metadata)
```html
<!-- En head.html o metadata de la página -->
<meta name="feature-cms-background-image" content="true">
```

### 2. Feature Flag Programático
```javascript
// Configuración global (ej: en scripts.js)
window.aviancaConfig = {
  features: {
    cmsBackgroundImage: true
  }
};
```

### 3. Feature Flag por Instancia
```
| Enabled | false |
```

**Prioridad:** Instancia > Metadata > Global Config > Default (true)

## 📱 Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1279px (var(--screen-md))
- **Desktop**: ≥ 1280px (var(--screen-xl))

## 🔍 SEO y Accesibilidad

### ✅ Implementación SEO-Friendly

1. **CSS `background-image`** en lugar de `<img>`:
   - No requiere alt text (es decorativa)
   - No compite con imágenes de contenido en búsqueda
   - No satura el DOM con elementos no semánticos

2. **Performance**:
   - Carga con baja prioridad automáticamente
   - No bloquea la carga del contenido principal
   - Lazy loading natural del navegador

3. **Accesibilidad (WCAG AA)**:
   - Lectores de pantalla ignoran el background (correcto)
   - No interrumpe la navegación por teclado
   - Cumple con criterio de imágenes decorativas

### ⚠️ Lo que NO hace (y por qué está bien)

- ❌ **No indexa en Google Images** → ✅ Correcto, es decorativa
- ❌ **No tiene alt text** → ✅ Correcto según WCAG (decorativas no deben tenerlo)
- ❌ **No aparece en HTML source** → ✅ Correcto, es presentación (CSS)

### 🎯 Cuando NO usar este componente

Si la imagen necesita SEO (banner de producto, promoción importante), usar `cms-hero-banner` en su lugar.

## 🎨 Características CSS

### Z-Index Hierarchy
- Background image: `z-index: -1` (más bajo)
- Contenido: `z-index: 1` (por encima)
- Header/Components: z-index normal

### Responsive
- Mobile-first approach
- Media queries en 768px (tablet) y 1280px (desktop)

### Accessibility
- Respeta `prefers-reduced-motion` (desactiva parallax)
- Respeta `prefers-contrast: high` (oculta background)
- No se imprime (`@media print`)

### Performance
- GPU acceleration para backgrounds fixed
- Will-change para optimizar animaciones

## 💻 Ejemplo de Uso en AEM

### Configuración Completa
```
CMS Background Image
| Mobile Image   | /assets/bg-mobile.jpg    |
| Tablet Image   | /assets/bg-tablet.jpg    |
| Desktop Image  | /assets/bg-desktop.jpg   |
| Fallback Color | #e6f0ff                  |
| Position       | center                   |
| Behavior       | scroll                   |
| Enabled        | true                     |
```

### Configuración Mínima (Solo 1 imagen)
```
CMS Background Image
| Mobile Image   | /assets/bg.jpg           |
| Fallback Color | #f5f5f5                  |
```

> **Nota**: Si solo se proporciona mobile image, se usará para todos los tamaños de pantalla.

### Configuración con Parallax
```
CMS Background Image
| Desktop Image  | /assets/bg-hero.jpg      |
| Fallback Color | #000000                  |
| Position       | center                   |
| Behavior       | fixed                    |
```

## 🐛 Debugging

En localhost, el componente logea su configuración en la consola:

```javascript
console.log('CMS Background Image applied:', {
  mobileImage: '/assets/bg-mobile.jpg',
  tabletImage: '/assets/bg-tablet.jpg',
  desktopImage: '/assets/bg-desktop.jpg',
  fallbackColor: '#f5f5f5',
  position: 'center',
  behavior: 'scroll'
});
```

## ⚠️ Validaciones

El componente se auto-destruye y muestra warnings si:

1. Feature flag está deshabilitado:
   ```
   CMS Background Image: Feature is disabled via feature flag.
   ```

2. No se proporciona ninguna imagen:
   ```
   CMS Background Image: No images provided. Block will not be applied.
   ```

3. No se encuentra el elemento `<main>`:
   ```
   CMS Background Image: <main> element not found.
   ```

4. La instancia está deshabilitada:
   ```
   CMS Background Image: Block instance is disabled.
   ```

## 📦 Formatos Soportados

- JPG / JPEG
- PNG
- WEBP (recomendado para mejor performance)
- SVG

## 🎯 Mejores Prácticas

1. **Optimizar imágenes**: Usar WEBP cuando sea posible
2. **Tamaños recomendados**:
   - Mobile: 768px ancho
   - Tablet: 1280px ancho
   - Desktop: 1920px ancho
3. **Peso**: < 200KB por imagen (usar compresión)
4. **Fallback color**: Usar color dominante de la imagen
5. **Testing**: Validar en diferentes dispositivos y conexiones

## 🔗 Referencias

- [Figma Design](https://www.figma.com/design/aNpEjeC8fQijo2i21zESAs/-ENTREGABLE----HOME-2026?node-id=479-33894)
- [WCAG 2.1 - Decorative Images](https://www.w3.org/WAI/tutorials/images/decorative/)
- [Google SEO - Background Images](https://developers.google.com/search/docs/appearance/google-images)
