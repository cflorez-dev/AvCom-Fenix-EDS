/**
 * Triangulation Service
 *
 * Level 2 of POS resolution (PBI 1216373). Flujo:
 *   1. Determinar país/POS del usuario: Haversine contra ConsultaCombinabilidad
 *      (573 aeropuertos Avianca-operados con lat/lng). El país del aeropuerto
 *      más cercano se asume como el país del usuario (no hay reverse geocoding
 *      disponible en el proyecto).
 *   2. Determinar ATO (aeropuerto origen) — 3 niveles:
 *      a. Si POS es EU/OTHERS → ATO fijo (MAD/MIA respectivamente).
 *      b. Si POS es un país operado por Avianca (22 países del Master) →
 *         cruzar lat/lng con spreadsheet `geo-master` para obtener el IATA
 *         según reglas de negocio (PBI CU-186, referencia Master XLSX).
 *      c. Fallback: iataCityCode del aeropuerto más cercano (compat. anterior).
 *
 * Data sources:
 *   - ConsultaCombinabilidad (POST AV_BOOKINGBOX_ENDPOINT): catálogo de airports
 *     para determinar país por Haversine.
 *   - `geo-pos-mapping` spreadsheet AEM: mapeo country ISO → POS.
 *   - `geo-master` spreadsheet AEM: 457 capitales con lat/lng → IATA (regla PBI
 *     CU-186). Cubre 22 países donde opera Avianca.
 *
 * Reglas PBI fijas (en código):
 *   - EU → ATO MAD
 *   - OTHERS → ATO MIA
 *   - UK + cityCode LON → ATO LHR
 */

import { fetchAEMData } from '../../utils/aem-data.js';
import { calculateDistance } from '../../utils/haversine.helper.js';
import { isApimDirectMode } from '../apim/apim-mode.js';
import { consultaCombinabilidad } from '../apim/apim-client.service.js';
import { fetchAirportsRawProxy } from './triangulation.proxy.service.js';

const AIRPORTS_CACHE_KEY = 'airports-catalog';
const MASTER_CACHE_KEY = 'geo-master-catalog';
const DEFAULT_LANGUAGE = 'es';

const POS_MAPPING_ENDPOINT = 'geo-pos-mapping';
const POS_MAPPING_FALLBACK_KEY = '_FALLBACK_';
const MASTER_ENDPOINT = 'geo-master';

/**
 * País del Master (columna `pais`) → POS. El Master cubre 22 países
 * operados por Avianca. Se usa para filtrar las capitales del Master al
 * mismo POS del usuario antes del Haversine de ATO refinement.
 */
const MASTER_COUNTRY_TO_POS = {
  Colombia: 'CO',
  Ecuador: 'EC',
  Argentina: 'AR',
  Uruguay: 'UY',
  Paraguay: 'PY',
  Brasil: 'BR',
  Chile: 'CL',
  Perú: 'PE',
  Bolivia: 'BO',
  'Estados Unidos': 'US',
  'EE.UU.': 'US',
  México: 'MX',
  Canadá: 'CA',
  'República Dominicana': 'DO',
  'Rep. Dominicana': 'DO',
  España: 'ES',
  Francia: 'FR',
  'Reino Unido': 'UK',
  'El Salvador': 'SV',
  Nicaragua: 'NI',
  Panamá: 'PA',
  'Costa Rica': 'CR',
  Honduras: 'HN',
  Guatemala: 'GT',
};

/**
 * Minimal last-resort fallback if AEM sheet AND local mock both fail.
 * Only guarantees the service doesn't crash — every country maps to OTHERS.
 */
const MINIMAL_POS_MAPPING = [
  { isoCountryCode: '_FALLBACK_', posResuelto: 'OTHERS', active: 'true' },
];

/**
 * POS codes that do NOT use the nearest airport's cityCode as ATO —
 * they have a fixed ATO regardless of user location. Kept in code because
 * they are 2 fixed PBI rules, not administrable data.
 */
const FIXED_ATO_BY_POS = {
  EU: 'MAD',
  OTHERS: 'MIA',
};

// Module-level cache for the POS mapping — loaded once per session.
let posMappingCache = null;
let masterCatalogCache = null;

function readCatalogCache() {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(AIRPORTS_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[triangulation.service] catalog cache read failed:', error);
    return null;
  }
}

function writeCatalogCache(airports) {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(AIRPORTS_CACHE_KEY, JSON.stringify(airports));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[triangulation.service] catalog cache write failed:', error);
  }
}

/**
 * Direct APIM path: call APIM and return the raw airports array.
 * Empty array on failure (caller falls back gracefully via cache).
 */
async function fetchAirportsRawDirect({ language }) {
  try {
    const data = await consultaCombinabilidad({
      idioma: language,
      codigoIataOrigen: '',
      codigoIataDestino: '',
    });
    return (Array.isArray(data) && data) || data?.data || [];
  } catch (error) {
    console.warn('[triangulation.service] catalog fetch failed (APIM direct):', error);
    return [];
  }
}

/**
 * Normalize a raw airport from the endpoint. Returns null if lat/lng invalid.
 *
 * NOTE: we do NOT filter by `active=false`. Observed in the live catalog
 * (2026-04-15): major airports like MDE, CLO, CTG, BAQ, PPN are flagged
 * `active: false` despite being fully operable. The booking box does not
 * filter by this flag, so we mirror that behavior for consistency — every
 * airport with valid coords is eligible for nearest-airport resolution.
 *
 * @param {object} raw
 */
function normalizeAirport(raw) {
  const lat = parseFloat(raw?.latitude);
  const lng = parseFloat(raw?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return {
    lat,
    lng,
    iataCityCode: String(raw.iataCityCode || '').toUpperCase(),
    iataCountryCode: String(raw.iataCountryCode || '').toUpperCase(),
    cityName: raw.name || '',
    country: raw.country || '',
  };
}

/**
 * Fetch the airport catalog from ConsultaCombinabilidad.
 * Cached in sessionStorage; one network call per session.
 *
 * Router: lee el flag AV_APIM_DIRECT_MODE y delega a APIM directo o al proxy
 * App Builder (extraído a `triangulation.proxy.service.js`). Cache y
 * normalización son compartidos entre ambos paths.
 *
 * @param {{ force?: boolean, language?: string }} [options]
 * @returns {Promise<Array|null>} list of normalized airports, or null on failure
 */
export async function fetchAirportsCatalog({
  force = false,
  language = DEFAULT_LANGUAGE,
} = {}) {
  if (!force) {
    const cached = readCatalogCache();
    if (Array.isArray(cached) && cached.length > 0) return cached;
  }

  const raw = (await isApimDirectMode())
    ? await fetchAirportsRawDirect({ language })
    : await fetchAirportsRawProxy({ language });

  const airports = Array.isArray(raw) ? raw.map(normalizeAirport).filter(Boolean) : [];
  if (airports.length === 0) return null;
  writeCatalogCache(airports);
  return airports;
}

/**
 * Find the closest airport to a given lat/lng.
 * @param {number} userLat
 * @param {number} userLng
 * @param {Array} airports  normalized airport list
 * @returns {object|null} nearest airport with `distance` (km), or null if empty
 */
export function findNearestAirport(userLat, userLng, airports) {
  if (!Array.isArray(airports) || airports.length === 0) return null;
  if (!Number.isFinite(userLat) || !Number.isFinite(userLng)) return null;

  const closest = airports.reduce((best, airport) => {
    const distance = calculateDistance(userLat, userLng, airport.lat, airport.lng);
    return distance < best.distance ? { airport, distance } : best;
  }, { airport: null, distance: Infinity });

  return closest.airport ? { ...closest.airport, distance: closest.distance } : null;
}

/**
 * Load the country-to-POS mapping with 2-level cascade: AEM → minimal.
 * Cached in memory after first load. Call with `force: true` to bypass cache.
 * @param {{ force?: boolean }} [options]
 * @returns {Promise<Array>} Array of { isoCountryCode, posResuelto, active } rows
 */
export async function ensurePosMapping({ force = false } = {}) {
  if (!force && posMappingCache) return posMappingCache;

  // Level 1: AEM spreadsheet (source of truth)
  try {
    const result = await fetchAEMData(POS_MAPPING_ENDPOINT);
    const rows = Array.isArray(result?.data) ? result.data : [];
    const active = rows.filter((r) => String(r?.active).toLowerCase() === 'true');
    if (active.length > 0) {
      posMappingCache = active;
      return active;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[triangulation.service] geo-pos-mapping AEM fetch failed, using minimal fallback:', error);
  }

  // Level 2: minimal inline fallback
  posMappingCache = MINIMAL_POS_MAPPING;
  return MINIMAL_POS_MAPPING;
}

/**
 * Map an airport's ISO country code to the PBI's POS code.
 * Async now (reads from AEM + local mock cascade). First call triggers the
 * fetch; subsequent calls use the cached mapping.
 * @param {string} iataCountryCode
 * @returns {Promise<string>} POS code (e.g. 'CO', 'EU', 'UK', 'OTHERS')
 */
export async function mapCountryToPos(iataCountryCode) {
  const code = String(iataCountryCode || '').toUpperCase();
  if (!code) return 'OTHERS';
  const mapping = await ensurePosMapping();
  const found = mapping.find((r) => String(r.isoCountryCode || '').toUpperCase() === code);
  if (found) return String(found.posResuelto || 'OTHERS').toUpperCase();
  const fallback = mapping.find(
    (r) => String(r.isoCountryCode || '').toUpperCase() === POS_MAPPING_FALLBACK_KEY,
  );
  return fallback ? String(fallback.posResuelto).toUpperCase() : 'OTHERS';
}

/**
 * Normalize a raw geo-master row. Returns null if lat/lng invalid.
 * Shape: { pais, region, capital, lat, lng, ciudad_cercana, iata }
 */
function normalizeMasterRow(raw) {
  const lat = parseFloat(raw?.lat);
  const lng = parseFloat(raw?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const iata = String(raw.iata || '').trim().toUpperCase();
  if (!iata) return null;
  return {
    lat,
    lng,
    pais: String(raw.pais || '').trim(),
    region: String(raw.region || '').trim(),
    capital: String(raw.capital || '').trim(),
    iata,
  };
}

/**
 * Load the `geo-master` spreadsheet (PBI CU-186). 457 rows mapping
 * country → region → capital (with lat/lng) → IATA.
 * Cached in sessionStorage; one fetch per session.
 * @param {{ force?: boolean }} [options]
 * @returns {Promise<Array|null>} normalized rows, or null on failure
 */
export async function fetchMasterCatalog({ force = false } = {}) {
  if (!force && masterCatalogCache) return masterCatalogCache;
  if (!force && typeof sessionStorage !== 'undefined') {
    try {
      const raw = sessionStorage.getItem(MASTER_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          masterCatalogCache = parsed;
          return parsed;
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('[triangulation.service] geo-master cache read failed:', error);
    }
  }

  try {
    const result = await fetchAEMData(MASTER_ENDPOINT);
    const rows = Array.isArray(result?.data) ? result.data : [];
    const normalized = rows.map(normalizeMasterRow).filter(Boolean);
    if (normalized.length === 0) return null;
    masterCatalogCache = normalized;
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.setItem(MASTER_CACHE_KEY, JSON.stringify(normalized));
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('[triangulation.service] geo-master cache write failed:', error);
      }
    }
    return normalized;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[triangulation.service] geo-master AEM fetch failed:', error);
    return null;
  }
}

/**
 * Find the IATA from geo-master for a given POS + user coords.
 * Filters Master rows to the target POS (via MASTER_COUNTRY_TO_POS),
 * then applies Haversine against those capitals only.
 * @param {string} pos
 * @param {Array} masterRows
 * @param {number} userLat
 * @param {number} userLng
 * @returns {string|null} IATA or null if POS not in Master or no rows
 */
export function findMasterIATA(pos, masterRows, userLat, userLng) {
  if (!Array.isArray(masterRows) || masterRows.length === 0) return null;
  if (!Number.isFinite(userLat) || !Number.isFinite(userLng)) return null;
  const targetPos = String(pos || '').toUpperCase();
  if (!targetPos) return null;

  const matching = masterRows.filter((row) => {
    const rowPos = MASTER_COUNTRY_TO_POS[row.pais];
    return rowPos && rowPos.toUpperCase() === targetPos;
  });
  if (matching.length === 0) return null;

  const closest = matching.reduce((best, row) => {
    const distance = calculateDistance(userLat, userLng, row.lat, row.lng);
    return distance < best.distance ? { row, distance } : best;
  }, { row: null, distance: Infinity });

  return closest.row ? closest.row.iata : null;
}

/**
 * Resolve the ATO (city IATA) for the resolved POS.
 * Jerarquía (PBI 1216373):
 *   1. EU/OTHERS → ATO fijo (MAD/MIA).
 *   2. POS operado con geo-master → IATA del Master (regla de negocio CU-186).
 *   3. UK + cityCode LON → LHR (override PBI).
 *   4. Fallback: iataCityCode del aeropuerto más cercano.
 * @param {string} pos
 * @param {object} nearestAirport
 * @param {Array} [masterRows]
 * @param {number} [userLat]
 * @param {number} [userLng]
 * @returns {string}
 */
function resolveATO(pos, nearestAirport, masterRows, userLat, userLng) {
  if (FIXED_ATO_BY_POS[pos]) return FIXED_ATO_BY_POS[pos];

  const masterIata = findMasterIATA(pos, masterRows, userLat, userLng);
  if (masterIata) return masterIata;

  const city = nearestAirport?.iataCityCode?.toUpperCase() || '';
  if (pos === 'UK' && city === 'LON') return 'LHR';
  return city;
}

/**
 * Full triangulation: given user coords, resolve POS + ATO + metadata.
 *
 * @param {number} userLat
 * @param {number} userLng
 * @param {{ force?: boolean, language?: string }} [options]
 * @returns {Promise<object|null>} result or null on catalog/coord failure
 */
export async function triangulatePOS(userLat, userLng, options = {}) {
  if (!Number.isFinite(userLat) || !Number.isFinite(userLng)) return null;

  const [airports, , masterRows] = await Promise.all([
    fetchAirportsCatalog(options),
    ensurePosMapping(options),
    fetchMasterCatalog(options),
  ]);
  if (!airports) return null;

  const nearest = findNearestAirport(userLat, userLng, airports);
  if (!nearest) return null;

  const pos = await mapCountryToPos(nearest.iataCountryCode);
  const ato = resolveATO(pos, nearest, masterRows, userLat, userLng);

  // TODO(remove-after-qa): temporary debug log to help the client verify
  // that the airport catalog's lat/lng match the real-world airport. If the
  // picked city is wrong, comparing `userCoords` vs `catalog.{lat,lng}` (and
  // the Google Maps link) usually points to a data issue in the catalog.
  // Context: Lyon bug (2026-04-23) — catalog had wrong lat for LYS.
  // eslint-disable-next-line no-console
  console.log(
    '%c[GEO-DEBUG] triangulation result',
    'color:#09a;font-weight:bold',
    {
      userCoords: { lat: userLat, lng: userLng },
      pickedAirport: {
        iata: nearest.iataCityCode,
        cityName: nearest.cityName,
        country: nearest.iataCountryCode,
        catalogLat: nearest.lat,
        catalogLng: nearest.lng,
      },
      distanceKm: Number(nearest.distance).toFixed(2),
      resolvedPos: pos,
      resolvedAto: ato,
      verifyCatalogAt: `https://www.google.com/maps?q=${nearest.lat},${nearest.lng}`,
    },
  );

  return {
    pos,
    ato,
    iataCityCode: nearest.iataCityCode,
    iataCountryCode: nearest.iataCountryCode,
    cityName: nearest.cityName,
    country: nearest.country,
    distance: nearest.distance,
  };
}

export default triangulatePOS;
