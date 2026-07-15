/**
 * profile-completeness.js — cálculo de completitud del perfil del socio para el
 * badge de la card "Gestión de cuenta" del Dashboard (PBI 1263921, "Bloque 4").
 *
 * **La data ya existe:** sale del wrapper `memberProfile` (uno de los 3 que LM
 * expone hoy), por lo que este badge NO está bloqueado por fuente de datos
 * (a diferencia de la card "Actividad de millas").
 *
 * **Las reglas son editables desde AEM** (ESPEC-CF-DASHBOARD-CARDS.md §3.2):
 *  - `profileCompletenessFields`: qué campos cuentan para "completo" (ids estables).
 *  - `profileCompletenessThreshold`: % mínimo para considerar el perfil "completo".
 * Acá viven los **defaults** hasta que el PO los confirme; el CF los override-a.
 *
 * ⚠️ **NO guarda PII.** Solo evalúa PRESENCIA (lleno/vacío) por campo y devuelve un
 * resumen (porcentaje + lista de `missing` por id de campo). El caller
 * (`session.service.toUserVM`) puede exponer este resumen en el VM sin filtrar
 * datos sensibles, alineado con el diseño "VM mínimo sin datos sensibles".
 */

/** Un campo está "lleno" si no es null/undefined/'' (trim). */
const isFilled = (v) => v !== null && v !== undefined && String(v).trim() !== '';

/**
 * Predicados de "campo lleno" por **id estable** (los ids NO se traducen). El CF
 * manda la LISTA de ids que cuentan; acá vive el check de cada uno, sobre el
 * shape normalizado de `extractProfileFields`. Para soportar un id nuevo desde el
 * CF, agregar acá su check (si el CF manda un id sin check, se ignora — defensivo).
 */
export const COMPLETENESS_CHECKS = {
  firstName: (p) => isFilled(p.givenName),
  lastName: (p) => isFilled(p.familyName),
  dateOfBirth: (p) => isFilled(p.dateOfBirth),
  nationality: (p) => isFilled(p.nationality),
  email: (p) => isFilled(p.email),
  phone: (p) => isFilled(p.phone),
  // Dirección "completa" = al menos línea + ciudad + país (zipCode "0" es placeholder).
  address: (p) => isFilled(p.addressLine) && isFilled(p.city) && isFilled(p.country),
  // Al menos un documento cargado. `documentId` es el id que usa el CF autorado
  // (`profileCompletenessFields`); `travelDocument` es alias por compatibilidad.
  documentId: (p) => p.documentCount > 0,
  travelDocument: (p) => p.documentCount > 0,
};

/**
 * Set DEFAULT de campos que cuentan para la completitud (propuesta para el PO).
 * Cubre identidad + contacto + documento de viaje. El PO/CF puede recortar o ampliar.
 */
export const DEFAULT_COMPLETENESS_FIELDS = [
  'firstName',
  'lastName',
  'dateOfBirth',
  'nationality',
  'email',
  'phone',
  'address',
  'travelDocument',
];

/** Umbral default (ESPEC §3.2: 100 = todos los campos requeridos llenos). */
export const DEFAULT_COMPLETENESS_THRESHOLD = 100;

/**
 * Normaliza la respuesta CRUDA de `memberProfile` a los campos planos que usan los
 * checks. Navega defensivo: si falta cualquier nivel, los campos quedan undefined
 * (→ "vacío") sin romper.
 * @param {object} rawMemberProfile  respuesta cruda del wrapper memberProfile
 * @returns {object}
 */
export function extractProfileFields(rawMemberProfile) {
  const acc = rawMemberProfile?.memberProfileDetails?.memberAccount;
  const mp = acc?.memberProfile || {};
  const ind = mp.individualInfo || {};
  const contact = (Array.isArray(ind.memberContactInfos) && ind.memberContactInfos[0]) || {};
  return {
    givenName: ind.givenName,
    familyName: ind.familyName,
    dateOfBirth: ind.dateOfBirth,
    nationality: ind.memberNationality,
    // `preferredEmailAddress`/`preferredPhoneNumber` son flags de preferencia ("H"),
    // el valor real puede estar en `memberContactInfos`. Tomamos el que esté lleno.
    email: isFilled(ind.preferredEmailAddress) ? ind.preferredEmailAddress : contact.emailAddress,
    phone: isFilled(ind.preferredPhoneNumber) ? ind.preferredPhoneNumber : contact.phoneNumber,
    addressLine: contact.addressLine1,
    city: contact.city,
    country: contact.country,
    documentCount: Array.isArray(mp.document) ? mp.document.length : 0,
  };
}

/**
 * Mapa de PRESENCIA por campo (booleans) evaluando TODOS los checks conocidos
 * sobre el `memberProfile` crudo. **No contiene PII** — solo lleno/vacío — por lo
 * que es seguro exponerlo en el VM de sesión (`toUserVM`). El cálculo de
 * completitud (qué campos cuentan + umbral) se hace aparte con
 * `completenessFromPresence`, donde están disponibles las reglas del CF.
 * @param {object} rawMemberProfile
 * @returns {Object<string,boolean>} ej. `{ firstName:true, address:false, documentId:true, ... }`
 */
export function profileFieldPresence(rawMemberProfile) {
  const p = extractProfileFields(rawMemberProfile);
  return Object.keys(COMPLETENESS_CHECKS).reduce((acc, id) => {
    acc[id] = !!COMPLETENESS_CHECKS[id](p);
    return acc;
  }, {});
}

/**
 * Calcula la completitud a partir de un MAPA DE PRESENCIA (booleans) + reglas.
 * Es la forma que usa el organism: el VM trae la presencia (sin PII) y el CF
 * trae las reglas.
 * @param {Object<string,boolean>} presence  mapa de `profileFieldPresence`
 * @param {object} [rules]  { fields?:string[], threshold?:number } (del CF; defaults abajo)
 * @returns {{ complete:boolean, percent:number, filled:number, total:number, missing:string[] }}
 */
export function completenessFromPresence(presence = {}, rules = {}) {
  const requested = (Array.isArray(rules.fields) && rules.fields.length)
    ? rules.fields
    : DEFAULT_COMPLETENESS_FIELDS;
  const threshold = Number.isFinite(rules.threshold)
    ? rules.threshold
    : DEFAULT_COMPLETENESS_THRESHOLD;

  // Solo ids con check conocido (un id desconocido del CF se ignora, no rompe).
  const fields = requested.filter((f) => typeof COMPLETENESS_CHECKS[f] === 'function');
  const total = fields.length;
  if (!total) {
    return {
      complete: false, percent: 0, filled: 0, total: 0, missing: [],
    };
  }
  const missing = fields.filter((f) => presence[f] !== true);
  const filled = total - missing.length;
  const ratio = (filled / total) * 100; // exacto para decidir; redondeado para mostrar
  return {
    complete: ratio >= threshold,
    percent: Math.round(ratio),
    filled,
    total,
    missing,
  };
}

/**
 * Calcula la completitud del perfil directo desde el wrapper `memberProfile`
 * (atajo = presencia + reglas en un paso).
 * @param {object} rawMemberProfile
 * @param {object} [rules]  { fields?:string[], threshold?:number }
 * @returns {{ complete:boolean, percent:number, filled:number, total:number, missing:string[] }}
 */
export function computeProfileCompleteness(rawMemberProfile, rules = {}) {
  return completenessFromPresence(profileFieldPresence(rawMemberProfile), rules);
}
