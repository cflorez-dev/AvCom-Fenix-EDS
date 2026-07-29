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
