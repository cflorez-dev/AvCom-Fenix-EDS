# Upgrades — mapeo de idioma para la redirección MMB (VSTS 1301186)

**Fecha:** 2026-07-31
**Rama:** `feature/1301186`
**Antecedente:** [2026-07-23-upgrades-form-design.md](2026-07-23-upgrades-form-design.md) §5

## Problema

El formulario de upgrades redirige a MMB con el idioma de la cookie del usuario:

```js
// cabin-upgrade-form.js
const url = buildMmbRedirectUrl({ baseUrl: mmbUrl, lang: getStoredLanguage() || 'es', ... });
// upgrades-result.js
const resolvedBase = baseUrl.replace('{lang}', lang);
```

El sitio de destino (`https://gestiona.avianca.com/{lang}/manage/upgrade-business-class`) no tiene
versión en francés. Un usuario con la cookie en `fr` aterriza en una URL inexistente.

## Requerimiento

Aplica a todos los idiomas del producto (ES, EN, PT, FR), todos los dispositivos, navegadores y
sistemas operativos. **FR debe dirigirse a EN.** El destino debe poder cambiarse sin deploy, por si
el negocio habilita el sitio en francés o decide otro destino.

## Diseño

El mapeo vive en la lógica pura de redirect (`upgrades-result.js`), no en el componente ni en
`getStoredLanguage()`. Razón: `buildMmbRedirectUrl` ya es la dueña del reemplazo de `{lang}`, así que
resolver ahí garantiza que ningún llamador se lo salte, y queda testeable sin DOM ni fetch.
Tocar `getStoredLanguage()` está descartado: afecta al header, a los catálogos i18n y al POS, y
volvería FR en EN donde no corresponde.

### 1. `scripts/services/upgrades/upgrades.service.js` — leer y parsear la key

```js
export const DEFAULT_MMB_LANG_MAP = { fr: 'en' };
export const parseLangMap = (text) => { /* pares "origen:destino" separados por , o ; */ };
```

`getUpgradesConfig()` pasa a devolver `{ channel, mmbUrl, langMap }`, siguiendo el patrón ya
establecido de `AV_UPGRADES_CHANNEL` / `AV_UPGRADES_MMB_URL`.

**Key nueva:** `AV_UPGRADES_MMB_LANG_MAP` en el sheet `environment`.

- Formato autorable: `fr:en`, o varios pares: `fr:en,it:en`. Separadores `,` o `;`; tolerante a
  espacios y mayúsculas (se normaliza a minúsculas).
- Entradas malformadas (sin `:`, con origen o destino vacío, o con `:` de más como `de:es:xx`) se
  descartan una por una, sin tumbar a las válidas.
- Si la key no existe, está vacía o no aporta **ni un par válido** → `DEFAULT_MMB_LANG_MAP`.
- Si aporta pares válidos → **reemplaza el default por completo**. Lo que está autorado en la hoja
  es lo que aplica, sin merge implícito. Para apagar el mapeo el negocio autora `fr:fr`.

### 2. `scripts/services/upgrades/upgrades-result.js` — aplicar el mapeo

```js
export const resolveMmbLang = (lang, langMap) => // normaliza y traduce; si no está en el mapa, pasa tal cual
export const buildMmbRedirectUrl = ({ baseUrl, lang, pnr, lastName, langMap }) =>
  // resolveMmbLang antes del replace('{lang}')
```

`langMap` es opcional: sin él la función se comporta exactamente como hoy, y los tests existentes de
`buildMmbRedirectUrl` siguen verdes sin tocarlos.

### 2.bis URL propia por idioma

El mapa de idiomas solo alcanza cuando el destino se arma desde la URL compartida cambiando el
segmento de idioma. Si un idioma tiene **otro host u otra ruta**, se le da su propia URL con una key
opcional por idioma:

**Key nueva:** `AV_UPGRADES_MMB_URL_<IDIOMA>` en el sheet `environment`, p. ej.
`AV_UPGRADES_MMB_URL_FR = https://otrositio.com/fr-upgrades`.

- `collectMmbUrlOverrides()` en `upgrades.service.js` las recoge **por prefijo**, así agregar un
  idioma es autorar una fila y no un deploy. `getUpgradesConfig()` las expone como `urlByLang`.
- El guion bajo final del prefijo es lo que evita que la propia `AV_UPGRADES_MMB_URL` se lea como
  override.
- `resolveMmbBaseUrl(lang, { baseUrl, urlByLang })` en `upgrades-result.js` elige la URL. La búsqueda
  es **por el idioma del usuario, no por el ya traducido con el langMap**: la key se llama `_FR`
  porque significa "para un usuario en francés", y buscar después de traducir caería en la de inglés.
- Si la URL propia trae `{lang}`, se resuelve con el mismo `langMap` que la compartida.

**Precedencia final:** URL propia del idioma → URL compartida + mapa de idioma → default de código.

### 3. `design-system/organisms/forms/cabin-upgrade-form/cabin-upgrade-form.js`

Pasar `langMap` y `urlByLang` junto a `mmbUrl`, los tres de `getUpgradesConfig()`.

### Comportamiento resultante

| Cookie de idioma | `{lang}` en la URL MMB |
| --- | --- |
| `fr` | `en` (por el mapa) |
| `es` / `en` / `pt` | igual |
| ausente | `es` (comportamiento actual, sin cambios) |
| cualquier otro | pasa tal cual |

Y si el idioma tiene autorada su `AV_UPGRADES_MMB_URL_<IDIOMA>`, esa URL gana sobre todo lo anterior.

Sin whitelist estricta: solo se traduce lo que esté en el mapa. Decisión deliberada — evita cambiar
el comportamiento de casos que hoy funcionan.

## Testing

Vitest, patrón `tests/services/upgrades/` existente:

- `parseLangMap`: un par, varios pares, separador `;`, espacios y mayúsculas, texto basura, vacío.
- `resolveMmbLang`: `fr`→`en`, `es`/`en`/`pt` intactos, idioma fuera del mapa pasa tal cual,
  entrada vacía o `undefined`.
- `buildMmbRedirectUrl`: con `langMap` (FR resuelve a `/en/`), sin `langMap` (idéntico a hoy).
- `getUpgradesConfig`: lee `AV_UPGRADES_MMB_LANG_MAP` del sheet; cae al default cuando falta.
- `collectMmbUrlOverrides`: recoge `AV_UPGRADES_MMB_URL_FR`/`_PT`, indexa en minúsculas, ignora
  valores vacíos, y **no** confunde `AV_UPGRADES_MMB_URL` ni `AV_UPGRADES_MMB_LANG_MAP` con overrides.
- `resolveMmbBaseUrl`: la URL propia gana; los demás idiomas usan la compartida; la búsqueda es por
  el idioma del usuario y no por el traducido; cookies hostiles no caen en `Object.prototype`.
- `cabin-upgrade-form`: con cookie `fr` y resultado `ELIGIBLE`, la URL de `window.location.assign`
  contiene `/en/`.

## Fuera de alcance

- **Los textos del formulario.** El usuario FR sigue viendo la página en francés; solo cambia el
  idioma del destino MMB.
- El sitio de destino en sí (`gestiona.avianca.com`), fuera del repo.
- El fallback `'es'` de `getStoredLanguage() || 'es'`: se conserva tal cual.

## Deploy

Nada obligatorio. El default `fr:en` va en código, así que el fix aplica solo con el deploy del
front. `AV_UPGRADES_MMB_LANG_MAP` en `environment.json` es **opcional**, únicamente si el negocio
quiere cambiar el destino más adelante.
