/**
 * Lógica PURA del organism de la tab Datos (1279361). Sin DOM/preact → testeable.
 * Formato de fecha por idioma (AC), completitud por sección (chips del banner) y
 * helpers de opciones (género, país geo-first).
 */

import { completenessFromPresence } from '../../../scripts/services/members/profile-completeness.js';

const INTL_LOCALE = {
  es: 'es-ES', en: 'en-US', fr: 'fr-FR', pt: 'pt-BR',
};

/**
 * Formatea la fecha de nacimiento en formato Figma **"Mes DD, YYYY"** (mes largo
 * capitalizado + día, año). Spec `1056:32519` / `1223:13377` (perfil-completo).
 * Se usa el mismo patrón en TODOS los idiomas (mes long del locale + capitalize)
 * para consistencia visual con Figma. Pura.
 * @param {{day:number,month:number,year:number}|null} parts (month 1-based)
 * @param {string} lang
 * @returns {string} '' si no hay fecha
 * @example formatDob({day:14, month:11, year:1997}, 'es') → 'Noviembre 14, 1997'
 * @example formatDob({day:14, month:11, year:1997}, 'en') → 'November 14, 1997'
 */
export const formatDob = (parts, lang = 'es') => {
  if (!parts || !Number.isFinite(parts.year)) return '';
  const locale = INTL_LOCALE[String(lang).toLowerCase().slice(0, 2)] || INTL_LOCALE.es;
  const day = parts.day || 1;
  try {
    const d = new Date(parts.year, (parts.month || 1) - 1, day);
    const monthLong = new Intl.DateTimeFormat(locale, { month: 'long' }).format(d);
    const monthCap = monthLong.charAt(0).toLocaleUpperCase(locale) + monthLong.slice(1);
    return `${monthCap} ${day}, ${parts.year}`;
  } catch (e) {
    return `${day}/${parts.month}/${parts.year}`;
  }
};

/** Etiqueta de género por código LM ('M'/'F'/otro) → i18n. */
export const genderLabel = (code, labels = {}) => {
  const c = String(code || '').toUpperCase();
  if (c === 'M') return labels.genderMale || '';
  if (c === 'F') return labels.genderFemale || '';
  if (!c || c === 'U') return '';
  return labels.genderOther || '';
};

/** Opciones del Select de género. */
export const genderOptions = (labels = {}) => [
  { value: 'M', label: labels.genderMale || 'Masculino' },
  { value: 'F', label: labels.genderFemale || 'Femenino' },
  { value: 'O', label: labels.genderOther || 'Otro' },
];

const notEmpty = (v) => v != null && String(v).trim() !== '';

/**
 * Completitud por sección (para el chip complete/incomplete y el checklist del
 * banner). Reglas pragmáticas por sección. Pura.
 * @param {string} key personal|contact|emergency|documents
 * @param {object} vm VM del perfil (account-profile.service)
 * @returns {boolean}
 */
export const sectionComplete = (key, vm = {}) => {
  const p = vm.personal || {};
  const c = vm.contact || {};
  const e = vm.emergency || {};
  const docs = Array.isArray(vm.documents) ? vm.documents : [];
  switch (key) {
    case 'personal':
      return notEmpty(p.gender) && notEmpty(p.country)
        && notEmpty(p.city) && notEmpty(p.addressLine);
    case 'contact':
      return notEmpty(c.email) && notEmpty(c.prefix) && notEmpty(c.phone);
    case 'emergency':
      return notEmpty(e.name) && notEmpty(e.prefix) && notEmpty(e.phone);
    case 'documents':
      return docs.length > 0;
    default:
      return false;
  }
};

/**
 * Completitud de UN documento (chip verde vs. "Información incompleta" en
 * `DocumentReadCard`). Reglas por tipo:
 *  - Pasaporte ('P'): number + nationality + expiry (fecha obligatoria en Figma
 *    1056:32574 / 1056:32744).
 *  - Otros (CC/I/N…): number + nationality.
 * Pura.
 * @param {{type?:string, number?:string, nationality?:string, expiry?:string}} doc
 * @returns {boolean}
 */
export const isDocComplete = (doc = {}) => {
  const hasNumber = notEmpty(doc.number);
  const hasNationality = notEmpty(doc.nationality);
  const type = String(doc.type || '').toUpperCase();
  if (type === 'P') return hasNumber && hasNationality && notEmpty(doc.expiry);
  return hasNumber && hasNationality;
};

/**
 * Secciones INCOMPLETAS para el checklist del banner (chips ancla). Solo las que
 * faltan; al 100% queda vacío. Pura.
 * @param {object} vm
 * @param {object} labels
 * @returns {Array<{key:string,label:string}>}
 */
export const incompleteSections = (vm = {}, labels = {}) => {
  const map = [
    { key: 'personal', label: labels.sectionPersonal },
    { key: 'contact', label: labels.sectionContact },
    { key: 'emergency', label: labels.sectionEmergency },
    { key: 'documents', label: labels.panelDocuments },
  ];
  return map.filter((s) => !sectionComplete(s.key, vm));
};

/**
 * Completitud global (donut) a partir del `presence` (sin PII) + reglas.
 * @param {object} presence mapa de booleans (profileFieldPresence)
 * @param {object} [rules] { fields?, threshold? } del CF
 * @returns {{percent:number, pending:number, complete:boolean}}
 */
export const donutCompleteness = (presence, rules = {}) => {
  const res = completenessFromPresence(presence || {}, rules);
  return { percent: res.percent, pending: res.missing.length, complete: res.percent >= 100 };
};

/**
 * Ordena opciones de país geo-first (el país guardado del POS primero). Pura.
 * @param {Array<{value:string,label:string}>} options
 * @param {string} storedCountry código guardado
 */
export const geoFirst = (options, storedCountry) => {
  const list = Array.isArray(options) ? options.slice() : [];
  const code = String(storedCountry || '').toLowerCase();
  if (!code) return list;
  const idx = list.findIndex((o) => String(o.value).toLowerCase() === code);
  if (idx <= 0) return list;
  const [pref] = list.splice(idx, 1);
  return [pref, ...list];
};

/** Clave de localStorage del dismiss del banner 100% (D25, con membershipNumber, SIN PII). */
export const dismissKey = (membershipNumber) => `members.account.completeDismissed.${membershipNumber || 'anon'}`;
