/**
 * NewYearStatusModal — trigger + persistencia (1271694, decisión A3).
 *
 * El TRIGGER real queda pendiente de confirmación del PO (pregunta #2 del
 * lote). Default razonable implementado acá: "primer login del AÑO nuevo" —
 * el modal se muestra la primera visita de cada año calendario NUEVO respecto
 * del último año visto, y se marca como visto al cerrarse (✕ / Esc / click
 * fuera / CTA). El flag de visibilidad (`cfg.newYearModal.enabled`, default
 * false) lo gatea el caller — este módulo solo decide el "cuándo".
 *
 * Persistencia (mismo patrón que `alert-persistence.js`):
 *  - Key: `av-members-newyear-seen[:{member}]` → año (string).
 *  - `member` (membershipNumber) escopa por cuenta (§7.3: cambiar de cuenta en
 *    la misma máquina no hereda el visto ajeno).
 *  - Primera visita EVER (sin last-seen) → BASELINE: se registra el año actual
 *    y NO se muestra ("Empiezas un nuevo año" a mitad de año para un usuario
 *    nuevo no tiene sentido; consistente con detectTierChange).
 *  - localStorage inaccesible (Safari private / lleno) → fail-closed SIN
 *    crash: no se muestra (evita re-mostrar el modal en cada visita).
 */

const LAST_YEAR_KEY = 'av-members-newyear-seen';

const scoped = (member) => (member ? `${LAST_YEAR_KEY}:${member}` : LAST_YEAR_KEY);

const safeGet = (key) => {
  try { return window.localStorage.getItem(key); } catch (e) { return null; }
};
const safeSet = (key, value) => {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (e) { return false; }
};

/**
 * ¿Corresponde mostrar el modal de año nuevo?
 *
 * @param {{year?:number, member?:string}} [opts]
 *  - `year`: año actual (default: año calendario del sistema).
 *  - `member`: membershipNumber para escopar el last-seen.
 * @returns {boolean} true solo si hay un last-seen previo MENOR al año actual.
 */
export const shouldShowNewYearModal = ({ year, member = '' } = {}) => {
  const current = Number(year) || new Date().getFullYear();
  const key = scoped(member);
  const lastRaw = safeGet(key);
  if (lastRaw == null) {
    // Baseline primera visita: registrar y no mostrar. Si el write falla
    // (storage inaccesible) NO mostramos: sin persistencia el modal se
    // repetiría en cada visita (fail-closed deliberado).
    safeSet(key, String(current));
    return false;
  }
  const last = Number(lastRaw);
  return Number.isFinite(last) && last < current;
};

/**
 * Marca el modal como visto para el año dado (se llama al CERRAR: ✕ / Esc /
 * click fuera / CTA). Idempotente.
 * @param {{year?:number, member?:string}} [opts]
 */
export const markNewYearModalSeen = ({ year, member = '' } = {}) => {
  const current = Number(year) || new Date().getFullYear();
  safeSet(scoped(member), String(current));
};
