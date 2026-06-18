/**
 * Umbrella POS Sub-resolution Service
 *
 * Implements PBI 1216373 rule 3.3 generalized: when a URL poscode matches an
 * "umbrella POS" (a POS that groups multiple countries), the final POS is NOT
 * immediate — instead, geo determines the final POS based on the user's
 * location within that umbrella.
 *
 * Today only `EU` is used as an umbrella. The design supports adding more
 * umbrellas in the future (LATAM, APAC, NA, etc.) without code changes —
 * just add rows to the AEM sheet with the new `umbrellaPos`.
 *
 * Data source — 2-level cascade:
 *   1. AEM spreadsheet `/geo-umbrella-pos-subresolution.json` (source of truth,
 *      administrable by content authors without requiring a deploy)
 *   2. Minimal inline fallback (2 rows: `_DEFAULT_` + `_FALLBACK_` for EU)
 *      so the service never throws even if AEM is unavailable
 *
 * Expected spreadsheet columns:
 *   umbrellaPos, geoCountry, posResuelto, idioma, moneda, ato, active
 *
 * Special row keys per umbrella:
 *   `_DEFAULT_`  → used when geo is unavailable
 *   `_FALLBACK_` → used when geo resolves a country not in the umbrella's rows
 *
 * Example rows:
 *   EU, FR, FR, fr, EUR, CDG, true          (France escapes EU umbrella)
 *   EU, ES, EU, es, EUR, MAD, true          (Spain stays in EU)
 *   EU, DE, EU, en, EUR, MAD, true          (Germany → EU)
 *   EU, _DEFAULT_, EU, es, EUR, MAD, true   (no geo → EU default)
 *   EU, _FALLBACK_, OTHERS, en, USD, MIA, true  (Asia/Africa → OTHERS)
 */

import { fetchAEMData } from '../../utils/aem-data.js';

const AEM_ENDPOINT = 'geo-umbrella-pos-subresolution';
const DEFAULT_ROW_KEY = '_DEFAULT_';
const FALLBACK_ROW_KEY = '_FALLBACK_';

/**
 * @typedef {object} UmbrellaResolution
 * @property {string} pos        POS code (FR, EU, OTHERS, etc.)
 * @property {string} idioma     language code (fr, es, en)
 * @property {string} moneda     currency code (EUR, USD)
 * @property {string} ato        ATO IATA code (CDG, MAD, MIA)
 * @property {string} geoCountry source row's geoCountry value (debugging)
 * @property {string} umbrellaPos source row's umbrellaPos value
 */

/**
 * Minimal last-resort fallback (level 2 in the cascade).
 * Keeps only EU umbrella `_DEFAULT_` + `_FALLBACK_` so EU flow never breaks
 * even if AEM is unreachable. Other umbrellas (if added in the future)
 * depend on AEM being available; until then they fall to OTHERS.
 */
const MINIMAL_FALLBACK = [
  {
    umbrellaPos: 'EU', geoCountry: '_DEFAULT_', posResuelto: 'EU', idioma: 'es', moneda: 'EUR', ato: 'MAD', active: 'true',
  },
  {
    umbrellaPos: 'EU', geoCountry: '_FALLBACK_', posResuelto: 'OTHERS', idioma: 'en', moneda: 'USD', ato: 'MIA', active: 'true',
  },
];

function isActive(row) {
  return String(row?.active ?? 'true').toLowerCase() === 'true';
}

/**
 * Load the full umbrella sub-resolution table with 2-level cascade:
 * AEM → MINIMAL_FALLBACK.
 * @returns {Promise<Array>}
 */
async function loadSubresolutionTable() {
  try {
    const result = await fetchAEMData(AEM_ENDPOINT);
    const rows = Array.isArray(result?.data) ? result.data : [];
    const active = rows.filter(isActive);
    if (active.length > 0) return active;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[umbrella-pos-subresolution.service] AEM fetch failed, using minimal fallback:', error);
  }
  return MINIMAL_FALLBACK;
}

/**
 * Filter rows for a specific umbrella POS.
 * @param {Array} rows
 * @param {string} umbrellaPos
 * @returns {Array}
 */
function filterByUmbrella(rows, umbrellaPos) {
  const target = String(umbrellaPos || '').toUpperCase();
  return rows.filter(
    (r) => String(r?.umbrellaPos || '').toUpperCase() === target,
  );
}

function findRow(rows, geoCountry) {
  if (!geoCountry) return null;
  const target = String(geoCountry).toUpperCase();
  return rows.find(
    (r) => String(r?.geoCountry || '').toUpperCase() === target,
  ) || null;
}

function normalizeRow(row) {
  return {
    pos: String(row.posResuelto || 'OTHERS').toUpperCase(),
    idioma: String(row.idioma || 'en').toLowerCase(),
    moneda: String(row.moneda || 'USD').toUpperCase(),
    ato: String(row.ato || 'MIA').toUpperCase(),
    geoCountry: String(row.geoCountry || ''),
    umbrellaPos: String(row.umbrellaPos || ''),
  };
}

/**
 * Resolve the sub-resolution for an umbrella POS given the user's geo country.
 *
 * Example for EU umbrella:
 *   - `('EU', 'FR')` → POS=FR, lang=fr, EUR, CDG  (France escapes umbrella)
 *   - `('EU', 'ES')` → POS=EU, lang=es, EUR, MAD
 *   - `('EU', 'DE')` → POS=EU, lang=en, EUR, MAD
 *   - `('EU', null)` → `_DEFAULT_` → POS=EU, lang=es, EUR, MAD
 *   - `('EU', 'JP')` → `_FALLBACK_` → POS=OTHERS, lang=en, USD, MIA
 *
 * @param {string} umbrellaPos The umbrella POS from URL (e.g. 'EU', 'LATAM')
 * @param {string|null|undefined} geoCountry ISO country from triangulation
 * @returns {Promise<UmbrellaResolution>}
 */
export async function resolveUmbrellaPosSubresolution(umbrellaPos, geoCountry) {
  const allRows = await loadSubresolutionTable();
  let rows = filterByUmbrella(allRows, umbrellaPos);

  // If AEM has no rows for this umbrella, fall back to MINIMAL (which covers EU)
  if (rows.length === 0) {
    rows = filterByUmbrella(MINIMAL_FALLBACK, umbrellaPos);
  }

  if (!geoCountry) {
    const row = findRow(rows, DEFAULT_ROW_KEY)
      || findRow(filterByUmbrella(MINIMAL_FALLBACK, umbrellaPos), DEFAULT_ROW_KEY);
    return normalizeRow(row || MINIMAL_FALLBACK[0]);
  }

  const match = findRow(rows, geoCountry);
  if (match) return normalizeRow(match);

  const fallback = findRow(rows, FALLBACK_ROW_KEY)
    || findRow(filterByUmbrella(MINIMAL_FALLBACK, umbrellaPos), FALLBACK_ROW_KEY);
  return normalizeRow(fallback || MINIMAL_FALLBACK[1]);
}

/**
 * Check if a given POS has sub-resolution rows defined (either in AEM or the
 * minimal fallback). Used by the orchestrator to decide whether to trigger
 * the sub-resolution flow for a URL poscode.
 *
 * @param {string} pos POS code to check (e.g. 'EU', 'LATAM')
 * @returns {Promise<boolean>}
 */
export async function hasUmbrellaSubresolution(pos) {
  if (!pos) return false;
  const rows = await loadSubresolutionTable();
  return filterByUmbrella(rows, pos).length > 0
    || filterByUmbrella(MINIMAL_FALLBACK, pos).length > 0;
}

export default resolveUmbrellaPosSubresolution;
