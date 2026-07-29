import { whenLmReady } from './lm-script.loader.js';
import { parseLmDate } from './account-profile.service.js';

/**
 * frequent-flyer.service — Acompañantes frecuentes del socio (1279361, decisión
 * P/D20). PRIMERA ESCRITURA REAL del lote contra LM vía wrapper `lmFrequentFlyer`
 * (Login Script Documentation 1.2.0, págs. 25-35). CRUD completo: get / add /
 * edit / remove.
 *
 * Contrato (resumen del plan):
 *  - Params base salen del `memberProfile` ya cargado (`profileParams`):
 *    companyCode, programCode, accountStatus, preferredLanguage.
 *  - `add` EXIGE `travelerCompanionCount` = largo ACTUAL de la lista (pág. 34).
 *  - `edit` manda `countryOfResidence` ORIGINAL (NO editable, pág. 31) y NO manda
 *    `partnerMembershipNumber` (solo-lectura tras crear).
 *  - `remove` manda los identificadores del `get`.
 *  - Respuesta OK = `header.code === '000'`. Otro code o string `E.EON.*` →
 *    `{ ok:false, error }`. `E.EON.20` → `error:'max'` (máximo alcanzado); resto
 *    → `error:'generic'` (popup genérico D20).
 *
 * Fail-soft total (mismo criterio que club-subscription): wrapper ausente/no
 * deployado/error → `{ ok:false, error:'unavailable' }` en el get (el módulo
 * muestra fail-soft, NO "0 acompañantes" falso).
 *
 * ⚠️ En tests/samples se usa SIEMPRE un `wrapperFn` mock — NUNCA el wrapper real.
 */

// --- Etiqueta de edad (D34, cerrada): Infante 0–2 · Niño 3–14 · Joven 15–17 ·
// Adulto ≥18. Bordes EXACTOS 2/3, 14/15, 17/18. ---

/**
 * Edad en años a partir de `{day,month,year}` (month 1-based). Pura → testeable.
 * @param {{day:number,month:number,year:number}|null} parts
 * @param {Date} [now]
 * @returns {number|null}
 */
export const computeAge = (parts, now = new Date()) => {
  if (!parts || !Number.isFinite(parts.year)) return null;
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  let age = y - parts.year;
  if (m < parts.month || (m === parts.month && d < parts.day)) age -= 1;
  return age >= 0 ? age : null;
};

/**
 * Banda de edad (key para i18n: ageInfant/ageChild/ageYoung/ageAdult). Pura.
 * @param {number|null} age
 * @returns {('infant'|'child'|'young'|'adult'|null)}
 */
export const ageBand = (age) => {
  if (age == null || !Number.isFinite(age)) return null;
  if (age <= 2) return 'infant';
  if (age <= 14) return 'child';
  if (age <= 17) return 'young';
  return 'adult';
};

const isEmpty = (v) => v == null || String(v).trim() === '';
const str = (v) => (isEmpty(v) ? '' : String(v));

/**
 * Proyecta una entrada cruda del `get` al VM de acompañante. Defensivo con los
 * nombres de campo (contrato real no 100% confirmado). Pura → testeable.
 * @param {object} raw
 * @param {Date} [now]
 */
export const toCompanionVM = (raw = {}, now = new Date()) => {
  const dobRaw = raw.dateOfBirth ?? raw.birthDate ?? raw.dob ?? '';
  const parts = parseLmDate(dobRaw);
  const age = computeAge(parts, now);
  return {
    nomineeReferenceNumber: str(raw.nomineeReferenceNumber ?? raw.referenceNumber),
    customerNumber: str(raw.customerNumber),
    accountGroupType: str(raw.accountGroupType),
    givenName: str(raw.givenName ?? raw.name ?? raw.firstName),
    familyName: str(raw.familyName ?? raw.lastName),
    gender: str(raw.gender),
    dateOfBirth: str(dobRaw),
    dateOfBirthParts: parts,
    age,
    ageBand: ageBand(age),
    countryOfResidence: str(raw.countryOfResidence ?? raw.country),
    lmNumber: str(raw.partnerMembershipNumber ?? raw.membershipNumber ?? raw.lmNumber),
    email: str(raw.emailAddress ?? raw.email),
    phone: str(raw.phoneNumber ?? raw.phone),
  };
};

/** Ordena acompañantes alfabéticamente por nombre completo. Pura. */
export const sortCompanions = (list) => (Array.isArray(list) ? list.slice() : []).sort((a, b) => {
  const na = `${a.givenName || ''} ${a.familyName || ''}`.trim().toLowerCase();
  const nb = `${b.givenName || ''} ${b.familyName || ''}`.trim().toLowerCase();
  return na.localeCompare(nb);
});

/** Mapea un code/string de error al tipo que consume la UI. */
const mapError = (raw) => (String(raw || '').toUpperCase().includes('EON.20') ? 'max' : 'generic');

/** Extrae la lista de acompañantes del envelope del get (defensivo). */
const extractList = (json) => {
  const cand = json?.frequentFlyers ?? json?.nominees ?? json?.travelerCompanions
    ?? json?.companions ?? json?.data?.frequentFlyers ?? [];
  return Array.isArray(cand) ? cand : [];
};

/**
 * Normaliza la respuesta del wrapper (Response o string `E.EON.*`) a
 * `{ ok, json?, error? }`. `header.code !== '000'` → error mapeado.
 */
const readEnvelope = async (res) => {
  if (typeof res === 'string') return { ok: false, error: mapError(res) };
  if (!(res instanceof Response) || !res.ok) return { ok: false, error: 'unavailable' };
  let json;
  try { json = await res.json(); } catch (e) { return { ok: false, error: 'generic' }; }
  const code = json?.header?.code;
  if (code != null && String(code) !== '000') return { ok: false, error: mapError(code), json };
  return { ok: true, json };
};

const resolveWrapper = async (wrapperFn) => {
  if (wrapperFn) return wrapperFn;
  await whenLmReady('lmFetchWrapper');
  return (typeof window !== 'undefined' && typeof window.lmFetchWrapper === 'function')
    ? window.lmFetchWrapper : null;
};

/** Params base comunes a todas las acciones (del memberProfile ya cargado). */
const baseParams = (action, profileParams) => ({
  action,
  companyCode: str(profileParams?.companyCode),
  programCode: str(profileParams?.programCode),
  accountStatus: str(profileParams?.accountStatus),
  preferredLanguage: str(profileParams?.preferredLanguage),
});

/**
 * GET — lista de acompañantes ordenada alfabéticamente. Fail-soft: wrapper
 * ausente/error → `{ ok:false, error:'unavailable' }` (NO lista vacía falsa).
 * @param {object} profileParams
 * @param {Function|null} wrapperFn
 * @returns {Promise<{ok:boolean, companions?:object[], error?:string}>}
 */
export async function getCompanions(profileParams, wrapperFn = null) {
  try {
    const fn = await resolveWrapper(wrapperFn);
    if (typeof fn !== 'function') return { ok: false, error: 'unavailable' };
    const res = await fn('lmFrequentFlyer', {
      action: 'get',
      companyCode: str(profileParams?.companyCode),
      programCode: str(profileParams?.programCode),
    }, false);
    const env = await readEnvelope(res);
    if (!env.ok) return { ok: false, error: env.error };
    const now = new Date();
    const companions = sortCompanions(extractList(env.json).map((c) => toCompanionVM(c, now)));
    return { ok: true, companions };
  } catch (e) {
    return { ok: false, error: 'unavailable' };
  }
}

/**
 * ADD — alta de acompañante. `travelerCompanionCount` = largo ACTUAL de la lista
 * (OBLIGATORIO, pág. 34). Si `data.partnerMembershipNumber` viene, se manda el
 * alta por número LM (los demás campos pueden omitirse, pág. 34).
 * @param {object} profileParams
 * @param {object} data { givenName, familyName, gender, dateOfBirth,
 *   countryOfResidence, partnerMembershipNumber? }
 * @param {number} currentCount largo actual de la lista
 * @param {Function|null} wrapperFn
 */
export async function addCompanion(profileParams, data = {}, currentCount = 0, wrapperFn = null) {
  try {
    const fn = await resolveWrapper(wrapperFn);
    if (typeof fn !== 'function') return { ok: false, error: 'unavailable' };
    const params = {
      ...baseParams('add', profileParams),
      travelerCompanionCount: Number.isFinite(Number(currentCount)) ? Number(currentCount) : 0,
    };
    if (!isEmpty(data.partnerMembershipNumber)) {
      // Alta por número LM: los demás campos pueden omitirse (pág. 34).
      params.partnerMembershipNumber = str(data.partnerMembershipNumber);
    } else {
      params.givenName = str(data.givenName);
      params.familyName = str(data.familyName);
      params.gender = str(data.gender);
      params.dateOfBirth = str(data.dateOfBirth);
      params.countryOfResidence = str(data.countryOfResidence);
    }
    const env = await readEnvelope(await fn('lmFrequentFlyer', params, false));
    return env.ok ? { ok: true } : { ok: false, error: env.error };
  } catch (e) {
    return { ok: false, error: 'generic' };
  }
}

/**
 * EDIT — edición de acompañante. Manda `countryOfResidence` ORIGINAL (NO editable,
 * pág. 31) y NUNCA `partnerMembershipNumber` (solo-lectura tras crear).
 * @param {object} profileParams
 * @param {object} companion VM original (con nomineeReferenceNumber + country original)
 * @param {object} changes campos editables (givenName, familyName, gender, dateOfBirth)
 * @param {Function|null} wrapperFn
 */
export async function editCompanion(profileParams, companion = {}, changes = {}, wrapperFn = null) {
  try {
    const fn = await resolveWrapper(wrapperFn);
    if (typeof fn !== 'function') return { ok: false, error: 'unavailable' };
    const params = {
      ...baseParams('edit', profileParams),
      nomineeReferenceNumber: str(companion.nomineeReferenceNumber),
      customerNumber: str(companion.customerNumber),
      accountGroupType: str(companion.accountGroupType),
      givenName: str(changes.givenName ?? companion.givenName),
      familyName: str(changes.familyName ?? companion.familyName),
      gender: str(changes.gender ?? companion.gender),
      dateOfBirth: str(changes.dateOfBirth ?? companion.dateOfBirth),
      // País de residencia ORIGINAL — NO editable (pág. 31).
      countryOfResidence: str(companion.countryOfResidence),
    };
    // Nunca mandar partnerMembershipNumber en edit (solo-lectura tras crear).
    const env = await readEnvelope(await fn('lmFrequentFlyer', params, false));
    return env.ok ? { ok: true } : { ok: false, error: env.error };
  } catch (e) {
    return { ok: false, error: 'generic' };
  }
}

/**
 * REMOVE — baja de acompañante con los identificadores del get.
 * @param {object} profileParams
 * @param {object} companion VM (nomineeReferenceNumber, customerNumber, accountGroupType)
 * @param {Function|null} wrapperFn
 */
export async function removeCompanion(profileParams, companion = {}, wrapperFn = null) {
  try {
    const fn = await resolveWrapper(wrapperFn);
    if (typeof fn !== 'function') return { ok: false, error: 'unavailable' };
    const params = {
      ...baseParams('remove', profileParams),
      nomineeReferenceNumber: str(companion.nomineeReferenceNumber),
      customerNumber: str(companion.customerNumber),
      accountGroupType: str(companion.accountGroupType),
    };
    const env = await readEnvelope(await fn('lmFrequentFlyer', params, false));
    return env.ok ? { ok: true } : { ok: false, error: env.error };
  } catch (e) {
    return { ok: false, error: 'generic' };
  }
}

export default {
  getCompanions, addCompanion, editCompanion, removeCompanion, computeAge, ageBand,
};
