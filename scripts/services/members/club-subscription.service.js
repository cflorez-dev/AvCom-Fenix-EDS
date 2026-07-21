import { whenLmReady } from './lm-script.loader.js';
import {
  getStoredLanguage,
  getStoredCountry,
  getStoredCurrency,
  normalizeToIsoCountry,
} from '../header/language-country-selector.js';

/**
 * Club subscription service — estado Lifemiles Plus del socio (1271694,
 * respuesta P1: prioridad AC-estricto con gates tolerantes).
 *
 * FUENTE REAL: wrapper `lmClubSubscription` (contrato CAPTURADO en UAT,
 * capturas 2026-07-03): `activeSuscriptions: [{planName, price, idSuscription,
 * isNewPlan, isPlanPlus, planId, hasPendingCharge}]` + `plans: [{idPlan, name,
 * planOrder, monthlyMiles, anualMiles, pricePerMonth,
 * promotion{discount,priceWithDiscount}, subscribed}]`. Sin plan →
 * `activeSuscriptions: []` (confirmado en 4 de las 5 cuentas UAT).
 *
 * ⚠️ El wrapper NO existe en el script de PROD (gate go-live del lote) →
 * mismo criterio fail-soft de members-activity.service: string `E.EON.*` /
 * no-Response / error ⇒ `state: 'unavailable'` y la sección LM+ entera NO se
 * renderiza (no podemos afirmar "sin plan" sin dato).
 *
 * VARIANTE SUSPENDIDA (GATEADA): la UI existe (diseño §D) pero solo se
 * muestra si `deriveSubscriptionState` ve un indicador EXPLÍCITO de
 * suspensión en la respuesta — campo aún NO observado en el contrato real.
 * Con entrada activa el default es 'active'.
 * // TODO(LM): representación de suscripción suspendida en lmClubSubscription
 * // (¿hasPendingCharge? ¿status?) — consulta §3 de verificacion-wrappers.md.
 */

/** Resuelve los params del wrapper desde el POS/locale del sitio. */
const resolveParams = () => {
  const language = String(getStoredLanguage() || 'es').toLowerCase().slice(0, 2);
  const currency = String(getStoredCurrency() || 'COP').toUpperCase();
  let country = getStoredCountry() || '';
  try { country = normalizeToIsoCountry(country) || country; } catch (e) { /* fallback abajo */ }
  country = String(country).toUpperCase().slice(0, 2) || 'CO';
  return { country, language, currency };
};

const UNAVAILABLE_VM = {
  state: 'unavailable', plan: null, upsell: null, plans: [],
};

/**
 * Estado de la suscripción activa. 'suspended' SOLO ante un indicador
 * EXPLÍCITO (`status`/`state`/`suspended` con semántica de suspensión) —
 * campo no observado aún en el contrato real; default 'active'.
 * @param {object} active entrada de `activeSuscriptions[0]`
 * @returns {('active'|'suspended')}
 */
export const deriveSubscriptionState = (active) => {
  const status = String(active?.status ?? active?.state ?? '').toLowerCase();
  if (active?.suspended === true || status.includes('suspend')) return 'suspended';
  // TODO(LM): confirmar el campo real de suspensión (consulta §3).
  return 'active';
};

/** Proyecta la respuesta cruda del wrapper al VM de la sección LM+. */
export const toClubSubscriptionVM = (raw) => {
  if (!raw || typeof raw !== 'object') return { ...UNAVAILABLE_VM };
  const active = Array.isArray(raw.activeSuscriptions) ? raw.activeSuscriptions : null;
  if (!active) return { ...UNAVAILABLE_VM }; // shape malformado → sin datos
  const plans = Array.isArray(raw.plans) ? raw.plans : [];

  if (active.length === 0) {
    return {
      state: 'none', plan: null, upsell: null, plans,
    };
  }

  const current = active[0];
  // Millas/mes desde el catálogo `plans[]` matcheando el planId activo. El
  // contrato REAL (gold: planId "33" vs idPlan 29/38/39/40) puede NO matchear
  // → monthlyMiles null (la card oculta la línea, §7.3) y sin upsell.
  const match = plans.find((p) => String(p?.idPlan ?? p?.id ?? '') === String(current?.planId ?? ''));
  const plan = {
    name: String(current?.planName || (match && match.name) || ''),
    monthlyMiles: match && Number.isFinite(Number(match.monthlyMiles))
      ? Number(match.monthlyMiles)
      : null,
    planId: String(current?.planId ?? ''),
  };

  // Upsell = plan del SIGUIENTE planOrder con su pricePerMonth (franja
  // "Obtén más beneficios con el {plan} por solo {price} adicional").
  let upsell = null;
  if (match && Number.isFinite(Number(match.planOrder))) {
    const next = plans.find((p) => Number(p?.planOrder) === Number(match.planOrder) + 1);
    if (next) {
      const price = Number(next?.promotion?.priceWithDiscount ?? next?.pricePerMonth);
      upsell = {
        name: String(next.name || ''),
        priceDelta: Number.isFinite(price) ? price : null,
      };
    }
  }

  return {
    state: deriveSubscriptionState(current), plan, upsell, plans,
  };
};

/**
 * Carga el estado LM+ vía `lmClubSubscription` (patrón fail-soft del activity
 * service): wrapper ausente/no deployado/error → `state: 'unavailable'`.
 * @returns {Promise<{state:('active'|'none'|'suspended'|'unavailable'),
 *   plan:{name:string, monthlyMiles:number|null, planId:string}|null,
 *   upsell:{name:string, priceDelta:number|null}|null, plans:object[]}>}
 */
export async function loadClubSubscription(wrapperFn = null) {
  // `wrapperFn` (SOLO samples/tests): reemplaza al global `lmFetchWrapper` para
  // inyectar fixtures sin depender del loader real de LM (fix e2e 2026-07-05).
  try {
    if (!wrapperFn) await whenLmReady('lmFetchWrapper');
    const fn = wrapperFn
      || (typeof window !== 'undefined' ? window.lmFetchWrapper : null);
    if (typeof fn !== 'function') {
      return { ...UNAVAILABLE_VM };
    }
    const res = await fn('lmClubSubscription', resolveParams(), false);
    // Wrapper NO deployado → devuelve string `E.EON.*` (no Response) → sin datos.
    if (!(res instanceof Response) || !res.ok) return { ...UNAVAILABLE_VM };
    const json = await res.json();
    return toClubSubscriptionVM(json);
  } catch (e) {
    return { ...UNAVAILABLE_VM }; // fail-soft
  }
}

export default { loadClubSubscription, toClubSubscriptionVM, deriveSubscriptionState };
