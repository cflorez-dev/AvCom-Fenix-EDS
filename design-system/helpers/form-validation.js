/**
 * form-validation — motor de validación liviano y PURO (sin DOM) del kit
 * "Gestión de cuenta" (1279360). Hoy cada form valida ad-hoc; este helper
 * centraliza reglas simples y produce props listas para spreadear en
 * `Input`/`Select` (contrato `input.js:18-19`: `state` + `helperText`).
 *
 * El TEXTO de cada error lo pasa el consumidor (i18n) — el motor solo devuelve
 * la KEY del error (`required`|`minLength`|`maxLength`|`pattern`|`email`), así
 * nada de copy queda hardcodeado.
 */

/**
 * Valida un valor contra un set de reglas. Devuelve `{ valid, error }` donde
 * `error` es la key de la primera regla incumplida (o null si válido).
 * @param {*} value  valor a validar (se castea a string y se trimea).
 * @param {Object} [rules]  { required, minLength, maxLength, pattern, email }.
 * @returns {{valid:boolean, error:(string|null)}}
 */
export const validateField = (value, rules = {}) => {
  const v = String(value ?? '').trim();
  if (rules.required && !v) return { valid: false, error: 'required' };
  if (v && rules.minLength && v.length < rules.minLength) return { valid: false, error: 'minLength' };
  if (v && rules.maxLength && v.length > rules.maxLength) return { valid: false, error: 'maxLength' };
  if (v && rules.pattern && !new RegExp(rules.pattern).test(v)) return { valid: false, error: 'pattern' };
  if (v && rules.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return { valid: false, error: 'email' };
  return { valid: true, error: null };
};

/**
 * Traduce el resultado de `validateField` a props de `Input`/`Select`. El
 * consumidor pasa `messages` (mapa error-key → texto i18n; `default` como
 * genérico, ej. "Pendiente por completar" — Figma).
 * @param {{valid:boolean, error:(string|null)}} result
 * @param {Object<string,string>} [messages]
 * @returns {{state:('error'|'normal'), helperText:string}}
 */
export const fieldProps = ({ valid, error }, messages = {}) => (valid
  ? { state: 'normal', helperText: '' }
  : { state: 'error', helperText: messages[error] || messages.default || '' });
