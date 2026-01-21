# Universal Editor Author Mode Pattern

## Problema Identificado

### ❌ Enfoque que NO funciona: `window.xwalk?.isAuthorEnv`

```javascript
const isAuthorEnv = window.xwalk?.isAuthorEnv; // ⚠️ TIMING ISSUE - SIEMPRE UNDEFINED
```

**Razón del fallo**: Cuando la función `decorate()` se ejecuta durante la carga de la página, `window.xwalk` aún **no está definido** o `isAuthorEnv` no está disponible. Este es un **timing issue inherente al boilerplate de AEM EDS**, no causado por código custom.

### Flujo de carga que causa el problema:

1. **Inicio de página**: `loadPage()` en `scripts.js` (línea ~145)
2. **Eager loading**: `loadEager()` → `decorateMain()` → `decorateBlocks()` → `loadBlock()`
3. **Carga dinámica**: Cada `loadBlock()` hace `await import('.../blocks/{block}/{block}.js')`
4. **Ejecución inmediata**: `decorate(block)` se ejecuta al importar el módulo
5. **❌ `window.xwalk` aún no existe** - Universal Editor lo inyecta después en el iframe
6. **Resultado**: `window.xwalk?.isAuthorEnv` retorna `undefined` en el 100% de los casos

**Confirmado**: Revisión completa del código (`scripts.js`, `aem.js`, `editor-support.js`, `head.html`) **no muestra ninguna manipulación custom de `window.xwalk`**. El problema es timing del boilerplate original.

**Síntomas**:
- La variable siempre retorna `undefined`
- El bloque se renderiza en modo producción incluso en Universal Editor
- Los hijos (children) no aparecen en el Content Tree
- El contenido no es editable en Universal Editor

---

## ✅ Solución: Detección basada en hostname

### Patrón Limpio Recomendado

```javascript
/**
 * Decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  // Author Mode detection using hostname (RELIABLE)
  const isAuthorEnv = window.location.hostname.includes('author-') 
    || window.location.hostname.includes('adobeaemcloud.com');

  if (isAuthorEnv) {
    // Hide original DOM but keep it in the DOM tree for Universal Editor
    block.style.display = 'none';
    
    // Render the Preact component as a sibling
    const previewContainer = document.createElement('div');
    previewContainer.className = 'your-block-preview';
    
    // ... render your component into previewContainer ...
    
    // Insert preview as sibling to maintain editability
    block.parentNode.insertBefore(previewContainer, block.nextSibling);
    
    return;
  }

  // Production mode: normal rendering
  // ... your production rendering code ...
}
```

---

## Por qué este patrón funciona

### 1. **Original DOM preservado**
```javascript
block.style.display = 'none';
```
- El DOM original permanece en el árbol (solo oculto)
- Universal Editor puede acceder a la estructura HTML original
- Los hijos (children) son visibles y editables en Content Tree
- Los atributos `data-aue-*` siguen funcionando

### 2. **Preview limpio como sibling**
```javascript
block.parentNode.insertBefore(previewContainer, block.nextSibling);
```
- La vista previa renderizada se inserta como hermano (sibling)
- El autor ve una representación visual limpia del componente
- No hay indicadores visuales confusos (borders, labels, etc.)
- La apariencia coincide con producción

### 3. **Detección confiable**
```javascript
const isAuthorEnv = window.location.hostname.includes('author-') 
  || window.location.hostname.includes('adobeaemcloud.com');
```
- `window.location` está **siempre disponible**
- No depende de scripts externos que se cargan después
- Funciona en 100% de los casos
- Simple y predecible

---

## Ejemplos Implementados

### Bloques que usan este patrón:

1. **cms-mosaic-cards** (`/blocks/cms-mosaic-cards/cms-mosaic-cards.js`)
   - Parent-child pattern con Link Cards
   - Oculta DOM original, renderiza LinkCard components como preview
   
2. **origin-dropdown-selector** (`/blocks/origin-dropdown-selector/origin-dropdown-selector.js`)
   - Componente con lista de ciudades editables
   - Preview muestra HeadingDropdownSelector funcionando

3. **marquesina** (`/blocks/marquesina/marquesina.js`)
   - Banner sticky con contenido editable
   - Preview muestra Marquesina component con styling correcto

---

## Anti-patrones a Evitar

### ❌ Dual-display con indicadores visuales

```javascript
// NO HACER ESTO - confuso para autores
if (isAuthorEnv) {
  const editableContent = document.createElement('div');
  editableContent.style.border = '2px solid #0066cc';
  editableContent.textContent = '✏️ Contenido Editable';
  
  const preview = document.createElement('div');
  preview.style.border = '2px dashed #666';
  preview.textContent = '👁️ Vista Previa';
  
  block.appendChild(editableContent);
  block.appendChild(preview);
}
```

**Problemas**:
- Duplicación visual confusa
- Borders y labels distraen
- Ocupa doble espacio
- No representa la experiencia final

### ❌ Reemplazar contenido original

```javascript
// NO HACER ESTO - rompe editabilidad
if (isAuthorEnv) {
  block.innerHTML = ''; // ⚠️ Destruye el DOM original
  // ... render preview ...
}
```

**Problemas**:
- Destruye la estructura HTML original
- Universal Editor pierde referencia a elementos
- Los hijos no aparecen en Content Tree
- No se puede editar contenido

### ❌ Usar window.xwalk sin fallback

```javascript
// NO HACER ESTO - falla por timing
const isAuthorEnv = window.xwalk?.isAuthorEnv; // undefined!
```

**Problemas**:
- Timing issue garantizado
- No hay fallback confiable
- Comportamiento inconsistente
- Dificulta debugging

---

## Checklist de Implementación

Al implementar Author Mode en un bloque, asegúrate de:

- [ ] Usar detección por hostname (NO `window.xwalk?.isAuthorEnv`)
- [ ] Ocultar DOM original con `block.style.display = 'none'`
- [ ] Renderizar preview como sibling con `insertBefore(..., block.nextSibling)`
- [ ] NO usar borders, labels, o indicadores visuales
- [ ] NO duplicar contenido (editable + preview en mismo bloque)
- [ ] Mantener funcionalidad completa en preview (eventos, interacciones)
- [ ] Verificar que children aparecen en Content Tree
- [ ] Probar editabilidad de campos en Universal Editor

---

## Casos Especiales

### Bloques sin Preact (DOM manipulation puro)

Si tu bloque no usa Preact y solo manipula DOM:

```javascript
export default function decorate(block) {
  const isAuthorEnv = window.location.hostname.includes('author-') 
    || window.location.hostname.includes('adobeaemcloud.com');

  if (isAuthorEnv) {
    // Keep original DOM visible and editable
    // Don't transform anything
    return;
  }

  // Production mode: transform DOM
  const ul = document.createElement('ul');
  // ... DOM manipulation ...
  
  block.style.display = 'none';
  block.parentNode.insertBefore(ul, block.nextSibling);
}
```

### Bloques con configuración dinámica

Si tu bloque necesita leer configuración incluso en Author Mode:

```javascript
export default function decorate(block) {
  const isAuthorEnv = window.location.hostname.includes('author-') 
    || window.location.hostname.includes('adobeaemcloud.com');

  // Read config first (needed for both modes)
  const config = parseBlockConfig(block);

  if (isAuthorEnv) {
    block.style.display = 'none';
    
    const preview = renderPreview(config); // Use config for preview
    block.parentNode.insertBefore(preview, block.nextSibling);
    
    return;
  }

  // Production rendering with config
  renderProduction(block, config);
}
```

---

## Referencias

- **cms-mosaic-cards.js**: Parent-child pattern implementation
- **origin-dropdown-selector.js**: Component with event dispatch
- **marquesina.js**: Conditional rendering based on targeting rules
- **Universal Editor Docs**: https://experienceleague.adobe.com/docs/experience-manager-cloud-service/content/implementing/developing/universal-editor/introduction.html

---

## Última Actualización

**Fecha**: 2025-12-15  
**Patrón validado en**: cms-mosaic-cards, origin-dropdown-selector, marquesina  
**Status**: ✅ Producción estable
