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
export const resolveMmbLang = (lang, langMap) => {
  const normalized = String(lang ?? '').trim().toLowerCase();
  // Se exige propiedad propia y valor string: el idioma viene de una cookie que
  // el usuario controla, y un `langMap[lang]` a secas caería en Object.prototype
  // con cookies como `constructor` o `toString`, devolviendo una función que
  // terminaría interpolada en la URL.
  const found = Object.prototype.hasOwnProperty.call(langMap || {}, normalized)
    ? langMap[normalized]
    : null;
  return typeof found === 'string' && found ? found : lang;
};

export const buildMmbRedirectUrl = ({
  baseUrl, lang, pnr, lastName, langMap,
}) => {
  const resolvedBase = baseUrl.replace('{lang}', resolveMmbLang(lang, langMap));
  const params = new URLSearchParams({ pnr, lastname: lastName, flow: 'mmb' });
  return `${resolvedBase}?${params.toString()}`;
};
