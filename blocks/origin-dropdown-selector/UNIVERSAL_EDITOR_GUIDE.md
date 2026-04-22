# 📚 Guía: Cómo Funciona Universal Editor con Container Fields

## 🎯 Entendiendo el Flujo de Datos

### 1. **Configuración del Modelo (component-models.json)**

Cuando defines un campo `container` con `multi: true`:

```json
{
  "component": "container",
  "name": "cities",
  "label": "Ciudades",
  "multi": true,
  "fields": [
    {
      "component": "text",
      "name": "label",
      "label": "Etiqueta"
    },
    {
      "component": "text",
      "name": "value",
      "label": "Código"
    }
  ]
}
```

**Lo que hace Universal Editor:**
- Crea una interfaz de "multifield" (array de objetos)
- Permite agregar/eliminar items dinámicamente
- Cada item tiene los campos definidos en `fields[]`

---

## 🔄 Transformación de Datos: Author → DOM → JavaScript

### **Paso 1: Author Environment (Universal Editor)**

El autor configura:
```
Ciudades:
  ├─ Item 0
  │   ├─ Etiqueta: "Bogotá (BOG)"
  │   └─ Código: "BOG"
  ├─ Item 1
  │   ├─ Etiqueta: "Medellín (MDE)"
  │   └─ Código: "MDE"
```

---

### **Paso 2: AEM Cloud Serializa a HTML (DOM Structure)**

AEM convierte el modelo a esta estructura HTML:

```html
<div class="origin-dropdown-selector block">
  <!-- Campo simple: label -->
  <div>
    <div>Label</div>
    <div><p>Origen</p></div>
  </div>
  
  <!-- Campo simple: defaultValue -->
  <div>
    <div>DefaultValue</div>
    <div><p>BOG</p></div>
  </div>
  
  <!-- ⭐ Campo CONTAINER: cities -->
  <div>
    <div>Cities</div>
    <div>
      <!-- Item 0 -->
      <p>{"label":"Bogotá (BOG)","value":"BOG"}</p>
      <!-- Item 1 -->
      <p>{"label":"Medellín (MDE)","value":"MDE"}</p>
      <!-- Item 2 -->
      <p>{"label":"Cali (CLO)","value":"CLO"}</p>
    </div>
  </div>
</div>
```

**🔑 Punto Clave:**
- Cada item del container se serializa como **JSON string** dentro de un `<p>`
- **NO** es un objeto JavaScript, es **texto JSON** en el HTML

---

### **Paso 3: readBlockConfig() Procesa el DOM**

La función `readBlockConfig()` hace esto:

```javascript
function readBlockConfig(block) {
  const config = {};
  block.querySelectorAll(':scope > div').forEach((row) => {
    const cols = [...row.children];
    if (cols[1]) {
      const name = toClassName(cols[0].textContent); // "cities"
      
      // Si el contenedor tiene múltiples <p> (container multifield)
      if (col.querySelector('p')) {
        const ps = [...col.querySelectorAll('p')];
        if (ps.length === 1) {
          value = ps[0].textContent; // String: '{"label":"...","value":"..."}'
        } else {
          // ⭐ AQUÍ: Array de strings JSON
          value = ps.map((p) => p.textContent); 
          // ['{"label":"Bogotá","value":"BOG"}', '{"label":"Medellín","value":"MDE"}']
        }
      }
      
      config[name] = value;
    }
  });
  return config;
}
```

**Resultado:**
```javascript
config = {
  label: "Origen",
  defaultvalue: "BOG",
  cities: [
    '{"label":"Bogotá (BOG)","value":"BOG"}',  // ⚠️ STRING, no objeto
    '{"label":"Medellín (MDE)","value":"MDE"}',
    '{"label":"Cali (CLO)","value":"CLO"}'
  ]
}
```

---

## ⚙️ Cómo Procesar Correctamente en Tu Bloque

### ❌ **Problema Común: Asumir que ya son objetos**

```javascript
// ❌ ESTO NO FUNCIONA
const cities = config.cities;
console.log(cities[0].label); // undefined! porque cities[0] es un STRING
```

### ✅ **Solución: Parsear cada item del array**

```javascript
// ✅ CORRECTO
let cities = [];

if (config.cities) {
  // config.cities puede ser:
  // 1. Array de strings JSON (cuando multi: true)
  // 2. String JSON único (cuando multi: false, caso raro)
  
  const citiesRaw = Array.isArray(config.cities) 
    ? config.cities  // Ya es array
    : [config.cities]; // Convertir string único a array
  
  // Parsear cada string JSON a objeto
  cities = citiesRaw
    .map(cityStr => {
      try {
        return JSON.parse(cityStr); // Convertir string → objeto
      } catch (e) {
        console.warn('Error parsing city:', cityStr, e);
        return null;
      }
    })
    .filter(city => city !== null && city.label && city.value);
}

// Ahora sí:
console.log(cities[0].label); // "Bogotá (BOG)" ✅
console.log(cities[0].value); // "BOG" ✅
```

---

## 🎯 Patrón Robusto Completo

```javascript
/**
 * Parsea un campo container del config de AEM
 * @param {string|string[]} containerData - Dato del container (string JSON o array de strings JSON)
 * @returns {object[]} Array de objetos parseados
 */
function parseContainerField(containerData) {
  if (!containerData) return [];
  
  // Asegurar que tenemos un array
  const dataArray = Array.isArray(containerData) ? containerData : [containerData];
  
  // Parsear cada string JSON
  return dataArray
    .map(jsonStr => {
      try {
        return JSON.parse(jsonStr);
      } catch (e) {
        console.warn('Failed to parse container item:', jsonStr, e);
        return null;
      }
    })
    .filter(item => item !== null); // Remover items inválidos
}

// Uso:
const cities = parseContainerField(config.cities);
```

---

## 🔍 Casos Edge y Validaciones

### **Caso 1: Container vacío (no hay items)**
```javascript
config.cities = undefined
// o
config.cities = []
```
**Solución:** Usar fallback
```javascript
const cities = parseContainerField(config.cities);
if (cities.length === 0) {
  // Usar datos por defecto
  cities = [
    { label: 'Bogotá (BOG)', value: 'BOG' },
    { label: 'Medellín (MDE)', value: 'MDE' }
  ];
}
```

### **Caso 2: Items con datos incompletos**
```javascript
// Autor solo llenó "label" pero no "value"
config.cities = ['{"label":"Bogotá (BOG)"}']
```
**Solución:** Validar después del parse
```javascript
const cities = parseContainerField(config.cities)
  .filter(city => city.label && city.value); // Requiere ambos campos
```

### **Caso 3: JSON malformado**
```javascript
config.cities = ['{"label":"Bogotá" invalid json']
```
**Solución:** Try-catch en el parse (ya incluido en `parseContainerField`)

---

## 📊 Comparación: Container vs Text Multi

### **Text con multi: true (Anterior)**
```json
{
  "component": "text",
  "name": "cityName",
  "multi": true
}
```
**Resultado en config:**
```javascript
config.cityname = ["Bogotá | BOG", "Medellín | MDE"]
```
- ✅ Simple
- ❌ Requiere parsing manual del separador `|`
- ❌ No es estructurado
- ❌ Mala experiencia de autoría

### **Container con multi: true (Actual)**
```json
{
  "component": "container",
  "name": "cities",
  "multi": true,
  "fields": [...]
}
```
**Resultado en config:**
```javascript
config.cities = [
  '{"label":"Bogotá (BOG)","value":"BOG"}',
  '{"label":"Medellín (MDE)","value":"MDE"}'
]
```
- ✅ Datos estructurados
- ✅ Validación por campo
- ✅ Mejor UX para autores
- ⚠️ Requiere parsing JSON (simple)

---

## 🚀 Best Practices

### ✅ **DO:**
1. **Siempre parsear con try-catch**
2. **Validar campos requeridos después del parse**
3. **Proveer fallbacks para arrays vacíos**
4. **Loggear warnings, no errors silenciosos**
5. **Documentar estructura esperada en JSDoc**

### ❌ **DON'T:**
1. **Asumir que config.cities ya son objetos**
2. **Olvidar manejar el caso de array vacío**
3. **Ignorar errores de JSON.parse**
4. **Usar eval() en lugar de JSON.parse**
5. **No validar datos antes de usarlos**

---

## 🧪 Testing en Local

### **Simular Estructura HTML en Local**

Para probar sin Universal Editor:

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
      <p>{"label":"Bogotá (BOG)","value":"BOG"}</p>
      <p>{"label":"Medellín (MDE)","value":"MDE"}</p>
    </div>
  </div>
</div>
```

### **Console Log para Debugging**

```javascript
const config = readBlockConfig(block);
console.log('Raw config:', config);
console.log('Cities raw:', config.cities);
console.log('Cities type:', typeof config.cities);
console.log('Is array?', Array.isArray(config.cities));

const cities = parseContainerField(config.cities);
console.log('Parsed cities:', cities);
```

---

## 📝 Resumen Ejecutivo

| Aspecto | Detalle |
|---------|---------|
| **Formato en config** | Array de strings JSON |
| **Parsing requerido** | `JSON.parse()` por cada item |
| **Validación** | Verificar campos requeridos post-parse |
| **Fallback** | Array vacío → usar defaults hardcoded |
| **Error handling** | Try-catch + warnings en consola |

---

## 🔗 Referencias

- [Universal Editor Field Types](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/developing/universal-editor/field-types)
- AEM EDS: `scripts/aem.js` → `readBlockConfig()`
- Ejemplo real: `blocks/footer-partner-logos/` (aunque no usa el config, procesa DOM directo)
