# 🔍 Diagnóstico Avanzado: Container Multi en Universal Editor

## Hallazgos del Análisis

### 1. **Causa Confirmada: HTML Sin Nombres de Propiedad**

Tu HTML actual:
```html
<div class="origin-dropdown-selector">
  <div>
    <div></div>  <!-- ❌ cols[0] vacío -->
  </div>
  <div>
    <div><p>BOG</p></div>  <!-- ❌ Solo 1 columna, falta cols[0] -->
  </div>
  <div>
    <div></div>  <!-- ❌ cols[0] vacío -->
  </div>
</div>
```

**Problema:** `readBlockConfig()` hace esto:
```javascript
const name = toClassName(cols[0].textContent);  // '' si cols[0] está vacío
config[name] = value;  // config[''] = valor → NO se guarda correctamente
```

### 2. **Este es el PRIMER bloque con `container multi: true`**

Búsqueda en codebase:
```bash
grep -r '"component": "container".*"multi": true' models/
# Resultado: ❌ No se encontraron otros casos
```

**Conclusión:** No hay precedente en este proyecto de cómo AEM serializa containers multifield.

---

## 🎯 Posibles Causas

### Causa A: El Bloque Se Guardó Con Modelo Anterior

**Hipótesis:** El bloque se creó cuando el modelo tenía `component: "text"` con separador por pipes, y al actualizar a `container`, el HTML viejo persistió.

**Evidencia:**
- `models/_component-models.json` línea 1277: Ahora es `container`
- HTML generado: No tiene estructura de tabla con nombres
- Contenido: Solo `BOG` está presente (parece defaultValue, no cities)

**Prueba:**
1. En AEM Content Tree, revisa el nodo JCR del bloque
2. Busca propiedades como `cities`, `label`, `defaultValue`
3. Si no existen como nodos hijos, el modelo no se aplicó

### Causa B: Container Multi Requiere Configuración Adicional

**Hipótesis:** En Universal Editor, los containers con `multi: true` pueden requerir:
- Field adicional en `component-definition.json`
- Plugin específico de xwalk para serialización
- Configuración en JCR para nodos multivaluados

**Evidencia:**
```json
{
  "component": "container",
  "name": "cities",
  "multi": true,  // ← ¿Necesita algo más?
  "fields": [...]
}
```

**Referencia:** https://www.aem.live/developer/block-collection → Buscar ejemplos de containers

### Causa C: El Campo "component" Adicional que Mencionas

**Tu observación:** "adiciona algo que se llama component"

**Posibilidad:** Universal Editor está agregando un campo interno llamado `component` que interfiere con la serialización.

**Necesito ver:**
1. Screenshot del Content Tree en Universal Editor
2. HTML completo del bloque desde DevTools
3. Propiedades JCR del nodo del bloque

---

## 🧪 Pruebas de Diagnóstico

### Prueba 1: Eliminar y Recrear el Bloque

**Objetivo:** Forzar a AEM a usar el modelo actualizado

**Pasos:**
1. En Universal Editor, **ELIMINA completamente** el bloque `origin-dropdown-selector`
2. **GUARDA la página** (Save)
3. **PUBLICA a preview** (Preview & Publish)
4. **AGREGA NUEVO** bloque `origin-dropdown-selector` desde cero
5. **CONFIGURA los campos:**
   - Etiqueta: `Origen`
   - Código Default: `BOG`
   - Ciudades → [+ Add Item]:
     - Ciudad 1: Label `Bogotá (BOG)`, Value `BOG`
     - Ciudad 2: Label `Medellín (MDE)`, Value `MDE`
6. **GUARDA y PUBLICA**
7. **HARD REFRESH** en navegador

**Resultado Esperado:**
```html
<div class="origin-dropdown-selector">
  <div>
    <div>label</div>
    <div><p>Origen</p></div>
  </div>
  <div>
    <div>defaultvalue</div>
    <div><p>BOG</p></div>
  </div>
  <div>
    <div>cities</div>
    <div>
      <p>{"label":"Bogotá (BOG)","value":"BOG"}</p>
      <p>{"label":"Medellín (MDE)","value":"MDE"}</p>
    </div>
  </div>
</div>
```

### Prueba 2: Verificar Modelo Compilado

**Objetivo:** Confirmar que AEM tiene el modelo correcto

**Pasos:**
```bash
# En tu repositorio local
cd /home/olsalas/aem-eds-projects/avianca-eds

# Verificar modelo compilado
cat component-models.json | grep -A 30 "origin-dropdown-selector"

# Verificar que tiene container + multi: true
cat component-models.json | grep -B 5 -A 15 '"name": "cities"'

# Verificar último commit con cambios
git log --oneline -- component-models.json models/_component-models.json

# Verificar que está pusheado
git log origin/juanpa-help --oneline -5
```

**Resultado Esperado:**
- `component-models.json` tiene `"component": "container"` y `"multi": true`
- Commit está en remoto y AEM lo ha sincronizado

### Prueba 3: Inspeccionar JCR (Modo Avanzado)

**Objetivo:** Ver cómo AEM almacena los datos realmente

**Pasos:**
1. En AEM Author, abre **CRXDE Lite**:
   ```
   https://author-p34631-e1321407.adobeaemcloud.com/crx/de
   ```

2. Navega a la página:
   ```
   /content/Avianca-home-site/[tu-pagina]
   ```

3. Busca el nodo del bloque `origin-dropdown-selector`

4. Inspecciona propiedades:
   - ¿Existe `cities`?
   - ¿Es tipo `String[]` (array)?
   - ¿Qué valores contiene?

5. Captura screenshot y comparte

---

## 🔧 Soluciones Propuestas

### Solución 1: Usar Text Multi Temporal (Rápida)

Si `container multi` no funciona, volver temporalmente a `text multi` con JSON manual:

```json
{
  "component": "text",
  "name": "cities",
  "label": "Ciudades (JSON Array)",
  "multi": true,
  "valueType": "string",
  "value": "",
  "description": "Una ciudad por línea en formato JSON: {\"label\":\"Bogotá (BOG)\",\"value\":\"BOG\"}"
}
```

**Pros:** Funciona garantizado  
**Contras:** UX peor para autores

### Solución 2: Usar Reference/Fragment Pattern (AEM Native)

Crear un componente `city-item` separado y referenciarlos:

**component-models.json:**
```json
{
  "id": "city-item",
  "fields": [
    {"component": "text", "name": "label"},
    {"component": "text", "name": "value"}
  ]
},
{
  "id": "origin-dropdown-selector",
  "fields": [
    {
      "component": "reference",
      "name": "cities",
      "multi": true  // ← Reference multi SÍ funciona bien
    }
  ]
}
```

**Pros:** Pattern establecido en AEM  
**Contras:** Más archivos, complejidad mayor

### Solución 3: Parsear DOM Directamente (Fallback)

El código que agregué ya hace esto si `readBlockConfig()` falla. Pero necesitamos saber **exactamente** qué estructura genera AEM.

---

## 📋 Información Necesaria para Continuar

**Por favor comparte:**

1. **Screenshot del Content Tree** en Universal Editor:
   - Abre la página en AEM Author
   - Selecciona el bloque `origin-dropdown-selector`
   - En el panel derecho, expande el árbol de nodos
   - Screenshot mostrando todos los campos y sub-nodos

2. **HTML Completo del Bloque** (DevTools):
   ```javascript
   // En consola del navegador (preview/published page):
   console.log(document.querySelector('.origin-dropdown-selector').outerHTML);
   ```
   - Copia y pega todo el output

3. **Propiedades Configuradas** en Panel de Propiedades:
   - ¿Cuántas ciudades agregaste con [+ Add Item]?
   - ¿Ves campos "label" y "value" para cada ciudad?
   - ¿Aparece ese campo "component" que mencionaste? (screenshot)

4. **Branch y Sync Status**:
   ```bash
   git branch
   git status
   git log --oneline -3
   ```

5. **¿Ya probaste eliminar y recrear el bloque?** (Prueba 1 arriba)

---

## 🔮 Predicción

Mi hipótesis principal: **El bloque tiene HTML viejo porque se creó antes del cambio de modelo**.

**Solución esperada:** Eliminar el bloque, guardar, recrear desde cero con modelo nuevo = debería funcionar.

**Si no funciona:** Entonces hay un bug/limitación en cómo xwalk serializa `container multi: true` y necesitamos usar una de las soluciones alternativas.

---

**Siguiente paso:** Ejecuta **Prueba 1 (Eliminar y Recrear)** y comparte los resultados. Si persiste, necesito la información adicional listada arriba para un diagnóstico más profundo.
