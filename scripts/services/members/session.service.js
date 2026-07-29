import { setSession } from './session.store.js';
import { onCrossTab, MEMBERS_EVENTS } from './session.events.js';
import { loadLmScript, whenLmReady } from './lm-script.loader.js';
import { loadMembersConfig } from './members-config.js';
import { profileFieldPresence } from './profile-completeness.js';
import { isPortalPage } from './page-type.js';
import { classifyMembersError, resetRetries } from './members-error.js';
import { getStoredLanguage } from '../header/language-country-selector.js';
import {
  isMembersDataMockEnabled,
  getMockMemberMetrics,
  getEmptyMemberMetrics,
  isDevSessionMockEnabled,
  getMockUserVM,
} from './members-data.mock.js';
import { guardPortalSession } from './members-guard.js';
import { normalizeTierKey } from '../../../design-system/helpers/members-tier-theme.js';

/**
 * Servicio singleton de sesión (base de 1255354).
 *
 * MPA: en cada page load el estado en memoria se pierde → este servicio RE-HIDRATA
 * el signal `session.store` desde la fuente de verdad (las COOKIES, compartidas entre
 * páginas Y tabs) + un cache del perfil en sessionStorage (por-tab, sobrevive reloads).
 *
 * Encaminado a multi-tab (1255576): escucha el BroadcastChannel para re-hidratar/limpiar
 * cuando OTRA tab hace login/logout.
 *
 * Seguridad: los TOKENS quedan en las cookies (las maneja el script LM) — NO se copian a
 * storage. El cache es solo perfil de display, en sessionStorage, y se limpia en logout.
 */

const TOKEN_COOKIE = 'access_token';
const PROFILE_KEY = 'members-profile';

const getCookie = (name) => {
  const match = document.cookie.match(new RegExp(`(^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
};

const isLoggedIn = () => !!getCookie(TOKEN_COOKIE);

const readCache = () => {
  try { return JSON.parse(sessionStorage.getItem(PROFILE_KEY) || 'null'); } catch (e) { return null; }
};
const writeCache = (profile) => {
  try { sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch (e) { /* ignore */ }
};
const clearCache = () => {
  try { sessionStorage.removeItem(PROFILE_KEY); } catch (e) { /* ignore */ }
};

const sentenceCase = (s) => (s || '').toLowerCase().replace(/(^|\s)\S/g, (m) => m.toUpperCase());

/**
 * Deriva el nivel Cenit del socio de forma tolerante (1271692, decisión 5).
 * Fuentes: (a) `eliteProgram.status.cenitStatus` (ej. 'ONE_MILLION'/'TWO_MILLION';
 * acepta variantes de case/underscore/espacios y numéricas), y (b) la string
 * `tier` cuando contiene "cenit"/"million" (el AC dice que el status cenit llega
 * en `tier`). La fuente (a) gana sobre (b); "cenit" sin nivel explícito → 1
 * (One Million es el nivel base). Devuelve `{ level: 1|2|null }`.
 * // TODO(captura shapes _progelite-ben/capturas/): afinar valores exactos por tier.
 * @param {{tierRaw?:string|null, cenitStatusRaw?:string|null}} [args]
 * @returns {{level: (1|2|null)}}
 */
export const deriveCenit = ({ tierRaw = null, cenitStatusRaw = null } = {}) => {
  const norm = (v) => String(v ?? '').toLowerCase();
  // Sufijo de nivel PEGADO al tier base en las keys compuestas del servicio
  // ('diamondone', 'goldone', 'magnotwo'… — shape real de `status.current`,
  // captura 2026-07-03 §5.5): sin separador no lo cubren los \b de levelOf.
  const suffixLevelOf = (s) => {
    if (/(lifemiles|red[\s_-]?plus|redplus|silver|gold|diamond|magno)two$/.test(s)) return 2;
    if (/(lifemiles|red[\s_-]?plus|redplus|silver|gold|diamond|magno)one$/.test(s)) return 1;
    return null;
  };
  const levelOf = (s) => {
    if (/\btwo\b|two[\s_-]*million|(^|[^0-9])2([^0-9]|$)/.test(s)) return 2;
    if (/\bone\b|one[\s_-]*million|(^|[^0-9])1([^0-9]|$)/.test(s)) return 1;
    return suffixLevelOf(s);
  };
  const status = norm(cenitStatusRaw);
  if (status) {
    const l = levelOf(status);
    if (l) return { level: l };
  }
  const tier = norm(tierRaw);
  if (tier.includes('cenit') || tier.includes('million')) {
    return { level: levelOf(tier) || 1 };
  }
  // Key compuesta sin 'cenit'/'million' literal (ej. tierRaw = status.current
  // = 'diamondone'): el sufijo del tier base define el nivel.
  const suffix = suffixLevelOf(tier);
  if (suffix) return { level: suffix };
  return { level: null };
};

/** Mapea la respuesta del wrapper a un VM mínimo de display (sin datos sensibles). */
function toUserVM(raw) {
  const acc = raw?.memberProfileDetails?.memberAccount;
  if (!acc) return null;
  const ind = acc.memberProfile?.individualInfo || {};
  return {
    membershipNumber: acc.memberProfile?.membershipNumber || null,
    tier: acc.tier || null,
    // Nivel Cenit (1271692). El AC dice que el status cenit llega en `tier`, así
    // que lo derivamos de ahí en el perfil; `fetchMemberMetrics` lo refina si
    // `eliteProgram.status.cenitStatus` trae el dato.
    cenit: deriveCenit({ tierRaw: acc.tier }),
    firstName: sentenceCase(ind.displayName || ind.givenName) || null,
    lastName: sentenceCase(ind.familyName) || null,
    language: ind.preferredLanguage || null,
    // Mapa de PRESENCIA de campos del perfil (booleans, SIN PII) para el badge de
    // completitud de la card "Gestión de cuenta" (1263921). Las REGLAS (qué campos
    // cuentan + umbral) las aplica el organism con la config del CF; acá solo el
    // "lleno/vacío" por campo. Ver `profile-completeness.js`.
    profileFields: profileFieldPresence(raw),
    // --- Métricas del hero "Mi Lifemiles" (1263924). El `memberProfile` NO las
    // trae: las puebla `enrichUserWithMetrics()` desde `lmBalance`/`eliteProgram`
    // (o el mock de datos). Se declaran acá para FIJAR el shape del VM en un solo
    // lugar. `null` = dato ausente → el hero pinta placeholder por campo (empty),
    // nunca rompe. Ver `members-data.mock.js` (MemberMetricsVM typedef).
    totalMiles: null,
    milesExpiryDate: null,
    statusExpiry: null,
    elite: null,
  };
}

/**
 * Mapea la respuesta CRUDA de `lmBalance` → fragmento de millas del VM.
 *
 * SHAPE REAL VERIFICADO en QA (cuenta 13515182590, 2026-06-22):
 *   { member:{memshpnum,lastUpd}, summarization:[{type:'LM',amount,totalAccrual,detail},
 *     {type:'CR',amount,...}] }
 * El saldo LifeMiles del socio = la entrada `type:'LM'` → `amount`. (`CR` = otra
 * moneda/crédito, no se muestra.) Se conservan fallbacks defensivos a nombres planos
 * por si el shape cambia. Punto de swap único (hipotesis-inicial §4).
 * @param {object|null} raw
 * @returns {{totalMiles:number|null, milesExpiryDate:string|null}}
 */
function toBalanceVM(raw) {
  if (!raw) return { totalMiles: null, milesExpiryDate: null };
  const b = raw.balance || raw.lmBalance || raw.data || raw;
  const summ = Array.isArray(b?.summarization) ? b.summarization : [];
  const lm = summ.find((s) => s?.type === 'LM') || summ[0] || null;
  const milesNum = Number(
    lm?.amount ?? b?.totalMiles ?? b?.availableMiles ?? b?.miles ?? b?.balance,
  );
  // La vigencia de millas vive en `LM.detail[]` (array de grupos; el grupo
  // "Redeemable Miles" trae `expDate`). Verificado QA Gold: detail[0].expDate.
  const detail0 = Array.isArray(lm?.detail) ? lm.detail[0] : lm?.detail;
  const rawExpiry = detail0?.expDate || detail0?.expirationDate || lm?.expirationDate
    || b?.expirationDate || b?.expiryDate || b?.milesExpiryDate || null;
  // El wrapper devuelve ISO completo ('2027-06-18T00:00:00Z'); normalizamos a date-only
  // ('YYYY-MM-DD') para que el formateador del hero (espera date-only) lo muestre bien
  // sin depender del fix de `formatDate`. Igual que `statusExpiry` (date-only).
  return {
    totalMiles: Number.isFinite(milesNum) ? milesNum : null,
    milesExpiryDate: rawExpiry ? String(rawExpiry).split('T')[0] : null,
  };
}

/** Región de residencia (COL vs EXCOL) desde el profile crudo. Mirror de
 * `resolveRegion` de elite-detail.service — se replica acá (no se importa) para
 * evitar la dependencia circular session↔elite-detail (elite-detail ya importa
 * `deriveCenit` de este módulo). */
export const resolveRegionFromProfile = (profileRaw, countryRegionMap = {}) => {
  const details = profileRaw?.memberProfileDetails || profileRaw || {};
  const rawRegion = details?.applicableRegion?.value
    || details?.memberAccount?.memberProfile?.applicableRegion?.value
    || profileRaw?.applicableRegion?.value
    || null;
  const norm = (v) => (String(v || '').trim().toUpperCase() === 'COL' ? 'COL' : 'EXCOL');
  if (rawRegion) return norm(rawRegion);
  const country = details?.memberAccount?.memberProfile?.individualInfo?.countryOfResidence;
  if (country != null && countryRegionMap[String(country)]) {
    return norm(countryRegionMap[String(country)]);
  }
  return 'EXCOL';
};

/** Metas del progreso elite del hero desde `eliteGoalsV2` (T18): elige col/row por
 * región y toma el mapeo de métrica de `eliteMetrics` → consistente con la tab elite.
 * Avianca confirmó que las metas reales son las de v2 (las de v1 eran un supuesto).
 * Devuelve el shape que ya consume `toEliteVM` ({metaTotal, metaAvianca, metricTotal,
 * metricAvianca}), o `undefined` si no hay metas para el tier (lifemiles/magno-total
 * → sin barra). NOTA métrica avianca: se alinea a `av-miles` (año) como la tab; si el
 * PO define que el hero cuente vitalicias (`avstar`), es cambio de 1 línea en el CF. */
export const resolveEliteGoalsV2 = (eliteGoalsV2, rawTier, region, eliteMetrics = {}) => {
  if (!eliteGoalsV2 || !rawTier) return undefined;
  const e = eliteGoalsV2[normalizeTierKey(rawTier)];
  if (!e) return undefined;
  const pick = (dim) => {
    if (!dim) return null;
    return region === 'COL' ? dim.col : dim.row;
  };
  return {
    metaTotal: pick(e.totales),
    metaAvianca: pick(e.avianca),
    metricTotal: eliteMetrics.total,
    metricAvianca: eliteMetrics.avianca,
  };
};

/** Escalera de tiers. Duplicada de `elite-detail.service.js` (que ya importa
 * `deriveCenit` de este módulo) para no crear la dependencia circular
 * session↔elite-detail — mismo criterio que `resolveRegionFromProfile`. */
const TIER_LADDER_HERO = ['lifemiles', 'red-plus', 'silver', 'gold', 'diamond', 'magno'];

/**
 * Tier cuyas metas debe mostrar la tira elite del hero (1284716).
 *
 * La tabla `eliteGoalsV2`/`DEFAULT_ELITE_GOALS` está indexada por tier **DESTINO**
 * (los montos son "lo que hay que hacer para LLEGAR a ese tier"), y el AC de la tab
 * Progreso (1271699, bloque 6) define la meta inmediata como el **siguiente** peldaño:
 * Lifemiles→Red Plus, Red Plus→Silver, Silver→Gold, Gold→Diamond. Antes se consultaba
 * la tabla con el tier ACTUAL del socio: al tier base (sin fila propia) le quedaba
 * `undefined` ⇒ hero SIN tira, y a los demás les mostraba las metas que ya cumplieron.
 *
 * Las variantes Cenit operan sobre el tier base puro (las metas no las distinguen).
 * Magno es el último peldaño: se queda en su propia fila (meta única "mantener", AC
 * bloque 6 variante Magno). Un tier desconocido ya lo colapsa `normalizeTierKey` a
 * base lifemiles (mismo criterio que la tab elite) ⇒ persigue Red Plus.
 *
 * @param {string} rawTier tier del socio (crudo, sin normalizar)
 * @returns {string} tier key con el que consultar `eliteGoalsV2`
 */
export const resolveHeroGoalTier = (rawTier) => {
  const key = normalizeTierKey(rawTier);
  const pure = String(key || '').replace(/-cenit$/, '');
  const idx = TIER_LADDER_HERO.indexOf(pure);
  if (idx < 0) return key;
  if (idx === TIER_LADDER_HERO.length - 1) return pure; // magno: mantener
  return TIER_LADDER_HERO[idx + 1];
};

/** Tier-objetivo del progreso elite (primer campo plausible del crudo). El
 * `fallbackTarget` (meta calculada por la escalera) va ANTES de `e.tier` para que
 * el título no anuncie el tier actual cuando el servicio no manda objetivo — si
 * las barras muestran las metas de Gold, el copy debe decir Gold. */
const pickTierTarget = (e, fallbackTarget = null) => e?.tierTarget || e?.targetTier
  || e?.nextTier || e?.status?.next || fallbackTarget || e?.tier || null;

/**
 * Mapea la respuesta CRUDA de `eliteProgram` → `EliteProgressVM` (o `null`).
 *
 * SHAPE REAL VERIFICADO en QA (cuenta 13515182590, 2026-06-22):
 *   { qualified:[{type:'segments'|'dollars'|'historic'|'av-miles'|'avstar', amount}],
 *     status:{current, expiryDate, cenitStatus}, tier, summary:[…QM…] }
 * Los VALORES de progreso están en `qualified[].amount`. El API NO trae las METAS:
 * vienen del CF (`goalsForTier`, 1263924) con los umbrales (`metaTotal`/`metaAvianca`)
 * y el MAPEO de qué métrica de `qualified` alimenta cada barra (`metricTotal`/
 * `metricAvianca`). Sin `goalsForTier` (tier sin metas) → fallback al shape viejo
 * (conditions/requirements con goal embebido, p.ej. el mock); si tampoco → `null`.
 * @param {object|null} raw
 * @param {{metaTotal:number,metaAvianca:number,metricTotal:string,metricAvianca:string}}
 *   [goalsForTier] - metas del CF para el tier META del socio (ver `resolveHeroGoalTier`).
 * @param {string|null} [targetTier] - tier meta calculado por la escalera; se usa como
 *   objetivo del título cuando el servicio no manda uno explícito.
 * @returns {{year:number, tierTarget:string|null, conditions:object[]}|null}
 */
function toEliteVM(raw, goalsForTier, targetTier = null) {
  if (!raw) return null;
  const e = raw.eliteProgram || raw.elite || raw.data || raw;
  // Camino CF (1263924): combinar los VALORES de `qualified` (por type) con las metas
  // + el mapeo de métrica del CF → las 2 barras.
  if (goalsForTier && Array.isArray(e?.qualified)) {
    const byType = {};
    e.qualified.forEach((q) => {
      if (q && q.type != null) byType[q.type] = Number(q.amount) || 0;
    });
    const cfConditions = [];
    if (Number(goalsForTier.metaTotal) > 0) {
      cfConditions.push({
        key: 'qualifying-miles',
        value: byType[goalsForTier.metricTotal] || 0,
        goal: Number(goalsForTier.metaTotal),
      });
    }
    if (Number(goalsForTier.metaAvianca) > 0) {
      cfConditions.push({
        key: 'avianca-miles',
        value: byType[goalsForTier.metricAvianca] || 0,
        goal: Number(goalsForTier.metaAvianca),
      });
    }
    if (cfConditions.length) {
      return {
        year: Number(e?.year ?? e?.targetYear) || (new Date().getFullYear() + 1),
        tierTarget: pickTierTarget(e, targetTier),
        conditions: cfConditions,
      };
    }
  }
  // Fallback (shape viejo / mock con goal embebido): conditions/requirements con goal.
  let list = [];
  if (Array.isArray(e?.conditions)) list = e.conditions;
  else if (Array.isArray(e?.requirements)) list = e.requirements;
  else if (Array.isArray(e?.qualified)) list = e.qualified;
  const conditions = list
    .map((c, i) => ({
      key: c?.key || c?.code || c?.type || (i === 0 ? 'qualifying-miles' : 'avianca-miles'),
      value: Number(c?.value ?? c?.current ?? c?.progress ?? c?.amount) || 0,
      goal: Number(c?.goal ?? c?.target ?? c?.required) || 0,
    }))
    .filter((c) => c.goal > 0);
  if (!conditions.length) return null;
  return {
    year: Number(e?.year ?? e?.targetYear) || (new Date().getFullYear() + 1),
    tierTarget: pickTierTarget(e, targetTier),
    conditions,
  };
}

/** Extrae la vigencia del estatus de cualquiera de los dos wrappers (campo
 * plausible, sin verificar). null si ausente. */
const extractStatusExpiry = (balanceRaw, eliteRaw) => eliteRaw?.status?.expiryDate
  || balanceRaw?.statusExpiry || eliteRaw?.statusExpiry || eliteRaw?.tierExpiry
  || eliteRaw?.tierExpiryDate || null;

/** Lee el JSON de un resultado de `Promise.allSettled` sobre un wrapper LM.
 * Devuelve el objeto parseado o `null` (string E.EON / no-ok / rechazo → sin
 * datos = empty; nunca lanza). */
async function readWrapperJson(settled) {
  if (!settled || settled.status !== 'fulfilled') return null;
  const resp = settled.value;
  if (resp && resp.ok && typeof resp.json === 'function') {
    try { return await resp.json(); } catch (e) { return null; }
  }
  return null;
}

/** Trae millas + progreso elite vía `lmBalance`/`eliteProgram` EN PARALELO.
 * Best-effort y NO-ROMPEDOR: cualquier fallo de estos wrappers degrada a campos
 * `null` (empty) y NUNCA afecta al perfil ni al estado de sesión. */
async function fetchMemberMetrics(goalsForTier, targetTier = null) {
  try {
    const [balanceRes, eliteRes] = await Promise.allSettled([
      window.lmFetchWrapper('lmBalance', {}, false),
      window.lmFetchWrapper('eliteProgram', {}, false),
    ]);
    const balanceRaw = await readWrapperJson(balanceRes);
    const eliteRaw = await readWrapperJson(eliteRes);
    const balance = toBalanceVM(balanceRaw);
    // Refina el nivel Cenit desde `eliteProgram.status.cenitStatus` si el wrapper
    // lo trae (el perfil ya lo derivó del `tier`). Solo sobrescribe cuando resuelve
    // un nivel — si es null, se preserva el del VM del perfil.
    const cenit = deriveCenit({ cenitStatusRaw: eliteRaw?.status?.cenitStatus });
    return {
      totalMiles: balance.totalMiles,
      milesExpiryDate: balance.milesExpiryDate,
      statusExpiry: extractStatusExpiry(balanceRaw, eliteRaw),
      elite: toEliteVM(eliteRaw, goalsForTier, targetTier),
      ...(cenit.level != null ? { cenit } : {}),
    };
  } catch (e) {
    return getEmptyMemberMetrics();
  }
}

/** Enriquece el VM del perfil con las métricas reales del hero (lmBalance/eliteProgram).
 * Si `user` es null (no logueado / error de perfil), no hace nada. NUNCA lanza.
 *
 * Herramienta de QA `?membersMock=<estado>`: fuerza un fixture de métricas para probar
 * los estados del hero (empty/error/por-tier) sin datos reales. SOLO en non-prod
 * (`env !== 'prd'`); en producción se IGNORA por completo y siempre va al wrapper real.
 * Ver `qa/guia-prueba-estados-modales.md`. */
async function enrichUserWithMetrics(user, profileRaw = null) {
  if (!user) return user;
  try {
    const conf = await loadMembersConfig();
    const useMock = conf.env !== 'prd' && isMembersDataMockEnabled();
    // Metas elite del hero desde `eliteGoalsV2` (T18, región-aware + mapeo de
    // `eliteMetrics`) — consistente con la tab elite y con los valores reales de
    // Avianca. La tabla se indexa por tier DESTINO, así que se consulta con la meta
    // inmediata del socio (siguiente peldaño de la escalera, `resolveHeroGoalTier`),
    // no con su tier actual (1284716). Magno se queda en su fila (meta "mantener").
    const { eliteGoalsV2, eliteMetrics, countryRegionMap } = conf;
    const region = resolveRegionFromProfile(profileRaw, countryRegionMap);
    const goalTier = resolveHeroGoalTier(user.tier);
    const goalsForTier = resolveEliteGoalsV2(eliteGoalsV2, goalTier, region, eliteMetrics);
    const metrics = useMock
      ? getMockMemberMetrics()
      : await fetchMemberMetrics(goalsForTier, goalTier);
    return { ...user, ...metrics };
  } catch (e) {
    return user; // el perfil sigue válido; las métricas quedan null (empty)
  }
}

/** Silent refresh del access_token vía refresh_token. SOLO lo usa el fallback defensivo
 * fetchProfileDirect() (red de seguridad cuando el wrapper oficial no responde). El camino normal
 * de refresh + validación es lmFetchWrapper(refreshLoginFlag=false) en fetchProfile() — el que
 * define el requisito (1255354) y que NO redirige.
 *
 * OJO: lmRefreshSession es arity-0 y, cuando el refresh falla (refresh_token revocado por logout
 * cross-domain), RESUELVE con `false` (no lanza) Y ADEMÁS redirige al SSO internamente. Por eso
 * NO se llama en el camino de carga (rehydrate) — solo en este fallback puntual. */
async function refreshToken() {
  await whenLmReady('lmRefreshSession'); // event-driven, sin timeout
  try {
    const ok = await window.lmRefreshSession();
    return ok !== false; // contrato real: `false` = el refresh falló (token revocado)
  } catch (e) {
    return false;
  }
}

// Fallback defensivo de fetchProfile: si el wrapper oficial no devuelve un perfil válido
// (string de error E.EON, Response no-ok, etc.), pedimos el perfil directo a la API con el
// access_token (hace su propio refresh + retry ante 401/403). Red de seguridad, no el camino feliz.
async function fetchProfileDirect() {
  // eslint-disable-next-line no-underscore-dangle
  const base = window.__LM_LOGIN_CONFIG__?.API_BASE_PROFILE;
  const memb = getCookie('userinfo');
  if (!base || !memb) return { profile: null, status: 0 };
  const call = (token) => fetch(`${base}/${memb}`, { headers: { Authorization: `Bearer ${token}` } });
  try {
    let resp = await call(getCookie(TOKEN_COOKIE));
    if (resp.status === 401 || resp.status === 403) {
      await refreshToken(); // silent refresh + retry
      resp = await call(getCookie(TOKEN_COOKIE));
    }
    // Devolvemos el status para que loadProfile clasifique el error (400/500 → modal, 1255601).
    if (resp.ok) return { profile: await resp.json(), status: resp.status };
    return { profile: null, status: resp.status };
  } catch (e) {
    return { profile: null, status: 0 };
  }
}

/** Trae el perfil vía el wrapper oficial de Lifemiles, con fallback defensivo a la API directa.
 *
 * Contrato de `lmFetchWrapper(F, R = {}, refreshLoginFlag = true)`: devuelve el `Response` CRUDO
 * del fetch (hay que leerlo con `.json()`) y hace su propio auto-refresh del token ante un 403.
 * Cuando ese auto-refresh se agota (refresh_token revocado) devuelve un string `E.EON.xx`.
 *
 * ⚠️ `refreshLoginFlag` es el TERCER argumento (`R` —el 2º— NO se usa para `memberProfile`). Por
 * defecto es `true`: al agotarse el auto-refresh, el script dispara el redirect completo al SSO.
 * Ese re-auth lo inicia el script (no nuestro lmLogin) → NO lleva nuestro `code_verifier` → falla
 * PKCE con `E.EON.6` y deja al usuario clavado en `/members/auth/callback`. Con `false` evitamos el
 * redirect: si el silent refresh anda → renueva calladito y devuelve el Response; si no → devuelve
 * el flag `E.EON.xx` → lo leemos como sesión expirada y transicionamos a `expired` (sin redirect).
 * (Verificado en vivo QA 2026-06-11: pasar `false` en 2º posición dejaba `refreshLoginFlag=true` y
 * el wrapper SÍ redirigía — el `false` debe ir en 3ª posición.)
 *
 * @returns {Promise<{ user: object|null, expired: boolean }>}
 */
async function fetchProfile() {
  await loadLmScript();
  await whenLmReady('lmFetchWrapper'); // event-driven, sin timeout (robusto en red lenta)
  let wrapperStatus = 0;
  try {
    const resp = await window.lmFetchWrapper('memberProfile', {}, false);
    // Camino feliz: Response ok → perfil. Ante refresh agotado: string `E.EON.xx` → expirada.
    if (resp && resp.ok && typeof resp.json === 'function') {
      const raw = await resp.json();
      const user = await enrichUserWithMetrics(toUserVM(raw), raw);
      return { user, expired: false, error: null };
    }
    if (typeof resp === 'string' && resp.startsWith('E.EON')) {
      return { user: null, expired: true, error: null };
    }
    if (resp && typeof resp.status === 'number') wrapperStatus = resp.status;
  } catch (e) { /* cae al fallback defensivo */ }
  // Red de seguridad: el wrapper no dio perfil NI flag de expiración (caso raro). API directa.
  const { profile, status } = await fetchProfileDirect();
  const user = toUserVM(profile);
  // Sin perfil + status HTTP de fallo → error de servicio clasificable (400/500). 1255601.
  const errStatus = status || wrapperStatus;
  const error = !user && errStatus ? { status: errStatus } : null;
  return { user: await enrichUserWithMetrics(user, profile), expired: false, error };
}

/** Trae el perfil y actualiza el signal. Muestra el cache YA (sin flash) pero SIEMPRE revalida
 * contra el wrapper: en single-logout la cookie sigue presente (token revocado) y solo el wrapper
 * detecta la expiración — un early-return con cache la ocultaría. */
async function loadProfile() {
  const cached = readCache();
  if (cached) setSession({ status: 'authenticated', user: cached }); // estado inmediato, NO corta la revalidación
  const { user, expired, error } = await fetchProfile();
  if (user) {
    writeCache(user);
    setSession({ status: 'authenticated', user });
    resetRetries(); // éxito de una operación Members → resetea el contador global (P4).
  } else if (expired || !isLoggedIn()) {
    // Token revocado/expirado (flag E.EON del wrapper) o cookie ausente → sesión expirada. Acá
    // SOLO el estado; el modal CMS-driven que lo consume es 1255601.
    clearCache();
    setSession({ status: 'expired', user: null });
    // Guardia de zona privada (1263924): el silent refresh (camino `false`) ya
    // falló → en páginas del Portal redirigimos al login (flujo existente, sin
    // reintroducir el redirect del script — PKCE E.EON.6). No-op fuera del Portal.
    guardPortalSession();
  } else {
    // Sin perfil pero token aún válido → error de servicio (400/500). Modal clasificado,
    // sin tocar el estado (mantenemos el cache previo). El host se carga lazy (1255601).
    const key = classifyMembersError(error || {});
    if (key) {
      try {
        const cfg = await loadMembersConfig();
        const { showMembersModal } = await import('./members-modal-host.js');
        await showMembersModal(key, { cfg });
      } catch (e) { /* no romper la carga por el modal */ }
    }
  }
}

/** Re-hidrata el signal desde la cookie (estado inmediato) + perfil/validación async (no bloquea).
 * El refresh del access_token y la detección de expiración los hace loadProfile() vía
 * lmFetchWrapper(refreshLoginFlag=false) — el camino que define el requisito (1255354) y que NO
 * redirige. (Antes había un lmRefreshSession() proactivo acá, pero ese helper es arity-0 y SIEMPRE
 * redirige al SSO en fallo → rompía la transición a expired; verificado en vivo QA 2026-06-11.) */
async function rehydrate() {
  // Dev-only short-circuit (localhost + `?mockMembers=1` + `?membersMock=<state>`):
  // salta el flujo real de LM y monta un user mock listo para pintar el hero. Con
  // esto se revisa en localhost sin cookie/token de LM. En qa/prod el gate por
  // hostname en `isDevSessionMockEnabled()` lo ignora por completo.
  if (isDevSessionMockEnabled() && isMembersDataMockEnabled()) {
    const mockUser = getMockUserVM();
    if (mockUser) {
      setSession({ status: 'authenticated', user: mockUser, error: null });
      return;
    }
  }
  if (!isLoggedIn()) {
    clearCache();
    setSession({ status: 'anonymous', user: null, error: null });
    // Guardia de zona privada (1263924): sin cookie en una página del Portal →
    // redirige al login. No-op fuera del Portal.
    guardPortalSession();
    return;
  }
  setSession({ status: 'authenticated', user: readCache() || null });
  await loadProfile();
}

let wired = false;
/** Cablea la sync multi-tab (1255576): re-hidrata/limpia cuando otra tab cambia. */
function wireCrossTab() {
  if (wired) return;
  wired = true;
  onCrossTab(MEMBERS_EVENTS.LOGIN_SUCCESS, () => rehydrate());
  onCrossTab(MEMBERS_EVENTS.LOGOUT, async () => {
    // Estado anónimo PRIMERO (síncrono): el header pasa a logged-out en cualquier página.
    clearCache();
    setSession({ status: 'anonymous', user: null, error: null });
    // Logout diferenciado por tipo de página (1255576, P2=A): solo las páginas de Portal
    // (perfil) redirigen a la Home del locale; Home/corporativa se queda donde está.
    try {
      const cfg = await loadMembersConfig(); // cacheado tras boot, instantáneo
      if (isPortalPage(window.location.pathname, cfg)) {
        const lang = getStoredLanguage() || document.documentElement.lang || 'pt';
        window.location.assign(`/${lang}`);
      }
    } catch (e) {
      // Si la config no carga, NO redirigimos: la tab se queda (ya logged-out). Nunca colgada.
    }
  });
}

/**
 * Inicializa la sesión en la página actual. Síncrono en el estado (cookie),
 * async en el perfil (no bloquea el render). Se invoca en cada page load.
 */
// eslint-disable-next-line import/prefer-default-export
export function initSession() {
  rehydrate();
  wireCrossTab();
}
