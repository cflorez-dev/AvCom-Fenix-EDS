import { fetchAEMData } from '../../utils/aem-data.js';

// Kill-switch maestro de TODA la funcionalidad Members. Mismo patrón que
// `AV_CENTRIBAL_CHAT_ENABLED` (centribal.js) y `AV_APIM_DIRECT_MODE` (apim-mode.js):
// booleano en el spreadsheet `environment.json` (content bus), editable SIN redeploy y
// POR ENTORNO. Permite mergear Members a producción APAGADA y encenderla luego editando
// el sheet (propaga por cache, o purge para inmediato).
//
// DEFAULT OFF (seguridad para "ship dark"): la AUSENCIA de la key ⇒ deshabilitado, así
// prod sale oscuro aunque nadie autore el sheet. Los entornos que hoy usan Members
// (UAT/nuxqa) deben setear `AV_MEMBERS_ENABLED = "true"` explícitamente. Solo el string
// exacto `"true"` enciende (fail-safe: cualquier otro valor/typo = off).
const FLAG_KEY = 'AV_MEMBERS_ENABLED';

let enabledCache = null;

/**
 * ¿Está habilitada la funcionalidad Members en este entorno?
 * Override QA por query param `?members=on|off` (no toca configuración), igual que el
 * `?chat=on|off` de centribal.js. Cachea el resultado a nivel de módulo (una sola lectura
 * de environment.json por página; fetchAEMData ya dedupea/cachea en memoria).
 * @returns {Promise<boolean>}
 */
export const isMembersEnabled = async () => {
  const { search = '', hostname = '' } = window.location;
  if (search.includes('members=off')) return false;
  if (search.includes('members=on')) return true;
  // MOCK-CLEANUP-1263924: en localhost, `?mockMembers=1` (dev-only, gate del
  // mock de sesión sin login) implica `members=on` automáticamente. Sin esto,
  // en entornos donde `AV_MEMBERS_ENABLED` no está seteado (p.ej. UAT vía el
  // proxy `aem up`), `initSession()` nunca corre y el mock queda anulado
  // (session store en `anonymous` → hero/rails no pintan). Solo aplica a
  // localhost/127.0.0.1; en qa/prod el flag mock se ignora aquí también.
  if (
    (hostname === 'localhost' || hostname === '127.0.0.1')
    && new URLSearchParams(search).get('mockMembers') === '1'
  ) {
    return true;
  }
  if (enabledCache !== null) return enabledCache;
  const config = await fetchAEMData('environment');
  const rows = Array.isArray(config?.data) ? config.data : [];
  const value = rows.find((r) => r?.Key?.trim?.() === FLAG_KEY)?.Text?.trim?.();
  enabledCache = value === 'true';
  return enabledCache;
};

/** Resetea el cache del flag (para tests). */
export const resetMembersFlagCache = () => {
  enabledCache = null;
};
