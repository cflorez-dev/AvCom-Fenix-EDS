// Lógica pura del flujo Upgrades (AVAEMF2P20-270): sin fetch, sin DOM.
// El contrato de /upgrades/validate está confirmado contra QA (ver spec
// docs/superpowers/specs/2026-07-23-upgrades-form-design.md):
// - PNR inexistente responde 200 con passengers/segments null (no 404).
// - upgradeStatus usa la ortografía del backend: 'elegible' | 'not_elegible'.
// - El servicio NO valida apellido (solo recibe header PNR): se compara en
//   el front contra passengers[].lastName.

export const UPGRADE_RESULT = {
  ELIGIBLE: 'ELIGIBLE',
  NO_AVAILABILITY: 'NO_AVAILABILITY',
  NOT_FOUND: 'NOT_FOUND',
  ERROR: 'ERROR',
};

export const normalizeName = (value) => String(value ?? '')
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .trim()
  .replace(/\s+/g, ' ')
  .toUpperCase();

export const mapValidateResult = ({
  ok, status, body, lastName,
}) => {
  if (!ok) return status === 404 ? UPGRADE_RESULT.NOT_FOUND : UPGRADE_RESULT.ERROR;
  if (!body || typeof body !== 'object') return UPGRADE_RESULT.ERROR;

  const passengers = Array.isArray(body.passengers) ? body.passengers : [];
  const segments = Array.isArray(body.segments) ? body.segments : [];
  if (!passengers.length || !segments.length) return UPGRADE_RESULT.NOT_FOUND;

  const target = normalizeName(lastName);
  const lastNameMatches = passengers.some((p) => normalizeName(p?.lastName) === target);
  if (!lastNameMatches) return UPGRADE_RESULT.NOT_FOUND;

  const hasEligible = segments.some((s) => s?.upgradeStatus === 'elegible');
  return hasEligible ? UPGRADE_RESULT.ELIGIBLE : UPGRADE_RESULT.NO_AVAILABILITY;
};

const normalizeLang = (lang) => String(lang ?? '').trim().toLowerCase();

/**
 * Lee una entrada de un mapa de configuración usando como llave el idioma del
 * usuario. Exige propiedad propia y valor string no vacío porque ese idioma sale
 * de una cookie que el usuario controla: un `map[lang]` a secas caería en
 * Object.prototype con cookies como `constructor` o `toString`, devolviendo una
 * función que terminaría interpolada en la URL.
 *
 * @param {Object<string, string>} [map]
 * @param {string} key - Idioma ya normalizado
 * @returns {string} El valor, o '' si no hay uno usable
 */
const pickOwnString = (map, key) => {
  const found = Object.prototype.hasOwnProperty.call(map || {}, key) ? map[key] : null;
  return typeof found === 'string' && found.trim() ? found.trim() : '';
};

/**
 * Traduce el idioma del usuario al idioma con que se arma la URL de MMB
 * (VSTS 1301186). Existe porque el sitio de destino no está publicado en todos
 * los idiomas del producto: el francés no tiene `/fr/`, así que se manda a `/en/`.
 *
 * Solo traduce lo que esté en el mapa; cualquier otro idioma pasa tal cual, y sin
 * idioma se devuelve lo recibido. Es a propósito: no hay whitelist estricta, para
 * no alterar el comportamiento de los casos que hoy funcionan.
 *
 * @param {string} lang - Idioma del usuario (cookie), p. ej. 'fr'
 * @param {Object<string, string>} [langMap] - Mapa origen → destino de getUpgradesConfig()
 * @returns {string} Idioma con que se resuelve el placeholder {lang}
 */
export const resolveMmbLang = (lang, langMap) => pickOwnString(langMap, normalizeLang(lang))
  || lang;

/**
 * Elige la URL base de MMB para un idioma. Un idioma puede tener URL propia
 * (key AV_UPGRADES_MMB_URL_<IDIOMA>) cuando su destino no se puede armar a partir
 * de la URL compartida cambiando el segmento de idioma — otro host u otra ruta.
 * Si no la tiene, se usa la URL compartida de siempre.
 *
 * La búsqueda es por el idioma **del usuario**, no por el ya traducido con el
 * langMap: la key se llama `_FR` porque significa "para un usuario en francés",
 * y buscar después de traducir la haría caer en la de inglés.
 *
 * @param {string} lang - Idioma del usuario (cookie)
 * @param {{ baseUrl: string, urlByLang?: Object<string, string> }} config
 * @returns {string} URL base a usar (aún puede traer el placeholder {lang})
 */
export const resolveMmbBaseUrl = (lang, { baseUrl, urlByLang }) => pickOwnString(
  urlByLang,
  normalizeLang(lang),
) || baseUrl;

export const buildMmbRedirectUrl = ({
  baseUrl, lang, pnr, lastName, langMap, urlByLang,
}) => {
  // Primero qué URL, después con qué idioma: si la URL propia de un idioma trae
  // {lang}, se resuelve con el mismo mapa que la compartida.
  const base = resolveMmbBaseUrl(lang, { baseUrl, urlByLang });
  const resolvedBase = base.replace('{lang}', resolveMmbLang(lang, langMap));
  const params = new URLSearchParams({ pnr, lastname: lastName, flow: 'mmb' });
  return `${resolvedBase}?${params.toString()}`;
};
