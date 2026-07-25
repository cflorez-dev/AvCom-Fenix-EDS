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

export const buildMmbRedirectUrl = ({
  baseUrl, lang, pnr, lastName,
}) => {
  const resolvedBase = baseUrl.replace('{lang}', lang);
  const params = new URLSearchParams({ pnr, lastname: lastName, flow: 'mmb' });
  return `${resolvedBase}?${params.toString()}`;
};
