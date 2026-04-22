# 🎯 Origin Dropdown Selector - Guía AEM Universal Editor

## Arquitectura: AEM as Content Source + Universal Editor

Este proyecto usa **AEM as a Cloud Service** como fuente de contenido con **Universal Editor (WYSIWYG)** siguiendo el patrón **xwalk** de Franklin/AEM EDS.

## 📋 Cómo Funciona el Flujo de Datos

### 1. **Configuración en AEM (Lado Autor)**

Cuando creas un bloque `origin-dropdown-selector` en una página de AEM:

1. **Seleccionas el componente** desde el panel de componentes
2. **AEM lee** `component-definition.json` → encuentra `model: "origin-dropdown-selector"`
3. **AEM carga** `component-models.json` → muestra el panel de propiedades
4. **Autor configura** los campos en el panel:
   ```
   Etiqueta del Selector: "Origen"
   Ciudad por Defecto (Código): "BOG"
   Ciudades:
     ├─ Ciudad 1
     │   ├─ Etiqueta: "Bogotá (BOG)"
     │   └─ Código: "BOG"
     ├─ Ciudad 2
     │   ├─ Etiqueta: "Medellín (MDE)"
     │   └─ Código: "MDE"
   ```

### 2. **Serialización AEM → HTML**

AEM toma los valores del modelo y los serializa como **tabla HTML de propiedades**:

```html
<div class="origin-dropdown-selector block" data-block-name="origin-dropdown-selector">
  <!-- Campo simple: label -->
  <div>
    <div>label</div>
    <div><p>Origen</p></div>
  </div>
  
  <!-- Campo simple: defaultValue -->
  <div>
    <div>defaultValue</div>
    <div><p>BOG</p></div>
  </div>
  
  <!-- Campo container (multi): cities -->
  <div>
    <div>cities</div>
    <div>
      <!-- Cada item del container se serializa como JSON string en un <p> -->
      <p>{"label":"Bogotá (BOG)","value":"BOG"}</p>
      <p>{"label":"Medellín (MDE)","value":"MDE"}</p>
      <p>{"label":"Cali (CLO)","value":"CLO"}</p>
    </div>
  </div>
</div>
```

**📌 Puntos Clave:**
- Cada campo del modelo = 1 fila en la tabla (`<div>`)
- Columna 1 = nombre del campo (lowercase por `toClassName()`)
- Columna 2 = valor(es) del campo
- **Container multi** = múltiples `<p>` con JSON strings

### 3. **Lectura en JavaScript (`readBlockConfig()`)**

La función `readBlockConfig()` de AEM EDS lee esta tabla y crea un objeto:

```javascript
const config = readBlockConfig(block);

// Resultado:
config = {
  label: "Origen",                    // String simple
  defaultvalue: "BOG",                // String simple (¡lowercase!)
  cities: [                            // Array de strings JSON
    '{"label":"Bogotá (BOG)","value":"BOG"}',
    '{"label":"Medellín (MDE)","value":"MDE"}',
    '{"label":"Cali (CLO)","value":"CLO"}'
  ]
}
```

### 4. **Parsing en Tu Código**

```javascript
// ✅ Campos simples - directos
const label = config.label || 'Origen';
const defaultValueCode = config.defaultvalue || '';  // ⚠️ lowercase!

// ✅ Campo container - requiere JSON.parse
const citiesRaw = Array.isArray(config.cities) ? config.cities : [config.cities];
const cities = citiesRaw
  .map(cityStr => JSON.parse(cityStr))  // String → Objeto
  .filter(city => city.label && city.value);

// Ahora cities es un array de objetos:
cities = [
  { label: "Bogotá (BOG)", value: "BOG" },
  { label: "Medellín (MDE)", value: "MDE" }
]
```

---

## 🔧 Configuración de Archivos

### `component-definition.json`

Define qué componentes están disponibles en Universal Editor:

```json
{
  "title": "Origin Dropdown Selector",
  "id": "origin-dropdown-selector",
  "plugins": {
    "xwalk": {
      "page": {
        "resourceType": "core/franklin/components/block/v1/block",
        "template": {
          "name": "Origin Dropdown Selector",
          "model": "origin-dropdown-selector"  // ← Referencia al modelo
        }
      }
    }
  }
}
```

### `component-models.json`

Define los campos editables y su UI:

```json
{
  "id": "origin-dropdown-selector",
  "fields": [
    {
      "component": "richtext",      // Tipo de input
      "name": "label",               // Nombre del campo
      "label": "Etiqueta del Selector",
      "valueType": "string",
      "value": "",
      "description": "..."
    },
    {
      "component": "text",
      "name": "defaultValue",
      "label": "Ciudad por Defecto (Código)",
      "valueType": "string",
      "value": "",
      "description": "Código IATA..."
    },
    {
      "component": "container",      // ⭐ Multifield
      "name": "cities",
      "label": "Ciudades",
      "multi": true,                 // ⭐ Permite múltiples items
      "description": "Lista de ciudades...",
      "fields": [                    // ⭐ Campos de cada item
        {
          "component": "text",
          "name": "label",
          "label": "Etiqueta",
          "valueType": "string",
          "value": "",
          "description": "Ej: Bogotá (BOG)"
        },
        {
          "component": "text",
          "name": "value",
          "label": "Código",
          "valueType": "string",
          "value": "",
          "description": "Código IATA: BOG"
        }
      ]
    }
  ]
}
```

### `component-filters.json`

Define qué componentes aparecen en qué contextos (opcional):

```json
{
  "id": "section",
  "components": [
    "origin-dropdown-selector",
    "other-components"
  ]
}
```

---

## 🚀 Workflow de Desarrollo

### 1. **Modificar Modelo**
```bash
# Editar models/_component-models.json
vim models/_component-models.json

# Compilar a raíz
npm run build:json
```

### 2. **Push a AEM**
```bash
git add .
git commit -m "feat: update origin-dropdown-selector model"
git push

# AEM Cloud detecta cambios y actualiza
```

### 3. **Probar en AEM Author**
1. Abre Universal Editor en AEM
2. Edita una página
3. Agrega bloque "Origin Dropdown Selector"
4. Configura en panel de propiedades
5. Guarda y previsualiza
6. Verifica en DevTools que el HTML sea correcto

### 4. **Debugging**
```javascript
// En tu bloque, los logs mostrarán:
console.log('Config:', config);
// ✅ Si ves config = {label: "...", defaultvalue: "...", cities: [...]}
//    → El modelo está funcionando
// ❌ Si ves config = {}
//    → El bloque no está configurado o hay error en la serialización
```

---

## ⚠️ Problemas Comunes

### Problema 1: `config = {}` (vacío)

**Causas:**
- El bloque no tiene configuración en AEM aún
- Error en `component-models.json` (JSON inválido)
- `npm run build:json` no se ejecutó después de cambios

**Solución:**
1. Verificar que `component-models.json` es JSON válido
2. Ejecutar `npm run build:json`
3. Push a git
4. Esperar que AEM actualice
5. Refrescar página en Universal Editor

### Problema 2: `config.cities = undefined`

**Causas:**
- No se agregaron ciudades en el panel de propiedades
- Falta `"multi": true` en el container

**Solución:**
1. Verificar modelo tiene `"multi": true`
2. En Universal Editor, hacer clic en [+ Add Item]
3. Agregar al menos 1 ciudad

### Problema 3: Error al parsear JSON

**Causas:**
- AEM generó JSON malformado
- Caracteres especiales no escapados

**Solución:**
- Verificar en DevTools el HTML generado
- Asegurar que no hay comillas dobles sin escapar en los valores

### Problema 4: `defaultvalue` vs `defaultValue`

**⚠️ Importante:** `readBlockConfig()` usa `toClassName()` que convierte a lowercase

```javascript
// ❌ NO funciona
config.defaultValue

// ✅ SÍ funciona
config.defaultvalue
```

---

## 🎓 Conceptos Clave

### Container vs Text Multi

| Aspecto | Text Multi | Container Multi |
|---------|------------|-----------------|
| **UI** | Un input por item | Múltiples inputs por item |
| **Datos** | Array de strings | Array de objetos (JSON) |
| **Parsing** | Simple split | JSON.parse requerido |
| **Validación** | Ninguna | Por campo |
| **UX** | ⭐⭐ | ⭐⭐⭐⭐⭐ |

### Serialización de Campos

| Tipo Campo | HTML Generado | JavaScript Result |
|------------|---------------|-------------------|
| `text` | `<p>valor</p>` | `config.name = "valor"` |
| `richtext` | `<p>valor</p>` | `config.name = "valor"` |
| `select` | `<p>opción</p>` | `config.name = "opción"` |
| `boolean` | `<p>true</p>` | `config.name = "true"` (string!) |
| `reference` | `<p>url</p>` | `config.name = "url"` |
| `container` single | `<p>{...json...}</p>` | `config.name = "{...}"` (string) |
| `container` multi | `<p>{...}</p><p>{...}</p>` | `config.name = ["{...}", "{...}"]` |

---

## 📖 Referencias

- **Tutorial Oficial:** https://www.aem.live/developer/ue-tutorial
- **Block Collection:** https://www.aem.live/developer/block-collection
- **Component Models Spec:** https://github.com/adobe/aem-boilerplate
- **Código de este proyecto:** `blocks/origin-dropdown-selector/`

---

## ✅ Checklist de Implementación

- [x] Modelo definido en `models/_component-models.json`
- [x] Container tiene `"multi": true"`
- [x] Campos del container tienen `name`, `label`, `component`
- [x] Compilado con `npm run build:json`
- [x] Definition en `component-definition.json` apunta al modelo
- [x] Código parsea correctamente con `JSON.parse()`
- [x] Fallback para bloque sin configurar
- [x] Validación de campos requeridos
- [x] Logs de debugging para troubleshooting

---

**Siguiente paso:** Crear el bloque en AEM Universal Editor y verificar que el HTML generado coincida con lo esperado. Los logs en consola te mostrarán exactamente qué está llegando desde AEM.
