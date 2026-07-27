import { whenLmReady } from './lm-script.loader.js';
import { profileFieldPresence } from './profile-completeness.js';

/**
 * account-profile.service — LECTURA del perfil COMPLETO del socio para la tab
 * "Datos" (1279361). Fuente: wrapper `memberProfile` (uno de los 3 que LM expone
 * hoy), mismo patrón best-effort que `members-elite.js` (`whenLmReady` +
 * `refreshLoginFlag=false`).
 *
 * ⚠️ **PII — NO PERSISTIR.** El VM que devuelve esta función contiene datos
 * sensibles (dirección, teléfono, email, documentos, contacto de emergencia).
 * Debe vivir SOLO en el estado en memoria del organism `MembersAccountData`.
 * PROHIBIDO escribirlo en `session.store`, localStorage, sessionStorage o
 * `console.log`. El `presence` (mapa de booleans, SIN PII) sí es seguro de usar
 * para la torta de completitud.
 *
 * El VM se divide por secciones (Figma "Data Panel"):
 *  - `personal`  — género, nombre/apellido, fecha de nacimiento, país, ciudad, dirección.
 *  - `contact`   — email, prefijo, teléfono + `hadValue` por campo (obligatoriedad
 *                  dinámica del AC 2.2: si LM trajo el dato → required al editar).
 *  - `emergency` — nombre completo (D33, un solo campo) + prefijo + teléfono.
 *                  Shape del wrapper NO confirmado (el contrato real vino `[]`):
 *                  mapeo defensivo, fail-soft a vacío.
 *  - `documents` — orden pasaporte → identidad, expiración SOLO si el wrapper la trae
 *                  (D23: si no viene → null → la UI muestra "no disponible").
 *  - `profileParams` — params que consume `frequent-flyer.service` (companyCode,
 *                  programCode, accountStatus, preferredLanguage, membershipNumber…).
 *  - `presence`  — `profileFieldPresence` (booleans, sin PII) para la torta.
 */

// Orden de documentos en lectura/edición: pasaporte ('P') → identidad ('I').
const DOC_ORDER = ['P', 'I'];

/** '' / null / undefined → true (campo vacío). */
const isEmpty = (v) => v == null || String(v).trim() === '';
/** Campo a string limpio ('' si vacío). */
const str = (v) => (isEmpty(v) ? '' : String(v));
/** Primer valor no vacío (como string), o ''. */
const pick = (...vals) => str(vals.find((v) => !isEmpty(v)));

/** Meses del formato LM ('DD-Mon-YYYY', ej. '15-May-1990'). */
const LM_MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/**
 * Parsea una fecha del wrapper LM ('DD-Mon-YYYY') a `{day,month,year}` (numbers).
 * Acepta también ISO 'YYYY-MM-DD'. Pura → testeable. No matchea → null.
 * @param {string} raw
 * @returns {{day:number,month:number,year:number}|null}
 */
export const parseLmDate = (raw) => {
  const s = String(raw || '').trim();
  if (!s) return null;
  const lm = s.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})/);
  if (lm) {
    const monthIdx = LM_MONTHS.indexOf(lm[2].toLowerCase());
    if (monthIdx >= 0) return { day: Number(lm[1]), month: monthIdx + 1, year: Number(lm[3]) };
  }
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return { day: Number(iso[3]), month: Number(iso[2]), year: Number(iso[1]) };
  return null;
};

/** Navega defensivo al nodo `memberProfile` del wrapper crudo. */
const pickMemberProfile = (raw) => raw?.memberProfileDetails?.memberAccount?.memberProfile || {};
const pickMemberAccount = (raw) => raw?.memberProfileDetails?.memberAccount || {};

/**
 * Proyecta la respuesta CRUDA de `memberProfile` al VM de la tab Datos. Pura →
 * testeable. Navega defensivo: cualquier nivel ausente → sección vacía sin romper.
 * @param {object} rawMemberProfile respuesta cruda (raíz con `memberProfileDetails`)
 * @returns {object} VM por secciones + presence + profileParams
 */
export const toAccountProfileVM = (rawMemberProfile) => {
  const acc = pickMemberAccount(rawMemberProfile);
  const mp = pickMemberProfile(rawMemberProfile);
  const ind = mp.individualInfo || {};
  const contact = (Array.isArray(ind.memberContactInfos) && ind.memberContactInfos[0]) || {};

  // Email/teléfono: preferimos el valor real de memberContactInfos; los flags
  // `preferred*` ("H"/"HP") son de preferencia, no el dato.
  const email = str(contact.emailAddress);
  const phone = str(contact.phoneNumber);
  const prefix = pick(contact.phoneCountryCode, contact.countryCode);

  const personal = {
    gender: str(ind.gender),
    givenName: str(ind.givenName),
    familyName: str(ind.familyName),
    fullName: [ind.givenName, ind.familyName].filter((x) => !isEmpty(x)).join(' '),
    dateOfBirth: str(ind.dateOfBirth),
    dateOfBirthParts: parseLmDate(ind.dateOfBirth),
    nationality: str(ind.memberNationality),
    country: pick(ind.countryOfResidence, contact.country),
    city: str(contact.city),
    addressLine: str(contact.addressLine1),
  };

  // Contacto de emergencia (D33): shape NO confirmado → mapeo defensivo. Un solo
  // campo de nombre completo (name directo, o given+family concatenados).
  const ec = (Array.isArray(mp.emergencyContact) && mp.emergencyContact[0]) || {};
  const emergency = {
    name: pick(ec.name, [ec.givenName, ec.familyName].filter((x) => !isEmpty(x)).join(' ')),
    prefix: pick(ec.phoneCountryCode, ec.countryCode),
    phone: str(ec.phoneNumber),
  };

  // Documentos: orden pasaporte → identidad. Expiración SOLO si el wrapper la
  // trae (D23): probamos `expiryDate`/`expirationDate`; ausente → null.
  const rawDocs = Array.isArray(mp.document) ? mp.document : [];
  const docRank = (t) => (DOC_ORDER.indexOf(t) >= 0 ? DOC_ORDER.indexOf(t) : DOC_ORDER.length);
  const documents = rawDocs
    .map((d) => {
      const type = String(d?.documentType || '').toUpperCase();
      const expiryRaw = d?.expiryDate ?? d?.expirationDate ?? null;
      return {
        type,
        number: str(d?.documentNumber),
        nationality: str(d?.issuedCountryCode),
        expiry: isEmpty(expiryRaw) ? null : String(expiryRaw),
        expiryParts: parseLmDate(expiryRaw),
      };
    })
    .sort((a, b) => docRank(a.type) - docRank(b.type));

  const profileParams = {
    companyCode: str(acc.companyCode),
    programCode: str(acc.programCode),
    accountStatus: str(acc.accountStatus),
    preferredLanguage: str(ind.preferredLanguage),
    membershipNumber: str(mp.membershipNumber),
    countryOfResidence: personal.country,
    nationality: personal.nationality,
  };

  return {
    ok: true,
    personal,
    contact: {
      email,
      prefix,
      phone,
      // Obligatoriedad dinámica (AC 2.2): required al editar SOLO si LM trajo el dato.
      hadValue: {
        email: !isEmpty(email),
        prefix: !isEmpty(prefix),
        phone: !isEmpty(phone),
      },
    },
    emergency,
    documents,
    profileParams,
    // Sin PII — seguro para la torta (completenessFromPresence en el organism).
    presence: profileFieldPresence(rawMemberProfile),
    // Seguridad (1279363): SOLO tenencia (boolean, sin PII). NO entra en `presence`
    // (P4: seguridad no puntúa la torta). El VALOR del PIN no está disponible.
    security: { hasPin: mp.pin === true },
  };
};

/**
 * Carga el perfil completo del socio vía wrapper `memberProfile` (best-effort,
 * patrón elite). Falla/ausente → `{ ok:false }` (el organism muestra fail-soft).
 * @param {Function|null} wrapperFn SOLO samples/tests: reemplaza el global
 *   `lmFetchWrapper` para inyectar fixtures sin el loader real de LM.
 * @returns {Promise<object>} VM (ver `toAccountProfileVM`) o `{ ok:false }`.
 */
export async function loadAccountProfile(wrapperFn = null) {
  try {
    if (!wrapperFn) await whenLmReady('lmFetchWrapper');
    const fn = wrapperFn
      || (typeof window !== 'undefined' ? window.lmFetchWrapper : null);
    if (typeof fn !== 'function') return { ok: false };
    const res = await fn('memberProfile', {}, false);
    // Wrapper NO deployado → string `E.EON.*` (no Response) → sin datos.
    if (!(res instanceof Response) || !res.ok) return { ok: false };
    const json = await res.json();
    return toAccountProfileVM(json);
  } catch (e) {
    return { ok: false }; // fail-soft
  }
}

export default { loadAccountProfile, toAccountProfileVM, parseLmDate };
