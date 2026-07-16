/**
 * Lógica pura del deep-linking de tabs de la sección "Progreso Elite y
 * beneficios" (1271689, decisión T3). Sin efectos ni DOM → 100% testeable.
 *
 * El estado de la tab activa se refleja en la URL con un query param localizado
 * por idioma (SEO): al ESCRIBIR la URL se usa el valor autorado del locale
 * actual (`tabToParam`); al LEERLA se acepta el valor de CUALQUIER idioma y se
 * normaliza a la key interna `progress|benefits` (`paramToTab`). Valor inválido
 * o ausente → `progress` (tab por defecto), sin error.
 */

export const TAB_PROGRESS = 'progress';
export const TAB_BENEFITS = 'benefits';
export const TABS = [TAB_PROGRESS, TAB_BENEFITS];
export const DEFAULT_TAB = TAB_PROGRESS;

/**
 * Valores canónicos del query param por tab en los 4 idiomas (defaults de la
 * decisión T3). Es la whitelist de ACEPTACIÓN al leer la URL: un `?tab=` de
 * cualquier idioma resuelve a la key interna. (Nota: el param pt de beneficios
 * es `beneficios` sin acento — URL-safe — no `benefícios`.)
 */
const PARAM_ALIASES = {
  [TAB_PROGRESS]: ['progreso', 'progress', 'progresso', 'progres'],
  [TAB_BENEFITS]: ['beneficios', 'benefits', 'avantages'],
};

/**
 * Normaliza el valor crudo del query param a una key de tab interna.
 * Acepta los valores de los 4 idiomas (case-insensitive) más el valor autorado
 * del locale actual (`labels.tabParam*`) por si el autor lo customizó. Cualquier
 * otro valor (o vacío/null) → `DEFAULT_TAB`. Nunca devuelve el string crudo.
 * @param {string|null|undefined} rawParam  valor de `?tab=`
 * @param {{tabParamProgress?:string, tabParamBenefits?:string}} [labels]  labels elite del locale
 * @returns {'progress'|'benefits'}
 */
export function paramToTab(rawParam, labels = {}) {
  if (!rawParam || typeof rawParam !== 'string') return DEFAULT_TAB;
  const needle = rawParam.trim().toLowerCase();
  if (!needle) return DEFAULT_TAB;

  // 1) Valor autorado del locale actual (override del autor vía CF/i18n).
  if (labels.tabParamBenefits && needle === String(labels.tabParamBenefits).toLowerCase()) {
    return TAB_BENEFITS;
  }
  if (labels.tabParamProgress && needle === String(labels.tabParamProgress).toLowerCase()) {
    return TAB_PROGRESS;
  }

  // 2) Whitelist cross-idioma (decisión T3).
  if (PARAM_ALIASES[TAB_BENEFITS].includes(needle)) return TAB_BENEFITS;
  if (PARAM_ALIASES[TAB_PROGRESS].includes(needle)) return TAB_PROGRESS;

  // 3) Inválido → default (sin error).
  return DEFAULT_TAB;
}

/**
 * Valor del query param para ESCRIBIR en la URL, en el idioma del locale actual.
 * Usa el valor autorado (`labels.tabParam*`) y cae al canónico de la decisión T3.
 * @param {string} tabKey  key interna (`progress`|`benefits`)
 * @param {{tabParamProgress?:string, tabParamBenefits?:string}} [labels]
 * @returns {string}
 */
export function tabToParam(tabKey, labels = {}) {
  if (tabKey === TAB_BENEFITS) {
    return labels.tabParamBenefits || PARAM_ALIASES[TAB_BENEFITS][0];
  }
  return labels.tabParamProgress || PARAM_ALIASES[TAB_PROGRESS][0];
}
