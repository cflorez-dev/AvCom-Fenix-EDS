/**
 * Darksite Gate — decide por página si mostrar el interstitial, redirigir
 * (ruta bloqueada con bypass) o no hacer nada. Corre en loadEager.
 * Spec: docs/superpowers/specs/2026-07-07-darksite-design.md §3.3
 */
import { h, render } from '@dropins/tools/preact.js';
import {
  isActiveForPos, isPathBlocked, BYPASS_KEY, readCachedState, fetchDarksiteState,
  readCachedInterstitial, fetchDarksiteInterstitial,
  readCachedMarquee, fetchDarksiteMarquee,
  readCachedBanner, fetchDarksiteBanner,
} from './darksite.service.js';
import { readDetailPagesRoot, isUnderDetailRoot, detectDarksiteLang } from './darksite-detail.js';
import { HeaderDarksite } from '../../../design-system/organisms/header/header-darksite/header-darksite.js';
import { FooterBottom } from '../../../design-system/organisms/footer/footer-bottom/footer-bottom.js';
import { DarksiteFlightInfo } from '../../../design-system/molecules/darksite-flight-info/darksite-flight-info.js';
import { DarksiteMultiFlightInfo } from '../../../design-system/molecules/darksite-multi-flight-info/darksite-multi-flight-info.js';
import { DarksiteContactInfo } from '../../../design-system/molecules/darksite-contact-info/darksite-contact-info.js';
import { DarksiteInformativeBanner } from '../../../design-system/molecules/darksite-informative-banner/darksite-informative-banner.js';
import { Alert } from '../../../design-system/molecules/alert/alert.js';

export const DARKSITE_ROOT = '/darksite';
const DEFAULT_LANG = 'es';

export const isAuthorEnvironment = () => {
  try {
    return !!(
      window.xwalk?.isAuthorEnv
      || window.hlx?.aue
      || document.querySelector('meta[name="urn:auecon:aemconnection"]')
    );
  } catch (e) {
    return false;
  }
};

export const hasBypass = () => {
  try {
    return sessionStorage.getItem(BYPASS_KEY) === '1';
  } catch (e) {
    return false;
  }
};

export const setBypass = () => {
  try {
    sessionStorage.setItem(BYPASS_KEY, '1');
  } catch (e) {
    // sin storage no hay bypass persistente: el overlay reaparecerá
  }
};

export const isDarksiteRoute = (pathname) => {
  const path = String(pathname || '');
  return path === DARKSITE_ROOT || path.startsWith(`${DARKSITE_ROOT}/`);
};

export const decideAction = ({
  state, pos, pathname, bypass,
}) => {
  const path = String(pathname || '');
  if (isDarksiteRoute(path)) return 'none';
  if (!isActiveForPos(state, pos)) return 'none';
  if (!bypass) return 'overlay';
  if (isPathBlocked(state, path)) return 'redirect';
  return 'none';
};

export const buildFragmentCandidates = (language, pos, name = 'interstitial') => {
  const lang = language || DEFAULT_LANG;
  const candidates = [];
  const posLower = String(pos || '').trim().toLowerCase();
  if (posLower) candidates.push(`${DARKSITE_ROOT}/${lang}/${posLower}/${name}`);
  candidates.push(`${DARKSITE_ROOT}/${lang}/${name}`);
  if (lang !== DEFAULT_LANG) candidates.push(`${DARKSITE_ROOT}/${DEFAULT_LANG}/${name}`);
  return candidates;
};

const CONTINUE_SELECTOR = 'a[href$="#darksite-continue"]';

// ------------------------------------------------------------------------
// CTA "Ver información del vuelo" (FUTURO — página aún no implementada).
//
// El diseño define 2 CTAs en el interstitial: (a) "Continuar en avianca"
// (bypass, CONTINUE_SELECTOR arriba) y (b) "Ver información del vuelo", que
// navega a una página real bajo /darksite/{lang}/flight-info (aún por armar).
//
// Convención propuesta para autoría del fragment cuando exista la página:
//   <a href="/darksite/{lang}/flight-info" data-darksite-cta="flight-info">
//     Ver información del vuelo
//   </a>
//
// Esa página NO requiere lógica adicional en el gate: cae bajo `/darksite/`,
// que `isDarksiteRoute` ya exime de `decideAction` (retorna 'none'). Su
// chrome se resuelve consumiendo HeaderDarksite variant='light' y
// FooterBottom variant='darksite-light' como bloques normales.
// ------------------------------------------------------------------------

// Idiomas del selector según Figma spec §3 (labels literales del diseño).
const LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'Inglés' },
  { code: 'pt', label: 'Português' },
  { code: 'fr', label: 'Francés' },
];

// Mapa consumido por HeaderDarksite (`{value, label}[]`) — evita re-mapear
// en cada mount y mantiene una única fuente de verdad para los códigos.
const LANGUAGE_OPTIONS = LANGUAGES.map(({ code, label }) => ({ value: code, label }));

// aria-labels localizados (Fix F4): antes fijos en español, ahora salen de
// este mapa según el `lang` ya resuelto por el gate. Claves = las 4 rutas de
// contenido soportadas (es/en/pt/fr); getAriaLabels cae a 'es' ante cualquier
// código desconocido, así ya no hace falta normalizar `language` aparte.
const ARIA_LABELS = {
  es: {
    overlay: 'Información importante',
    headerAlert: 'Alerta de contingencia',
    headerAlertDismiss: 'Cerrar alerta',
  },
  en: {
    overlay: 'Important information',
    headerAlert: 'Contingency alert',
    headerAlertDismiss: 'Close alert',
  },
  pt: {
    overlay: 'Informação importante',
    headerAlert: 'Alerta de contingência',
    headerAlertDismiss: 'Fechar alerta',
  },
  fr: {
    overlay: 'Information importante',
    headerAlert: 'Alerte de contingence',
    headerAlertDismiss: "Fermer l'alerte",
  },
};
const getAriaLabels = (language) => ARIA_LABELS[language] || ARIA_LABELS[DEFAULT_LANG];

// Contenido de fallback del headerAlert cuando el CF `getDarksiteMarquee` no
// responde (env var ausente, endpoint 404, timeout, etc.). Mismo criterio que
// `DEFAULT_CONTENT` del interstitial: la decisión de mostrar el aviso depende
// del state (enabled + user con bypass), NO del contenido — si el líder
// activó el darksite y el usuario presionó "Continuar", el banner debe
// aparecer aunque el CF de contenido falle. Texto genérico y link al hub del
// darksite en el idioma correspondiente.
const DEFAULT_MARQUEE_CONTENT = {
  es: '<p>Existe información importante sobre nuestros vuelos. <a href="/darksite/es/"><strong>Consulta los detalles</strong></a>.</p>',
  en: '<p>There is important information about our flights. <a href="/darksite/en/"><strong>See the details</strong></a>.</p>',
  pt: '<p>Há informações importantes sobre nossos voos. <a href="/darksite/pt/"><strong>Confira os detalhes</strong></a>.</p>',
  fr: '<p>Des informations importantes concernent nos vols. <a href="/darksite/fr/"><strong>Voir les détails</strong></a>.</p>',
};
const getDefaultMarqueeContent = (language) => (
  DEFAULT_MARQUEE_CONTENT[language] || DEFAULT_MARQUEE_CONTENT[DEFAULT_LANG]
);

// Idioma del CF (interstitial + marquee) = cookie `selected-language` del
// selector del header (fuente de verdad del "idioma del sitio" según el
// líder). Cuando el usuario cambia el idioma en el selector, la cookie
// cambia inmediatamente y ese cambio dispara un fetch nuevo del CF del path
// correcto (`.../darksite/{lang}/marquee`). Fallback a `locale.language`
// (URL-derived) cuando la cookie no está seteada todavía (primera visita).
const SUPPORTED_CF_LANGS = new Set(['es', 'en', 'pt', 'fr']);
const readLangFromCookie = () => {
  try {
    const raw = document.cookie.match(/(?:^|;\s*)selected-language=([^;]+)/)?.[1];
    if (!raw) return null;
    const value = decodeURIComponent(raw).trim().toLowerCase();
    return SUPPORTED_CF_LANGS.has(value) ? value : null;
  } catch (e) {
    return null;
  }
};
const resolveCfLanguage = (fallbackLanguage) => (
  readLangFromCookie() || (
    SUPPORTED_CF_LANGS.has(String(fallbackLanguage || '').toLowerCase())
      ? String(fallbackLanguage).toLowerCase()
      : DEFAULT_LANG
  )
);

// Flag de dismiss del headerAlert post-bypass: sobrevive el resto de la
// sesión (a diferencia del overlay, que reaparece si el bypass expira).
export const ALERT_DISMISSED_KEY = 'av-darksite-alert-dismissed';

const isAlertDismissed = () => {
  try {
    return sessionStorage.getItem(ALERT_DISMISSED_KEY) === '1';
  } catch (e) {
    return false;
  }
};

// ---------- Contactos temporizados (Task 11) ----------
//
// Contrato de clases (resuelve colisión de revisión): las DOS secciones de
// contactos que autora el cliente llevan la clase BASE `darksite-contacts`
// (estilizada por Task 9 vía `styles/darksite.css`, aplica a ambas por
// diseño) MÁS un modificador de section-metadata: `darksite-contacts
// darksite-contacts-initial` y `darksite-contacts darksite-contacts-updated`.
// La lógica de selección de abajo filtra SIEMPRE por el MODIFICADOR
// (`.darksite-contacts-initial` / `.darksite-contacts-updated`), nunca por la
// clase base, que es puramente de estilo y no distingue fase.
const CONTACTS_INITIAL_SELECTOR = '.darksite-contacts-initial';
const CONTACTS_UPDATED_SELECTOR = '.darksite-contacts-updated';

// Límite del delay soportado por setTimeout en navegadores: internamente el
// delay se almacena en un entero de 32 bits, así que un valor mayor a
// 2^31-1 ms (~24.8 días) se trunca y el timer dispara de inmediato en vez de
// esperar. Si el remanente hasta el cambio de fase supera esto, NO se agenda
// timer (ver scheduleContactPhase) para no arriesgar un flip prematuro —
// es un caso de configuración extrema de contactSwitchMinutes, no el flujo
// esperado (default 60 min).
const MAX_SET_TIMEOUT_MS = (2 ** 31) - 1;

/**
 * Decide y aplica qué sección de contactos mostrar dentro del overlay ya
 * montado. Pura y testeable: recibe overlay/state/now explícitos, no lee
 * reloj ni DOM global.
 *
 * Regla: `elapsed = now - Date.parse(state.activatedAt)`;
 * `elapsed < contactSwitchMinutes*60000` ⇒ 'initial', si no ⇒ 'updated'.
 *
 * Casos borde (nunca rompe el overlay):
 * - `activatedAt` ausente/inválido (Date.parse ⇒ NaN) ⇒ 'updated' si existe,
 *   si no la que haya.
 * - Solo existe una de las dos secciones ⇒ esa se muestra siempre,
 *   independientemente del tiempo.
 * - Ninguna de las dos existe ⇒ no-op, phase null.
 *
 * @returns {{phase: 'initial'|'updated'|null, remainingMs: number}}
 *   remainingMs es el tiempo restante (ms, ya clampeado ≥0) hasta el corte
 *   SOLO cuando phase === 'initial'; 0 en cualquier otro caso.
 */
export function applyContactPhase(overlay, state, now = Date.now()) {
  const initial = overlay.querySelector(CONTACTS_INITIAL_SELECTOR);
  const updated = overlay.querySelector(CONTACTS_UPDATED_SELECTOR);
  if (!initial && !updated) return { phase: null, remainingMs: 0 };
  if (!initial) {
    updated.style.display = '';
    return { phase: 'updated', remainingMs: 0 };
  }
  if (!updated) {
    initial.style.display = '';
    return { phase: 'initial', remainingMs: 0 };
  }

  const minutes = Number.isFinite(state?.contactSwitchMinutes) && state.contactSwitchMinutes > 0
    ? state.contactSwitchMinutes
    : 60;
  const switchMs = minutes * 60000;
  const activatedMs = Date.parse(state?.activatedAt);
  const elapsed = Number.isFinite(activatedMs) ? now - activatedMs : NaN;
  // NaN < switchMs es siempre false ⇒ activatedAt ausente/inválido cae a 'updated'.
  const phase = elapsed < switchMs ? 'initial' : 'updated';

  if (phase === 'initial') {
    initial.style.display = '';
    updated.style.display = 'none';
  } else {
    updated.style.display = '';
    initial.style.display = 'none';
  }

  const remainingMs = phase === 'initial' ? Math.max(switchMs - elapsed, 0) : 0;
  return { phase, remainingMs };
}

// Timer del cambio en caliente: única instancia viva a la vez (module-level
// porque solo hay un overlay montado por vez). Se cancela explícitamente en
// unmount y antes de cada re-mount (cambio de idioma, Task 9) para que nunca
// queden dos timers pisándose ni uno huérfano sobre un overlay ya removido.
let contactPhaseTimerId = null;

const clearContactPhaseTimer = () => {
  if (contactPhaseTimerId !== null) {
    clearTimeout(contactPhaseTimerId);
    contactPhaseTimerId = null;
  }
};

/**
 * Legacy — reemplazado por `scheduleContactPhaseRerender` (Preact-based),
 * que re-renderiza la molecule del DS en vez de togglear secciones DOM del
 * fragment autorado. Se preserva solo por si algún consumidor externo lo
 * importaba; mountOverlay ya no lo llama. La misma limpieza de timer aplica
 * (`clearContactPhaseTimer` corre en `unmountOverlay`).
 */
// eslint-disable-next-line no-unused-vars
function scheduleContactPhase(overlay, state) {
  const { phase, remainingMs } = applyContactPhase(overlay, state, Date.now());
  if (phase !== 'initial') return;
  if (!Number.isFinite(remainingMs) || remainingMs > MAX_SET_TIMEOUT_MS) return;
  const delay = Math.max(remainingMs, 0);
  contactPhaseTimerId = setTimeout(() => {
    contactPhaseTimerId = null;
    applyContactPhase(overlay, state, Date.now());
  }, delay);
}

const unmountOverlay = (doc) => {
  clearContactPhaseTimer();
  const overlay = doc.querySelector('.darksite-interstitial');
  if (overlay) {
    // Preact: desmontar los slots antes de remover el nodo para que se
    // liberen listeners/efectos registrados por el renderer.
    overlay.querySelectorAll('[data-darksite-slot]').forEach((slot) => {
      try {
        render(null, slot);
      } catch (e) {
        // Fail-safe: si el slot nunca lleg\u00f3 a renderizar, ignorar.
      }
    });
    overlay.remove();
  }
  doc.body.classList.remove('darksite-open');
};

/**
 * Persistencia + re-mount al cambiar idioma desde el dropdown del header DS.
 * Extra\u00eddo de la l\u00f3gica original de `wireLanguageDropdown.selectLanguage`:
 * reusa el helper real de cookie del sitio y, ante fallo del import, cae al
 * mismo formato de cookie (`selected-language`).
 */
async function changeLanguage(doc, code, currentLanguage, pos, state) {
  if (!code || code === currentLanguage) return;
  try {
    const { setStoredLanguage } = await import('../header/language-country-selector.js');
    setStoredLanguage(code);
  } catch (e) {
    doc.cookie = `selected-language=${code}; path=/; Secure; SameSite=Lax`;
  }
  // Re-mount del fragment con el nuevo idioma, sin recargar la p\u00e1gina.
  // eslint-disable-next-line no-use-before-define
  await mountOverlay(doc, code, pos, state);
}

/**
 * Header del interstitial: consume el organismo DS `HeaderDarksite` (variant
 * 'dark') con el atom `Select` (theme darksite-dark) para el dropdown de
 * idioma. Al cambiar de idioma, `onLanguageChange` persiste la cookie y
 * re-monta el overlay v\u00eda `changeLanguage`.
 *
 * Nota: el overlay siempre usa variant='dark'. La variante 'light' del DS
 * `HeaderDarksite` se consume desde la futura p\u00e1gina `/darksite/{lang}/flight-info`
 * como bloque regular \u2014 no es concern del gate (isDarksiteRoute exime a esa
 * ruta).
 */
const buildHeader = (doc, language, pos, state) => {
  const host = doc.createElement('header');
  host.setAttribute('data-darksite-slot', 'header');
  render(h(HeaderDarksite, {
    variant: 'dark',
    logoAlt: 'Avianca',
    languageOptions: LANGUAGE_OPTIONS,
    defaultLanguage: language,
    onLanguageChange: (code) => changeLanguage(doc, code, language, pos, state),
  }), host);
  return host;
};

/**
 * Footer del interstitial: consume el organismo DS `FooterBottom` (variant
 * 'darksite-dark'). Si el fragment autorado incluye una secci\u00f3n con clase
 * `.darksite-footer`, su texto se usa como override manual del copyright
 * (soporta `{year}` interpolado por el propio DS); si no, se cae al default
 * i18n del componente.
 */
const buildFooter = (doc, overlay) => {
  const authored = overlay.querySelector(':scope > .darksite-footer');
  let copyrightText;
  if (authored) {
    copyrightText = authored.textContent.trim() || undefined;
    authored.remove();
  }
  const host = doc.createElement('footer');
  host.setAttribute('data-darksite-slot', 'footer');
  render(h(FooterBottom, {
    variant: 'darksite-dark',
    copyrightText,
  }), host);
  return host;
};

// ------------------------------------------------------------------------
// Contenido del interstitial — CF `getDarksiteInterstitial` por idioma.
//
// El contenido (títulos, labels de CTA, plantilla de operador y sets de
// contactos initial/updated) viene ahora del CF; el service normaliza y
// cachea con SWR. La data DE VUELOS (`flights[]`) vive en el CF del state
// junto a `enabled/level/activatedAt` porque es el operational payload que
// cambia por evento — el líder la actualiza sin tocar contenido.
//
// Interpolación de tokens en labels del CF:
//   - `{flightCode}` → primer vuelo del state (single) — se sustituye en
//     `titleSingle` para armar el H1000 "Vuelo AV062 afectado".
//   - `{operator}`   → `flight.operatorName` — se sustituye en
//     `operatorTemplate` para armar "Operado por Avianca".
// Tokens ausentes en la plantilla ⇒ se preserva el label tal cual.
// ------------------------------------------------------------------------
const interpolate = (template, tokens) => {
  if (typeof template !== 'string' || !template) return '';
  if (!tokens || typeof tokens !== 'object') return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => (
    Object.prototype.hasOwnProperty.call(tokens, key) ? String(tokens[key]) : match
  ));
};
// ---------- Override de variante (QA / preview) ----------
//
// Para poder previsualizar la variante MULTI-vuelo (Figma 9611:7745) sin
// esperar a que el líder configure ≥2 vuelos en el CF de state, aceptamos
// un override por URL / sessionStorage — mismo patrón que
// `readContactPhaseOverride` para mantener DX consistente.
//
//   - `?darksite-phase=multifly`  → alias amigable (autor-friendly)
//   - `?darksite-variant=multi`   → nombre canónico (recomendado en QA)
//   - `?darksite-variant=single`  → fuerza la variante single aunque el
//                                    state traiga N vuelos (útil para diff)
//
// Persiste en `sessionStorage` (`av-darksite-variant-override`) para
// sobrevivir a cambios de idioma in-page sin re-adjuntar el query.
// Fail-open ante window/storage ausentes (SSR / tests JSDOM sin location).
export const VARIANT_OVERRIDE_KEY = 'av-darksite-variant-override';
const VALID_VARIANTS = new Set(['single', 'multi']);

export const readVariantOverride = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const variantRaw = params.get('darksite-variant');
    if (variantRaw !== null) {
      const value = String(variantRaw).trim().toLowerCase();
      if (VALID_VARIANTS.has(value)) {
        try { sessionStorage.setItem(VARIANT_OVERRIDE_KEY, value); } catch (e) { /* no-op */ }
        return value;
      }
      try { sessionStorage.removeItem(VARIANT_OVERRIDE_KEY); } catch (e) { /* no-op */ }
      return null;
    }
    // Alias de conveniencia sobre `?darksite-phase=multifly` — no persiste
    // como 'multifly' sino como el valor canónico 'multi'.
    const phaseRaw = params.get('darksite-phase');
    if (phaseRaw !== null && String(phaseRaw).trim().toLowerCase() === 'multifly') {
      try { sessionStorage.setItem(VARIANT_OVERRIDE_KEY, 'multi'); } catch (e) { /* no-op */ }
      return 'multi';
    }
  } catch (e) { /* no-op */ }
  try {
    const stored = sessionStorage.getItem(VARIANT_OVERRIDE_KEY);
    return VALID_VARIANTS.has(stored) ? stored : null;
  } catch (e) {
    return null;
  }
};

// Contenido por defecto cuando el CF `getDarksiteInterstitial` no responde
// (env var ausente, endpoint 404, timeout, etc.). Se aplica SIEMPRE como
// fallback porque la decisión de mostrar el overlay depende del state CF
// (enabled/level/flights), NO del contenido: si el líder activó el darksite
// desde el state, el overlay debe montar aunque el CF de contenido falle —
// mostramos los strings genéricos en vez de dejar la página sin mensaje.
const DEFAULT_CONTENT = {
  titleSingle: 'Vuelo {flightCode} afectado',
  titleMultiple: 'Información sobre vuelos afectados',
  operatorTemplate: 'Operado por {operator}',
  contactsLabel: 'Líneas de contacto:',
  primaryCtaLabel: 'Ver información del vuelo',
  primaryCtaAlt: 'Ir al detalle del vuelo afectado',
  secondaryCtaLabel: 'Continuar en avianca.com',
  secondaryCtaAlt: 'Continuar navegando en avianca.com',
  // Nota: en el modo `showFlightIcon=true` (default del CF) el molecule ignora
  // el guion final del label — el chevron va en `detailCtaChevron`. El "→" del
  // fallback existía por compatibilidad; ahora se sirve limpio y `detailCtaChevron`
  // (true por default) agrega el chevron visual.
  detailCtaLabel: 'Ver detalle',
  // Separador origen→destino y chevron del CTA de detalle. Espejo del CF real
  // publicado por el líder: icono `action/plane2` visible por defecto,
  // chevron activado en el multi-flight, `flightSeparator` vacío (solo entra
  // en juego cuando el operador apaga el icono).
  flightIcon: 'action/plane2',
  showFlightIcon: true,
  flightSeparator: '',
  detailCtaChevron: true,
  // Espejo exacto del CF `darksite/es/interstitial` autorado por el líder,
  // así QA offline (sin env vars) muestra lo mismo que staging.
  contactsInitial: [
    {
      title: 'Contact center',
      subtitle: 'Llamadas desde Bogotá o celulares en Colombia',
      phones: ['+57 601 794 8488', '+57 601 307 3940'],
      sortOrder: 1,
    },
    {
      title: 'Resto del país',
      subtitle: 'Línea gratuita nacional desde números fijos',
      phones: ['+57 01 800 018 9810'],
      sortOrder: 2,
    },
    {
      title: 'Línea para agencias de viaje',
      subtitle: 'Línea gratuita nacional desde números fijos',
      phones: ['+57 01 800 0183 098'],
      sortOrder: 3,
    },
  ],
  contactsUpdated: [
    {
      title: 'Línea gratuita',
      subtitle: 'Gratis para quienes llaman desde EU o Canadá',
      phones: ['+1 (855) 610-8668'],
      sortOrder: 1,
    },
    {
      title: 'DID (Direct dial)',
      subtitle: '',
      phones: ['+1 (646) 430-9336'],
      sortOrder: 2,
    },
  ],
};

// Vuelos sintéticos de preview para cuando el override fuerza `multi` pero
// el state solo trae 1 (o 0) vuelos reales. Etiquetados con `__preview: true`
// por si el DS quiere marcarlos visualmente en el futuro.
const PREVIEW_FLIGHTS = [
  {
    flightCode: 'AV 1224',
    origin: 'Bogotá',
    destination: 'Miami',
    operatorName: 'Avianca',
    detailUrl: '/darksite/{lang}/flight-info?code=AV1224',
    __preview: true,
  },
  {
    flightCode: 'AV 40',
    origin: 'Miami',
    destination: 'Cartagena',
    operatorName: 'Avianca',
    detailUrl: '/darksite/{lang}/flight-info?code=AV40',
    __preview: true,
  },
  {
    flightCode: 'AV 2034',
    origin: 'Barrancabermeja',
    destination: 'Barranquilla',
    operatorName: 'Avianca',
    detailUrl: '/darksite/{lang}/flight-info?code=AV2034',
    __preview: true,
  },
];

const buildInterstitialViewModel = (content, state, language) => {
  const stateFlights = Array.isArray(state?.flights) ? state.flights : [];
  const variantOverride = readVariantOverride();
  // Resolve final flight list based on override:
  //   - 'multi' + <2 real flights → append preview flights until we hit ≥2
  //     (keep the real one at position 0 so contacts + activatedAt stay
  //     coherent with the operational payload).
  //   - 'single' → keep only the first real flight (or empty if none).
  //   - null    → passthrough.
  let flights = stateFlights;
  if (variantOverride === 'multi' && stateFlights.length < 2) {
    flights = [...stateFlights, ...PREVIEW_FLIGHTS].slice(0, Math.max(3, stateFlights.length + 2));
  } else if (variantOverride === 'single' && stateFlights.length > 1) {
    flights = stateFlights.slice(0, 1);
  }
  const activeFlight = flights[0] || null;
  const operatorTemplate = content?.operatorTemplate || '';
  const decorateFlight = (f) => {
    if (!f) return null;
    // Preview flights carry a `{lang}` token in `detailUrl` so QA can jump
    // between locales without hardcoding the path per language.
    const detailUrl = interpolate(f.detailUrl || '', { lang: language }) || f.detailUrl;
    return {
      flightCode: f.flightCode,
      origin: f.origin,
      destination: f.destination,
      operator: operatorTemplate
        ? interpolate(operatorTemplate, { operator: f.operatorName })
        : '',
      detailUrl,
    };
  };
  // Variant selection: explicit override wins; else derive from flight count.
  let isMulti;
  if (variantOverride === 'multi') isMulti = true;
  else if (variantOverride === 'single') isMulti = false;
  else isMulti = flights.length > 1;
  const singleTitle = activeFlight
    ? interpolate(content?.titleSingle || '', { flightCode: activeFlight.flightCode })
    : '';
  return {
    language,
    isMulti,
    // Single-flight props
    singleTitle,
    singleFlight: decorateFlight(activeFlight),
    // Multi-flight props
    multiTitle: content?.titleMultiple || '',
    multiFlights: flights.map(decorateFlight).filter(Boolean),
    // Common
    detailCtaLabel: content?.detailCtaLabel || 'Ver detalle',
    // Separador origen→destino y chevron del CTA de detalle. Se derivan del
    // CF (o DEFAULT_CONTENT si el fetch falla). Los molecules aplican sus
    // propios fallbacks visuales cuando `flightIcon`/`flightSeparator` vienen
    // vacíos, por eso aquí se pasan sin coalescer.
    flightIcon: content?.flightIcon || '',
    showFlightIcon: content?.showFlightIcon === true,
    flightSeparator: content?.flightSeparator || '',
    detailCtaChevron: content?.detailCtaChevron === true,
    primaryCta: {
      label: content?.primaryCtaLabel || '',
      alt: content?.primaryCtaAlt || '',
      href: activeFlight?.detailUrl || `${DARKSITE_ROOT}/${language}/flight-info`,
    },
    secondaryCta: {
      label: content?.secondaryCtaLabel || '',
      alt: content?.secondaryCtaAlt || '',
      href: '#darksite-continue',
    },
    contactsLabel: content?.contactsLabel || '',
    contactsInitial: content?.contactsInitial || [],
    contactsUpdated: content?.contactsUpdated || [],
  };
};

// ---------- Fase de contactos (mock / override) ----------
//
// Reglas del CF (Task 11): el CF trae `activatedAt` y `contactSwitchMinutes`
// (default 60). Antes del umbral se muestra el set `initial`; después, el set
// `updated` (Figma nodo 9611:8204). Cuando el líder cablee el CF, este
// helper puro sigue siendo el que decide la fase — solo cambia la data.
//
// Override para QA/preview sin esperar 60 min:
//   - Query param: `?darksite-phase=initial` | `?darksite-phase=updated`
//   - sessionStorage: `av-darksite-phase-override` con el mismo valor
// Cualquier otro valor (o ausencia) ⇒ decisión automática por tiempo.
export const PHASE_OVERRIDE_KEY = 'av-darksite-phase-override';
const VALID_PHASES = new Set(['initial', 'updated']);

/**
 * Devuelve el override de fase resuelto SI viene por URL o sessionStorage.
 * `null` si no aplica. Fail-open ante window/storage ausentes (SSR/tests).
 * La URL persiste a sessionStorage en la primera lectura para sobrevivir a
 * navegación in-page sin re-adjuntar el query (útil en cambios de idioma).
 */
export const readContactPhaseOverride = () => {
  try {
    const raw = new URLSearchParams(window.location.search).get('darksite-phase');
    if (raw !== null) {
      // Normaliza: valores fuera del set limpian el override para volver a auto.
      const value = String(raw).trim().toLowerCase();
      if (VALID_PHASES.has(value)) {
        try { sessionStorage.setItem(PHASE_OVERRIDE_KEY, value); } catch (e) { /* no-op */ }
        return value;
      }
      try { sessionStorage.removeItem(PHASE_OVERRIDE_KEY); } catch (e) { /* no-op */ }
      return null;
    }
  } catch (e) { /* no-op */ }
  try {
    const stored = sessionStorage.getItem(PHASE_OVERRIDE_KEY);
    return VALID_PHASES.has(stored) ? stored : null;
  } catch (e) {
    return null;
  }
};

/**
 * Decisión pura por tiempo: sin tocar DOM ni override. Espejo del cálculo
 * de `applyContactPhase` pero devolviendo solo `{phase, remainingMs}`.
 * `activatedAt` inválido o ausente ⇒ 'updated' (fail-open al set "estable").
 */
export const computeContactPhaseByTime = (state, now = Date.now()) => {
  const minutes = Number.isFinite(state?.contactSwitchMinutes) && state.contactSwitchMinutes > 0
    ? state.contactSwitchMinutes
    : 60;
  const switchMs = minutes * 60000;
  const activatedMs = Date.parse(state?.activatedAt);
  const elapsed = Number.isFinite(activatedMs) ? now - activatedMs : NaN;
  const phase = elapsed < switchMs ? 'initial' : 'updated';
  const remainingMs = phase === 'initial' ? Math.max(switchMs - elapsed, 0) : 0;
  return { phase, remainingMs };
};

/**
 * Renderiza el árbol de contenido del interstitial dentro del host `<main>`.
 * Se llama tanto al montar como al cambiar de fase (Preact diffea, solo el
 * subárbol de contactos re-monta con la nueva data).
 *
 * `vm` es el view-model preparado por `buildInterstitialViewModel` a partir
 * del CF de contenido + `state.flights`. Elige variante single vs. multi por
 * `vm.isMulti` (>=2 vuelos ⇒ `DarksiteMultiFlightInfo`).
 */
const renderContentTree = (host, vm, phase) => {
  const items = phase === 'updated' && vm.contactsUpdated.length
    ? vm.contactsUpdated
    : vm.contactsInitial;
  const flightNode = vm.isMulti
    ? h(DarksiteMultiFlightInfo, {
      title: vm.multiTitle,
      flights: vm.multiFlights,
      detailCtaLabel: vm.detailCtaLabel,
      detailCtaChevron: vm.detailCtaChevron,
      flightIcon: vm.flightIcon,
      showFlightIcon: vm.showFlightIcon,
      flightSeparator: vm.flightSeparator,
      secondaryCta: vm.secondaryCta,
    })
    : h(DarksiteFlightInfo, {
      title: vm.singleTitle,
      origin: vm.singleFlight?.origin || '',
      destination: vm.singleFlight?.destination || '',
      operator: vm.singleFlight?.operator || '',
      flightIcon: vm.flightIcon,
      showFlightIcon: vm.showFlightIcon,
      flightSeparator: vm.flightSeparator,
      primaryCta: vm.primaryCta,
      secondaryCta: vm.secondaryCta,
    });
  render(h('div', { class: 'darksite-content-inner' }, [
    flightNode,
    h(DarksiteContactInfo, {
      label: vm.contactsLabel,
      contacts: items,
    }),
  ]), host);
};

/**
 * Contenido central del interstitial: renderiza las molecules del DS
 * (single: `DarksiteFlightInfo`, multi: `DarksiteMultiFlightInfo`) más
 * `DarksiteContactInfo`. Data del CF `getDarksiteInterstitial` + `state.flights`.
 * El host es un `<main>` para no colisionar con la regla CSS
 * `.darksite-interstitial > div` (que estiliza secciones autoradas legacy).
 * Estilos de layout en `styles/darksite.css` bajo `[data-darksite-slot='content']`.
 *
 * El wrapper NO absorbe el click de la CTA secundaria (`#darksite-continue`);
 * el listener del overlay lo captura por delegación — el `Button` atom
 * renderiza como `<a>` cuando recibe `href`.
 */
const buildContent = (doc, vm, phase) => {
  const host = doc.createElement('main');
  host.setAttribute('data-darksite-slot', 'content');
  renderContentTree(host, vm, phase);
  return host;
};

/**
 * Agenda el cambio automático `initial → updated` cuando expira el remanente
 * del CF. Si hay override activo O ya estamos en 'updated', no agenda nada.
 * Reutiliza el mismo `contactPhaseTimerId` que `scheduleContactPhase` para
 * que el clear-on-unmount (`clearContactPhaseTimer`) siga limpiándolo. El
 * re-render es via Preact sobre el mismo host — no re-monta el overlay ni el
 * flight-info (mismos props ⇒ Preact diff mínimo).
 */
const scheduleContactPhaseRerender = (host, vm, state, override) => {
  if (override) return; // Override manual congela la fase.
  const { phase, remainingMs } = computeContactPhaseByTime(state, Date.now());
  if (phase !== 'initial') return;
  if (!Number.isFinite(remainingMs) || remainingMs > MAX_SET_TIMEOUT_MS) return;
  const delay = Math.max(remainingMs, 0);
  clearContactPhaseTimer();
  contactPhaseTimerId = setTimeout(() => {
    contactPhaseTimerId = null;
    // Si el host fue removido del DOM antes del disparo (unmount), no-op.
    if (!host.isConnected) return;
    renderContentTree(host, vm, 'updated');
  }, delay);
};

const trapFocus = (overlay) => {
  overlay.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const focusables = overlay.querySelectorAll('a[href], button, [tabindex]:not([tabindex="-1"])');
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const { activeElement } = overlay.ownerDocument;
    if (event.shiftKey && activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
};

// Guard anti doble-montaje (Fix F5): contador de generación module-level.
// mountOverlay se invoca desde varios disparadores que pueden solaparse (mount
// inicial vs. corrección stale→fresh de revalidation.then, o dos cambios de
// idioma rápidos vía el dropdown): cada invocación toma un número de
// generación al entrar y, tras el único await relevante (la carga del
// fragment), aborta sin tocar el DOM si un mount MÁS NUEVO ya arrancó mientras
// esperaba. Así el resultado visible siempre corresponde a la invocación más
// reciente, sin importar en qué orden resuelven sus fetches.
let mountGeneration = 0;

// `state` (4to parámetro, Task 11): el CF ya llega normalizado al gate desde
// runDarksiteGate/revalidation; se pasa aquí (en vez de re-leerlo dentro) para
// mantener mountOverlay puro respecto a su fuente de estado y minimizar el
// cambio de firma. Default null: llamadas legacy sin 4to argumento no rompen
// (applyContactPhase/scheduleContactPhase son fail-open ante state null).
async function mountOverlay(doc, language, pos, state = null) {
  mountGeneration += 1;
  const myGeneration = mountGeneration;
  // Idioma del CF: la cookie `selected-language` gana sobre el `language`
  // pasado por el gate (URL-derived). Cuando el usuario cambia el idioma en
  // el header selector, la cookie se actualiza de inmediato; el próximo
  // mountOverlay pide el CF del path correcto (`.../darksite/{lang}/interstitial`)
  // sin depender de que la URL ya haya rotado al nuevo prefix.
  const lang = resolveCfLanguage(language);
  // SWR pattern: si hay contenido cacheado del CF `getDarksiteInterstitial`
  // pintamos con eso mientras revalidamos en background. Si NO hay caché,
  // esperamos al fetch para evitar overlay a medias en el primer paint.
  // Si tanto la caché como el fetch fallan, caemos al `DEFAULT_CONTENT`
  // embebido — la decisión de montar depende del state, no del contenido.
  const cachedContent = readCachedInterstitial(lang);
  let content = cachedContent;
  const revalidation = fetchDarksiteInterstitial(lang);
  if (!content) {
    content = await revalidation;
    // Fix F5: si otro mount más nuevo arrancó mientras este esperaba el
    // fetch, este quedó obsoleto — aborta sin montar ni desmontar nada.
    if (myGeneration !== mountGeneration) return false;
  }
  // Si el CF de contenido no dio nada (env var ausente en local, endpoint
  // caído, timeout), caemos al `DEFAULT_CONTENT` embebido. La decisión de
  // MONTAR el overlay pertenece al state CF (enabled/level); el contenido
  // solo decora — no puede vetar el mount o quedaríamos con la página
  // “libre” aunque el líder haya activado el darksite.
  if (!content) content = DEFAULT_CONTENT;
  // Precarga el CSS del overlay ahora que sabemos que vamos a montar (la
  // ruta anterior lo hacía dentro de `fetchDarksiteFragment`; sin ese fetch,
  // lo cargamos aquí para preservar el mismo timing de estilos).
  // eslint-disable-next-line no-use-before-define
  ensureDarksiteCss();

  unmountOverlay(doc);
  const overlay = doc.createElement('div');
  overlay.className = 'darksite-interstitial';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', getAriaLabels(lang).overlay); // Fix F4: localizado
  const header = buildHeader(doc, lang, pos, state);
  overlay.append(header);
  // Contenido central: view-model derivado del CF + `state.flights`.
  // Elige variante single vs multi por cantidad de vuelos afectados.
  // Fase inicial: override manual (URL/sessionStorage) gana; si no, la decide
  // el tiempo transcurrido desde `state.activatedAt` vs `contactSwitchMinutes`.
  const vm = buildInterstitialViewModel(content, state, lang);
  const phaseOverride = readContactPhaseOverride();
  const initialPhase = phaseOverride
    || computeContactPhaseByTime(state, Date.now()).phase;
  const contentHost = buildContent(doc, vm, initialPhase);
  overlay.append(contentHost);
  overlay.append(buildFooter(doc, overlay));
  overlay.addEventListener('click', (event) => {
    const cta = event.target.closest(CONTINUE_SELECTOR);
    if (!cta) return;
    event.preventDefault();
    setBypass();
    unmountOverlay(doc);
    // Fix F1 (revisión final): si la página actual está en blockedPaths, el
    // bypass NO debe liberar la navegación in-place — el CTA continuar debe
    // comportarse igual que la rama 'redirect' de decideAction/runDarksiteGate
    // (mismo destino: el hub `${DARKSITE_ROOT}/${lang}/`), en vez de montar el
    // chrome inline (headerAlert + swap) como si la ruta no estuviera bloqueada.
    if (isPathBlocked(state, window.location.pathname)) {
      window.location.replace(`${DARKSITE_ROOT}/${lang}/`);
      return;
    }
    // Fix post-review (Task 12): el CTA continuar no navega (preventDefault),
    // así que el usuario debe ver DE INMEDIATO el chrome del modo bypass
    // (headerAlert + banner swapeado, Figma §1.1), no recién en su próxima
    // navegación. Mismo patrón fire-and-forget que la rama bypass de
    // runDarksiteGate, pero SIN setTimeout(0): en el momento del click la
    // página ya está completamente decorada (decorateSections corrió hace
    // rato), la lectura síncrona de `.section.darksite-swap` es segura.
    // mountHeaderAlert respeta internamente el flag de dismiss de la sesión.
    Promise.all([
      // eslint-disable-next-line no-use-before-define
      mountHeaderAlert(doc, lang, pos),
      // eslint-disable-next-line no-use-before-define
      swapHomeBanner(doc, lang, pos),
    ]).catch(() => {
      // Red de seguridad: no dejar un rechazo sin manejar.
    });
  });
  trapFocus(overlay);
  doc.body.append(overlay);
  doc.body.classList.add('darksite-open');
  // Fix F9: el foco inicial va al primer focusable DEL CONTENIDO del
  // fragment, no al trigger de idioma del header (que, al ser el primer nodo
  // del overlay, "ganaba" el querySelector genérico anterior). Fallback al
  // trigger si el contenido no trae ningún elemento focusable.
  const contentFocusable = [...overlay.querySelectorAll('a[href], button')]
    .find((el) => !header.contains(el));
  (contentFocusable || header.querySelector('a[href], button'))?.focus();
  // Contactos temporizados (Task 11): fase inicial + cambio en caliente si
  // corresponde. Ahora se re-renderiza la molecule vía Preact sobre el mismo
  // `contentHost` en vez de togglear secciones del fragment autorado. El
  // override manual (si viene) congela la fase — no se agenda timer.
  scheduleContactPhaseRerender(contentHost, vm, state, phaseOverride);
  // SWR: si pintamos con caché, dispara la revalidación en background y, si
  // la respuesta trae contenido distinto, re-renderiza el subárbol sobre el
  // mismo `contentHost` (Preact diffea, sin destruir el DOM del overlay).
  // Fail-open: cualquier error de red se traga silenciosamente.
  if (cachedContent) {
    revalidation.then((fresh) => {
      if (!fresh || !contentHost.isConnected) return;
      if (myGeneration !== mountGeneration) return;
      const freshVm = buildInterstitialViewModel(fresh, state, lang);
      renderContentTree(contentHost, freshVm, initialPhase);
      scheduleContactPhaseRerender(contentHost, freshVm, state, phaseOverride);
    }).catch(() => { /* fail-open */ });
  }
  return true;
}

// mountHeaderAlert y swapHomeBanner corren en paralelo (Promise.all) y ambos
// ahora consumen CFs GraphQL directos (getDarksiteMarquee / getDarksiteBanner)
// en vez de fragments HTML. La carga de `fragment.js`/`aem.js` para
// resolución de paths quedó fuera del flujo del gate cuando ambos flows
// migraron a CF; el helper `loadDarksiteFragmentDeps` y `fetchDarksiteFragment`
// se eliminaron por esa migración (git blame).

/**
 * Idempotente. Fire-and-forget: inyecta el `<link>` de `styles/darksite.css`
 * (aem's loadCSS dedupea por href). Garantiza que el CSS del overlay esté
 * antes de pintar.
 */
function ensureDarksiteCss() {
  import('../../aem.js').then(({ loadCSS }) => {
    loadCSS(`${window.hlx?.codeBasePath || ''}/styles/darksite.css`);
  }).catch(() => { /* fail-open: sin CSS el overlay pierde estilos pero no rompe */ });
}

// blocks/marquesina también gestiona `--marquee-height` (su propia altura
// medida, `blocks/marquesina/marquesina.js` líneas ~590-602). En modo darksite
// esa marquesina se REEMPLAZA por la nuestra: la ocultamos en `mountHeaderAlert`
// (inline `display:none` + regla CSS `body.darksite-active` como red de
// seguridad) y marquesina.js corta su `updateHeaderTop`/`scheduleMarquesinaFinalize`
// vía el guard `body.darksite-active` para no sobreescribir nuestro valor.

/**
 * Marquesina sticky negra post-bypass (Figma §1.1, nodo 9611:7929): solo
 * corre cuando el overlay ya no tapa la página (bypass activo + darksite
 * activo). Respeta el dismiss por sesión y evita doble-mount si se invoca
 * más de una vez.
 *
 * Contenido: CF `getDarksiteMarquee` por idioma
 * (`/content/dam/avianca/content-fragments/darksite/{lang}/marquee`) —
 * único campo `content` (multi-line rich text) que se consume como
 * `contentHTML` del molecule `Alert` del DS.
 *
 * Renderiza el molecule `Alert` (variant custom por bg negro + texto blanco):
 * bg #000, texto Red Hat Display 16px blanco, icono triángulo de alerta
 * blanco (`alert/warning-triangle`, sprite 20×20), botón X para descartar.
 * SWR: si hay caché en localStorage, monta con caché INMEDIATAMENTE y en
 * paralelo revalida (no re-render de la marquesina; el fresco queda para
 * próximas navegaciones — evita flicker/pop-in visualmente perturbador
 * mientras el usuario ya está leyendo el mensaje).
 */
// eslint-disable-next-line no-unused-vars
async function mountHeaderAlert(doc, language, pos) {
  if (isAlertDismissed() || doc.querySelector('[data-darksite-slot="header-alert"]')) return;

  // Bug fix: en la rama "bypass sin overlay" de runDarksiteGate (action ===
  // 'none', usuario que ya continuó en una navegación previa) este es el
  // ÚNICO punto de entrada del chrome darksite — nunca pasa por mountOverlay,
  // que es el único otro call-site que precarga `styles/darksite.css` (ver
  // `ensureDarksiteCss` más abajo). Sin esa hoja de estilos, la regla
  // `.darksite-header-alert { position: sticky; top: 0; z-index: 2000 }`
  // nunca se aplica: el host queda en flujo normal, no viaja pegado al header
  // sticky al scrollear. `ensureDarksiteCss` es idempotente (loadCSS dedupea
  // por href), así que llamarla también desde la rama de mountOverlay no
  // duplica nada.
  // eslint-disable-next-line no-use-before-define
  ensureDarksiteCss();

  // Idioma del CF (mismo criterio que mountOverlay): cookie `selected-language`
  // gana sobre `language` (URL-derived). Ver comentario en mountOverlay.
  const cfLang = resolveCfLanguage(language);

  // SWR: leer caché primero para mount inmediato; si no hay caché, esperar red.
  // `pos` queda disponible en la firma por retro-compat de call-site aunque el
  // CF actual no discrimina por país (contenido idéntico por lang) — mantener
  // la firma abierta permite extender a futuro sin refactor de call-sites.
  const cached = readCachedMarquee(cfLang);
  const revalidation = fetchDarksiteMarquee(cfLang);
  const marquee = cached || await revalidation;
  // Fail-CLOSED del CF: si no hay contenido remoto (env var ausente en local,
  // 404, timeout), montamos con `DEFAULT_MARQUEE_CONTENT` embebido. El aviso
  // debe aparecer SIEMPRE que darksite esté activo y el usuario haya pulsado
  // "Continuar en avianca.com" (bypass) — no queremos que un fallo del CF
  // deje al usuario sin señal visual del estado de contingencia.
  const contentHTML = (marquee && marquee.contentHTML) || getDefaultMarqueeContent(cfLang);

  // Re-chequeo tras el await: el usuario pudo descartarla mientras cargaba.
  if (isAlertDismissed() || doc.querySelector('[data-darksite-slot="header-alert"]')) return;

  const host = doc.createElement('div');
  host.setAttribute('data-darksite-slot', 'header-alert');
  // Clase legacy `darksite-header-alert` preservada como HOOK para tests e2e,
  // analytics y CSS overrides preexistentes en `styles/darksite.css`. El
  // molecule `Alert` monta debajo con `data-name="alert"` y `data-variant`.
  host.className = 'darksite-header-alert';

  const handleDismiss = () => {
    // El `Alert` ya se auto-oculta en dismiss (setIsVisible(false)); solo
    // limpiamos el host y la reserva de layout que agregamos. NO restauramos
    // la marquesina promocional oculta por `body.darksite-active`: el darksite
    // sigue activo por sesión, y su regla de negocio es "sin promociones"
    // (mismo criterio que swapHomeBanner). --marquee-height vuelve a 0
    // porque nuestra alerta ya no ocupa reserva.
    render(null, host);
    host.remove();
    doc.documentElement.style.setProperty('--marquee-height', '0px');
    try {
      sessionStorage.setItem(ALERT_DISMISSED_KEY, '1');
    } catch (e) {
      // sin persistencia: reaparecerá en el próximo mount.
    }
  };

  // La marquesina promocional (`blocks/marquesina`) del home puede haber
  // pintado ya `.marquesina-global-container` en el DOM. En modo darksite la
  // reemplazamos por nuestra alerta: agregamos `darksite-active` al body (que
  // via `styles/darksite.css` la esconde con `display:none`) y forzamos el
  // mismo display inline como defensa contra un render de marquesina.js
  // POSTERIOR a este mount (la clase por sí sola bastaría si el CSS ya está
  // cargado, pero el inline blinda contra la carrera). marquesina.js tiene un
  // guard simétrico en `updateHeaderTop`/`scheduleMarquesinaFinalize` que
  // evita sobreescribir `--marquee-height` cuando `body.darksite-active`.
  doc.body.classList.add('darksite-active');
  doc.querySelectorAll('.marquesina-global-container, .section.marquesina-container')
    .forEach((el) => { el.style.display = 'none'; });

  doc.body.prepend(host);

  // Match Figma nodo 9611:7929: bg #000, py-16 px-24, gap-12, texto Red Hat
  // Display 16px blanco, icono triángulo 20×20 blanco, dismiss X blanco.
  // Todo el tema visual + procesamiento del rich text vive dentro del variant
  // `darksite` del molecule Alert (bg/text/border/typo/dismiss + `contentOptions`
  // que aplica `!text-base !leading-6 pt-0 pb-0 !m-0` a los <p> y deja los
  // <a> en crudo con subrayado del browser). Ver `design-system/molecules/alert/alert.js`.
  // `fullWidth=true` monta el aside externo full-viewport con `w-full`; el
  // molecule ya centra el contenido con `max-w-[1248px]` internamente.
  // `marqueeMode=false` fuerza wrapping natural (no scroll horizontal); el
  // banner es un aviso estático, no una promo animada.
  render(h(Alert, {
    variant: 'darksite',
    fullWidth: true,
    contentHTML,
    marqueeMode: false,
    heightMode: 'auto',
    dismissible: true,
    onDismiss: handleDismiss,
    dismissButtonAriaLabel: getAriaLabels(cfLang).headerAlertDismiss,
    'aria-label': getAriaLabels(cfLang).headerAlert,
  }), host);

  // Reemplazamos completamente cualquier marquesina previa: `--marquee-height`
  // = altura REAL de NUESTRA alerta (no sumamos sobre un valor pre-existente,
  // porque el chrome que lo generaba ya está oculto).
  doc.documentElement.style.setProperty('--marquee-height', `${host.offsetHeight}px`);

  // Revalidación SWR en background: si mostramos caché, actualiza el store
  // para la próxima navegación. NO re-renderiza esta instancia (no queremos
  // que el texto cambie bajo los ojos del usuario mientras lee).
  if (cached) {
    revalidation.catch(() => { /* fail-open */ });
  }
}

const HOME_SWAP_SELECTOR = 'main .section.darksite-swap';
const HOME_BOOKING_BOX_SELECTOR = 'main .section.booking-box-container';

/**
 * Localiza el anchor donde debe insertarse el darksite home banner, y
 * decide si además hay que ocultar la promo original.
 *
 * Dos escenarios:
 *   1. Si existe una sección marcada `darksite-swap` (authoring prep del
 *      home), la ocultamos y usamos como anchor: el banner queda EN LUGAR
 *      de la promoción autorada.
 *   2. Fallback si NO existe esa marca: insertamos el banner justo después
 *      del `.section.booking-box-container` (el bloque de búsqueda de
 *      vuelos, presente en todo home). Esto asegura visibilidad del aviso
 *      de contingencia incluso si el home nunca recibió el authoring prep.
 *   3. Si tampoco hay booking-box (ej. home minimalista), no hay anchor
 *      razonable: log y no-op.
 */
function resolveBannerAnchor(doc) {
  const swap = doc.querySelector(HOME_SWAP_SELECTOR);
  if (swap) return { anchor: swap, hideAnchor: true, reason: 'swap' };
  const bookingSection = doc.querySelector(HOME_BOOKING_BOX_SELECTOR);
  if (bookingSection) return { anchor: bookingSection, hideAnchor: false, reason: 'booking-box' };
  return null;
}

/**
 * Reemplazo del banner promocional del home (Figma 9611:7981, tarjeta oscura
 * informativa). Data desde CF `getDarksiteBanner` vía `fetchDarksiteBanner`
 * (SWR con localStorage por idioma). Fail-CLOSED deliberado si el CF no
 * devuelve data: el requisito de negocio es "no ver promociones" durante el
 * darksite, así que la sección queda oculta igual (a diferencia del resto
 * del gate, que es fail-open).
 *
 * Anchor:
 *   - Preferente: sección `darksite-swap` autorada (se oculta + banner
 *     insertado en su lugar).
 *   - Fallback: sección del `booking-box` (banner inmediatamente después,
 *     sin ocultar nada) — cubre el caso "el home no tiene la marca
 *     `darksite-swap` autorada pero igual queremos comunicar la
 *     contingencia".
 *
 * El CF es idioma-único (no por POS). Se mantiene la firma con `language`
 * para simetría con `mountHeaderAlert`.
 */
async function swapHomeBanner(doc, language) {
  const target = resolveBannerAnchor(doc);
  if (!target) {
    // Ni sección `darksite-swap` ni booking-box: no hay dónde anclar el
    // banner con sentido visual. No vale la pena gastar el fetch del CF.
    // eslint-disable-next-line no-console
    console.warn('[darksite] No se encontró ni .darksite-swap ni .booking-box-container en el home: se omite el reemplazo del banner.');
    return;
  }
  if (target.hideAnchor) {
    target.anchor.classList.add('darksite-swapped');
  }

  // SWR: caché síncrona primero para pintar al toque; si no hay, esperamos
  // el fetch. La revalidación en background no re-renderiza esta instancia
  // (evita que el texto cambie bajo los ojos del usuario mientras lee).
  const cached = readCachedBanner(language);
  const revalidation = fetchDarksiteBanner(language);
  const banner = cached || await revalidation;
  if (!banner) {
    // Fail-CLOSED cuando el anchor era la promo: la sección original ya
    // quedó oculta arriba; sin banner que insertar, el home queda sin la
    // card promocional. Mejor sin promo que con promo (o con card vacía).
    // En el caso fallback (booking-box) simplemente no se agrega nada: el
    // home queda igual que si el darksite estuviera apagado.
    // eslint-disable-next-line no-console
    console.warn(`[darksite] CF getDarksiteBanner sin data para el idioma actual: no se inserta banner (anchor=${target.reason}).`);
    return;
  }

  const host = doc.createElement('div');
  // Clase `darksite-informative-banner` en el wrapper del host: hook para
  // tests e2e, analytics y CSS overrides en `styles/darksite.css`. La clase
  // `section` la sumamos también para heredar el layout estándar de las
  // secciones de la página. El molecule `DarksiteInformativeBanner` monta
  // debajo con `data-name="darksiteInformativeBanner"`.
  host.className = 'section darksite-informative-banner no-padding-y';
  target.anchor.insertAdjacentElement('afterend', host);

  render(h(DarksiteInformativeBanner, {
    title: banner.title,
    description: banner.description,
    ctaLabel: banner.ctaLabel,
    ctaUrl: banner.ctaUrl,
    ctaAlt: banner.ctaAlt,
  }), host);

  // Revalidación SWR en background: si mostramos caché, actualiza el store
  // para la próxima navegación. Consistente con `mountHeaderAlert`.
  if (cached) {
    revalidation.catch(() => { /* fail-open */ });
  }
}

export async function runDarksiteGate(doc = document) {
  if (isAuthorEnvironment()) return;

  const cached = readCachedState();
  const revalidation = fetchDarksiteState();
  // Primera visita (sin caché): esperar el fetch acotado. Con caché: decidir ya.
  const state = cached || await revalidation;

  const { resolveLocale } = await import('../../utils/locale.js');
  const { default: mapCountryToPos } = await import('../../utils/pos-mapping.js');
  const locale = await resolveLocale();
  const pos = mapCountryToPos(locale.country);
  const { pathname } = window.location;
  const bypass = hasBypass();

  // Guard de las landings de detalle (`/darksite/{lang}/...`, árbol configurable
  // vía AV_DARKSITE_DETAIL_PAGES_ROOT): estas páginas SOLO tienen sentido con el
  // darksite activo. Author ya salió arriba (nunca se redirige el authoring).
  //   - Modo NO activo: se redirige al home del idioma (`/{lang}/`) para no dejar
  //     accesible una página de contingencia con el chrome normal encima (links
  //     viejos, bookmarks, buscadores).
  //   - Modo activo: no se hace nada aquí; el chrome darksite (HeaderDarksite
  //     light + FooterBottom darksite-light) lo monta darksite-chrome.js en
  //     loadLazy. El overlay tampoco aplica (isDarksiteRoute exime a estas rutas).
  const detailRoot = await readDetailPagesRoot();
  if (isUnderDetailRoot(pathname, detailRoot)) {
    if (state?.enabled !== true) {
      // Idioma DE LA PÁGINA (primer segmento tras el root configurado), no el
      // de resolveLocale (que en rutas darksite no lee el lang del path).
      window.location.replace(`/${detectDarksiteLang(pathname, detailRoot)}/`);
    }
    return;
  }

  // Preview override: si el QA fuerza fase o variante por URL, el POS local
  // (típicamente EC en dev) no debe vetar el mount cuando el CF ya está
  // activo. Solo aplica en rutas NO darksite y solo si el state trae
  // `enabled=true` — así respetamos el kill-switch del líder aunque haya
  // override en la URL.
  const previewOverride = readContactPhaseOverride() || readVariantOverride();
  const forcePreview = Boolean(
    previewOverride && !isDarksiteRoute(pathname) && state && state.enabled === true,
  );

  const decidedAction = decideAction({
    state, pos, pathname, bypass,
  });
  const action = forcePreview && decidedAction === 'none' ? 'overlay' : decidedAction;
  if (action === 'overlay') {
    await mountOverlay(doc, locale.language, pos, state);
  } else if (action === 'redirect') {
    window.location.replace(`${DARKSITE_ROOT}/${locale.language || 'es'}/`);
    return;
  } else if (action === 'none' && bypass && !isDarksiteRoute(pathname) && state?.enabled === true) {
    // Modo bypass: el overlay ya no tapa la página. Chrome de aviso propio
    // (headerAlert + swap del banner del home), ambos fetches en paralelo y
    // sin await aquí: no deben bloquear el render principal (fire-and-forget,
    // ya son fail-open/fail-closed internamente).
    //
    // NOTA: gate por `state.enabled === true` (no por `isActiveForPos`).
    // Si el usuario ya pulsó "Continuar en avianca.com" (bypass=1) el aviso
    // debe reaparecer en cada navegación mientras el darksite siga activo,
    // aunque su POS actual no matchee `affectedPos` (p.ej. cambió de país en
    // el selector). El interstitial sí filtra por POS al decidir mostrarse
    // por primera vez, pero una vez el usuario aceptó continuar el aviso es
    // persistente por sesión (hasta que lo cierre con la X del headerAlert).
    //
    // setTimeout(…, 0) es deliberado, NO un ajuste arbitrario de timing:
    // runDarksiteGate() corre en loadEager ANTES de decorateMain(main)
    // (scripts.js), que es quien recién aplica decorateSections() y por lo
    // tanto la clase `darksite-swap` de section-metadata. swapHomeBanner lee
    // esa clase de forma síncrona al entrar; si se llama sin diferir, el
    // querySelector corre en el mismo tick que runDarksiteGate (antes de
    // decorateMain) y NUNCA encontraría la sección. Un macrotask garantiza
    // que decorateMain (síncrono) ya terminó cuando esto se ejecuta.
    setTimeout(() => {
      Promise.all([
        mountHeaderAlert(doc, locale.language, pos),
        swapHomeBanner(doc, locale.language),
      ]).catch(() => {
        // Red de seguridad: no dejar un rechazo sin manejar.
      });
    }, 0);
  }

  // Corrección stale→fresh: si el estado fresco difiere de lo aplicado, ajustar.
  revalidation.then((fresh) => {
    if (!fresh) return;
    const decidedFresh = decideAction({
      state: fresh, pos, pathname, bypass: hasBypass(),
    });
    // Mismo bypass de POS que arriba: si hay override QA activo y el CF sigue
    // enabled, forzamos overlay aunque el POS local no matchee affectedPos.
    const forcePreviewFresh = Boolean(
      previewOverride && !isDarksiteRoute(pathname) && fresh.enabled === true,
    );
    const freshAction = forcePreviewFresh && decidedFresh === 'none' ? 'overlay' : decidedFresh;
    const mounted = !!doc.querySelector('.darksite-interstitial');
    // Usa `fresh` (no `state`, ya potencialmente stale) para que un
    // activatedAt/contactSwitchMinutes recién actualizado por el operador
    // se refleje si el overlay se monta recién acá.
    if (freshAction === 'overlay' && !mounted) {
      // Fix F6: mismo patrón que la rama bypass — no dejar un rechazo del
      // mount (p.ej. fallo de import dinámico) sin manejar.
      mountOverlay(doc, locale.language, pos, fresh).catch(() => {
        // Red de seguridad: no dejar un rechazo sin manejar.
      });
    }
    if (freshAction === 'none' && mounted) unmountOverlay(doc);
  });
}
