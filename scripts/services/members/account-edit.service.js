/**
 * account-edit.service — edición MOCK OPTIMISTIC del perfil (1279361, decisión
 * P3/D24). LM está DESARROLLANDO los wrappers de ESCRITURA (perfil, contacto,
 * emergencia, documentos) — todavía no hay contrato. Mientras tanto, cada
 * función valida el shape mínimo, SIMULA éxito con una latencia corta (para que
 * el estado "Guardando" del botón sea visible) y devuelve el VM ACTUALIZADO
 * marcado `mock: true`. El organism aplica ese VM a su estado local (se pierde
 * al recargar — documentado para QA como "pendiente de backend LM").
 *
 * ⚠️ Kill-switch (`account.editMockEnabled`, default true): el organism pasa
 * `enabled`; con `false` (CF futuro) estas funciones devuelven
 * `{ ok:false, reason:'disabled' }` y la UI deshabilita los botones de edición
 * de perfil (NO afecta acompañantes, que son CRUD REAL).
 *
 * PII: NO se persiste nada fuera del estado en memoria del organism.
 */

const DEFAULT_LATENCY_MS = 300;

const delay = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

const isDisabled = (opts) => opts && opts.enabled === false;
const latency = (opts) => (opts && Number.isFinite(opts.latencyMs)
  ? opts.latencyMs : DEFAULT_LATENCY_MS);

// Orden de documentos: pasaporte → identidad → otros.
const DOC_RANK = ['P', 'I'];
const docRank = (t) => (DOC_RANK.indexOf(t) >= 0 ? DOC_RANK.indexOf(t) : DOC_RANK.length);

/** Éxito mock uniforme: VM nuevo + flags. */
const okMock = (vm) => ({ ok: true, vm, mock: true });

/**
 * Actualiza la sección "Datos personales" (mock). Los campos readonly
 * (nombre/apellido/fecha) NO se tocan: solo se mergean los `changes` provistos.
 * @param {object} vm VM actual del perfil (ver account-profile.service)
 * @param {object} changes campos editables (gender, country, city, addressLine)
 * @param {{enabled?:boolean, latencyMs?:number}} [opts]
 * @returns {Promise<{ok:boolean, vm?:object, mock?:boolean, reason?:string}>}
 */
export async function updatePersonal(vm, changes = {}, opts = {}) {
  // TODO(LM): cablear wrapper de escritura de perfil cuando LM lo entregue (D24).
  if (isDisabled(opts)) return { ok: false, reason: 'disabled' };
  if (!vm || typeof vm !== 'object') return { ok: false, reason: 'invalid' };
  await delay(latency(opts));
  const personal = { ...vm.personal, ...changes };
  // Mantener fullName coherente si cambian nombre/apellido (readonly hoy, pero
  // defensivo).
  personal.fullName = [personal.givenName, personal.familyName]
    .filter((x) => x != null && String(x).trim() !== '').join(' ');
  return okMock({ ...vm, personal });
}

/**
 * Actualiza la sección "Información de contacto" (mock): email, prefijo, teléfono.
 * @param {object} vm
 * @param {object} changes { email?, prefix?, phone? }
 * @param {{enabled?:boolean, latencyMs?:number}} [opts]
 */
export async function updateContact(vm, changes = {}, opts = {}) {
  // TODO(LM): cablear wrapper de escritura de contacto (D24).
  if (isDisabled(opts)) return { ok: false, reason: 'disabled' };
  if (!vm || typeof vm !== 'object') return { ok: false, reason: 'invalid' };
  await delay(latency(opts));
  const contact = { ...vm.contact, ...changes };
  return okMock({ ...vm, contact });
}

/**
 * Actualiza la sección "Contacto de emergencia" (mock): nombre (D33), prefijo,
 * teléfono.
 * @param {object} vm
 * @param {object} changes { name?, prefix?, phone? }
 * @param {{enabled?:boolean, latencyMs?:number}} [opts]
 */
export async function updateEmergency(vm, changes = {}, opts = {}) {
  // TODO(LM): cablear wrapper de escritura de contacto de emergencia (D24).
  if (isDisabled(opts)) return { ok: false, reason: 'disabled' };
  if (!vm || typeof vm !== 'object') return { ok: false, reason: 'invalid' };
  await delay(latency(opts));
  const emergency = { ...vm.emergency, ...changes };
  return okMock({ ...vm, emergency });
}

/**
 * Guarda (agrega o edita) un documento de viaje (mock). Máx 1 por tipo (R2): si
 * ya existe un doc del mismo `type`, se REEMPLAZA; si no, se AGREGA. Reordena
 * pasaporte → identidad.
 * @param {object} vm
 * @param {{type:string, number:string, nationality:string, expiry?:string|null,
 *   expiryParts?:object|null}} doc
 * @param {{enabled?:boolean, latencyMs?:number}} [opts]
 */
export async function saveDocument(vm, doc = {}, opts = {}) {
  // TODO(LM): cablear wrapper de escritura de documentos (D24).
  if (isDisabled(opts)) return { ok: false, reason: 'disabled' };
  if (!vm || typeof vm !== 'object') return { ok: false, reason: 'invalid' };
  const type = String(doc.type || '').toUpperCase();
  if (!type) return { ok: false, reason: 'invalid' };
  await delay(latency(opts));
  const next = {
    type,
    number: doc.number != null ? String(doc.number) : '',
    nationality: doc.nationality != null ? String(doc.nationality) : '',
    expiry: doc.expiry != null && String(doc.expiry) !== '' ? String(doc.expiry) : null,
    expiryParts: doc.expiryParts || null,
  };
  const existing = Array.isArray(vm.documents) ? vm.documents.slice() : [];
  const idx = existing.findIndex((d) => String(d.type).toUpperCase() === type);
  if (idx >= 0) existing[idx] = next; else existing.push(next);
  existing.sort((a, b) => docRank(String(a.type).toUpperCase())
    - docRank(String(b.type).toUpperCase()));
  return okMock({ ...vm, documents: existing });
}

export default {
  updatePersonal, updateContact, updateEmergency, saveDocument,
};
