# Guía de Autoría — Bloque Destination Details

Este documento describe cómo diligenciar el Content Fragment de cada destino para que el bloque `destination-details` se renderice correctamente en los tres tabs.

---

## Estructura general del Content Fragment

Cada destino tiene un CF con campos rich text localizados por idioma (`_es`, `_en`, `_fr`, `_pt`). Los campos relevantes para este bloque son:

| Campo CF | Tab | Descripción |
|----------|-----|-------------|
| `intro_{lang}` | Découvrir / Descubre | Descripción + datos clave del destino |
| `airportAndTransport_{lang}` | Aéroport / Aeropuerto | Info del aeropuerto y opciones de transporte |
| *(automático)* | Conditions d'entrée / Requisitos | Widget Smartvel, no requiere autoría |

---

## Tab 1 — Découvrir / Descubre / Discover

### Campo: `intro_{lang}`

#### Estructura

```
[Párrafo de descripción inspiracional]

• [Label corto]: [Valor]
• [Label corto]: [Valor]
• [Label corto]: [Valor]
• [Label corto]: [Valor]
```

#### Reglas

- **Párrafo**: texto libre, máximo 3–4 líneas. Puede incluir texto en negrita para énfasis.
- **Lista**: máximo **4 items** con datos clave del destino.
- **Labels**: cortos, máximo ~15 caracteres. El separador visual entre párrafo y lista lo genera el CSS automáticamente — no agregar `---` ni líneas manuales.
- **Formato de cada item**: label en **negrita** + dos puntos + valor en texto normal.

#### Cómo escribirlo en el editor TipTap

1. Escribe el párrafo de descripción.
2. Presiona **Enter** para salir del párrafo.
3. Activa la **bulleted list** (botón `•` en la barra o escribe `* ` + espacio).
4. Para cada item:
   - Activa **Bold** (Ctrl+B / Cmd+B)
   - Escribe el label: `Aéroport:`
   - Desactiva Bold
   - Escribe el valor: ` Aéroport Ernesto Cortissoz (BAQ)`
   - Presiona **Enter** para el siguiente item (o **Escape** + Enter para salir de la lista)

#### Ejemplo correcto

```
Découvrez Barranquilla, une ville côtière animée du nord de la Colombie.
Profitez de ses plages, de sa culture caribéenne et de sa délicieuse
gastronomie.

• Aéroport: Aéroport Ernesto Cortissoz (BAQ)
• Langue: Espagnol
• Monnaie: Peso colombien
• Fuseau horaire: UTC-5
```

#### HTML generado (referencia técnica)

```html
<p>Découvrez Barranquilla...</p>
<ul>
  <li><p><strong>Aéroport:</strong> Aéroport Ernesto Cortissoz (BAQ)</p></li>
  <li><p><strong>Langue:</strong> Espagnol</p></li>
  <li><p><strong>Monnaie:</strong> Peso colombien</p></li>
  <li><p><strong>Fuseau horaire:</strong> UTC-5</p></li>
</ul>
```

#### Lo que hace el CSS automáticamente

- Agrega el separador visual (línea horizontal) entre el párrafo y la lista
- Distribuye los items en un grid de columnas iguales (hasta 4 columnas en desktop)
- En mobile muestra cada item apilado al 100% de ancho

#### ⚠️ Errores comunes

| Error | Problema | Corrección |
|-------|----------|-----------|
| Label largo: `Applications de transport :` | Wrappea en 2+ líneas en el grid | Usar label corto: `Apps transport :` |
| Más de 4 items en la lista | El grid se rompe visualmente | Máximo 4 items |
| Agregar `---` manual como separador | Aparece como texto visible | No es necesario, el CSS lo genera automáticamente |

---

## Tab 2 — Aéroport et Transport / Aeropuerto y Transporte / Airport and Transport

### Campo: `airportAndTransport_{lang}`

#### Estructura

```
### [Nombre del aeropuerto]

[Párrafo: descripción del aeropuerto. [Texto del link](URL del sitio oficial)]

### [Título de la sección de transporte]

• [Medio de transporte]: [Descripción]
• [Medio de transporte]: [Descripción]
• [Medio de transporte]: [Descripción]
• [Medio de transporte]: [Descripción]
```

#### Reglas

- **Heading del aeropuerto**: usar **Heading 3** (H3) con el nombre del aeropuerto.
- **Párrafo de descripción**: incluir nombre con código IATA, ubicación y distancia al centro. Si existe, agregar el link al sitio oficial del aeropuerto.
- **Heading de transporte**: usar **Heading 3** (H3) con el título de la sección. El CSS aplica automáticamente el separador visual (línea horizontal) y reduce el tamaño a 20px (tratamiento H4) cuando un H3 sigue a un párrafo.
- **Lista de transporte**: máximo **4 opciones**. Nunca más de 4.
- **Formato de cada item**: label del medio de transporte en **negrita** + dos puntos + descripción.

#### Cómo escribirlo en el editor TipTap

1. Selecciona **Heading 3** en el selector de estilo de párrafo.
2. Escribe el nombre del aeropuerto.
3. Presiona **Enter** — el editor vuelve a párrafo normal.
4. Escribe la descripción del aeropuerto. Para el link: selecciona el texto, agrega el URL.
5. Presiona **Enter**.
6. Selecciona **Heading 3** nuevamente.
7. Escribe el título de la sección de transporte (ej: `Del aeropuerto al centro`).
8. Presiona **Enter** — vuelve a párrafo normal, activa **bulleted list**.
9. Para cada opción de transporte (máximo 4):
   - Activa **Bold**
   - Escribe el label: `Taxis:`
   - Desactiva Bold
   - Escribe la descripción: ` Disponibles a la salida del terminal.`
   - Presiona **Enter** para siguiente opción

#### Ejemplo correcto — ES

```
### Aeropuerto Ernesto Cortissoz (BAQ)

Aeropuerto Ernesto Cortissoz (BAQ): Ubicado en el municipio de Soledad,
a 12 km del centro de la ciudad. [Sitio oficial del aeropuerto](https://...)

### Del aeropuerto al centro de la ciudad

• Taxis: Disponibles en la salida del terminal.
• Transporte público: Varias rutas de bus conectan con la ciudad.
• Autobuses del aeropuerto: No hay servicio oficial.
• Apps de transporte: Uber e InDriver.
```

#### Ejemplo correcto — FR

```
### Aéroport Ernesto Cortissoz (BAQ)

Aéroport Ernesto Cortissoz (BAQ) : Situé dans la municipalité de Soledad,
à 12 km du centre-ville. [Site officiel de l'aéroport](https://...)

### De l'aéroport au centre-ville

• Taxis : Disponibles à la sortie du terminal.
• Transports publics : Plusieurs lignes de bus relient l'aéroport à la ville.
• Navettes : Aucun service officiel.
• Apps transport : Uber et InDriver.
```

#### HTML generado (referencia técnica)

```html
<h3>Aéroport Ernesto Cortissoz (BAQ)</h3>
<p>Aéroport Ernesto Cortissoz... <a href="https://...">Site officiel</a></p>
<h3>De l'aéroport au centre-ville</h3>
<ul>
  <li><strong>Taxis :</strong><br>Disponibles à la sortie du terminal.</li>
  <li><strong>Transports publics :</strong><br>Plusieurs lignes de bus...</li>
  <li><strong>Navettes :</strong><br>Aucun service officiel.</li>
  <li><strong>Apps transport :</strong><br>Uber et InDriver.</li>
</ul>
```

> **Nota**: el CF Editor puede generar `<strong>Label</strong><br>Descripción` dentro de cada `<li>`. El CSS oculta el `<br>` y usa `flex-column` para apilar label y descripción correctamente.

#### Lo que hace el CSS automáticamente

- El **H3 del aeropuerto** se muestra a 24px bold
- El **H3 de la sección de transporte** (que sigue a un `<p>`) recibe automáticamente:
  - Separador visual (línea horizontal) encima
  - Tamaño reducido a 20px (tratamiento H4)
- Los **items de la lista** se distribuyen en un grid de **4 columnas iguales** en desktop
- En mobile cada item se muestra al 100% de ancho, apilado

#### Límite de opciones de transporte

**Máximo 4 opciones.** El grid está diseñado para 4 columnas en desktop. Con más de 4 opciones el diseño se rompe.

Opciones recomendadas (en orden de prioridad):
1. Taxis / Taxi
2. Transporte público / Transport en commun / Public transport
3. Shuttle / Navette del aeropuerto
4. Apps (Uber, InDriver, etc.)

Si hay menos de 4 opciones, las columnas se distribuyen igualmente entre las disponibles (ej: 3 opciones = 3 columnas de igual ancho).

#### ⚠️ Errores comunes

| Error | Problema | Corrección |
|-------|----------|-----------|
| Más de 4 opciones de transporte | Grid se rompe | Máximo 4 |
| Label muy largo (>20 chars) | Se muestra en 2 líneas | Abreviar: `Apps transport:` en vez de `Applications de transport :` |
| Usar H2 en vez de H3 | Jerarquía visual incorrecta | Siempre H3 para ambos títulos |
| No usar bulleted list para las opciones | No se genera el grid de columnas | Usar bulleted list obligatoriamente |

---

## Tab 3 — Conditions d'entrée / Requisitos de entrada / Entry Requirements

### Sin autoría requerida

Este tab utiliza el widget **Smartvel** que carga automáticamente los requisitos de entrada según el destino (código IATA del aeropuerto) y el idioma del site. No requiere contenido en el CF.

La API key de Smartvel se gestiona en `environment.json` (clave `AV_SMARTVEL_API_KEY`).

---

## Referencia visual — Layout en desktop

### Tab Découvrir

```
┌─────────────────────────────────────────────────────────────────┐
│  [Imagen 240×240]  │  Párrafo de descripción del destino...     │
│                    │                                             │
│                    │  ────────────────────────────────           │
│                    │  Aéroport:       Langue:        Monnaie:    │
│                    │  BAQ             Espagnol       Peso col.   │
└─────────────────────────────────────────────────────────────────┘
```

### Tab Aéroport et Transport

```
┌─────────────────────────────────────────────────────────────────┐
│  [Imagen 240×240]  │  Aéroport Ernesto Cortissoz (BAQ)          │
│                    │                                             │
│                    │  Aéroport Ernesto Cortissoz (BAQ) :         │
│                    │  Situé à 12 km du centre... [Lien]          │
│                    │                                             │
│                    │  ────────────────────────────────           │
│                    │  De l'aéroport au centre-ville              │
│                    │                                             │
│                    │  Taxis:     Transport:    Navettes:  Apps:  │
│                    │  Disponib.  Plusieurs...  Aucun...   Uber   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Checklist antes de publicar

- [ ] `intro_{lang}`: párrafo de descripción completo
- [ ] `intro_{lang}`: entre 2 y 4 items en la lista
- [ ] `intro_{lang}`: labels de items ≤ 15 caracteres
- [ ] `airportAndTransport_{lang}`: H3 para nombre del aeropuerto
- [ ] `airportAndTransport_{lang}`: párrafo con descripción y link al sitio oficial
- [ ] `airportAndTransport_{lang}`: H3 para el título de la sección de transporte
- [ ] `airportAndTransport_{lang}`: bulleted list con **máximo 4 opciones**
- [ ] `airportAndTransport_{lang}`: labels de transporte ≤ 20 caracteres
- [ ] Campos diligenciados en todos los idiomas activos del site (es, en, fr, pt)
