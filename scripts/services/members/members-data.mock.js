/**
 * Fixture de datos del hero "Mi Lifemiles" (PBI 1263924, Sub A). DOBLE USO:
 *  1) Herramienta de QA `?membersMock=<estado>` — fuerza estados del hero (empty /
 *     error / por-tier) SIN datos reales. GATEADA a non-prod en `session.service.js`
 *     (env !== 'prd'): funciona en qa/uat, se IGNORA en prod. Ver
 *     `qa/guia-prueba-estados-modales.md`.
 *  2) Fixture de tests unitarios.
 *
 * Los wrappers reales (`lmBalance`/`eliteProgram`) YA están cableados + verificados en
 * QA (mapeo en `toBalanceVM`/`toEliteVM` de `session.service.js`, cuentas UAT). Este
 * módulo entrega fragmentos YA en shape de VM (`MemberMetricsVM`) y NUNCA corre en el
 * camino real de producción.
 *
 * Activación (NO afecta producción; default desactivado):
 *  - `?membersMock=<state>` en la URL (querystring), o
 *  - `sessionStorage['members-data-mock'] = '<state>'`, o
 *  - `window.__MEMBERS_DATA_MOCK__ = '<state>'`.
 * `<state>` ∈ keys de `MEMBERS_DATA_STATES`. Si no hay flag → `null` (sin mock).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * @typedef {Object} EliteConditionVM
 * @property {string} key    - id estable de la condición ('qualifying-miles'…).
 * @property {number} value  - progreso actual (millas calificadas). 0..goal.
 * @property {number} goal   - meta de la condición.
 *
 * @typedef {Object} EliteProgressVM
 * @property {number} year         - año objetivo del estatus (automático, NO copy).
 * @property {string} tierTarget   - tier que persigue (key normalizada: 'gold'…).
 * @property {EliteConditionVM[]} conditions - 1 (Magno) o 2 condiciones (resto).
 *
 * @typedef {Object} MemberMetricsVM
 * @property {number|null} totalMiles      - total de millas (número crudo, sin
 *   formato; el componente formatea por locale). null = dato ausente (empty).
 * @property {string|null} milesExpiryDate - ISO 'YYYY-MM-DD' del vencimiento de
 *   millas. null = ausente. El componente formatea por locale.
 * @property {string|null} statusExpiry    - ISO 'YYYY-MM-DD' de vigencia del
 *   estatus. null = ausente.
 * @property {EliteProgressVM|null} elite  - progreso elite, o null si no aplica
 *   (tier sin programa / dato ausente).
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Estados de mock disponibles (cubren los casos del plan: por-tier, empty,
 * parcial y tier-máximo/Magno). loading/error son estados de FLUJO del organism,
 * no de datos — se simulan desde el sample del organism, no acá. */
export const MEMBERS_DATA_STATES = Object.freeze({
  GOLD: 'gold', // happy path desktop del Figma 518:27631 (2 condiciones, persigue Gold 2027)
  SILVER: 'silver', // tier intermedio
  LIFEMILES: 'lifemiles', // tier base
  RED_PLUS: 'red-plus', // tier bajo (2nd) — usado por mock de la pág. Elite 765:42466
  DIAMOND: 'diamond', // tier alto (5º) — usado por mock de la pág. Elite 765:42724
  MAGNO: 'magno', // tier máximo → 1 sola condición (nota Figma 518:26721)
  EMPTY: 'empty', // wrapper sin datos → todos los campos null (placeholder por campo)
  PARTIAL: 'partial', // wrapper parcial → millas sí, elite ausente
});

// Fixtures por estado. Números/fechas tomados de los defaults visibles del Figma
// (518:27631 / 518:25778) para que el mock sea visualmente fiel al diseño.
const FIXTURES = {
  [MEMBERS_DATA_STATES.GOLD]: {
    totalMiles: 18056,
    milesExpiryDate: '2026-12-31',
    statusExpiry: '2026-01-30',
    elite: {
      year: 2027,
      tierTarget: 'gold',
      conditions: [
        { key: 'qualifying-miles', value: 11460, goal: 20000 },
        { key: 'avianca-miles', value: 4000, goal: 8000 },
      ],
    },
  },
  [MEMBERS_DATA_STATES.SILVER]: {
    totalMiles: 232757,
    milesExpiryDate: '2026-12-31',
    statusExpiry: '2026-01-30',
    elite: {
      year: 2027,
      tierTarget: 'silver',
      conditions: [
        { key: 'qualifying-miles', value: 6200, goal: 15000 },
        { key: 'avianca-miles', value: 1500, goal: 5000 },
      ],
    },
  },
  [MEMBERS_DATA_STATES.LIFEMILES]: {
    totalMiles: 4820,
    milesExpiryDate: '2027-06-30',
    statusExpiry: null,
    elite: {
      year: 2027,
      tierTarget: 'silver',
      conditions: [
        { key: 'qualifying-miles', value: 0, goal: 10000 },
        { key: 'avianca-miles', value: 0, goal: 3000 },
      ],
    },
  },
  // Red Plus (Figma pág. Elite mobile 765:42466): tier 2 → persigue Silver.
  // Millas coherentes con la escala (lifemiles 4.8k < red-plus < silver 232k).
  [MEMBERS_DATA_STATES.RED_PLUS]: {
    totalMiles: 24500,
    milesExpiryDate: '2026-12-31',
    statusExpiry: '2026-01-30',
    elite: {
      year: 2026,
      tierTarget: 'silver',
      conditions: [
        { key: 'qualifying-miles', value: 4400, goal: 8000 },
        { key: 'avianca-miles', value: 1150, goal: 2000 },
      ],
    },
  },
  // Diamond (Figma pág. Elite mobile 765:42724): tier 5 → persigue Magno.
  // Millas coherentes con la escala (silver 232k < diamond < magno 540k).
  [MEMBERS_DATA_STATES.DIAMOND]: {
    totalMiles: 385000,
    milesExpiryDate: '2026-12-31',
    statusExpiry: '2026-01-30',
    elite: {
      year: 2026,
      tierTarget: 'magno',
      conditions: [
        { key: 'qualifying-miles', value: 55000, goal: 45000 },
        { key: 'avianca-miles', value: 65000, goal: 110000 },
      ],
    },
  },
  // Magno = tier máximo: el componente cambia de estructura a UNA sola condición
  // (solo "Millas requeridas con avianca"). El section title pasa a "Mantener…"
  // (Figma 518:27096 mobile / 518:26794 desktop). Valores tomados del Figma
  // desktop 518:26794 (45k/110k → 41% progress).
  [MEMBERS_DATA_STATES.MAGNO]: {
    totalMiles: 540210,
    milesExpiryDate: '2027-12-31',
    statusExpiry: '2027-12-31',
    elite: {
      year: 2027,
      tierTarget: 'magno',
      conditions: [
        { key: 'avianca-miles', value: 45000, goal: 110000 },
      ],
    },
  },
  // Empty: el wrapper no devolvió datos → placeholder por campo + CTA off.
  [MEMBERS_DATA_STATES.EMPTY]: {
    totalMiles: null,
    milesExpiryDate: null,
    statusExpiry: null,
    elite: null,
  },
  // Parcial: millas sí, vencimiento y elite ausentes (cada campo cae a placeholder
  // sin tumbar el resto del hero).
  [MEMBERS_DATA_STATES.PARTIAL]: {
    totalMiles: 18056,
    milesExpiryDate: null,
    statusExpiry: null,
    elite: null,
  },
};

const EMPTY_METRICS = Object.freeze({
  totalMiles: null,
  milesExpiryDate: null,
  statusExpiry: null,
  elite: null,
});

/**
 * Lee el estado de mock activo desde URL / sessionStorage / window. Devuelve la
 * key del estado (string) o `null` si no hay flag (producción).
 * @returns {string|null}
 */
export function getMembersDataMockState() {
  try {
    if (typeof window !== 'undefined') {
      const fromUrl = new URLSearchParams(window.location.search).get('membersMock');
      if (fromUrl) return fromUrl;
      // eslint-disable-next-line no-underscore-dangle
      if (window.__MEMBERS_DATA_MOCK__) return String(window.__MEMBERS_DATA_MOCK__);
    }
    if (typeof sessionStorage !== 'undefined') {
      const fromStorage = sessionStorage.getItem('members-data-mock');
      if (fromStorage) return fromStorage;
    }
  } catch (e) { /* entornos sin window/sessionStorage → sin mock */ }
  return null;
}

/** ¿Hay un mock de datos activo? */
export const isMembersDataMockEnabled = () => getMembersDataMockState() !== null;

/**
 * ¿Está el flag DEV-ONLY `?mockMembers=1` activo? — distinto del data-mock
 * (`?membersMock=`, que cambia las métricas en el camino REAL). Gate DURO a
 * localhost: en qa/prod se IGNORA por completo.
 *
 * OJO (MOCK-CLEANUP-1263924): el módulo que pintaba la sesión mock y montaba el hero
 * (`members-dev-mock.js`) se eliminó en `e0011f4f`, así que este flag YA NO monta nada.
 * Hoy solo lo consume `members-guard.js` para no redirigir al login en localhost.
 * Para ver el hero en local hay que montar el componente en un harness, o usar
 * `?membersMock=<estado>` en un entorno non-prod con sesión real.
 * @returns {boolean}
 */
export function isDevSessionMockEnabled() {
  try {
    if (typeof window === 'undefined') return false;
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') return false;
    return new URLSearchParams(window.location.search).get('mockMembers') === '1';
  } catch (e) {
    return false;
  }
}

/**
 * Devuelve el fragmento `MemberMetricsVM` para un estado. Si el estado no existe,
 * cae al fixture GOLD (el happy-path del Figma). Clona profundo para que el caller
 * no mute el fixture.
 * @param {string} [state] - key de `MEMBERS_DATA_STATES`. Default = estado activo.
 * @returns {MemberMetricsVM}
 */
export function getMockMemberMetrics(state = getMembersDataMockState()) {
  const fixture = FIXTURES[state] || FIXTURES[MEMBERS_DATA_STATES.GOLD];
  // Clon profundo simple (sin Date/funciones → JSON es seguro y suficiente).
  return JSON.parse(JSON.stringify(fixture));
}

/** Fragmento vacío (todos los campos null) — usado como fallback no-rompedor
 * cuando el wrapper real falla o no está disponible. */
export const getEmptyMemberMetrics = () => ({ ...EMPTY_METRICS });

export default getMockMemberMetrics;
