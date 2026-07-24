import { normalizeTierKey } from '../../../design-system/helpers/members-tier-theme.js';
import { deriveCenit } from './session.service.js';
import {
  DEFAULT_CENIT_CONFIG,
  DEFAULT_ELITE_METRICS,
  mergeEliteGoalsV2,
} from './members-config.js';

/**
 * Elite detail — view-model del panel de progreso de la tab Progreso (1271699).
 *
 * FUNCIONES PURAS, sin fetch: los raws de `eliteProgram`/`memberProfile` ya los
 * trae `session.service`; acá solo se proyectan al VM que consume la máquina de
 * estados (`goal-progress.logic.js`). Contratos de referencia: los JSON REALES
 * capturados en UAT (tests/fixtures/members/elite/*.json, sesión 2026-07-03).
 *
 * Modelo de tier (T5 v2): la fuente de verdad del tier + variante Cenit es el
 * SERVICIO — `status.current` llega como key simple ('lifemiles'|'gold'|'magno')
 * o compuesta ('diamondone'), y `tier`/`cenitStatus` traen el display armado
 * ('Diamond Cenit One Million'). `avstar` NO define la variante: es solo el
 * contador de las barras Cenit y el trigger de visibilidad (≥500k config.).
 */

/** Escalera de tiers base (orden del programa). Define la meta "siguiente". */
export const TIER_LADDER = ['lifemiles', 'red-plus', 'silver', 'gold', 'diamond', 'magno'];

/**
 * Tier base "puro" (sin sufijo -cenit) de una key de theming. El theming
 * distingue 'gold-cenit'/'diamond-cenit', pero las metas y la escalera de
 * tiers operan sobre el tier base.
 * @param {string} tierBase key de theming (ej. 'diamond-cenit')
 * @returns {string} tier base puro (ej. 'diamond')
 */
export const pureTierBase = (tierBase) => String(tierBase || '').replace(/-cenit$/, '');

/**
 * Siguiente tier de la escalera para un tier base puro. `null` si es el último
 * (magno) o si el tier no está en la escalera.
 * @param {string} pure tier base puro
 * @returns {string|null}
 */
export const nextTierOf = (pure) => {
  const idx = TIER_LADDER.indexOf(pure);
  if (idx < 0 || idx === TIER_LADDER.length - 1) return null;
  return TIER_LADDER[idx + 1];
};

/**
 * Región de metas del socio (T16): cadena `applicableRegion.value` (si el
 * wrapper la trae — en las 5 capturas UAT viene en
 * `memberProfileDetails.applicableRegion`) → mapa `countryOfResidence`→región
 * configurable (CF/sheet, default vacío) → **default 'EXCOL'** (conservador:
 * metas más altas; flag para el PO).
 * Semántica binaria: 'COL' literal → COL; cualquier otro valor no vacío → EXCOL.
 * @param {object|null} profileRaw respuesta cruda de `memberProfile`
 * @param {Object<string,string>} [countryRegionMap] código → 'COL'|'EXCOL'
 * @returns {('COL'|'EXCOL')}
 */
export const resolveRegion = (profileRaw, countryRegionMap = {}) => {
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

/** Meta efectiva para un tier destino y región. `null` si el tier no tiene
 * entrada en la tabla (ej. 'lifemiles' — no hay metas "para llegar a lifemiles")
 * o si la dimensión no existe (`magno.totales`). */
const goalFor = (goalsMap, tierKey, region) => {
  const entry = goalsMap?.[tierKey];
  if (!entry) return null;
  const pick = (dim) => {
    if (!dim) return null;
    const v = region === 'COL' ? dim.col : dim.row;
    return Number.isFinite(Number(v)) ? Number(v) : null;
  };
  return { total: pick(entry.totales), avianca: pick(entry.avianca) };
};

/**
 * Construye el VM del panel de progreso elite a partir de los raws + config.
 * Tolerancias (edge cases REALES de las capturas): `qualified` ausente o
 * métrica faltante → 0 · `expiryDate: ""` (string vacío) · tier desconocido →
 * base lifemiles + warn · raws null (wrapper caído) → VM en estado 0 sin romper.
 *
 * @param {{eliteRaw?:object|null, profileRaw?:object|null, config?:object|null}} args
 *   - eliteRaw: respuesta cruda de `eliteProgram`.
 *   - profileRaw: respuesta cruda de `memberProfile` (para la región T16).
 *   - config: config de Members (eliteGoalsV2/cenitConfig/eliteMetrics/
 *     countryRegionMap — defaults de código si faltan).
 * @returns {{
 *   tierBase:string, cenitLevel:(1|2|null), displayTier:string|null,
 *   year:number, maintainYear:number, region:('COL'|'EXCOL'),
 *   metrics:{totalYear:number, avYear:number, avLifetime:number},
 *   goals:{maintain:{total:number|null,avianca:number|null}|null,
 *          next:{tier:string,total:number|null,avianca:number|null}|null},
 *   cenit:{visible:boolean, version:('1m'|'2m'), goal:number, current:number},
 * }}
 */
export const buildEliteDetailVM = ({
  eliteRaw = null, profileRaw = null, config = null, sessionUser = null,
} = {}) => {
  // `sessionUser` (FIX UAT 1b, 2026-07-06): degradado correcto cuando los
  // wrappers no responden — el tier del VM de sesión (que SÍ tenemos) evita el
  // fallback mentiroso a lifemiles/Red Plus; el panel muestra la variante
  // correcta con métricas 0. Con raws presentes NO cambia nada.
  const goalsMap = config?.eliteGoalsV2 || mergeEliteGoalsV2(null);
  const cenitCfg = { ...DEFAULT_CENIT_CONFIG, ...(config?.cenitConfig || {}) };
  const metricsMap = { ...DEFAULT_ELITE_METRICS, ...(config?.eliteMetrics || {}) };
  const regionMap = config?.countryRegionMap || {};

  // --- Tier + variante Cenit (fuente = servicio, T5 v2). `status.current` es
  // la key canónica; `tier` display como fallback; perfil como último recurso
  // (y el tier del VM de sesión como degradado sin raws — FIX UAT 1b).
  const profileTier = profileRaw?.memberProfileDetails?.memberAccount?.tier || null;
  const userTier = sessionUser?.tier || null;
  const rawKey = eliteRaw?.status?.current || eliteRaw?.tier || profileTier || userTier || '';
  const tierBase = normalizeTierKey(rawKey);
  if (rawKey && tierBase === 'lifemiles' && !/lifemiles/i.test(String(rawKey))) {
    // Tier desconocido del servicio → base + log (§7.3). No rompe el panel.
    // eslint-disable-next-line no-console
    console.warn(`[members-elite] tier desconocido del servicio: "${rawKey}" → base lifemiles`);
  }
  const { level: cenitLevel } = deriveCenit({
    tierRaw: eliteRaw?.status?.current || eliteRaw?.tier
      || (!eliteRaw && !profileRaw ? userTier : null),
    cenitStatusRaw: eliteRaw?.status?.cenitStatus || null,
  });
  const displayTier = eliteRaw?.tier || profileTier || userTier || null;

  // --- Año del ciclo (T11): del servicio si lo manda; si no (las 5 capturas
  // NO traen `year`), año calendario EN CURSO (AC bloque 3: "Mi progreso Elite
  // [año en curso]"). `maintainYear` = año siguiente, para el hito "Mantener
  // {tier} en {year}" (tabla §B: "Mantener Red Plus en 2027").
  const year = Number(eliteRaw?.year ?? eliteRaw?.targetYear) || new Date().getFullYear();
  const maintainYear = year + 1;

  // --- Región de metas (T16).
  const region = resolveRegion(profileRaw, regionMap);

  // --- Métricas de `qualified[]` según el mapeo configurable. Ausente → 0.
  const byType = {};
  (Array.isArray(eliteRaw?.qualified) ? eliteRaw.qualified : []).forEach((q) => {
    if (q && q.type != null) byType[q.type] = Number(q.amount) || 0;
  });
  const metrics = {
    totalYear: byType[metricsMap.total] || 0,
    avYear: byType[metricsMap.avianca] || 0,
    avLifetime: byType[metricsMap.lifetime] || 0,
  };

  // --- Metas: mantener = metas del tier ACTUAL (tabla por tier destino);
  // siguiente = metas del próximo tier de la escalera. Cenit opera sobre el
  // tier base puro (las metas no distinguen -cenit). `ladder` = la escalera
  // completa region-resolved: la necesita la máquina de estados para la
  // RECALIBRACIÓN al sobrepasar metas (AC bloque 5) y para los hitos de la
  // "Vista completa" (todos los tiers con sus montos).
  const pure = pureTierBase(tierBase);
  const maintain = goalFor(goalsMap, pure, region);
  const nextKey = nextTierOf(pure);
  const nextGoals = nextKey ? goalFor(goalsMap, nextKey, region) : null;
  const next = nextGoals ? { tier: nextKey, ...nextGoals } : null;
  const ladder = TIER_LADDER.map((t) => ({
    tier: t,
    ...(goalFor(goalsMap, t, region) || { total: null, avianca: null }),
  }));

  // --- Panel Cenit (AC bloque 7): visible por umbral de millas avianca del año
  // (`historic`/`av-miles`, configurable), por tier Magno* o porque el SERVICIO
  // ya marca al socio como Cenit.
  const cenitVisible = metrics.avLifetime >= cenitCfg.visibleFrom
    || pure === 'magno'
    || (cenitLevel != null && cenitLevel >= 1);
  // La VERSIÓN (1M/2M) la manda el SERVICIO (`cenitStatus` → `cenitLevel`), NO la
  // métrica numérica. Verificado en QA vs LM (2026-07-15): Enrique reconocido
  // Cenit 1M (`cenitStatus:"Diamond Cenit One Million"` → level 1) → LM muestra
  // "of 2,000,000"; Fernanda Magno sin reconocimiento (`cenitStatus:"Magno"` →
  // level null) → LM "of 1,000,000". El wrapper NO expone millas vitalicias, así
  // que derivar la versión del número fallaba en ambos sentidos.
  const cenitVersion = (cenitLevel != null && cenitLevel >= 1) ? '2m' : '1m';
  // `oneGoal`/`twoGoal` se exponen además de `goal` porque la barra 2M arranca
  // en 1M ("la mitad ya completada", AC bloque 7) y ambos umbrales son
  // configurables por separado.
  const cenit = {
    visible: cenitVisible,
    version: cenitVersion,
    goal: cenitVersion === '1m' ? cenitCfg.oneGoal : cenitCfg.twoGoal,
    current: metrics.avLifetime,
    oneGoal: cenitCfg.oneGoal,
    twoGoal: cenitCfg.twoGoal,
  };

  return {
    tierBase,
    cenitLevel,
    displayTier,
    year,
    maintainYear,
    region,
    metrics,
    goals: { maintain, next, ladder },
    cenit,
  };
};
