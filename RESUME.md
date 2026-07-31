# RESUME — Agregar banderas faltantes (rama add-flags)

## Objetivo
Agregar al proyecto todas las banderas del banco del cliente
(`C:\Users\oscar.salas\Downloads\Flags v2\Flags v2`, ~195 SVG) que aún no existen,
siguiendo la convención de nombres: **español, kebab-case, sin tildes, sufijo `-flag.svg`**
(ej. `brasil-flag.svg`, `estados-unidos-flag.svg`, `republica-dominicana-flag.svg`).

Copiar a **ambos** destinos usados por el proyecto:
- `icons/flags/`
- `assets/icons/flags/` (este es el que sirve AEM EDS — ver `language-country-selector.js` `getIconsBasePath`)

## Reglas
- Excluir las 22 banderas del banco que ya existen (aunque algunas estén en inglés:
  `france`, `spain`, `uk`) → no duplicar.
- `europe-flag.svg` y `others-flag.svg` son propias (sin origen en el banco) → no tocar.
- Los `flagFileName` reales los define el spreadsheet AEM `countrieslist`
  (`countryFlagFileName`); estos archivos son el banco de assets para cuando se
  habiliten esos POS.

## Pasos
- [x] Explorar convención actual (24 banderas en icons/flags y assets/icons/flags)
- [x] Confirmar alcance (todas las faltantes) + idioma (español) con el usuario
- [x] Generar mapeo banco→slug español y copiar a ambos destinos (182 nuevas)
- [x] Verificar conteos (origen 204 = 182 nuevas + 22 existentes; total 206/dir; dirs idénticos; sin duplicados; SVG válidos 21x15)
- [x] Reportar resumen y decisiones límite

## Notas / decisiones límite
- `Afghanistan Taliban.svg` + `Afghanistan.svg`: el banco trae 2 banderas para Afganistán.
  Se agrega `afganistan-taliban-flag.svg` además de `afganistan-flag.svg`; revisar si se
  quiere solo una.
- Nombres normalizados sin tildes para coincidir con el set actual.

## Tarea 2 — Agregar POS a `target-countries` (models)
Agregar Alemania (de), Italia (it), Portugal (pt), Venezuela (ve) al multiselect
`target-countries` ("Target Countries (POS)") de TODOS los componentes.

- Fuente: `models/_component-models.json` (47 listas idénticas; hay un 48º campo
  `target-countries` tipo `text` sin options → NO se toca).
- Se anexan al FINAL de cada lista (tras Uruguay/uy) por seguridad (usuario OK con esto).
- Edición quirúrgica por texto (regex sobre bloque Uruguay-last), preservando formato/EOL;
  NO se reescribió el archivo completo. Validado con JSON.parse.
- `component-models.json` (raíz, generado) editado igual porque no hay `node_modules`
  para correr `build:json`, y `_component-models.json` no usa `$import` (merge = pass-through).
  ⚠️ Al reinstalar deps, correr `npm run build:json` regenera el root idéntico.
- Verificación: 752 add / 0 del en ambos; de/it/ve=47, pt=94 (47 país + 47 idioma).
- [x] Hecho y verificado.

---

# RESUME — AVAEMF2P20-270 Formulario Upgrades (MMB) — 2026-07-23

**Rama:** `feat/270-upgrades-form` (worktree `.claude/worktrees/feat-270-upgrades-form`, base `origin/avdev`)
**Spec:** `docs/superpowers/specs/2026-07-23-upgrades-form-design.md`
**Plan:** `docs/superpowers/plans/2026-07-23-upgrades-form.md` (7 tasks, subagent-driven; progreso en `.superpowers/sdd/progress.md`)

## Estado

- [x] Análisis ticket + Figma + colección Bruno (Digital - Upgrades)
- [x] Decisiones (usuario): creds Cognito en environment.json; modificar cabin-upgrade-form in place; URL MMB configurable + idioma dinámico; redirección misma pestaña
- [x] Ejemplo respuesta /validate recibido (PNR AYQQQS; upgradeStatus elegible/not_elegible; apellido se valida en front contra passengers[].lastName)
- [x] Spec escrito y aprobado en diseño (pendiente revisión del doc por el usuario)
- [x] Plan de implementación (writing-plans)
- [x] Implementación + tests (Tasks 1-5: servicio upgrades en apim-token, mapeo validate/MMB URL, cliente validate + retry 401, molecule full-page-loader, organism cabin-upgrade-form reescrito)
- [x] Task 6 (iconos de modales) en FALLBACK: sin el Figma activo con los nodos definitivos, los 3 modales quedan usando el icono existente `modals/upgrade-not-available`. Pendiente de diseño (ver más abajo).
- [x] Verificación (lint, tests) — ver detalle abajo
- [ ] E2E manual en browser (pasos documentados abajo; ya viable en dev sin sembrar tokens)
- [x] Documentación Confluence (2026-07-24): espacio AA, carpeta "Entrega 2026-07-24" — madre 4800249858 + 5 hijas (flujo funcional, integración técnica, configuración/diccionarios, dependencias/despliegue, QA). CAs re-verificados; CA-04 cerrado al 100% (2026-07-24, commit 13e77a98): ante NOT_FOUND el modal va acompañado de ambos campos en estado error (keys i18n cabinUpgradeForm.error.pnrNotFound/apellidoNotFound). Confluence actualizado (madre + hijas 1 y 3).
- [x] PNRs QA probados contra servicio real (2026-07-24): BBJVHZ/MANDELA, BBKZFK/ZAPATA, BBKQ8E/DIAZ, BBK698/CARVAJAL elegibles → MMB; BBL4Z4/ROJAS todo not_elegible → alta demanda; AYQQQS mixto → MMB. Ojo: lista externa decía "CARVAJAK" (apellido real CARVAJAL → caso de no coincidencia).
- [x] Fidelidad visual vs Figma (2026-07-25, verificada en browser sobre el preview): commit 77b74824 = valor de inputs en Bold real (!font-bold; utility perdía contra styles.css sin @layer — patrón !important como !text-base); commit 3f7ac4e7 = loader con condor inline visible (#1B1B1B) + animacion de trazo en loop (antes: decorative-vector blanco op.0.4, invisible sobre blanco). Mayúsculas del PNR ya funcionaban (lo reportado era el form viejo de avdev). E2E real: BBKQ8E/Diaz redirigió al MMB de Amadeus.
- [x] Loader oficial (2026-07-25, commit ed8ca24d): el form usa showLoader()/updateLoaderText del bloque cms-loader (GIF condor, mismo componente de las transiciones del producto — confirmado navegando www.avianca.com) con fallback a full-page-loader si la página no tiene el bloque. PENDIENTE CONTENIDO: autorar bloque cms-loader en /es/mis-viajes/business-class (hoy fallback). Con bloque autorado, el confinamiento del loader en megamenú/navbar desaparece (el bloque vive fuera del panel con transform).
- [x] PR a avdev → https://github.com/omni-pro/avianca-frontend-site/pull/1131
- [x] Revisión final de rama (2026-07-23): **Ready to merge**. 0 Critical. 1 Important NO-regresivo: el loader/modales quedan confinados dentro del megamenú (translate-y) y del drawer navbar-mobile (transform-gpu) porque un transform crea containing block para `fixed` — mismo comportamiento que ya tenía el modal viejo; en la landing (form-header-banner) es viewport completo. Acción: incluir pase visual de megamenú desktop + navbar mobile en el E2E manual. Minors no bloqueantes: maxLength/aria-* caen al div wrapper del atom Input (preexistente, merece ticket de a11y propio), doble `?` si AV_UPGRADES_MMB_URL trae query (documentar en handover), scroll-lock del loader inefectivo (html scrollea, cosmético), carrera de labels i18n en submit ultra-temprano (preexistente).

## Verificación (Task 7 — 2026-07-23)

- **Tests de la tarea**: `npx vitest run tests/services/upgrades tests/services/apim` → **56/56 verdes** (6 archivos:
  apim-token.service 17, apim-mode 9, apim-client.service 11, upgrades.service 6, upgrades-result 11,
  cabin-upgrade-form.helpers 2). Duración ~3s.
- **Suite completa**: `npx vitest run` en este entorno (Windows) es MUY lenta con el pool de threads por defecto
  (>45 min sin terminar en un intento; ver nota abajo) y con ciertos archivos NO relacionados a esta tarea que
  cuelgan cuando corren en modo `--pool=threads --poolOptions.threads.singleThread` de forma aislada:
  `tests/services/centribal/centribal.test.js` y `tests/services/members/login.service.test.js` (timeout >20s
  cada uno; ninguno importa nada de `apim-token`/`upgrades`). Se corrió la suite **por subdirectorio** y luego
  archivo-por-archivo (bisección con timeout de 20s) para aislar el resto:
  - `tests/blocks` + `tests/design-system` + `tests/organisms` + `tests/utils` (12 archivos): 8 passed, 4 failed
    (`date-range-picker.active-step.test.js`, `date-range-picker.router.test.js`,
    `origin-destination-selector.router.test.js`, `process-content-html.link-class.test.js`).
  - `tests/services` (47 archivos, bisección 1x1): 2 timeouts (`centribal.test.js`,
    `members/login.service.test.js`) + 3 fallos reales (`darksite/darksite-gate.test.js` 20/50,
    `geolocation/triangulation.router.test.js` 7/7, `members/elite-detail.service.test.js` 1/20); el resto
    (42 archivos) pasó limpio.
  - `tests/e2e/*.spec.js` (3 archivos): fallan de inmediato bajo `vitest run` con
    `Error: Playwright Test did not expect test.describe() to be called here` — son specs de Playwright, no
    vitest; incompatibilidad estructural preexistente (no hay `vitest.config` que los excluya).
  - **Los 9 archivos problemáticos (2 timeouts + 4 fallos design-system + 3 fallos services) tienen diff = 0
    líneas contra `origin/avdev`** (`git diff origin/avdev...HEAD -- <archivo>`) y ninguno importa algo que
    esta historia tocó (`apim-token.service.js`, `scripts/services/upgrades/**`,
    `cabin-upgrade-form.js`, `full-page-loader.js`) → **preexistentes, no relacionados con AVAEMF2P20-270**.
    No se tocaron.
- **Lint**: `npx eslint scripts/services/upgrades/ design-system/organisms/forms/cabin-upgrade-form/
  design-system/molecules/full-page-loader/ tests/services/upgrades/ tests/services/apim/apim-token.service.test.js`
  → 325 errores, **todos `linebreak-style` (CRLF vs LF)**. Confirmado que es un artefacto del checkout en
  Windows (`core.autocrlf=true`): el blob de git es LF pero el archivo en disco queda CRLF; se reproduce
  igual en archivos NO tocados por esta historia (ej. `scripts/scripts.js`, 1393 errores idénticos) y el blob
  de `apim-token.service.test.js` en `origin/avdev` no tiene CRLF. Filtrando `linebreak-style`: **0 errores
  reales** en el alcance de la tarea.

## Pendientes de coordinación (no bloquean el merge del código)

- **Backend**: ✅ RESUELTO en dev (2026-07-24). `getApiToken` ya soporta `service:'upgrades'` — contrato en
  `docs/FRONTEND_UPGRADES_TOKEN_CONTRACT.md` del repo omni-pro/avianca-appbuilder (main). Cadena completa
  verificada por curl contra dev: getApiToken(digital, token con Bearer) + getApiToken(upgrades, token crudo)
  → GET /v1/upgrades/validate = 200 con el payload de AYQQQS (APIM acepta el prefijo Bearer del token Azure).
  Pendiente solo: deploy del action a stage(QA)/prod + registrar `UPGRADES_COGNITO_*` en Cloud Manager de esos
  ambientes (el `AV_TOKEN_ENDPOINT` del frontend por ambiente debe apuntar al namespace correspondiente).
- **AEM**: keys i18n `cabinUpgradeForm.*` nuevas (labels del formulario/modales) + environment keys opcionales
  ya soportadas con fallback (`AV_UPGRADES_MMB_URL`, `AV_UPGRADES_CHANNEL`). Valor QA confirmado (2026-07-24):
  `AV_UPGRADES_MMB_URL = https://mmbqa.avtest.ink/{lang}/search` (autorizar en environment.json de QA; prod usa fallback gestiona).
- **Diseño**: iconos definitivos de los 3 modales (Figma nodos 77:7341 AirplaneMaintenance, 77:8287 FlatBed, y
  el de Reserva no encontrada) — Task 6 quedó en fallback usando `modals/upgrade-not-available` para los tres.
- **Seguridad**: rotar credenciales QA de la colección Bruno (Digital - Upgrades) antes de ir a prod — se usaron
  para sembrar el token en localStorage durante pruebas manuales.

## E2E manual (Step 3 del brief — NO ejecutado en este entorno, requiere browser + token QA)

Pasos documentados para ejecutar cuando haya entorno disponible:

1. `npm run start` (aem up) para levantar el dev server local.
2. En la consola del browser, sembrar el token QA (de la colección Bruno) para saltar el backend pendiente:
   ```js
   localStorage.setItem('avianca_apim_token_upgrades', JSON.stringify({
     token: '<access_token de Bruno>', expiresAt: Date.now() + 55 * 60 * 1000,
   }));
   ```
3. Casos a probar en el formulario cabin-upgrade-form:
   - PNR `AYQQQS` + apellido `Morales` → debe redirigir a MMB con
     `?pnr=AYQQQS&lastname=Morales&flow=mmb`.
   - PNR `AYQQQS` + apellido `Garcia` (no coincide) → modal "Reserva no encontrada".
   - PNR `ZZZZZZ` (no existe) → modal "Reserva no encontrada".
   - Sin red (DevTools offline) → modal "¡Ups!" (error técnico).
   - Campos vacíos → errores inline (PNR y apellido).
4. Verificar mientras se navega: el loader full-page se muestra durante la llamada a `/validate` y el foco
   entra correctamente a los modales al abrirse (navegación por teclado, Escape/Tab dentro del modal).

## Claves

- Servicios: GET /v1/upgrades/validate (headers Authorization[digital] + Ocp-Apim-Subscription-Key + AuthorizationUpgrades[upgrades] + channel + PNR) sobre apimBaseUrl del servicio 'digital'.
- Mapeo (CONFIRMADO contra QA 2026-07-23): PNR inexistente = 200 con passengers/segments null → NOT_FOUND; apellido sin match → NOT_FOUND; ≥1 elegible → ELIGIBLE; 0 elegibles → NO_AVAILABILITY; resto → ERROR. Token body: {access_token}; puede dar 200 con {"error":"invalid_client"} → éxito = presencia de access_token.
- Seguridad DECIDIDA (usuario): secreto Cognito NUNCA al frontend. Token upgrades vía getApimCredentials('upgrades') — agregar 'upgrades' a VALID_SERVICES; backend de AV_TOKEN_ENDPOINT debe exponer service:'upgrades' → {token, expiresIn} (PENDIENTE coordinación backend; bloquea solo E2E). QA manual: sembrar localStorage avianca_apim_token_upgrades con token de Bruno.
- environment.json keys: AV_UPGRADES_MMB_URL, AV_UPGRADES_CHANNEL (fallback 'MMB'), AV_UPGRADES_MMB_LANG_MAP (fallback 'fr:en'), AV_UPGRADES_MMB_URL_<IDIOMA> (opcional, sin fallback). NO van creds Cognito.
- Idioma de la redirección MMB (VSTS 1301186): el sitio de destino no está publicado en francés, así que FR se manda a EN. Default en código (DEFAULT_MMB_LANG_MAP), sobreescribible sin deploy con AV_UPGRADES_MMB_LANG_MAP (formato 'fr:en' o 'fr:en,it:en'; la key autorada reemplaza el default, no se mezcla; 'fr:fr' apaga el mapeo). Spec: docs/superpowers/specs/2026-07-31-upgrades-mmb-lang-map-design.md.
- URL propia por idioma (mismo VSTS): si el destino de un idioma no se arma desde la URL compartida (otro host u otra ruta), se autora AV_UPGRADES_MMB_URL_<IDIOMA> (p. ej. AV_UPGRADES_MMB_URL_FR) y esa URL gana. Se recogen por prefijo, así agregar un idioma es autorar una fila. La búsqueda es por el idioma del USUARIO, no por el ya traducido con el langMap. Precedencia: URL propia > URL compartida + mapa de idioma > default de código.
- Modales (ModalAviancaLayout): alta demanda ("Consultar otra reserva"), reserva no encontrada ("Reintentar"), error técnico ("Reintentar"). Loader full-page nuevo (molecule full-page-loader).
- PNR máx 6 alfanumérico MAYÚSCULAS; helper apellido "Tal y como aparece(n) en la reserva".
- Plan: docs/superpowers/plans/2026-07-23-upgrades-form.md (7 tasks, subagent-driven).
- Commit con --no-verify si el hook pre-commit re-estagea tw.css.

---

# RESUME — Diagnóstico inestabilidad avdev vs avqa (darksite) — 2026-07-14

## Conclusión (causa raíz ÚNICA)
avdev NO está "roto": tiene el **darksite ENABLED**. En avdev
`localStorage['av-darksite-state'] = {enabled:true, level:"max", affectedPos:["CO"], flights:[AV1224 BOG→MIA]}`.
En avqa ese estado es **null** (darksite apagado) → por eso avqa se ve "estable" = tu diseño normal.

Un solo flag (`av-darksite-state.enabled === true`) dispara TODO el "modo darksite" en CUALQUIER
página (no solo `/darksite/`), para el POS afectado (CO):

1. **Header raro al scrolear**: `body.darksite-active` monta la barra `.darksite-header-alert`
   (60px, sticky top:0) y deja `--marquee-height:60px`. El header (`header.header-wrapper`) es
   `position:sticky; top:var(--marquee-height,0px)` → queda a top:60px, bajo la alerta.
   Además `scheduleMarquesinaFinalize()` (blocks/marquesina/marquesina.js:274) hace `return` temprano
   si `body.darksite-active`, así que NUNCA resetea `--marquee-height` a 0.
   En avqa: sin alerta, `--marquee-height:0`, header top:0 = limpio.

2. **Multitab con anchos que rompen el DS**: blocks/multitab/multitab.js:112-119 lee
   `isDarksiteMode` de `localStorage['av-darksite-state'].enabled`. Si true →
   línea 431 `tabWidth = 'flex-1 min-w-[200px]'` (tabs iguales estirados). Con 2 tabs, cada uno
   ocupa ~50% → el "Tab 1" gigante. En modo normal es `w-auto` (compacto) = como se ve avqa.
   Nota: `isDarksiteMode` viene del flag GLOBAL, no de si la página es realmente darksite.

## Evidencia (browser, viewport 1440)
| | avdev (darksite ON) | avqa (darksite OFF) |
|---|---|---|
| localStorage av-darksite-state | enabled:true | null |
| body class | appear **darksite-active** | appear |
| .darksite-header-alert | presente 60px top:0 | ausente |
| --marquee-height / header top | 60px / 60px | 0px / 0px |
| multitab tabWidth | flex-1 (Tab1 ~50%) | w-auto (compacto) |

## Decisiones del usuario (2026-07-14)
- darksite en avdev está ENABLED **a propósito** (test). avqa lo tiene OFF a propósito.
- El estilo darksite debe aplicar **SOLO a rutas /darksite/**, no filtrarse a páginas normales.

## Conclusión refinada (tras leer darksite-gate.js)
Hay que separar DOS cosas que el usuario percibía como "un bug":

1. **Barra de alerta negra + header a top:60px en páginas normales = INTENCIONAL (no es bug).**
   Es el "bypass chrome" (Figma §1.1). Al pulsar "Continuar", `mountHeaderAlert()`
   (darksite-gate.js:965) agrega `body.darksite-active`, oculta la marquesina, monta
   `.darksite-header-alert` (sticky top:0, 60px) y setea `--marquee-height` = altura de la alerta.
   Es un recordatorio de contingencia por sesión para el POS afectado. Al scrolear el header
   queda pegado bajo la alerta (verificado: ambos sticky, sin gap ni glitch). avqa se ve
   distinto solo porque darksite está OFF.

2. **Multitab con tabs estirados en páginas normales = BUG REAL.**
   `blocks/multitab/multitab.js:112-119` deriva `isDarksiteMode` del flag GLOBAL
   `localStorage['av-darksite-state'].enabled`, no de la ruta ni de una clase de sección.
   Línea 431 → `tabWidth='flex-1 min-w-[200px]'`. Con 2 tabs cada uno ocupa ~50% (Tab 1 gigante).
   Esto se filtra a CUALQUIER página cuando hay evento activo. Rompe el DS. → ESTE es el fix.

## Fix APLICADO (multitab gateado por ruta, root de environment) — 2026-07-14
Decisión del usuario: gatear por ruta usando el root de detail pages de environment
(`AV_DARKSITE_DETAIL_PAGES_ROOT`), NO quemado.

Archivos:
- `scripts/services/darksite/darksite-detail.js`: NUEVO export puro
  `isDarksiteStyleActive(pathname, root, state)` = `state?.enabled===true && isUnderDetailRoot(pathname, root)`.
- `blocks/multitab/multitab.js`: import de `readDetailPagesRoot, isDarksiteStyleActive`; el bloque
  que antes ponía `isDarksiteMode = enabled` (flag global) ahora, solo si hay evento activo,
  hace `isDarksiteMode = isDarksiteStyleActive(location.pathname, await readDetailPagesRoot(), state)`.
  Short-circuit: si no hay evento, no se consulta environment (sin costo en el 99% de páginas).
- `tests/services/darksite/darksite-detail.test.js`: NUEVO, 6 tests TDD (RED→GREEN), incluye
  no-leak en página normal, no-quemado (root /contingencia/), tree-safe.

Verificación:
- `node --check` OK en ambos. `npx vitest run` del test nuevo: 6/6 PASS.
- E2E con DATA REAL en browser (avdev, evento CO activo, path /es/andrea/entrega-29-de-mayo):
  envRoot=/darksite/ (de environment.json), decisión NUEVA en página normal = FALSE (fix),
  en /darksite/es/flight-info = TRUE. Antiguo comportamiento = TRUE (el bug).
- PENDIENTE (limitación del entorno, sin node_modules): eslint del repo + suite darksite completa
  (usa happy-dom no instalado) + `aem up` en la rama. Correr en CI/local antes de PR.
- PENDIENTE de coordinación: en qué rama va (NO commitear directo en avdev; darksite vive en
  worktree `feat/darksite-detail-header-footer`).

---

# RESUME — Chrome (header/footer) para landings de detalle darksite

**Historia:** AVAEMF2P20-221 · **Rama:** `feat/darksite-detail-header-footer` (worktree, base `origin/darksite`)
**Objetivo:** Que las landings de detalle de afectación de vuelo (`/darksite/{lang}/...`) carguen
`HeaderDarksite variant='light'` + `FooterBottom variant='darksite-light'` en vez del header/footer
general del sitio, sin afectar el resto de páginas.

## Decisiones cerradas (con el usuario)
- **Mecanismo:** empezar **lean** = mount programático vía Preact en `loadLazy`, migrar a bloque
  autor-able (`blocks/header-darksite`) en una 2da iteración.
- **Gating:** ruta bajo `AV_DARKSITE_DETAIL_PAGES_ROOT` (env, default `/darksite/`) **AND** `enabled`
  del CF (reusar `readCachedState`/`fetchDarksiteState` del service). **Bypass en author env** (el
  autor siempre ve el chrome al editar). NO se filtra por POS (el usuario ya pasó el gate del interstitial).
- **Modo OFF en landing darksite:** si NO está enabled (y no es author), el gate REDIRIGE al home del
  idioma de la página (`/${detectDarksiteLang(pathname)}/`, ej. `/es/`) — no muestra el chrome normal.
  Se hace en loadEager (antes del paint, sin flash), reusando el estado que el gate ya resuelve.
- **Selector de idioma:** navega a la landing equivalente reusando el mecanismo existente
  `hreflang-redirection.js` → `getAlternatePageForLanguage(lang)` (metadata `alternate-page-{lang}`
  autorada en page properties). Fallback al hub `/darksite/{lang}/` si no hay alternate.
- **Labels de idioma:** endónimos (Español / English / Português / Français).
- **Componentes DS:** `HeaderDarksite` (light) y `FooterBottom` (darksite-light) — ya existen.

## Modelo de contenido confirmado (con el usuario)
- **Estructura:** sección-primero con prefijo neutro. `AV_DARKSITE_DETAIL_PAGES_ROOT = /darksite/`
  (sin cambios). Árbol: `/darksite/{lang}/vuelos-afectados/...` (ej. `/darksite/es/vuelos-afectados/AV062`).
- **Radio de impacto:** todo lo que cuelga de `/darksite/` (los 4 idiomas) = zona contingencia.
  Nada de contenido normal debe vivir bajo el root. Es tree-safe: `/darksite-promociones` NO matchea.
- **Aislamiento:** un solo subárbol → noindex/sitemap-exclusion/ACL en un solo lugar.
- **Descartado:** idioma-primero (`/es/vuelos-afectados/`) por aislamiento disperso + requerir cambio
  de matcher; el beneficio SEO no aplica (páginas noindex).

## Contexto clave del repo
- El interstitial (dark) ya está: `scripts/services/darksite/darksite-gate.js` + `darksite.service.js`.
  Las rutas `/darksite/**` están EXENTAS del overlay (`isDarksiteRoute`), sin conflicto con este chrome.
- Chrome normal se carga en `loadLazy` (scripts.js ~1133-1138) vía `loadHeader`/`loadFooter`.
- `AV_DARKSITE_DETAIL_PAGES_ROOT=/darksite/` ya está en environment.json; ningún código lo leía aún.

## Pasos
- [x] 1. `scripts/services/darksite/darksite-chrome.js` — `maybeLoadDarksiteChrome(doc)`. HECHO.
- [x] 1b. `scripts/services/darksite/darksite-detail.js` — helpers livianos compartidos
        (readDetailPagesRoot, isUnderDetailRoot, detectDarksiteLang) sin Preact/DS. HECHO.
- [x] 1c. Redirect al home del idioma cuando el modo está OFF, en `runDarksiteGate` (darksite-gate.js). HECHO.
- [x] 2. Wire en `loadLazy` (scripts.js): si toma el chrome, saltar `loadHeader/loadFooter` y el wait
        de `header-template-ready`. HECHO.
- [~] 3. Verificación: `node --check` OK en ambos; lógica pura (isUnderDetailRoot/detectDarksiteLang/
        resolveLanguageTarget) validada con test aislado (11/11 PASS, incl. trampa de prefijo).
        PENDIENTE: lint (eslint no instalado en este entorno) + dev server con `/darksite/{lang}/...`
        y CF enabled — requiere deps instaladas + contenido de landing publicado.
- [ ] 4. (2da iteración) bloque `blocks/header-darksite` autor-able (modelo UE: logo, back, idiomas).

## Riesgos / notas
- El header darksite no emite `header-template-ready` ni crea `.header-wrapper`; guardas en loadLazy.
- Código del sitio que asume el header normal (delayed.js, selectores `.header-*`) debe no-opear en
  estas páginas — validar en el paso 3.
- Alinear luego los labels del selector del interstitial (hoy exónimos ES) con endónimos.
# RESUME — Feature flag para Members (kill switch prod OFF)

## Objetivo
Diseñar la mejor forma de implementar un **feature flag maestro** para toda la
funcionalidad Members, de modo que se pueda mergear a producción **APAGADA** en un
próximo lanzamiento (bundleado con otras features) y encenderla luego SIN redeploy.

Preocupación explícita del usuario:
- NO inyectar el script de **Google One Tap** (`accounts.google.com/gsi/client`) cuando esté OFF.
- NO inyectar el script de **Lifemiles** (`lm-login.umd.js` + env-config por host) cuando esté OFF.

Worktree: `.claude/worktrees/avdev-members-flag` · branch `feature/members-feature-flag`
Base: `origin/avdev` @ 921603b9 (merge #973 members).
Sitio UAT para E2E: https://nuxqa2.avtest.ink/es

## Mapa de entry points de Members (todos en scripts/scripts.js)
En `loadPage()`:
1. `gateMembersPortalEarly()` — SÍNCRONO, oculta contenido /members a anónimos antes de pintar.
2. `/members/auth/*` → `members-auth.route.js#handleAuthRoute`
3. `session.service.js#initSession` — re-hidrata sesión desde cookies en cada page load.
4. `members-auth.route.js#showPendingErrorModal`

En `loadDelayed()`:
5. `lm-script.loader.js#loadLmScript` — **INYECTA Lifemiles** (P5, eager-ish).
6. `google-one-tap.service.js#initOneTap` — **INYECTA Google One Tap GSI**.

Otros: header actions (botón login / drawer) en design-system/organisms/header/actions
y blocks/header. Fetch del CF `members-config` vía members-config.js#loadMembersConfig
(se ve en consola como llamado a content fragments).

## Config actual
- `env` (uat/prd) sale de environment.json key `AV_MEMBERS_ENV` (default uat).
- URL script LM override por environment.json key `AV_LM_SCRIPT_URL`.
- NO existe hoy un flag maestro `enabled` para todo Members (sólo `oneTap.enabled` en el CF).

## Pasos
- [x] P1. Crear worktree desde origin/avdev + mapear arquitectura.
- [x] P2. Verificar patrón de feature flags del repo + estructura environment.json.
- [x] P3. Analizar E2E en nuxqa2 (network + consola: CF calls, inyección scripts, One Tap).
- [x] P4. Redactar recomendación → docs/members-feature-flag-analysis.md

## Precedentes confirmados (Explore agent)
- apim-mode.js#isApimDirectMode = flag booleano puro más limpio (AV_APIM_DIRECT_MODE).
- centribal.js = kill-switch de inyección de script + override ?chat=on|off (modelo ideal).
- cabin-options.js#isBookingBoxCabinEnabled = kill-switch global + toggle UE encima.
- NO existe flag maestro de Members hoy (solo AV_MEMBERS_ENV/AV_MEMBERS_CF_URL, no on/off).
- Gate header exacto: actions.js:119 (session ? UserSession : Button legacy), user.show wrap;
  user-actions.service.js:67 siempre pasa getSession(). → gatear ahí = corta CF + botón login.
- fetchAEMData('environment') = host-relative, cache en memoria por página, fail-soft, editable sin redeploy.

## DELIVERABLE: docs/members-feature-flag-analysis.md (recomendación completa)

## IMPLEMENTACIÓN (default OFF, confirmada por el usuario) — 2026-07-10
Archivos:
- NUEVO scripts/services/members/members-flag.js — isMembersEnabled() (default OFF, ?members=on|off, cache).
- scripts/scripts.js — loadPage + loadDelayed gateados por isMembersEnabled().
- scripts/services/members/lm-script.loader.js — guard interno en loadLmScript (cubre login.service on-demand).
- scripts/services/members/google-one-tap.service.js — guard interno en initOneTap.
- scripts/services/header/user-actions.service.js — renderWinner: OFF ⇒ sin session + user.show=false.
- NUEVO tests/services/members/members-flag.test.js (9 tests) + OFF-cases en lm-script.loader/one-tap tests.

Tests: 24/24 pass en los 3 archivos afectados (vitest run, happy-dom vía npx).

Verificación E2E en browser (aem up localhost:3001, proxy a main--...aem.page):
- DEFAULT OFF (sin param; el environment.json de la fuente NO tiene AV_MEMBERS_ENABLED):
  lmInjected=[], gsiInjected=[], hasGoogleAccounts=false, sin fetch del CF, header solo cart (sin login).
- ?members=on: LM (log-in-nprod...umd.js) + env-config + gsi/client inyectados, botón "Mi cuenta" presente.

LIMITACIÓN CONOCIDA (documentada): con OFF los MÓDULOS JS de members igual se descargan porque el
organism Actions importa ESTÁTICAMENTE la cadena UserSession. Es JS same-origin del repo — NO scripts de
terceros, NO llamadas externas, NO UI. Si se quiere 0 JS de members: follow-up = lazy-import de UserSession
detrás del flag en actions.js.

PENDIENTE de coordinación (no-código): setear AV_MEMBERS_ENABLED=true en environment.json de UAT/nuxqa
(junto al merge) o members queda OFF ahí también.

## Hallazgos E2E (nuxqa2, Home /es, anónimo) — 2026-07-10
- AMBOS scripts SÍ se inyectan hoy (confirmado en document.scripts):
  - `https://log-in.lifemiles.com/lm-login.umd.js?env=uat` (Lifemiles)
  - `https://accounts.google.com/gsi/client` (Google One Tap) — window.google.accounts presente.
  - Cookie `members-onetap-shown` seteada → initOneTap corrió y mostró prompt.
- (No aparecen en list_network_requests por ser cross-origin vía loadScript; verificados por DOM.)
- environment.json = spreadsheet content bus (`:type:sheet`), served `/environment.json`,
  cache-control max-age=7200 (2h), EDITABLE SIN REDEPLOY.
  - NO tiene `AV_MEMBERS_ENV` → members corre en default `uat`.
  - NO tiene `AV_LM_SCRIPT_URL` → LM cae a PROD url `log-in.lifemiles.com` con `?env=uat`.
  - **YA existe patrón de flags booleanos**: `AV_CENTRIBAL_CHAT_ENABLED:true`,
    `AV_BOOKINGBOX_CABIN_ENABLED:true`. → precedente directo para `AV_MEMBERS_ENABLED`.
- Header UI de login la monta el bloque header (header-user-actions.js → user-actions.service.js
  → user-session.js / anonymous.js / login-button.js), INDEPENDIENTE de scripts.js.
  → hay 2 chokepoints a gatear: (1) wiring en scripts.js, (2) UI del header.

## Diseño propuesto (borrador)
Flag maestro `AV_MEMBERS_ENABLED` en environment.json (booleano, mismo patrón que
AV_CENTRIBAL_CHAT_ENABLED). Default en código = **false** (prod ship dark aunque no se
autore la key). Setear `true` explícito en environment.json de UAT/nuxqa. Helper
`isMembersEnabled()` cacheado (reusa fetchAEMData('environment')). Gatear:
  (1) scripts.js: consolidar los 6 imports de members detrás de un solo check del flag.
  (2) header user-actions: no renderizar UI de login/drawer si flag off.
Tradeoff a confirmar: default-false obliga a añadir AV_MEMBERS_ENABLED=true en TODOS
los entornos no-prod que hoy dependen de members (nuxqa2, etc.).
