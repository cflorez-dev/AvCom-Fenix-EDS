# Guía para Crear Contenido de Prueba - CMS Accordion V2

Esta guía proporciona ejemplos concretos para probar todos los tipos de contenido soportados por el accordion V2 **(excepto tabla, que está bloqueada por problemas de estructura del documento)**.

## 📋 Tipos de Slots Disponibles

El accordion V2 soporta **10 tipos de slots**, pero **solo 9 están funcionales**:

✅ **Funcionales (9):**
1. Texto (richtext)
2. Texto + Botón
3. Alerta
4. Imagen
5. Banner Secundario
6. Cards Informativas
7. Carrusel Promocional
8. Mosaico de Cards
9. Vacío

❌ **Bloqueado:**
- Tabla de Datos (requiere recreación del documento en AEM)

---

## 🎯 Cómo Crear Items de Prueba

> ⚠️ **IMPORTANTE:** Los ejemplos muestran HTML para referencia, pero en AEM Universal Editor debes usar el **editor visual** (WYSIWYG) para formatear el texto. NO copies las etiquetas HTML directamente.

### 🖊️ Cómo Usar el Richtext Editor

El richtext editor en AEM Universal Editor funciona como Word o Google Docs:

1. **Negritas:** Selecciona el texto y haz clic en el botón **B** o usa `Ctrl+B`
2. **Cursivas:** Botón **I** o `Ctrl+I`
3. **Listas:** Botón de lista con viñetas (•) o numerada (1,2,3)
4. **Enlaces:** Selecciona el texto, haz clic en el botón de enlace (🔗) y pega la URL
5. **Títulos:** Usa el dropdown de estilos para seleccionar H2, H3, H4, etc.

**NO hagas esto:** ❌ Pegar `<strong>texto</strong>` directamente  
**Haz esto:** ✅ Escribe "texto" y usa el botón **B** para ponerlo en negrita

---

### 1️⃣ Texto Simple (richtext)

**Cuándo usar:** Para mostrar contenido de texto con formato (negritas, listas, enlaces, etc.)

**Campos a configurar:**
- **slotAType**: `text`
- **slotA_richTextBody**: Usa el editor visual para formatear

**Contenido a escribir en el editor:**

```
Documentos Requeridos para Viajes Internacionales
[Selecciona esta línea y aplica estilo "Heading 3"]

Para viajar fuera del país necesitas llevar contigo:

• Pasaporte vigente [selecciona "Pasaporte vigente" y ponlo en negrita] con al menos 6 meses de validez
• Visa (si el país de destino lo requiere)
• Tarjeta de vacunación COVID-19
• Comprobante de reserva de hotel
[Selecciona todo este texto y usa el botón de lista con viñetas]

Algunos países también requieren visas especiales [selecciona "visas especiales" y crea enlace a /visas] que debes tramitar con anticipación.

Nota: Verifica los requisitos específicos del país al que viajarás en nuestro portal de requisitos [selecciona "portal de requisitos" y crea enlace a /travel-requirements].
[Selecciona la línea completa "Nota:..." y ponla en cursiva]
```

**Referencia HTML (cómo se verá el código final):**
```html
<h3>Documentos Requeridos para Viajes Internacionales</h3>
<p>Para viajar fuera del país necesitas llevar contigo:</p>
<ul>
  <li><strong>Pasaporte vigente</strong> con al menos 6 meses de validez</li>
  <li>Visa (si el país de destino lo requiere)</li>
  <li>Tarjeta de vacunación COVID-19</li>
  <li>Comprobante de reserva de hotel</li>
</ul>
<p>Algunos países también requieren <a href="/visas">visas especiales</a> que debes tramitar con anticipación.</p>
<p><em>Nota: Verifica los requisitos específicos del país al que viajarás en nuestro <a href="/travel-requirements">portal de requisitos</a>.</em></p>
```

**Resultado esperado:** Texto formateado con título, lista con viñetas, negritas y enlaces.

---

### 2️⃣ Texto + Botón

**Cuándo usar:** Para contenido explicativo que requiere una acción del usuario.

**Campos a configurar:**
- **slotAType**: `text-button`
- **slotA_richTextBody**: Usa el editor visual
- **slotA_buttonLabel**: Texto del botón (ej: "Ver más detalles")
- **slotA_buttonUrl**: URL del enlace (ej: "/equipaje/medidas")
- **slotA_buttonLinkType**: `internal`, `external`, o `anchor`
- **slotA_buttonVariant**: `primary`, `secondary`, o `tertiary`

**Contenido a escribir en el editor:**

```
¿Necesitas Más Equipaje?
[Aplica estilo "Heading 3"]

Si necesitas llevar más maletas de las permitidas en tu tarifa, puedes comprar equipaje adicional con descuento antes de tu vuelo.

Beneficios de comprar por adelantado: [poner en negrita]
• Hasta 40% de descuento vs. aeropuerto
• Garantiza espacio en bodega
• Evita filas en el counter
[Crear lista con viñetas]
```

**Configuración del botón:**
- **Label:** "Comprar Equipaje Adicional"
- **URL:** "/servicios/equipaje-adicional"
- **Link Type:** `internal`
- **Variant:** `primary`

**Referencia HTML (resultado final):**
```html
<h3>¿Necesitas Más Equipaje?</h3>
<p>Si necesitas llevar más maletas de las permitidas en tu tarifa, puedes comprar equipaje adicional con descuento antes de tu vuelo.</p>
<p><strong>Beneficios de comprar por adelantado:</strong></p>
<ul>
  <li>Hasta 40% de descuento vs. aeropuerto</li>
  <li>Garantiza espacio en bodega</li>
  <li>Evita filas en el counter</li>
</ul>
```

**Resultado esperado:** Texto formateado con un botón primario al final.

---

### 3️⃣ Alerta

**Cuándo usar:** Para destacar información importante, advertencias o mensajes de éxito.

**Campos a configurar:**
- **slotAType**: `alert`
- **slotA_alertVariant**: `success`, `error`, `informative`, `caution`, `neutral`
- **slotA_alertContent**: Usa el editor visual (NO pegues HTML)
- **slotA_alertDismissible**: `true` o `false` (para permitir cerrar)

**Ejemplo 1: Alerta Informativa**

Escribe en el editor:
```
COVID-19: [poner en negrita] Todos los pasajeros deben usar mascarilla durante el vuelo y en el aeropuerto.
```

- **Variant:** `informative`
- **Dismissible:** `false`

**Ejemplo 2: Alerta de Advertencia**

Escribe en el editor:
```
⚠️ Atención: [poner en negrita] Los vuelos a Cartagena pueden presentar retrasos por condiciones climáticas. Llega al aeropuerto con 3 horas de anticipación.
```

- **Variant:** `caution`
- **Dismissible:** `true`

**Ejemplo 3: Alerta de Error**

Escribe en el editor:
```
Cambio de Vuelo No Disponible: [poner en negrita] Tu tarifa Basic no permite cambios. Para modificar tu reserva, contacta a nuestro call center o considera comprar una tarifa Flex.
```

- **Variant:** `error`
- **Dismissible:** `true`

**Ejemplo 4: Alerta de Éxito**

Escribe en el editor:
```
✓ Check-in Confirmado: [poner en negrita] Tu tarjeta de embarque ha sido enviada a tu correo. También puedes descargarla desde la app de Avianca.
```

- **Variant:** `success`
- **Dismissible:** `true`

**Resultado esperado:** Alerta con el estilo visual correspondiente al variant (colores, iconos).

---

### 4️⃣ Imagen

**Cuándo usar:** Para mostrar una imagen explicativa (diagrama, infografía, mapa).

**Campos a configurar:**
- **slotAType**: `image`
- **slotA_image**: Referencia a la imagen en DAM
- **slotA_imageAlt**: Texto alternativo

**Ejemplo de contenido:**
- **Imagen:** `/content/dam/avianca/help-center/baggage-dimensions-diagram.png`
- **Alt:** "Diagrama de dimensiones permitidas para equipaje de mano: máximo 55cm x 35cm x 25cm"

**Resultado esperado:** Imagen responsive con alt text accesible.

---

### 5️⃣ Banner Secundario

**Cuándo usar:** Para destacar promociones, ofertas especiales o información crítica dentro del accordion.

**Campos a configurar:**
- **slotAType**: `banner`
- **slotA_bannerTitle**: Título principal
- **slotA_bannerFirstLabel**: Etiqueta superior (opcional)
- **slotA_bannerSecondaryLabel**: Etiqueta inferior (opcional)
- **slotA_bannerImageDesktop**: Imagen para desktop
- **slotA_bannerImageMobile**: Imagen para mobile
- **slotA_bannerImageAlt**: Texto alternativo
- **slotA_bannerCtaText**: Texto del botón
- **slotA_bannerCtaUrl**: URL del botón
- **slotA_bannerMode**: `light` o `dark`
- **slotA_bannerBackgroundType**: `solid` o `gradient`
- **slotA_bannerBackgroundColor**: Color en hexadecimal

**Ejemplo de contenido:**
- **Title:** "LifeMiles: Vuela Gratis"
- **First Label:** "Promoción Especial"
- **Secondary Label:** "Válido hasta diciembre 2024"
- **Image Desktop:** `/content/dam/avianca/banners/lifemiles-promo-desktop.jpg`
- **Image Mobile:** `/content/dam/avianca/banners/lifemiles-promo-mobile.jpg`
- **Image Alt:** "Acumula millas y vuela gratis con LifeMiles"
- **CTA Text:** "Únete Ahora"
- **CTA URL:** "/lifemiles/registro"
- **Mode:** `dark`
- **Background Type:** `gradient`
- **Background Color:** `#d32f2f` (rojo Avianca)

**Resultado esperado:** Banner con imagen responsive, texto overlay y botón CTA.

---

### 6️⃣ Cards Informativas (Grid)

**Cuándo usar:** Para presentar información relacionada en formato de tarjetas (hasta 4 cards).

**Campos a configurar:**
- **slotAType**: `cards-grid`
- **slotA_cardsVariant**: `vertical` o `horizontal`
- Para cada card (1-4):
  - `slotA_card{N}Image`: Imagen de la card
  - `slotA_card{N}ImageAlt`: Texto alternativo
  - `slotA_card{N}Title`: Título de la card
  - `slotA_card{N}Details`: Descripción (richtext)
  - `slotA_card{N}ButtonText`: Texto del botón
  - `slotA_card{N}ButtonUrl`: URL del botón

**Ejemplo: 3 Cards de Clases de Servicio**

**Card 1: Clase Económica**
- **Image:** `/content/dam/avianca/classes/economy-cabin.jpg`
- **Alt:** "Interior de cabina económica de Avianca"
- **Title:** "Clase Económica"
- **Details:** (usa el editor visual)
  ```
  La opción perfecta para viajeros que buscan tarifas accesibles sin sacrificar comodidad.
  
  • Asiento reclinable
  • Entretenimiento a bordo
  • Snacks y bebidas
  [Crear lista con viñetas]
  ```
- **Button Text:** "Ver Tarifas"
- **Button URL:** "/tarifas/economica"

**Card 2: Clase Ejecutiva**
- **Image:** `/content/dam/avianca/classes/business-cabin.jpg`
- **Alt:** "Interior de cabina ejecutiva con asientos reclinables 180 grados"
- **Title:** "Clase Ejecutiva"
- **Details:** (usa el editor visual)
  ```
  Viaja con el máximo confort y servicios premium en todos tus vuelos.
  
  • Asientos-cama reclinables 180°
  • Comidas gourmet
  • Priority boarding y lounge access
  [Crear lista con viñetas]
  ```
- **Button Text:** "Upgrade Ahora"
- **Button URL:** "/upgrade/ejecutiva"

**Card 3: Avianca Plus**
- **Image:** `/content/dam/avianca/loyalty/avianca-plus-card.jpg`
- **Alt:** "Tarjeta Avianca Plus con beneficios exclusivos"
- **Title:** "Avianca Plus"
- **Details:** (usa el editor visual)
  ```
  Únete a nuestro programa de lealtad y acumula millas en cada vuelo.
  
  • Millas por cada vuelo
  • Acceso a salones VIP
  • Prioridad en check-in
  [Crear lista con viñetas]
  ```
- **Button Text:** "Registrarme Gratis"
- **Button URL:** "/avianca-plus/registro"

**Configuración:**
- **Variant:** `vertical` (cards apiladas verticalmente en mobile, grid en desktop)

**Resultado esperado:** Grid de 3 cards con imágenes, títulos, descripciones y botones. En mobile se apilan verticalmente, en desktop forman una grilla.

---

### 7️⃣ Carrusel Promocional

**Cuándo usar:** Para mostrar múltiples cards que el usuario puede deslizar (mismo formato que cards-grid pero con comportamiento de carrusel).

**Campos a configurar:**
- **slotAType**: `carousel`
- Mismos campos que cards-grid (hasta 4 cards)

**Ejemplo: 4 Cards de Destinos Populares**

**Card 1: Miami**
- **Image:** `/content/dam/avianca/destinations/miami-beach.jpg`
- **Alt:** "Vista aérea de las playas de Miami"
- **Title:** "Miami"
- **Details:** (usa el editor visual)
  ```
  Descubre las playas más icónicas de Florida y disfruta de su vibrante vida nocturna.
  
  Desde: [poner en negrita] $350 USD
  ```
- **Button Text:** "Ver Vuelos"
- **Button URL:** "/destinos/miami"

**Card 2: Nueva York**
- **Image:** `/content/dam/avianca/destinations/new-york-skyline.jpg`
- **Alt:** "Skyline de Manhattan con el Empire State Building"
- **Title:** "Nueva York"
- **Details:** (usa el editor visual)
  ```
  La ciudad que nunca duerme te espera con sus museos, teatros y gastronomía mundial.
  
  Desde: [poner en negrita] $420 USD
  ```
- **Button Text:** "Ver Vuelos"
- **Button URL:** "/destinos/nueva-york"

**Card 3: Madrid**
- **Image:** `/content/dam/avianca/destinations/madrid-plaza-mayor.jpg`
- **Alt:** "Plaza Mayor de Madrid con arquitectura histórica"
- **Title:** "Madrid"
- **Details:** (usa el editor visual)
  ```
  Explora la capital española, su arte, historia y la mejor comida mediterránea.
  
  Desde: [poner en negrita] $680 USD
  ```
- **Button Text:** "Ver Vuelos"
- **Button URL:** "/destinos/madrid"

**Card 4: Cartagena**
- **Image:** `/content/dam/avianca/destinations/cartagena-walled-city.jpg`
- **Alt:** "Ciudad amurallada de Cartagena al atardecer"
- **Title:** "Cartagena"
- **Details:** (usa el editor visual)
  ```
  Vive la magia del Caribe colombiano en la ciudad amurallada más hermosa de América.
  
  Desde: [poner en negrita] $120 USD
  ```
- **Button Text:** "Ver Vuelos"
- **Button URL:** "/destinos/cartagena"

**Resultado esperado:** Carrusel deslizable con 4 cards. En mobile muestra 1 card a la vez con controles de navegación, en desktop puede mostrar múltiples cards visibles.

---

### 8️⃣ Mosaico de Cards

**Cuándo usar:** Similar a cards-grid pero con un layout de mosaico más visual (mismo formato técnico que carousel/cards-grid).

**Campos a configurar:**
- **slotAType**: `mosaic`
- Mismos campos que cards-grid (hasta 4 cards)

**Ejemplo: Servicios Especiales**

**Card 1: Mascotas a Bordo**
- **Image:** `/content/dam/avianca/services/pet-travel.jpg`
- **Alt:** "Perro viajando en transportadora aprobada por aerolínea"
- **Title:** "Viaja con tu Mascota"
- **Details:** (usa el editor visual)
  ```
  Lleva a tu compañero peludo contigo de manera segura y cómoda.
  ```
- **Button Text:** "Más Info"
- **Button URL:** "/servicios/mascotas"

**Card 2: Menores No Acompañados**
- **Image:** `/content/dam/avianca/services/unaccompanied-minor.jpg`
- **Alt:** "Niño con identificación de menor no acompañado siendo asistido por tripulación"
- **Title:** "Servicio para Menores"
- **Details:** (usa el editor visual)
  ```
  Cuidamos de tus hijos con asistencia personalizada durante todo el viaje.
  ```
- **Button Text:** "Solicitar"
- **Button URL:** "/servicios/menores"

**Resultado esperado:** Layout tipo mosaico con cards de diferentes tamaños (el diseño específico depende de la implementación del renderer).

---

### 9️⃣ Vacío (Empty State)

**Cuándo usar:** Para mostrar un mensaje cuando no hay contenido disponible o como placeholder.

**Campos a configurar:**
- **slotAType**: `empty`

**Ejemplo de uso:**
- Útil para accordion items que se llenarán con contenido dinámico desde APIs
- Placeholder durante desarrollo

**Resultado esperado:** Componente renderizado sin contenido visible (o con un mensaje de "sin contenido").

---

## 🏗️ Estructura Completa de un Accordion Item de Prueba

Para probar de manera exhaustiva, crea un **Accordion con múltiples items**, cada uno usando un slot type diferente:

### Item 1: Documentos Requeridos (Texto)
- **title:** "¿Qué documentos necesito para viajar?"
- **layoutType:** `single-column`
- **slotAType:** `text`
- (Usar el contenido del ejemplo #1)

### Item 2: Equipaje Adicional (Texto + Botón)
- **title:** "¿Puedo comprar equipaje adicional?"
- **layoutType:** `single-column`
- **slotAType:** `text-button`
- (Usar el contenido del ejemplo #2)

### Item 3: Avisos Importantes (Alerta)
- **title:** "Información sobre COVID-19"
- **layoutType:** `single-column`
- **slotAType:** `alert`
- (Usar el contenido del ejemplo #3, variant `informative`)

### Item 4: Medidas de Equipaje (Imagen)
- **title:** "¿Cuáles son las dimensiones permitidas?"
- **layoutType:** `single-column`
- **slotAType:** `image`
- (Usar el contenido del ejemplo #4)

### Item 5: Promoción LifeMiles (Banner)
- **title:** "Acumula millas y vuela gratis"
- **layoutType:** `single-column`
- **slotAType:** `banner`
- (Usar el contenido del ejemplo #5)

### Item 6: Clases de Servicio (Cards Grid)
- **title:** "¿Qué clases de servicio ofrecen?"
- **layoutType:** `single-column`
- **slotAType:** `cards-grid`
- **slotA_cardsVariant:** `vertical`
- (Usar las 3 cards del ejemplo #6)

### Item 7: Destinos Populares (Carrusel)
- **title:** "¿Cuáles son sus destinos más populares?"
- **layoutType:** `single-column`
- **slotAType:** `carousel`
- (Usar las 4 cards del ejemplo #7)

### Item 8: Servicios Especiales (Mosaico)
- **title:** "¿Qué servicios especiales ofrecen?"
- **layoutType:** `single-column`
- **slotAType:** `mosaic`
- (Usar las 2 cards del ejemplo #8)

---

## ✅ Checklist de Validación

Después de crear el contenido, valida:

### Visual
- ✅ **Border:** 1px solid #d9d9d9 visible en estado default
- ✅ **Shadow:** Solo visible en hover (0 2px 20px 2px rgba(73,73,73,0.25))
- ✅ **Chevron:** Icono de 12×8px (expand-more.svg del proyecto)
- ✅ **Typography:** H400 para título (Red Hat Display Bold 18px), P300 para cuerpo (16px)

### Responsive
- ✅ **Mobile (≤480px):** Padding 16px, full width
- ✅ **Tablet (480-767px):** Padding 32px, full width
- ✅ **Desktop (768-1247px):** Padding 32px, full width
- ✅ **Desktop XL (≥1248px):** Max-width 1248px centrado, padding 32px

### Interacciones
- ✅ **Hover:** Shadow aparece suavemente
- ✅ **Click:** Chevron rota 180°, contenido se expande
- ✅ **Open state:** Borde se mantiene, shadow solo en hover
- ✅ **Transiciones:** Suaves y fluidas

### Funcionalidad por Slot Type
- ✅ **Text:** Renderiza HTML enriquecido correctamente
- ✅ **Text-button:** Botón con variant correcto (primary/secondary/tertiary)
- ✅ **Alert:** Colores y estilos según variant (success/error/caution/informative/neutral)
- ✅ **Image:** Imagen responsive con alt text
- ✅ **Banner:** Imagen desktop/mobile, overlay de texto, botón CTA
- ✅ **Cards-grid:** Layout de grid responsive
- ✅ **Carousel:** Controles de navegación funcionales
- ✅ **Mosaic:** Layout de mosaico
- ✅ **Empty:** Renderiza sin errores

---

## 🚫 Nota sobre el Slot Type "Tabla"

El slot type **`table`** está **bloqueado** porque:
- El documento en AEM fue creado antes de que existieran los campos de tabla en el modelo
- La estructura actual tiene solo **13 divs** vs los **68+ campos** requeridos
- **Solución:** Recrear el documento en AEM Cloud usando el modelo actualizado

**No intentes probar el slot type `table` hasta que se corrija el documento base.**

---

## 🎨 Notas de Implementación

### Figma Design Validation
Este accordion fue validado contra los siguientes nodos de Figma:
- **930-54775:** Anatomía del accordion
- **930-54806:** Estados del accordion
- **930-54970:** Estado default y hover
- **930-55131:** Breakpoints responsivos

### Playwright Validation
Se realizaron pruebas automatizadas con capturas de pantalla en:
- 400px (mobile small)
- 600px (mobile large / tablet small)
- 900px (tablet)
- 1440px (desktop)

Todos los escenarios pasaron exitosamente ✅

---

## 📞 Soporte

Si encuentras problemas al crear contenido de prueba:

1. Verifica que estés usando el modelo correcto (`cms-accordion` en component-models.json)
2. Asegúrate de que el documento en AEM está actualizado con los campos más recientes
3. Revisa la consola del navegador para errores de JavaScript
4. Confirma que las imágenes referenciadas existen en el DAM

Para el caso del **slot type "tabla"**, espera a que se corrija la estructura del documento antes de intentar probarlo.
