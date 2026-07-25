// account-security.service — escritura MOCK optimistic de seguridad (1279363, D24/D29).
// LM DESARROLLA los wrappers de escritura (password/PIN/método) — sin contrato aún.
// Cada fn valida el shape mínimo, simula éxito con latencia y devuelve `{ ok, mock }`.
// PII: NADA se persiste (ni storage ni logs); el organism NO guarda el valor.
const DEFAULT_LATENCY_MS = 300;
const delay = (ms) => new Promise((r) => { setTimeout(r, ms); });
const isDisabled = (o) => o && o.enabled === false;
const latency = (o) => (o && Number.isFinite(o.latencyMs) ? o.latencyMs : DEFAULT_LATENCY_MS);

/**
 * Cambio de contraseña (MOCK). Requiere contraseña actual + nueva.
 * @param {{current?:string, next?:string}} payload
 * @param {{enabled?:boolean, latencyMs?:number}} [opts]
 * @returns {Promise<{ok:boolean, mock?:boolean, reason?:string}>}
 */
export async function savePassword({ current, next } = {}, opts = {}) {
  // TODO(LM): cablear wrapper de cambio de contraseña (D24).
  if (isDisabled(opts)) return { ok: false, reason: 'disabled' };
  if (!current || !next) return { ok: false, reason: 'invalid' };
  await delay(latency(opts));
  return { ok: true, mock: true };
}

/**
 * Alta/cambio de PIN de redención (MOCK). Devuelve `hasPin:true` para que el
 * organism refleje la tenencia en lectura (el VALOR no se persiste nunca).
 * @param {{pin?:string}} payload
 * @param {{enabled?:boolean, latencyMs?:number}} [opts]
 */
export async function savePin({ pin } = {}, opts = {}) {
  if (isDisabled(opts)) return { ok: false, reason: 'disabled' };
  if (!pin) return { ok: false, reason: 'invalid' };
  await delay(latency(opts));
  return { ok: true, mock: true, hasPin: true };
}

/**
 * Cambio de método de verificación (MOCK). Devuelve el método elegido para que
 * el organism lo refleje en memoria (se pierde al reload — documentado QA).
 * @param {{method?:string}} payload
 * @param {{enabled?:boolean, latencyMs?:number}} [opts]
 */
export async function saveVerificationMethod({ method } = {}, opts = {}) {
  if (isDisabled(opts)) return { ok: false, reason: 'disabled' };
  if (!method) return { ok: false, reason: 'invalid' };
  await delay(latency(opts));
  return { ok: true, mock: true, method };
}

export default { savePassword, savePin, saveVerificationMethod };
