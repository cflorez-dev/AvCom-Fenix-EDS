// members-activity.service.js — fuente de transacciones recientes para la card
// "Actividad de millas" del Dashboard (PBI 1263921, "Bloque 4", CA10).
//
// FUENTE REAL: wrapper Lifemiles `lmLastThreeTransactions` (Login Script v1.1.0,
// "Script Login Gestión de cambios V1.1.0 ES.pdf"). Params: { country (ISO2),
// language (2 letras), currency (3 letras) }. Devuelve las últimas 3
// transacciones del socio.
//
// ⚠️ El wrapper está DOCUMENTADO pero puede NO estar deployado todavía en el env
// (uat trae `lmRefreshSession` de v1.1.0 pero aún NO `lmLastThreeTransactions` →
// devuelve el string de error `E.EON.12`). Por eso el servicio es fail-soft: si el
// wrapper no responde un `Response` OK, cae a `MOCK_TRANSACTIONS`. En cuanto LM lo
// deploye, la card muestra data real sin tocar nada (solo confirmar el mapeo).
//
// Idiom (igual que members-config): getter SÍNCRONO para el first-paint
// (`getRecentTransactionsSync`, cache-or-mock) + loader ASYNC que puebla la cache
// desde el wrapper (`loadRecentTransactions`); el organism re-renderiza al resolver.
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

// Fallback cuando el wrapper no está disponible (data del Figma 518:25319).
const MOCK_TRANSACTIONS = [
  { date: '2026-12-30', description: 'Redención de tiquete', amount: -123090 },
  { date: '2026-12-30', description: 'Bono millas extra', amount: 400 },
  { date: '2026-12-30', description: 'Lifemiles Plus mensual', amount: 600 },
];

// `activityType` que representan REDENCIONES (monto negativo → rojo). LM devuelve
// `totalAmount` positivo + un `activityType`; acá marcamos cuáles RESTAN millas.
// ⚠️ PENDIENTE: confirmar con Lifemiles el catálogo completo de `activityType`
// (qué códigos son redenciones). Hasta entonces, sin match → se muestra como
// acumulación (+). Ver mensaje de seguimiento a LM.
const REDEMPTION_ACTIVITY_TYPES = new Set([
  // p.ej. 'STRED', 'REDEM', ... (completar cuando LM confirme el catálogo)
]);

// Cache de las transacciones REALES una vez cargadas (por sesión de página).
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

/** Mapea la respuesta de `lmLastThreeTransactions` al shape del molecule. */
const mapTransactions = (raw) => {
  const list = Array.isArray(raw?.transactions) ? raw.transactions : [];
  return list.map((t) => ({
    // `activityDate` (ISO) si viene → el molecule formatea "Dic 30, 2026";
    // si solo hay `date` pre-formateado ("JUN 08"), se muestra tal cual.
    date: t.activityDate || t.date || '',
    description: t.text || '',
    amount: signedAmount(t),
  }));
};

/**
 * Devuelve las últimas N transacciones del socio (síncrono, first-paint).
 * Retorna la cache real si ya se cargó; si no, el mock.
 * @param {number} [limit=3]
 * @returns {Array<{date:string, description:string, amount:number}>}
 */
export function getRecentTransactionsSync(limit = 3) {
  const source = Array.isArray(cache) ? cache : MOCK_TRANSACTIONS;
  return source.slice(0, Math.max(0, Number(limit) || 0));
}

/**
 * Carga async las transacciones reales vía el wrapper Lifemiles
 * `lmLastThreeTransactions`. Fail-soft: si el wrapper no está deployado (string
 * de error) o falla, cae al mock. Puebla la cache para el getter síncrono.
 * @param {number} [limit=3]
 * @returns {Promise<Array<{date:string, description:string, amount:number}>>}
 */
export async function loadRecentTransactions(limit = 3) {
  try {
    await whenLmReady('lmFetchWrapper');
    if (typeof window === 'undefined' || typeof window.lmFetchWrapper !== 'function') {
      return getRecentTransactionsSync(limit);
    }
    const res = await window.lmFetchWrapper('lmLastThreeTransactions', resolveParams(), false);
    // Wrapper NO deployado → devuelve string `E.EON.12` (no Response) → fallback.
    if (!(res instanceof Response) || !res.ok) return getRecentTransactionsSync(limit);
    const json = await res.json();
    const mapped = mapTransactions(json);
    if (mapped.length) cache = mapped;
    return getRecentTransactionsSync(limit);
  } catch (e) {
    return getRecentTransactionsSync(limit); // fail-soft → mock
  }
}

export default { getRecentTransactionsSync, loadRecentTransactions };
