/**
 * Lógica PURA del hero "Mi Lifemiles" (1263924) — sin dependencias de UI, para
 * que sea testeable sin montar Preact. La consumen el organism `members-hero`
 * (toggle/persistencia) y la molécula `members-elite-progress` (estados/title).
 */

/**
 * Estado inicial del toggle comprimido/expandido (P2=A): el valor persistido en
 * sessionStorage GANA; si no hay, cae al `defaultState` del CF.
 * @param {string|null} saved - valor crudo de sessionStorage ('true'|'false'|null).
 * @param {string} defaultState - 'collapsed' | 'expanded'.
 * @returns {boolean} true = expandido.
 */
export const resolveInitialExpanded = (saved, defaultState) => {
  if (saved === 'true') return true;
  if (saved === 'false') return false;
  return defaultState === 'expanded';
};

/** ¿Condición elite completa? (value ≥ goal, con goal > 0). */
export const isEliteConditionComplete = (c) => Number(c?.goal) > 0
  && Number(c?.value) >= Number(c?.goal);

/**
 * ¿Todas las condiciones completas? Dispara el switch de section title
 * "Mantener…" → "Disfruta…" (nota Figma 518:27189).
 * @param {Array<{value:number, goal:number}>} conditions
 * @returns {boolean}
 */
export const isAllEliteComplete = (conditions) => Array.isArray(conditions)
  && conditions.length > 0
  && conditions.every(isEliteConditionComplete);

/** Variante de color de la barra por condición: "avianca" → magenta; resto → navy. */
export const eliteVariant = (key) => (key === 'avianca-miles' ? 'magenta' : 'navy');

/**
 * Conectores en español/portugués que NO se capitalizan cuando aparecen
 * intercalados en un nombre propio (ej. "María del Pilar", "Juan de la Vega",
 * "Vasco da Gama"). El primer token del nombre siempre se capitaliza aunque
 * matchee la lista.
 */
const NAME_CONNECTORS = new Set([
  'de', 'del', 'la', 'las', 'los', 'y', 'e', 'da', 'do', 'das', 'dos',
]);

/**
 * Normaliza un nombre propio a "Title Case" tolerante a nombres compuestos.
 * El wrapper de la sesión Lifemiles devuelve `firstName` / `lastName` en MAYÚSCULAS
 * ("SEBASTIÁN RUIZ"); en la UI queremos "Sebastián Ruiz". Aplicamos:
 *  - `toLocaleLowerCase()` primero, para preservar acentos (Ñ → ñ, Á → á).
 *  - Primera letra en mayúscula por cada "palabra": separadores = espacios,
 *    guiones ("Marie-Claire") y apóstrofos ("O'Brien" / "D'Artagnan").
 *  - Conectores comunes (de, del, la, las, los, y, da, do, ...) se dejan en
 *    minúscula EXCEPTO si son la primera palabra del nombre.
 * @param {string} name - Nombre crudo del wrapper (puede venir vacío o con
 *   múltiples espacios; se hace trim + collapse).
 * @returns {string} - Nombre normalizado, o '' si el input no es un string
 *   válido.
 */
export const toTitleCaseName = (name) => {
  if (typeof name !== 'string' || !name.trim()) return '';
  const lower = name.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
  return lower.replace(
    /(^|[\s\-'])(\p{L})(\p{L}*)/gu,
    (_match, sep, first, rest) => {
      const word = first + rest;
      // Conector intercalado (sep !== '' significa que hay separador antes,
      // así que NO es la primera palabra) → dejar en minúscula.
      if (sep && NAME_CONNECTORS.has(word)) return sep + word;
      return sep + first.toLocaleUpperCase() + rest;
    },
  );
};
