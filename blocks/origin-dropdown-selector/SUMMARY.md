# 📦 Origin Dropdown Selector - Resumen de Cambios

## ✅ Cambios Implementados

### 1. **Modelo JSON Actualizado** ✅
- **Archivo:** `models/_component-models.json`
- **Cambios:**
  - ✅ Campo `titlePrefix` → renombrado a `label` (más claro)
  - ✅ Campo `defaultCity` → renombrado a `defaultValue` (especifica código IATA)
  - ✅ Campo `cityName` (text multi) → reemplazado por `cities` (container multi)
  - ✅ **Container structure:**
    ```json
    {
      "component": "container",
      "name": "cities",
      "multi": true,  // ⭐ CLAVE para multifield
      "fields": [
        { "name": "label", "component": "text" },  // Ej: "Bogotá (BOG)"
        { "name": "value", "component": "text" }   // Ej: "BOG"
      ]
    }
    ```

### 2. **Bloque JavaScript Refactorizado** ✅
- **Archivo:** `blocks/origin-dropdown-selector/origin-dropdown-selector.js`
- **Mejoras:**
  - ✅ Parsing correcto de container field (JSON.parse de array de strings)
  - ✅ Validación robusta de datos (try-catch, filtrado de items inválidos)
  - ✅ Búsqueda de ciudad por defecto por código (case-insensitive)
  - ✅ Fallback inteligente (primera ciudad si defaultValue no existe)
  - ✅ Logs detallados para debugging
  - ✅ Event dispatch mejorado con datos completos
  - ✅ Data attributes para acceso externo

### 3. **Documentación Creada** 📚
- ✅ `UNIVERSAL_EDITOR_GUIDE.md` - Guía completa de cómo funciona Universal Editor
- ✅ `TEST_GUIDE.html` - Casos de prueba y ejemplos visuales

---

## 🎯 Experiencia de Autoría (Universal Editor)

### Antes (❌ Poco amigable):
```
Ciudad (Nombre | Código): [text multi]
  ├─ "Bogotá | BOG"  // Manual, propenso a errores
  ├─ "Medellín | MDE"
```

### Después (✅ Estructurado):
```
Ciudades: [container]
  ├─ Ciudad 1
  │   ├─ Etiqueta: "Bogotá (BOG)"
  │   └─ Código: "BOG"
  ├─ Ciudad 2
  │   ├─ Etiqueta: "Medellín (MDE)"
  │   └─ Código: "MDE"
  └─ [+ Add Item]
```

---

## 🔄 Flujo de Datos Técnico

### 1. Universal Editor → AEM Cloud
```javascript
// Autor configura en el panel de propiedades:
{
  label: "Origen",
  defaultValue: "BOG",
  cities: [
    { label: "Bogotá (BOG)", value: "BOG" },
    { label: "Medellín (MDE)", value: "MDE" }
  ]
}
```

### 2. AEM Cloud → HTML (DOM)
```html
<div class="origin-dropdown-selector block">
  <div>
    <div>Label</div>
    <div><p>Origen</p></div>
  </div>
  <div>
    <div>DefaultValue</div>
    <div><p>BOG</p></div>
  </div>
  <div>
    <div>Cities</div>
    <div>
      <!-- ⚠️ Strings JSON, NO objetos -->
      <p>{"label":"Bogotá (BOG)","value":"BOG"}</p>
      <p>{"label":"Medellín (MDE)","value":"MDE"}</p>
    </div>
  </div>
</div>
```

### 3. readBlockConfig() → JavaScript Object
```javascript
config = {
  label: "Origen",
  defaultvalue: "BOG",  // lowercase por toClassName()
  cities: [
    '{"label":"Bogotá (BOG)","value":"BOG"}',  // ⚠️ STRINGS
    '{"label":"Medellín (MDE)","value":"MDE"}'
  ]
}
```

### 4. Nuestro Código → Parse + Validación
```javascript
// Convertir strings JSON → objetos
cities = config.cities
  .map(jsonStr => JSON.parse(jsonStr))
  .filter(city => city.label && city.value);

// Resultado:
cities = [
  { label: "Bogotá (BOG)", value: "BOG" },  // ✅ Objetos
  { label: "Medellín (MDE)", value: "MDE" }
]
```

---

## 🛡️ Validaciones Implementadas

| Caso | Comportamiento | Log |
|------|----------------|-----|
| **Sin ciudades** | Usa 5 ciudades colombianas por defecto | ⚠️ Warning |
| **defaultValue vacío** | Usa primera ciudad | ℹ️ Info |
| **defaultValue no existe** | Usa primera ciudad + warning | ⚠️ Warning |
| **Item sin label/value** | Descarta item + warning | ⚠️ Warning |
| **JSON malformado** | Descarta item + error | ❌ Error |
| **Todo OK** | Funciona normalmente | ✅ Success |

---

## 📡 API Externa (para otros componentes)

### Escuchar cambios:
```javascript
document.addEventListener('origin-selected', (event) => {
  const { label, value, city } = event.detail;
  console.log(`Ciudad: ${label}, Código: ${value}`);
});
```

### Leer estado actual:
```javascript
const container = document.querySelector('.origin-dropdown-selector-container');

// Valor actual (código IATA)
const currentCode = container.dataset.currentValue; // "BOG"

// Label actual
const currentLabel = container.dataset.currentLabel; // "Bogotá (BOG)"

// Todas las ciudades disponibles
const cities = JSON.parse(container.dataset.cities);
// [{ label: "...", value: "..." }, ...]
```

---

## 🧪 Testing

### Local (sin AEM):
1. Crear HTML con la estructura DOM esperada (ver TEST_GUIDE.html)
2. Incluir scripts necesarios (Preact, HTM, aem.js)
3. Verificar logs en consola

### En AEM Universal Editor:
1. Editar bloque `origin-dropdown-selector`
2. Agregar ciudades usando [+ Add Item]
3. Configurar `defaultValue` con un código válido (ej: "BOG")
4. Guardar y previsualizar
5. Abrir DevTools → Console para ver logs

---

## 🎓 Conceptos Clave Aprendidos

### ❌ Error Común:
```javascript
// ❌ Asumir que config.cities ya son objetos
const firstCity = config.cities[0].label; 
// TypeError: config.cities[0] is a string
```

### ✅ Correcto:
```javascript
// ✅ Parsear cada string JSON primero
const cities = config.cities.map(str => JSON.parse(str));
const firstCity = cities[0].label; // ✅ Funciona
```

### 🔑 Regla de Oro:
**Los campos `container` con `multi: true` siempre vienen como array de STRINGS JSON, nunca como objetos JavaScript directamente.**

---

## 📁 Archivos Modificados

```
models/
  └─ _component-models.json           ✏️ Modificado (nuevo modelo)

blocks/origin-dropdown-selector/
  ├─ origin-dropdown-selector.js      ✏️ Refactorizado (parsing correcto)
  ├─ UNIVERSAL_EDITOR_GUIDE.md        ✨ Nuevo (guía técnica)
  ├─ TEST_GUIDE.html                  ✨ Nuevo (casos de prueba)
  └─ SUMMARY.md                       ✨ Nuevo (este archivo)

component-models.json                 🔨 Recompilado (npm run build:json)
```

---

## ✅ Checklist de Verificación

- [x] Modelo JSON tiene `"multi": true` en el container
- [x] Modelo compilado (`npm run build:json`)
- [x] Código parsea correctamente strings JSON
- [x] Validaciones implementadas (campos requeridos)
- [x] Fallbacks para casos edge
- [x] Logs informativos en consola
- [x] Event dispatch con datos completos
- [x] Data attributes para acceso externo
- [x] Sin errores de ESLint
- [x] Documentación completa

---

## 🚀 Próximos Pasos

1. **Deploy a AEM Cloud** (push + merge)
2. **Prueba en Universal Editor:**
   - Crear/editar bloque
   - Agregar múltiples ciudades
   - Verificar dropdown en preview
3. **Integración con otros bloques** (si es necesario)
4. **Feedback del equipo de content**

---

## 🆘 Troubleshooting

### Problema: "No aparece el botón [+ Add Item]"
**Solución:** Falta `"multi": true` en el container → verificar modelo JSON

### Problema: "cities is undefined"
**Solución:** No hay ciudades configuradas → verificar fallback

### Problema: "Cannot read property 'label' of undefined"
**Solución:** Olvidaste parsear JSON → usar `JSON.parse()`

### Problema: "Default city not working"
**Solución:** Código IATA no coincide (case-sensitive) → revisar logs

---

## 📖 Referencias

- **Universal Editor Field Types:** https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/developing/universal-editor/field-types
- **AEM EDS Docs:** https://www.aem.live/developer/block-collection
- **Preact Docs:** https://preactjs.com/
- **HTM Syntax:** https://github.com/developit/htm

---

**Autor:** GitHub Copilot  
**Fecha:** Diciembre 10, 2025  
**Versión:** 2.0.0 (Container Field Implementation)
