// members-activity.service.js — fuente de transacciones recientes para la card
// "Actividad de millas" del Dashboard (PBI 1263921, "Bloque 4", CA10).
//
// FUENTE: wrapper Lifemiles `lmLastThreeTransactions` (Login Script v1.1.0).
// Params: { country (ISO2), language (2 letras), currency (3 letras) }.
//
// DISEÑO "petición primero": UNA sola petición al montar (sin poll ni mock).
// El wrapper resuelve su propio ciclo de auth internamente (token expirado →
// auto-refresh → retry, verificado en vivo: con sesión coherente devuelve
// `REAL(200)` incluso con el access_token vencido — vive 300s). Estados:
//   - data válida → se cachea y la card muestra la lista REAL.
//   - sin data (wrapper no deployado `E.EON.12`, refresh fallido `E.EON.13`,
//     cookies no listas `null`, throw) → `null` → la card degrada a nav card
//     estándar (SIN lista). Nunca se muestran transacciones falsas.
// Verificado contra el bundle de LM (92.8KB): no emite eventos ni expone flag de
// readiness — no hay nada a qué suscribirse, por eso el gate es por request.
//
// Shape de una transacción (contrato del molecule `members-activity-card`):
//   - `date`: ISO string / Date / string pre-formateado — el molecule lo formatea.
//   - `description`: string (texto crudo, sin HTML).
//   - `amount`: number con SIGNO (negativo = redención → rojo; positivo = acumulación → verde).

import { whenLmReady } from './lm-script.loader.js';
import {
  getStoredLanguage,
  getStoredCountry,
  getStoredCurrency,
  normalizeToIsoCountry,
} from '../header/language-country-selector.js';

// `activityType` que representan REDENCIONES (monto negativo → rojo). LM devuelve
// `totalAmount` positivo + un `activityType`; acá marcamos cuáles RESTAN millas.
// ⚠️ PENDIENTE: confirmar con Lifemiles el catálogo completo de `activityType`
// (qué códigos son redenciones). Hasta entonces, sin match → se muestra como
// acumulación (+). Ver mensaje de seguimiento a LM.
const REDEMPTION_ACTIVITY_TYPES = new Set([
  // p.ej. 'STRED', 'REDEM', ... (completar cuando LM confirme el catálogo)
]);

// Cache de las transacciones REALES una vez cargadas (por sesión de página).
// `null` = aún no hay data confirmada (cargando o falló) — NUNCA data inventada.
let cache = null;

/** Resuelve los params del wrapper desde el POS/locale del sitio. */
const resolveParams = () => {
  const language = String(getStoredLanguage() || 'es').toLowerCase().slice(0, 2);
  const currency = String(getStoredCurrency() || 'COP').toUpperCase();
  let country = getStoredCountry() || '';
  try { country = normalizeToIsoCountry(country) || country; } catch (e) { /* fallback abajo */ }
  country = String(country).toUpperCase().slice(0, 2) || 'CO';
  return { country, language, currency };
};

/** Deriva el monto CON SIGNO (LM manda `totalAmount` positivo). */
const signedAmount = (t) => {
  const n = Math.abs(Number(t.totalAmount) || 0);
  const type = t.activityType ? String(t.activityType).toUpperCase() : '';
  return REDEMPTION_ACTIVITY_TYPES.has(type) ? -n : n;
};

// Extrae la lista de transacciones. El wrapper la anida en
// `activityHistory.transactions` (contrato real verificado en qa); se acepta
// también `transactions` plano por compatibilidad con versiones previas.
const pickTransactions = (raw) => {
  if (Array.isArray(raw?.activityHistory?.transactions)) return raw.activityHistory.transactions;
  if (Array.isArray(raw?.transactions)) return raw.transactions;
  return [];
};

// LM incrusta la fecha al final del `text` ("… - 03-Jul-2026"). Como la card ya
// muestra la fecha en su propia línea (campo `date`), la sacamos del texto para no
// duplicarla. Solo quita un sufijo con forma de fecha `- DD-Mmm-YYYY`; si el texto
// no la trae, lo deja igual (no toca guiones legítimos como "Transferencia - regalo").
const stripTrailingDate = (text) => String(text || '')
  .replace(/\s*-\s*\d{1,2}-[A-Za-zÀ-ÿ]{3,}-\d{4}\s*$/, '')
  .trim();

/** Mapea la respuesta de `lmLastThreeTransactions` al shape del molecule. */
const mapTransactions = (raw) => pickTransactions(raw).map((t) => ({
  // `activityDate` (ISO) si viene → el molecule formatea "Dic 30, 2026";
  // si solo hay `date` pre-formateado ("JUN 08"), se muestra tal cual.
  date: t.activityDate || t.date || '',
  description: stripTrailingDate(t.text),
  amount: signedAmount(t),
}));

/**
 * Devuelve las últimas N transacciones REALES del socio (síncrono) o `null` si
 * todavía no hay data confirmada. `[]` = data confirmada pero sin transacciones
 * (socio nuevo) → la card muestra el `emptyLabel`.
 * @param {number} [limit=3]
 * @returns {Array<{date:string, description:string, amount:number}>|null}
 */
export function getRecentTransactionsSync(limit = 3) {
  if (!Array.isArray(cache)) return null;
  return cache.slice(0, Math.max(0, Number(limit) || 0));
}

/**
 * UNA invocación de `lmLastThreeTransactions`. `ready` solo con data válida
 * (`Response.ok` u objeto plano — aunque venga sin transacciones). Cualquier
 * error (string `E.EON.*`, `null`, `Response` non-ok, throw) → `{ready:false}`.
 * @returns {Promise<{ready: boolean, json?: object}>}
 */
const fetchWrapperOnce = async () => {
  if (typeof window === 'undefined' || typeof window.lmFetchWrapper !== 'function') {
    return { ready: false };
  }
  try {
    const res = await window.lmFetchWrapper('lmLastThreeTransactions', resolveParams(), false);
    if (res instanceof Response) {
      return res.ok ? { ready: true, json: await res.json() } : { ready: false };
    }
    // Objeto plano = JSON ya resuelto (caso real en qa). String `E.EON.*` /
    // `null` / otro = sin data.
    if (res && typeof res === 'object') return { ready: true, json: res };
    return { ready: false };
  } catch (e) {
    return { ready: false };
  }
};

/**
 * Carga las transacciones reales vía el wrapper Lifemiles: UNA petición al
 * resolverse `lmFetchWrapper` (evento-driven, sin poll). El wrapper maneja su
 * auth internamente (auto-refresh). Resultado:
 *   - `Array` (puede ser `[]`) → data CONFIRMADA, cacheada para el getter síncrono.
 *   - `null` → sin data (no deployado / auth rota / LM caído) → la card NO
 *     muestra lista (nav card estándar). Nunca mock.
 * @param {number} [limit=3]
 * @returns {Promise<Array<{date:string, description:string, amount:number}>|null>}
 */
export async function loadRecentTransactions(limit = 3) {
  try {
    await whenLmReady('lmFetchWrapper');
    const { ready, json } = await fetchWrapperOnce();
    if (ready) cache = mapTransactions(json);
    return getRecentTransactionsSync(limit);
  } catch (e) {
    return getRecentTransactionsSync(limit); // fail-soft → null (sin lista)
  }
}

export default { getRecentTransactionsSync, loadRecentTransactions };
