/**
 * Darksite Service — estado global del modo contingencia.
 * Lee el CF darksite-config vía la persisted query GraphQL DIRECTA (GET, sin
 * middleware) con stale-while-revalidate en localStorage. FAIL-OPEN: cualquier
 * error ⇒ apagado.
 * Spec: docs/superpowers/specs/2026-07-07-darksite-design.md
 */
import { fetchAEMData } from '../../utils/aem-data.js';

export const STATE_KEY = 'av-darksite-state';
export const BYPASS_KEY = 'av-darksite-bypass';
// Prefijo del key de caché SWR del CF de contenido del interstitial. Se
// concatena con el idioma (`av-darksite-interstitial-es`, etc.) para que cada
// lang tenga su propia entrada y no se contaminen entre sí.
export const INTERSTITIAL_CACHE_PREFIX = 'av-darksite-interstitial-';
// Prefijo del key de caché SWR del CF de la marquesina (headerAlert
// post-bypass, `getDarksiteMarquee`). Misma estrategia por idioma que el
// interstitial: una entrada localStorage por lang para permitir SWR sin
// interferencia entre idiomas.
export const MARQUEE_CACHE_PREFIX = 'av-darksite-marquee-';
// Prefijo del key de caché SWR del CF del banner del home post-bypass
// (`getDarksiteBanner`). Misma estrategia por idioma que el interstitial y
// la marquesina: una entrada localStorage por lang, SWR por código de idioma.
export const BANNER_CACHE_PREFIX = 'av-darksite-banner-';
const FETCH_TIMEOUT_MS = 800;
const LANG_PREFIX_RE = /^\/(es|en|pt|fr)(?=\/|$)/;
const DEFAULT_LANG = 'es';
const SUPPORTED_LANGS = new Set(['es', 'en', 'pt', 'fr']);

let graphqlConfigCache = null;

// Config leída de environment.json (AEM Author):
//   - AV_DARKSITE_CONFIG_URL: URL COMPLETA de la persisted query del state
//     (`getDarksiteConfig`). Sin middleware: GET simple, sin headers custom
//     (evita preflight CORS).
//   - AV_DARKSITE_INTERSTITIAL_URL: URL de la persisted query del contenido
//     (`getDarksiteInterstitial;path=...`) con el token `{lang}` que este
//     módulo sustituye al fetchear por idioma. Ejemplo publicable:
//     `https://publish-.../graphql/execute.json/avianca/getDarksiteInterstitial;path=/content/dam/avianca/content-fragments/darksite/{lang}/interstitial`
//   - AV_DARKSITE_MARQUEE_URL: URL de la persisted query de la marquesina
//     post-bypass (`getDarksiteMarquee;path=...`), también con `{lang}`.
//     Ejemplo publicable:
//     `https://publish-.../graphql/execute.json/avianca/getDarksiteMarquee;path=/content/dam/avianca/content-fragments/darksite/{lang}/marquee`
//
// DERIVACIÓN AUTOMÁTICA: si `AV_DARKSITE_INTERSTITIAL_URL` o
// `AV_DARKSITE_MARQUEE_URL` no están autorados, se derivan desde
// `AV_DARKSITE_CONFIG_URL` reemplazando el nombre de la persisted query y
// anexando `;path=/content/dam/avianca/content-fragments/darksite/{lang}/{name}`.
// Los 3 CFs viven en el mismo publish host y comparten prefijo de endpoint,
// por lo que basta el config URL para reconstruir los otros dos. Esto evita
// que un environment.json parcial (solo `CONFIG_URL`) rompa la marquesina/
// interstitial en local, y da fail-safe si ops olvida agregar los otros 2.
const CF_PATH_PREFIX = '/content/dam/avianca/content-fragments/darksite';
const deriveCfUrl = (configUrl, name) => {
  if (!configUrl) return '';
  // configUrl termina en `.../execute.json/avianca/getDarksiteConfig`.
  // Reemplazamos la última segmento por el nombre de la CF pedida.
  const base = configUrl.replace(/getDarksiteConfig\/?$/, '');
  if (base === configUrl) return ''; // no matchea el shape esperado
  return `${base}getDarksite${name};path=${CF_PATH_PREFIX}/{lang}/${name.toLowerCase()}`;
};
const getGraphQLConfig = async () => {
  if (graphqlConfigCache) return graphqlConfigCache;
  const envData = await fetchAEMData('environment');
  const envRows = Array.isArray(envData?.data) ? envData.data : [];
  const readEnv = (key) => envRows.find((item) => item.Key === key)?.Text?.trim() || '';
  const configUrl = readEnv('AV_DARKSITE_CONFIG_URL');
  graphqlConfigCache = {
    configUrl,
    interstitialUrlTemplate: readEnv('AV_DARKSITE_INTERSTITIAL_URL')
      || deriveCfUrl(configUrl, 'Interstitial'),
    marqueeUrlTemplate: readEnv('AV_DARKSITE_MARQUEE_URL')
      || deriveCfUrl(configUrl, 'Marquee'),
    bannerUrlTemplate: readEnv('AV_DARKSITE_BANNER_URL')
      || deriveCfUrl(configUrl, 'Banner'),
  };
  return graphqlConfigCache;
};

const DEFAULT_CONTACT_SWITCH_MINUTES = 60;

// Normaliza y valida un item del array `flights` del CF darksite-config.
// Requiere que TODOS los campos obligatorios estén presentes y no vacíos
// (flightCode / origin / destination / detailUrl); si falta alguno el vuelo
// se descarta silenciosamente (los otros del array siguen válidos). El
// `operatorName` cae a 'Avianca' si viene vacío — marca por defecto y evita
// que la UI muestre "Operado por" huérfano. `sortOrder` opcional.
const normalizeFlight = (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  const flightCode = typeof raw.flightCode === 'string' ? raw.flightCode.trim() : '';
  const origin = typeof raw.origin === 'string' ? raw.origin.trim() : '';
  const destination = typeof raw.destination === 'string' ? raw.destination.trim() : '';
  const detailUrl = typeof raw.detailUrl === 'string' ? raw.detailUrl.trim() : '';
  if (!flightCode || !origin || !destination || !detailUrl) return null;
  const operatorName = typeof raw.operatorName === 'string' && raw.operatorName.trim()
    ? raw.operatorName.trim()
    : 'Avianca';
  const sortOrder = Number(raw.sortOrder);
  return {
    flightCode,
    origin,
    destination,
    operatorName,
    detailUrl,
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
  };
};

const normalizeState = (item) => {
  if (!item || typeof item !== 'object') return null;
  const toCleanArray = (value, upper = false) => (Array.isArray(value)
    ? value.map((v) => {
      const s = String(v).trim();
      return upper ? s.toUpperCase() : s;
    }).filter(Boolean)
    : []);
  // contactSwitchMinutes: number > 0 requerido por contrato; cualquier otra
  // cosa (ausente, no-numérico, <=0) cae al default de 60 (Task 11).
  const switchMinutes = Number(item.contactSwitchMinutes);
  // blockedPaths: el CF puede autorarse sin la barra inicial (p.ej.
  // "ofertas-destinos"); isPathBlocked matchea contra pathname normalizado
  // (siempre con "/"), así que se antepone aquí si falta (Fix F7).
  const normalizedBlockedPaths = toCleanArray(item.blockedPaths)
    .map((p) => (p.startsWith('/') ? p : `/${p}`));
  // flights: array normalizado + ordenado por sortOrder (asc). Los items
  // inválidos se descartan. Comparación numérica estable: si dos vuelos
  // comparten sortOrder, se preserva el orden de autoría del CF.
  const flights = (Array.isArray(item.flights) ? item.flights : [])
    .map(normalizeFlight)
    .filter(Boolean)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  return {
    enabled: item.enabled === true,
    level: typeof item.level === 'string' && item.level ? item.level : 'max',
    affectedPos: toCleanArray(item.affectedPos, true),
    blockedPaths: normalizedBlockedPaths,
    lastUpdated: item.lastUpdated || null,
    // activatedAt: string ISO-8601 no vacía, o null. La validez de formato se
    // resuelve más adelante (Date.parse en applyContactPhase del gate), no aquí.
    activatedAt: typeof item.activatedAt === 'string' && item.activatedAt ? item.activatedAt : null,
    contactSwitchMinutes: Number.isFinite(switchMinutes) && switchMinutes > 0
      ? switchMinutes : DEFAULT_CONTACT_SWITCH_MINUTES,
    flights,
  };
};

const extractConfigItem = (result) => {
  const payload = result?.data?.data || result?.data || result;
  const items = payload?.darksiteConfigList?.items;
  return (Array.isArray(items) && items.length) ? items[0] : null;
};

export const readCachedState = () => {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    return raw ? normalizeState(JSON.parse(raw)) : null;
  } catch (e) {
    return null;
  }
};

export const fetchDarksiteState = async (timeoutMs = FETCH_TIMEOUT_MS) => {
  try {
    const config = await getGraphQLConfig();
    if (!config.configUrl) return null;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(config.configUrl, { signal: controller.signal });
      if (!response.ok) return null;
      const item = extractConfigItem(await response.json());
      // Respuesta HTTP ok y bien formada, pero la query no trajo items (CF
      // vacío/no publicado aún): cachea un sentinel "disabled" en vez de null
      // (Fix F2). Evita que cada carga siguiente reintente el fetch cuando el
      // resultado real ya se conoce (apagado), sin tocar el camino de error
      // HTTP/red/parseo (esos siguen devolviendo null sin cachear, más abajo
      // en el catch).
      const state = item ? normalizeState(item) : {
        enabled: false,
        level: 'max',
        affectedPos: [],
        blockedPaths: [],
        lastUpdated: null,
        activatedAt: null,
        contactSwitchMinutes: DEFAULT_CONTACT_SWITCH_MINUTES,
        flights: [],
      };
      if (state) {
        try {
          localStorage.setItem(STATE_KEY, JSON.stringify(state));
        } catch (e) {
          // storage lleno/bloqueado: seguimos sin caché
        }
      }
      return state;
    } finally {
      clearTimeout(timer);
    }
  } catch (e) {
    return null; // fail-open
  }
};

export const isActiveForPos = (state, pos) => {
  if (!state || state.enabled !== true) return false;
  if (!Array.isArray(state.affectedPos) || !state.affectedPos.length) return false;
  const posUp = String(pos || '').trim().toUpperCase();
  if (!posUp) return false;
  return state.affectedPos.includes('ALL') || state.affectedPos.includes(posUp);
};

export const isPathBlocked = (state, pathname) => {
  if (!state || !Array.isArray(state.blockedPaths) || !state.blockedPaths.length) return false;
  const stripped = String(pathname || '').replace(LANG_PREFIX_RE, '') || '/';
  return state.blockedPaths.some((blocked) => {
    const base = blocked.replace(/\/+$/, '');
    if (!base) return false;
    return stripped === base || stripped.startsWith(`${base}/`);
  });
};

// ---------------------------------------------------------------------
// Contenido del interstitial (CF `getDarksiteInterstitial`)
// ---------------------------------------------------------------------
// A diferencia del state (single CF, un solo path), el contenido es un CF
// por idioma bajo `/content/dam/avianca/content-fragments/darksite/{lang}/interstitial`.
// La persisted query recibe el path como parámetro (`;path=...`) que el
// front interpola sustituyendo `{lang}` en la plantilla del env var.

const normalizeContact = (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  if (!title) return null;
  const subtitle = typeof raw.subtitle === 'string' && raw.subtitle.trim()
    ? raw.subtitle.trim() : '';
  const phones = (Array.isArray(raw.phones) ? raw.phones : [])
    .map((p) => (typeof p === 'string' ? p.trim() : ''))
    .filter(Boolean);
  if (!phones.length) return null;
  const sortOrder = Number(raw.sortOrder);
  return {
    title, subtitle, phones, sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
  };
};

const normalizeInterstitial = (item) => {
  if (!item || typeof item !== 'object') return null;
  const readStr = (k) => (typeof item[k] === 'string' ? item[k].trim() : '');
  const initial = (Array.isArray(item.contactsInitial) ? item.contactsInitial : [])
    .map(normalizeContact).filter(Boolean).sort((a, b) => a.sortOrder - b.sortOrder);
  const updated = (Array.isArray(item.contactsUpdated) ? item.contactsUpdated : [])
    .map(normalizeContact).filter(Boolean).sort((a, b) => a.sortOrder - b.sortOrder);
  return {
    titleSingle: readStr('titleSingle'),
    titleMultiple: readStr('titleMultiple'),
    operatorTemplate: readStr('operatorTemplate'),
    contactsLabel: readStr('contactsLabel'),
    primaryCtaLabel: readStr('primaryCtaLabel'),
    primaryCtaAlt: readStr('primaryCtaAlt'),
    secondaryCtaLabel: readStr('secondaryCtaLabel'),
    secondaryCtaAlt: readStr('secondaryCtaAlt'),
    detailCtaLabel: readStr('detailCtaLabel'),
    // Separador origen→destino: `showFlightIcon=true` ⇒ el front dibuja el
    // sprite `flightIcon` (ej. 'action/plane2'); `false` ⇒ dibuja el texto
    // `flightSeparator` (ej. '-', '|', '→'). Ambos con default en el molecule
    // si vienen vacíos. Booleans se validan estrictos (fail-open a false ⇒
    // texto), evitando que strings como "true" o "1" enciendan el icono.
    flightIcon: readStr('flightIcon'),
    showFlightIcon: item.showFlightIcon === true,
    flightSeparator: readStr('flightSeparator'),
    // detailCtaChevron: cuando el CF trae `true` (default del líder), el
    // multi-flight molecule pinta un chevron-right después del label; `false`
    // ⇒ solo texto (el autor NO debe hornear la flecha en detailCtaLabel).
    detailCtaChevron: item.detailCtaChevron === true,
    contactsInitial: initial,
    contactsUpdated: updated,
  };
};

const extractInterstitialItem = (result) => {
  const payload = result?.data?.data || result?.data || result;
  return payload?.darksiteInterstitialByPath?.item || null;
};

const resolveInterstitialLang = (lang) => (
  SUPPORTED_LANGS.has(String(lang || '').trim().toLowerCase())
    ? String(lang).trim().toLowerCase()
    : DEFAULT_LANG
);

/**
 * Lectura sincrónica del contenido del interstitial cacheado. Permite al
 * gate montar SIN esperar red (SWR: pintar cache → revalidar en background
 * → re-render). Devuelve `null` si no hay caché para ese idioma.
 */
export const readCachedInterstitial = (lang) => {
  try {
    const raw = localStorage.getItem(INTERSTITIAL_CACHE_PREFIX + resolveInterstitialLang(lang));
    return raw ? normalizeInterstitial(JSON.parse(raw)) : null;
  } catch (e) {
    return null;
  }
};

/**
 * Fetch del CF de contenido del interstitial para un idioma. Interpola
 * `{lang}` en la plantilla `AV_DARKSITE_INTERSTITIAL_URL`. Si el idioma
 * pedido no trae contenido (404 o items vacíos) reintenta con `es` para
 * garantizar overlay siempre poblado (fail-open a idioma default). Guarda
 * en localStorage por idioma para SWR en cargas futuras.
 * Retorna `null` en cualquier error de red/parseo (fail-open completo).
 */
export const fetchDarksiteInterstitial = async (lang, timeoutMs = FETCH_TIMEOUT_MS) => {
  try {
    const config = await getGraphQLConfig();
    if (!config.interstitialUrlTemplate) return null;
    const resolvedLang = resolveInterstitialLang(lang);
    const fetchForLang = async (l) => {
      const url = config.interstitialUrlTemplate.replace('{lang}', l);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) return null;
        const item = extractInterstitialItem(await response.json());
        const normalized = item ? normalizeInterstitial(item) : null;
        if (normalized) {
          try {
            localStorage.setItem(INTERSTITIAL_CACHE_PREFIX + l, JSON.stringify(item));
          } catch (e) { /* storage lleno/bloqueado */ }
        }
        return normalized;
      } finally {
        clearTimeout(timer);
      }
    };
    const primary = await fetchForLang(resolvedLang);
    if (primary) return primary;
    if (resolvedLang !== DEFAULT_LANG) {
      const fallback = await fetchForLang(DEFAULT_LANG);
      if (fallback) return fallback;
    }
    return null;
  } catch (e) {
    return null; // fail-open
  }
};

// ---------------------------------------------------------------------
// Contenido de la marquesina post-bypass (CF `getDarksiteMarquee`)
// ---------------------------------------------------------------------
// Se dispara SOLO cuando el usuario acepta el bypass del interstitial y sigue
// navegando el sitio: aparece como banner sticky arriba del body con la
// notificaci\u00f3n de contingencia. El CF es por idioma (mismo layout que el
// interstitial) bajo `/content/dam/avianca/content-fragments/darksite/{lang}/marquee`
// y su \u00fanico campo relevante es `content` (multi-line rich text), que se
// consume tal cual como `contentHTML` del `Alert` molecule del DS.

const normalizeMarquee = (item) => {
  if (!item || typeof item !== 'object') return null;
  // El campo `content` es un multi-line rich text de AEM: el shape estable
  // es `{ html: string, plaintext: string }`. Tolerante ante ambas:
  //   - `content: { html: "..." }` (shape esperado del CF actual)
  //   - `content: "..."` (fallback defensivo si el CF cambia a single-line)
  const rawContent = item.content;
  let contentHTML = '';
  if (typeof rawContent === 'string') {
    contentHTML = rawContent.trim();
  } else if (rawContent && typeof rawContent === 'object' && typeof rawContent.html === 'string') {
    contentHTML = rawContent.html.trim();
  }
  // Sin HTML \u21d2 no hay marquesina. Devolver null hace que el gate no monte
  // el `Alert` (fail-open: mejor sin banner que con banner vac\u00edo).
  if (!contentHTML) return null;
  return { contentHTML };
};

const extractMarqueeItem = (result) => {
  const payload = result?.data?.data || result?.data || result;
  return payload?.darksiteMarqueeByPath?.item || null;
};

const resolveMarqueeLang = (lang) => (
  SUPPORTED_LANGS.has(String(lang || '').trim().toLowerCase())
    ? String(lang).trim().toLowerCase()
    : DEFAULT_LANG
);

/**
 * Lectura sincr\u00f3nica del contenido cacheado de la marquesina. Permite al
 * gate montar el banner SIN esperar red (SWR). Devuelve `null` si no hay
 * cach\u00e9 para ese idioma.
 */
export const readCachedMarquee = (lang) => {
  try {
    const raw = localStorage.getItem(MARQUEE_CACHE_PREFIX + resolveMarqueeLang(lang));
    return raw ? normalizeMarquee(JSON.parse(raw)) : null;
  } catch (e) {
    return null;
  }
};

/**
 * Fetch del CF de la marquesina post-bypass para un idioma. Interpola
 * `{lang}` en la plantilla `AV_DARKSITE_MARQUEE_URL`. Si el idioma pedido no
 * trae contenido (404 o item vacío) reintenta con `es` (fail-open a idioma
 * default) y guarda en localStorage por idioma para SWR en cargas futuras.
 * Retorna `null` en cualquier error de red/parseo (fail-open completo: sin
 * marquesina el sitio funciona normal, solo pierde el aviso pasivo).
 */
export const fetchDarksiteMarquee = async (lang, timeoutMs = FETCH_TIMEOUT_MS) => {
  try {
    const config = await getGraphQLConfig();
    if (!config.marqueeUrlTemplate) return null;
    const resolvedLang = resolveMarqueeLang(lang);
    const fetchForLang = async (l) => {
      const url = config.marqueeUrlTemplate.replace('{lang}', l);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) return null;
        const item = extractMarqueeItem(await response.json());
        const normalized = item ? normalizeMarquee(item) : null;
        if (normalized) {
          try {
            localStorage.setItem(MARQUEE_CACHE_PREFIX + l, JSON.stringify(item));
          } catch (e) { /* storage lleno/bloqueado */ }
        }
        return normalized;
      } finally {
        clearTimeout(timer);
      }
    };
    const primary = await fetchForLang(resolvedLang);
    if (primary) return primary;
    if (resolvedLang !== DEFAULT_LANG) {
      const fallback = await fetchForLang(DEFAULT_LANG);
      if (fallback) return fallback;
    }
    return null;
  } catch (e) {
    return null; // fail-open
  }
};

// ---------------------------------------------------------------------
// Contenido del banner informativo del home (CF `getDarksiteBanner`)
// ---------------------------------------------------------------------
// Reemplaza al banner promocional (`cms-hero-banner` marcado con
// `section-metadata: darksite-swap`) cuando el modo darksite está activo Y
// el usuario ya aceptó el bypass. Match Figma nodo 9611:7981.
// El CF es por idioma bajo
// `/content/dam/avianca/content-fragments/darksite/{lang}/banner` y devuelve
// `{ title, description, ctaUrl, ctaLabel, ctaAlt }` — se consume tal cual
// como props del molecule `DarksiteInformativeBanner` del DS.

const normalizeBanner = (item) => {
  if (!item || typeof item !== 'object') return null;
  // Todos los campos son strings simples en el CF. Sin `title` no hay banner
  // que renderizar: fail-closed (mejor sin promo que con card vacía),
  // consistente con la política del swap en `darksite-gate.js`.
  const clean = (v) => (typeof v === 'string' ? v.trim() : '');
  const title = clean(item.title);
  if (!title) return null;
  return {
    title,
    description: clean(item.description),
    ctaUrl: clean(item.ctaUrl),
    ctaLabel: clean(item.ctaLabel),
    ctaAlt: clean(item.ctaAlt),
  };
};

const extractBannerItem = (result) => {
  const payload = result?.data?.data || result?.data || result;
  return payload?.darksiteBannerByPath?.item || null;
};

const resolveBannerLang = (lang) => (
  SUPPORTED_LANGS.has(String(lang || '').trim().toLowerCase())
    ? String(lang).trim().toLowerCase()
    : DEFAULT_LANG
);

/**
 * Lectura síncrona del contenido cacheado del banner del home. Permite al
 * gate montar el molecule SIN esperar red (SWR). Devuelve `null` si no hay
 * caché para ese idioma.
 */
export const readCachedBanner = (lang) => {
  try {
    const raw = localStorage.getItem(BANNER_CACHE_PREFIX + resolveBannerLang(lang));
    return raw ? normalizeBanner(JSON.parse(raw)) : null;
  } catch (e) {
    return null;
  }
};

/**
 * Fetch del CF del banner del home para un idioma. Interpola `{lang}` en la
 * plantilla `AV_DARKSITE_BANNER_URL` (o la URL derivada de
 * `AV_DARKSITE_CONFIG_URL`). Si el idioma pedido no trae contenido (404 o
 * item vacío) reintenta con `es` (fail-open a idioma default) y guarda en
 * localStorage por idioma para SWR en cargas futuras. Retorna `null` en
 * cualquier error de red/parseo: el gate lee `null` como "sin banner" y
 * mantiene la sección promocional oculta (fail-closed: el requisito de
 * negocio es "no ver promociones" durante el darksite).
 */
export const fetchDarksiteBanner = async (lang, timeoutMs = FETCH_TIMEOUT_MS) => {
  try {
    const config = await getGraphQLConfig();
    if (!config.bannerUrlTemplate) return null;
    const resolvedLang = resolveBannerLang(lang);
    const fetchForLang = async (l) => {
      const url = config.bannerUrlTemplate.replace('{lang}', l);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) return null;
        const item = extractBannerItem(await response.json());
        const normalized = item ? normalizeBanner(item) : null;
        if (normalized) {
          try {
            localStorage.setItem(BANNER_CACHE_PREFIX + l, JSON.stringify(item));
          } catch (e) { /* storage lleno/bloqueado */ }
        }
        return normalized;
      } finally {
        clearTimeout(timer);
      }
    };
    const primary = await fetchForLang(resolvedLang);
    if (primary) return primary;
    if (resolvedLang !== DEFAULT_LANG) {
      const fallback = await fetchForLang(DEFAULT_LANG);
      if (fallback) return fallback;
    }
    return null;
  } catch (e) {
    return null; // fail-open
  }
};
