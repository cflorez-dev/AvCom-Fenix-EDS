/**
 * Lógica pura del deep-linking de tabs de la página "Gestión de cuenta"
 * (1279360). Espejo de `members-tabs.logic.js` (elite) para 3 tabs
 * Datos | Pagos | Ajustes. Sin efectos ni DOM → 100% testeable.
 *
 * El estado de la tab activa se refleja en la URL con un query param localizado
 * por idioma (SEO): al ESCRIBIR se usa el valor autorado del locale (`tabToParam`);
 * al LEER se acepta el valor de CUALQUIER idioma y se normaliza a la key interna
 * `data|payments|settings` (`paramToTab`). Valor inválido/ausente → `data`
 * (tab por defecto, AC: Datos default al ingresar), sin error.
 */

export const TAB_DATA = 'data';
export const TAB_PAYMENTS = 'payments';
export const TAB_SETTINGS = 'settings';
export const TABS = [TAB_DATA, TAB_PAYMENTS, TAB_SETTINGS];
export const DEFAULT_TAB = TAB_DATA; // AC: Datos default al ingresar

/**
 * Valores canónicos del query param por tab en los 4 idiomas. Whitelist de
 * ACEPTACIÓN al leer la URL (URL-safe, sin acentos). Los `payments` usan la key
 * neutral `payments` (respuesta P4: label visible "Pagos" ×4).
 */
const PARAM_ALIASES = {
  [TAB_DATA]: ['datos', 'data', 'donnees', 'dados'],
  [TAB_PAYMENTS]: ['pagos', 'payments', 'paiements', 'pagamentos'],
  [TAB_SETTINGS]: ['ajustes', 'settings', 'parametres', 'configuracoes'],
};

/**
 * Normaliza el valor crudo del query param a una key de tab interna. Acepta los
 * valores de los 4 idiomas (case-insensitive) + el valor autorado del locale
 * (`labels.tabParam*`). Cualquier otro (o vacío/null) → `DEFAULT_TAB`. Nunca
 * devuelve el string crudo.
 * @param {string|null|undefined} rawParam  valor de `?tab=`
 * @param {{tabParamData?:string, tabParamPayments?:string, tabParamSettings?:string}} [labels]
 * @returns {'data'|'payments'|'settings'}
 */
export function paramToTab(rawParam, labels = {}) {
  if (!rawParam || typeof rawParam !== 'string') return DEFAULT_TAB;
  const needle = rawParam.trim().toLowerCase();
  if (!needle) return DEFAULT_TAB;

  // 1) Valor autorado del locale actual (override del autor vía CF/i18n).
  if (labels.tabParamSettings && needle === String(labels.tabParamSettings).toLowerCase()) {
    return TAB_SETTINGS;
  }
  if (labels.tabParamPayments && needle === String(labels.tabParamPayments).toLowerCase()) {
    return TAB_PAYMENTS;
  }
  if (labels.tabParamData && needle === String(labels.tabParamData).toLowerCase()) {
    return TAB_DATA;
  }

  // 2) Whitelist cross-idioma.
  if (PARAM_ALIASES[TAB_SETTINGS].includes(needle)) return TAB_SETTINGS;
  if (PARAM_ALIASES[TAB_PAYMENTS].includes(needle)) return TAB_PAYMENTS;
  if (PARAM_ALIASES[TAB_DATA].includes(needle)) return TAB_DATA;

  // 3) Inválido → default (sin error).
  return DEFAULT_TAB;
}

/**
 * Valor del query param para ESCRIBIR en la URL, en el idioma del locale actual.
 * Usa el valor autorado (`labels.tabParam*`) y cae al canónico.
 * @param {string} tabKey  key interna (`data`|`payments`|`settings`)
 * @param {{tabParamData?:string, tabParamPayments?:string, tabParamSettings?:string}} [labels]
 * @returns {string}
 */
export function tabToParam(tabKey, labels = {}) {
  if (tabKey === TAB_SETTINGS) {
    return labels.tabParamSettings || PARAM_ALIASES[TAB_SETTINGS][0];
  }
  if (tabKey === TAB_PAYMENTS) {
    return labels.tabParamPayments || PARAM_ALIASES[TAB_PAYMENTS][0];
  }
  return labels.tabParamData || PARAM_ALIASES[TAB_DATA][0];
}
