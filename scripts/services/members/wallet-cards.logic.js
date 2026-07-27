import { whenLmReady } from './lm-script.loader.js';
import {
  getStoredLanguage,
  getStoredCountry,
  getStoredCurrency,
  normalizeToIsoCountry,
} from '../header/language-country-selector.js';

/**
 * Wallet cards logic — tarjetas guardadas del socio (1279362, módulo "Métodos de
 * pago"). READ-ONLY: POST-PCI (R5/D28) no hay CRUD; solo se listan las tarjetas
 * que ya tiene el socio (la gestión es un redirect externo a LM).
 *
 * FUENTE REAL: wrapper `lmUserPaymentMethods` (shape del Login Script 1.2.0:
 * `cardType: "VISA"`, `cardCode: "VI"`, número enmascarado, moneda opcional, y
 * marca cobrand `isLifemiles`/`cobCodSoc`). SIEMPRE datos reales — con el wrapper
 * caído el módulo se OCULTA (no mostramos mock ni "sin tarjetas" sin dato).
 * Mismo criterio fail-soft que club-subscription.service.
 *
 * ⚠️ Moneda: `currency` es condicional (consulta LM #4) — sin dato, la línea no
 * se renderiza (respuesta P3).
 */

/** cardCode del wrapper → key de ícono de red (5 redes del diseño §C). */
export const NETWORK_MAP = {
  VI: 'visa',
  MC: 'mastercard',
  AX: 'amex',
  DS: 'discover',
  DN: 'diners',
};

/** Label humano por red (fallback del placeholder cuando no hay SVG). */
export const NETWORK_LABELS = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  discover: 'Discover',
  diners: 'Diners Club',
};

/**
 * Resuelve la key de red desde `cardCode` (mapa) con fallback a `cardType`
 * (lowercased, sin no-alfabéticos). Sin nada → 'card' (placeholder genérico).
 * @param {string} cardCode p.ej. "VI"
 * @param {string} cardType p.ej. "VISA"
 * @returns {string}
 */
export const mapNetworkKey = (cardCode, cardType) => {
  const byCode = NETWORK_MAP[String(cardCode || '').toUpperCase()];
  if (byCode) return byCode;
  const byType = String(cardType || '').toLowerCase().replace(/[^a-z]/g, '');
  return byType || 'card';
};

/** Label de red visible: mapa por key → nombre del contrato → key capitalizada. */
export const networkLabelOf = (networkKey, cardType) => NETWORK_LABELS[networkKey]
  || (cardType ? String(cardType) : '')
  || (networkKey ? networkKey.charAt(0).toUpperCase() + networkKey.slice(1) : '');

/**
 * Normaliza cualquier representación del número a `•••• XXXX` (solo últimos 4).
 * Sin dígitos → cadena original recortada (o '').
 * @param {string} raw
 * @returns {string}
 */
export const maskCardNumber = (raw) => {
  const str = String(raw || '');
  const digits = str.replace(/\D/g, '');
  if (digits.length >= 4) return `•••• ${digits.slice(-4)}`;
  return str.trim();
};

/**
 * Proyecta la respuesta cruda del wrapper al VM del módulo de tarjetas.
 * Shape malformado (sin array de tarjetas) → unavailable (no podemos afirmar
 * "sin tarjetas" sin un array explícito).
 * @param {object|null} raw
 * @returns {{state:('ready'|'unavailable'),
 *   cards:{networkKey:string,networkLabel:string,maskedNumber:string,
 *          currency:string|null,isCobrand:boolean}[]}}
 */
export const toWalletCardsVM = (raw) => {
  if (!raw || typeof raw !== 'object') return { state: 'unavailable', cards: [] };
  const list = Array.isArray(raw) ? raw
    : (Array.isArray(raw.paymentMethods) && raw.paymentMethods)
    || (Array.isArray(raw.cards) && raw.cards)
    || (Array.isArray(raw.creditCards) && raw.creditCards)
    || null;
  if (!list) return { state: 'unavailable', cards: [] };
  const cards = list
    .filter((c) => c && typeof c === 'object')
    .map((c) => {
      const networkKey = mapNetworkKey(c.cardCode, c.cardType);
      const isCobrand = c.isLifemiles === true
        || (c.cobCodSoc != null && String(c.cobCodSoc) !== '');
      return {
        networkKey,
        networkLabel: networkLabelOf(networkKey, c.cardType),
        maskedNumber: maskCardNumber(c.maskedNumber ?? c.cardNumber ?? c.number ?? c.last4),
        currency: c.currency ? String(c.currency) : null,
        isCobrand,
      };
    });
  return { state: 'ready', cards };
};

/** Resuelve los params del wrapper desde el POS/locale del sitio. */
const resolveParams = () => {
  const language = String(getStoredLanguage() || 'es').toLowerCase().slice(0, 2);
  const currency = String(getStoredCurrency() || 'COP').toUpperCase();
  let country = getStoredCountry() || '';
  try { country = normalizeToIsoCountry(country) || country; } catch (e) { /* fallback abajo */ }
  country = String(country).toUpperCase().slice(0, 2) || 'CO';
  return { country, language, currency };
};

/**
 * Carga las tarjetas guardadas vía `lmUserPaymentMethods` (fail-soft: wrapper
 * ausente/no deployado/error → `unavailable`, el módulo se oculta).
 * @param {Function} [wrapperFn] override de `window.lmFetchWrapper` (tests/samples).
 * @returns {Promise<{state:('ready'|'unavailable'), cards:object[]}>}
 */
export async function loadWalletCards(wrapperFn = null) {
  try {
    if (!wrapperFn) await whenLmReady('lmFetchWrapper');
    const fn = wrapperFn
      || (typeof window !== 'undefined' ? window.lmFetchWrapper : null);
    if (typeof fn !== 'function') return { state: 'unavailable', cards: [] };
    // `refreshLoginFlag = false`: llamada background, sin redirect de re-auth.
    const res = await fn('lmUserPaymentMethods', resolveParams(), false);
    if (!(res instanceof Response) || !res.ok) return { state: 'unavailable', cards: [] };
    const json = await res.json();
    return toWalletCardsVM(json);
  } catch (e) {
    return { state: 'unavailable', cards: [] }; // fail-soft
  }
}

export default {
  loadWalletCards, toWalletCardsVM, mapNetworkKey, maskCardNumber,
};
