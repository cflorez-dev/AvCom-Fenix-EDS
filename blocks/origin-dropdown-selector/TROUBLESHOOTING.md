# 🔧 Troubleshooting: Config Vacío en Origin Dropdown Selector

## Problema Actual

**Síntoma:**
```javascript
Config: {}
Block HTML tiene estructura incompleta sin nombres de propiedades
```

**HTML Generado (INCORRECTO):**
```html
<div class="origin-dropdown-selector">
  <div>
    <div></div>  <!-- ❌ Vacío - falta nombre de propiedad -->
  </div>
  <div>
    <div><p>BOG</p></div>  <!-- ❌ Solo 1 celda, falta nombre -->
  </div>
  <div>
    <div></div>  <!-- ❌ Vacío -->
  </div>
</div>
```

**HTML Esperado (CORRECTO):**
```html
<div class="origin-dropdown-selector">
  <div>
    <div>label</div>  <!-- ✅ Nombre de propiedad -->
    <div><p>Origen</p></div>  <!-- ✅ Valor -->
  </div>
  <div>
    <div>defaultvalue</div>  <!-- ✅ Nombre de propiedad -->
    <div><p>BOG</p></div>  <!-- ✅ Valor -->
  </div>
  <div>
    <div>cities</div>  <!-- ✅ Nombre de propiedad -->
    <div>
      <p>{"label":"Bogotá (BOG)","value":"BOG"}</p>
      <p>{"label":"Medellín (MDE)","value":"MDE"}</p>
    </div>
  </div>
</div>
```

---

## 🎯 Causa Raíz

**El bloque fue creado ANTES de actualizar el modelo `component-models.json`**

Cuando actualizas el modelo de un componente pero el contenido ya existe en AEM, el HTML viejo persiste hasta que:
1. Re-guardas el componente en Universal Editor
2. O vuelves a publicar la página

AEM **no regenera automáticamente** el HTML de bloques existentes cuando cambias el modelo.

---

## ✅ Solución: Re-guardar el Bloque en AEM

### Opción A: Editar y Re-guardar (RECOMENDADO)

1. **Abre AEM Universal Editor**
   ```
   https://author-p34631-e1321407.adobeaemcloud.com/
   ```

2. **Edita la página** que contiene el bloque `origin-dropdown-selector`

3. **Selecciona el bloque** en el editor visual

4. **Abre el Panel de Propiedades** (lateral derecho)

5. **Verifica/Edita los campos:**
   - **Etiqueta del Selector**: `Origen`
   - **Ciudad por Defecto (Código)**: `BOG`
   - **Ciudades**: Haz clic en `[+ Add Item]` para cada ciudad:
     ```
     Ciudad 1:
       - Etiqueta: Bogotá (BOG)
       - Código: BOG
     
     Ciudad 2:
       - Etiqueta: Medellín (MDE)
       - Código: MDE
     
     Ciudad 3:
       - Etiqueta: Cali (CLO)
       - Código: CLO
     ```

6. **Guarda la página** (Save en Universal Editor)

7. **Publica la página** (Publish)

8. **Limpia caché de navegador** y recarga

### Opción B: Eliminar y Recrear (Si Opción A no funciona)

1. **Elimina el bloque** actual de la página
2. **Inserta nuevo bloque** `Origin Dropdown Selector`
3. **Configura desde cero** con el panel de propiedades
4. **Guarda y publica**

---

## 🔍 Verificación

Después de re-guardar, el HTML debería verse así:

```html
<div class="origin-dropdown-selector block">
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
      <p>{"label":"Cali (CLO)","value":"CLO"}</p>
    </div>
  </div>
</div>
```

Y en consola deberías ver:

```javascript
Config from readBlockConfig: {
  label: "Origen",
  defaultvalue: "BOG",
  cities: [
    '{"label":"Bogotá (BOG)","value":"BOG"}',
    '{"label":"Medellín (MDE)","value":"MDE"}',
    '{"label":"Cali (CLO)","value":"CLO"}'
  ]
}
✅ Using readBlockConfig() method
Parsed cities: [
  { label: "Bogotá (BOG)", value: "BOG" },
  { label: "Medellín (MDE)", value: "MDE" },
  { label: "Cali (CLO)", value: "CLO" }
]
```

---

## 🛡️ Parser de Respaldo

El código ahora incluye un **parser dual** que puede manejar ambos casos:

```javascript
if (Object.keys(config).length > 0) {
  // ✅ Método 1: readBlockConfig() funciona
  // Usa config.label, config.defaultvalue, config.cities
} else {
  // ⚠️ Método 2: Parseo manual del DOM
  // Intenta inferir valores por posición de filas
}
```

Pero **el parser manual es un fallback** - la solución correcta es re-guardar en AEM.

---

## 📝 Checklist de Validación

Después de re-guardar el bloque:

- [ ] HTML tiene 3 filas (`<div>`)
- [ ] Primera fila tiene 2 celdas: `<div>label</div>` + `<div><p>Origen</p></div>`
- [ ] Segunda fila tiene 2 celdas: `<div>defaultvalue</div>` + `<div><p>BOG</p></div>`
- [ ] Tercera fila tiene 2 celdas: `<div>cities</div>` + `<div><p>{"label":...}</p>...</div>`
- [ ] Consola muestra `Config from readBlockConfig:` con valores
- [ ] Consola muestra `✅ Using readBlockConfig() method`
- [ ] Consola muestra `Parsed cities:` con array de objetos
- [ ] El dropdown visual muestra las ciudades configuradas

---

## 🚨 Si el Problema Persiste

### 1. Verificar que el Build se ejecutó

```bash
cd /home/olsalas/aem-eds-projects/avianca-eds
npm run build:json
git status  # Debería mostrar cambios en component-models.json
```

### 2. Verificar que los cambios están en git

```bash
git log --oneline -5
git show HEAD:component-models.json | grep -A 30 "origin-dropdown-selector"
```

### 3. Verificar que AEM tiene la versión nueva

- En AEM, abre Code View
- Busca el archivo `component-models.json`
- Verifica que tiene la estructura con `container` + `multi: true`

### 4. Limpiar caché de AEM

- En AEM Author, Tools → Operations → Web Console
- Busca "Clear Cache"
- O espera ~5 minutos para que expire

### 5. Hard Refresh en navegador

```
Chrome: Ctrl + Shift + R
Firefox: Ctrl + F5
Safari: Cmd + Option + R
```

---

## 📖 Referencias Técnicas

- **readBlockConfig()**: `scripts/aem.js` línea ~500
- **Modelo**: `models/_component-models.json` línea 1277-1330
- **Definition**: `component-definition.json` línea 307-318
- **Block code**: `blocks/origin-dropdown-selector/origin-dropdown-selector.js`

---

**Siguiente paso:** Re-guarda el bloque en AEM Universal Editor y comparte el nuevo HTML + console output.
