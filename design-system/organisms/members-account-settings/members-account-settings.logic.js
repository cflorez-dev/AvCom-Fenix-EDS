/**
 * Lógica PURA del organism de la tab Ajustes (1279363). Sin DOM/preact →
 * testeable. Resolución de opt-ins (config + override de localStorage + i18n),
 * key de persistencia INTERINA (D12), opciones de método de verificación y saneo
 * defensivo de links del copy.
 *
 * ⚠️ PII (regla dura del lote): la ÚNICA escritura a localStorage permitida acá es
 * el mapa de opt-ins `{ [id]: boolean }` — SOLO ids + boolean, CERO PII. Nada de
 * password/PIN/método toca storage.
 */

/** Clave de localStorage del mapa de opt-ins (con membershipNumber, SIN PII). */
export const optInsStorageKey = (membershipNumber) => `members.account.optins.${membershipNumber || 'anon'}`; // INTERINO (D12)

// Método de verificación → key de i18n de su etiqueta.
const METHOD_LABEL_KEY = {
  sms: 'methodSms',
  email: 'methodEmail',
  authenticator: 'methodAuthenticator',
};

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

/**
 * Fuerza `target="_blank" rel="noopener noreferrer"` en los `<a>` que no tengan
 * `target` (copy del CF que puede omitirlo). Puro, regex defensivo: no duplica
 * `target` ni `rel` si ya están presentes.
 * @param {string} html
 * @returns {string}
 */
export const forceBlankLinks = (html) => {
  const s = String(html || '');
  if (!s) return '';
  return s.replace(/<a\b([^>]*)>/gi, (match, attrs) => {
    if (/\btarget\s*=/i.test(attrs)) return match; // ya define target → intacto
    const rel = /\brel\s*=/i.test(attrs) ? '' : ' rel="noopener noreferrer"';
    return `<a${attrs} target="_blank"${rel}>`;
  });
};

/**
 * Resuelve la lista de opt-ins a renderizar. Parte de `config.settings.optIns`
 * (id + defaultOn), overridea `checked` con el mapa persistido si trae el id, y
 * resuelve `title`/`copyHtml` por id desde i18n (`optIn<Id>Title`/`optIn<Id>Copy`).
 * Ítem sin `title` en i18n → se OMITE (defensivo). El copy pasa por `forceBlankLinks`.
 * @param {Array<{id:string, defaultOn?:boolean}>} configOptIns
 * @param {Object<string,boolean>} [storedMap] mapa persistido `{ [id]: boolean }`
 * @param {Object} [labels] copies i18n
 * @returns {Array<{id:string, title:string, copyHtml:string, checked:boolean}>}
 */
export const resolveOptIns = (configOptIns, storedMap = {}, labels = {}) => {
  const list = Array.isArray(configOptIns) ? configOptIns : [];
  const stored = storedMap && typeof storedMap === 'object' ? storedMap : {};
  return list
    .map((o) => {
      const id = o && o.id;
      if (!id) return null;
      const cap = capitalize(id);
      const title = labels[`optIn${cap}Title`];
      if (!title) return null; // sin label → omitir (defensivo)
      const copyHtml = forceBlankLinks(labels[`optIn${cap}Copy`] || '');
      const checked = Object.prototype.hasOwnProperty.call(stored, id)
        ? stored[id] === true
        : o.defaultOn === true;
      return {
        id, title, copyHtml, checked,
      };
    })
    .filter(Boolean);
};

/**
 * Lee el mapa de opt-ins persistido `{ [id]: boolean }` (INTERINO, D12). Filtra a
 * SOLO ids→boolean (defensivo, sin PII). Storage no disponible / corrupto → `{}`.
 * @param {string} membershipNumber
 * @returns {Object<string,boolean>}
 */
export const readOptIns = (membershipNumber) => {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(optInsStorageKey(membershipNumber));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    const out = {};
    Object.keys(parsed).forEach((k) => {
      if (typeof parsed[k] === 'boolean') out[k] = parsed[k];
    });
    return out;
  } catch (e) {
    return {};
  }
};

/**
 * Persiste UN opt-in en el mapa INTERINO (D12). SOLO id→boolean (cero PII). Storage
 * no disponible → no-op (`false`). El estado en memoria del organism es la fuente
 * de verdad; esto es best-effort hasta el contrato CDP.
 * @param {string} membershipNumber
 * @param {string} id
 * @param {boolean} value
 * @returns {boolean} true si persistió
 */
export const writeOptIn = (membershipNumber, id, value) => {
  try {
    if (typeof localStorage === 'undefined' || !id) return false;
    const map = readOptIns(membershipNumber);
    map[id] = value === true;
    localStorage.setItem(optInsStorageKey(membershipNumber), JSON.stringify(map));
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Opciones del `Select` de método de verificación, filtradas por
 * `config.settings.verificationMethods` y etiquetadas por i18n. Método sin label
 * conocido → se omite.
 * @param {string[]} methods
 * @param {Object} [labels]
 * @returns {Array<{value:string, label:string}>}
 */
export const verificationMethodOptions = (methods, labels = {}) => {
  const list = Array.isArray(methods) ? methods : [];
  return list
    .map((m) => {
      const key = METHOD_LABEL_KEY[m];
      const label = key ? labels[key] : '';
      return label ? { value: m, label } : null;
    })
    .filter(Boolean);
};

/** Etiqueta i18n de un método de verificación (lectura). '' si desconocido. */
export const methodLabel = (method, labels = {}) => {
  const key = METHOD_LABEL_KEY[method];
  return (key && labels[key]) || '';
};
