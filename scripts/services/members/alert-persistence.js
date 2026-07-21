/**
 * Alert persistence — dismiss persistente + last-seen de las alertas de logro
 * del tab Progreso elite (1271699 paso 13, decisión T10).
 *
 * Keys de localStorage:
 *  - Dismiss:   `av-elite-alert:{tipo}:{hito}:{año}[:{member}]` → '1'.
 *  - Last-seen: `av-elite-last-tier[:{member}]` / `av-elite-last-cenit[:{member}]`.
 *
 * El `member` (membershipNumber) escopa las keys por cuenta (§7.3: usuario que
 * cambia de cuenta en la misma máquina no hereda last-seen ajeno). El flag
 * `persist` (config `eliteProgress.alertsPersistDismiss`, T10) gatea la
 * ESCRITURA del dismiss: con `persist:false` el dismiss es solo de la sesión
 * de render (estado del componente) y la alerta reaparece en la próxima visita.
 *
 * localStorage inaccesible (Safari private / storage lleno) → fail-open SIN
 * crash: las alertas se muestran siempre y los detect* no disparan (§7.3).
 */

const DISMISS_PREFIX = 'av-elite-alert:';
const LAST_TIER_KEY = 'av-elite-last-tier';
const LAST_CENIT_KEY = 'av-elite-last-cenit';

const scoped = (base, member) => (member ? `${base}:${member}` : base);

const safeGet = (key) => {
  try { return window.localStorage.getItem(key); } catch (e) { return null; }
};
const safeSet = (key, value) => {
  try { window.localStorage.setItem(key, value); } catch (e) { /* fail-open */ }
};

/**
 * ¿La alerta debe mostrarse? — true salvo dismiss PERSISTIDO previo.
 * @param {string} key  key de la alerta (`{tipo}:{hito}:{año}` — modelo de
 *   `buildPanelModel().alerts[]`).
 * @param {{persist?:boolean, member?:string}} [opts]
 * @returns {boolean}
 */
export const shouldShowAlert = (key, { persist = true, member = '' } = {}) => {
  if (!key) return false;
  if (!persist) return true; // flag off → nunca se persiste → siempre visible
  return safeGet(scoped(`${DISMISS_PREFIX}${key}`, member)) == null;
};

/**
 * Persiste el dismiss de una alerta (X de cierre). Con `persist:false` es
 * no-op (T10: comportamiento configurable por si el PO lo quiere cambiar).
 * @param {string} key
 * @param {{persist?:boolean, member?:string}} [opts]
 */
export const dismissAlert = (key, { persist = true, member = '' } = {}) => {
  if (!key || !persist) return;
  safeSet(scoped(`${DISMISS_PREFIX}${key}`, member), '1');
};

/**
 * Detecta el CAMBIO de tier contra el último visto (dispara la alerta de
 * logro de estatus) y actualiza el last-seen. Primera visita (sin last-seen)
 * → false (baseline, no hay "cambio" que celebrar).
 * @param {string} currentTier  tierBase actual (VM).
 * @param {{member?:string}} [opts]
 * @returns {boolean} true si el tier CAMBIÓ desde la última visita.
 */
export const detectTierChange = (currentTier, { member = '' } = {}) => {
  if (!currentTier) return false;
  const key = scoped(LAST_TIER_KEY, member);
  const last = safeGet(key);
  safeSet(key, String(currentTier));
  return last != null && last !== String(currentTier);
};

/**
 * Detecta el CRUCE de umbrales Cenit (1M/2M) de las millas avianca vitalicias
 * contra el último valor visto, y actualiza el last-seen. Primera visita →
 * baseline sin cruces.
 * @param {number} avLifetime  millas avianca vitalicias actuales (`avstar`).
 * @param {{oneGoal?:number, twoGoal?:number}} [goals]  umbrales (config Cenit).
 * @param {{member?:string}} [opts]
 * @returns {{crossed1M:boolean, crossed2M:boolean}}
 */
export const detectCenitCross = (avLifetime, goals = {}, { member = '' } = {}) => {
  const current = Number(avLifetime) || 0;
  const oneGoal = Number(goals.oneGoal) || 1000000;
  const twoGoal = Number(goals.twoGoal) || 2000000;
  const key = scoped(LAST_CENIT_KEY, member);
  const lastRaw = safeGet(key);
  safeSet(key, String(current));
  if (lastRaw == null) return { crossed1M: false, crossed2M: false };
  const last = Number(lastRaw) || 0;
  return {
    crossed1M: last < oneGoal && current >= oneGoal,
    crossed2M: last < twoGoal && current >= twoGoal,
  };
};
