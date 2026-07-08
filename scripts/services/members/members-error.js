/**
 * Clasificación de errores de Members + contador GLOBAL de reintentos (1255601).
 *
 * `classifyMembersError(input)` mapea un error de Lifemiles a la KEY de su modal. El mapeo es
 * 1:1 con las keys REALES del CF (members-config → config.modals), que ya tiene copy autorado
 * para cada caso (§5 override 2026-06-16, anula la tabla colapsada de P3): no colapsamos ni
 * silenciamos — cada error muestra SU modal. `session-expired` es Track 2 (PO-gated): el
 * clasificador puede no devolverlo (el dropin redirige antes), y el host NO lo renderiza.
 *
 * El contador de reintentos es GLOBAL (uno solo para cualquier error, no per-key), persistido
 * en localStorage. "Reintento" = recarga del usuario (CTA Recargar / X / click-fuera). Al 3º se
 * deja de auto-mostrar; el éxito de una operación Members (perfil/login OK) lo resetea.
 */

const RETRIES_KEY = 'members-modal-retries';

/** Reintentos acumulados (global). try/catch defensivo: localStorage puede estar bloqueado. */
export const getRetries = () => {
  try { return parseInt(localStorage.getItem(RETRIES_KEY) || '0', 10) || 0; } catch (e) { return 0; }
};

/** Incrementa el contador global de reintentos. */
export const incRetries = () => {
  try { localStorage.setItem(RETRIES_KEY, String(getRetries() + 1)); } catch (e) { /* ignore */ }
};

/** Resetea el contador (primer éxito de una operación Members). */
export const resetRetries = () => {
  try { localStorage.removeItem(RETRIES_KEY); } catch (e) { /* ignore */ }
};

/**
 * Clasifica un error de Members a la key de su modal del CF (o null si no aplica modal).
 * Acepta `{ status }` numérico (HTTP de userinfo / token) y/o un string/`{ code }` de error LM
 * (`invalid_grant` + descripción "Session not active"/"Code not valid", `PD007`, `state_mismatch`,
 * `redirect_uri`, `E.EON.*`). Mapeo 1:1 con las keys del CF (§5 override).
 *
 * @param {{status?:number, code?:string}|string} input
 * @returns {string|null} modalKey o null. Keys sin fallback local → el host cae a generic-error.
 */
export function classifyMembersError(input = {}) {
  const status = Number(input && input.status) || 0;
  const raw = (input && input.code) || (typeof input === 'string' ? input : '') || '';
  const code = String(raw).toLowerCase();

  // HTTP de servicio (userinfo / token) → su propia key del CF.
  if (status === 400) return 'http_400';
  if (status === 500) return 'http_500';

  // PD007: access_token inválido / lmID mal formado al consumir userinfo.
  if (code.includes('pd007')) return 'pd007';

  // invalid_grant desambiguado por la descripción de Lifemiles.
  if (code.includes('session not active')) return 'invalid_grant_session';
  if (code.includes('code not valid')) return 'invalid_grant_code';

  // Mismatch de state (posible CSRF): el CF lo autoró → muestra modal (§5 override).
  if (code.includes('state') && code.includes('mismatch')) return 'state_mismatch';

  // redirect_uri no registrada (error de config) → su key (el call-site además loguea).
  if (code.includes('redirect_uri')) return 'redirect_uri';

  // Errores devueltos por la callback de Lifemiles (E.EON.*) → modal de conexión.
  if (code.startsWith('e.eon')) return 'connection-error';

  return null; // no reconocido → sin modal (el call-site puede forzar 'generic-error').
}

export default classifyMembersError;
