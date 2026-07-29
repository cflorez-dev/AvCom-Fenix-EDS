/**
 * Darksite Detail — helpers LIVIANOS (sin Preact ni componentes DS) para razonar
 * sobre las landings de detalle de afectación de vuelo (`/darksite/{lang}/...`).
 *
 * Vive separado de `darksite-chrome.js` (que sí importa Preact + organismos DS)
 * para que el gate (loadEager, corre en TODAS las páginas) pueda importar esta
 * lógica sin arrastrar el peso del chrome. El chrome real solo se carga en
 * loadLazy cuando la página efectivamente es una landing darksite activa.
 *
 * Spec: docs/superpowers/specs/2026-07-07-darksite-design.md §3.5 / §7bis.5
 */
import { fetchAEMData } from '../../utils/aem-data.js';

export const DEFAULT_DETAIL_ROOT = '/darksite/';
export const DEFAULT_LANG = 'es';
// Idiomas soportados por el árbol darksite (misma fuente de verdad que el service).
export const SUPPORTED_LANGS = new Set(['es', 'en', 'pt', 'fr']);

/**
 * Lee el árbol de las landings de detalle desde environment.json
 * (`AV_DARKSITE_DETAIL_PAGES_ROOT`). NO está quemado: `/darksite/` es solo el
 * fallback si la variable falta. El operador puede reapuntar el árbol sin deploy.
 */
export const readDetailPagesRoot = async () => {
  try {
    const env = await fetchAEMData('environment');
    const rows = Array.isArray(env?.data) ? env.data : [];
    const value = rows.find((item) => item.Key === 'AV_DARKSITE_DETAIL_PAGES_ROOT')?.Text?.trim();
    return value || DEFAULT_DETAIL_ROOT;
  } catch (e) {
    return DEFAULT_DETAIL_ROOT;
  }
};

/**
 * Normaliza el root a su base sin barra final ('/darksite/' -> '/darksite') y
 * matchea la ruta exacta o cualquier descendiente. Language-agnostic: el
 * segmento {lang} queda dentro del subárbol, así que no hay que enumerarlo.
 */
export const isUnderDetailRoot = (pathname, root) => {
  const base = String(root || '').replace(/\/+$/, '');
  if (!base) return false;
  const path = String(pathname || '');
  return path === base || path.startsWith(`${base}/`);
};

/**
 * ¿Debe ESTA página aplicar el ESTILO darksite (multitab con tabs estirados,
 * indicador oscuro, etc.)? Solo cuando el evento está activo (`state.enabled`)
 * Y la ruta cuelga del root de detail pages (`root`, que viene de
 * `readDetailPagesRoot()` → env `AV_DARKSITE_DETAIL_PAGES_ROOT`, NO quemado).
 *
 * Motivo: el flag `av-darksite-state` es GLOBAL para el POS afectado, así que
 * gatear el estilo solo por `enabled` lo filtra a páginas normales mientras hay
 * un evento activo. Este helper acota el tratamiento a las rutas darksite.
 * `state` es el objeto ya parseado de `av-darksite-state` (o null); tolera
 * null / enabled ausente devolviendo false.
 *
 * @param {string} pathname
 * @param {string} root
 * @param {{enabled?: boolean}|null|undefined} state
 * @returns {boolean}
 */
export const isDarksiteStyleActive = (pathname, root, state) => (
  state?.enabled === true && isUnderDetailRoot(pathname, root)
);

/**
 * Idioma DE LA PÁGINA, relativo al root configurado: es el primer segmento
 * DESPUÉS del root (`{root}/{lang}/...`). Todo el árbol es multiidioma bajo el
 * mismo root, así que el idioma no está atado a `/darksite/` literal — se deriva
 * del root que venga de la env var. Si el primer segmento tras el root no es un
 * idioma soportado (es/en/pt/fr), cae a `es` (default seguro).
 *
 * Ej. root `/darksite/`  + `/darksite/en/flight-info`  => 'en'
 *     root `/contingencia/` + `/contingencia/pt/x`     => 'pt'
 */
export const detectDarksiteLang = (pathname, root = DEFAULT_DETAIL_ROOT) => {
  const base = String(root || '').replace(/\/+$/, '');
  const path = String(pathname || '');
  let rest = path;
  if (base && (path === base || path.startsWith(`${base}/`))) {
    rest = path.slice(base.length);
  }
  const segment = rest.replace(/^\/+/, '').split('/')[0].toLowerCase();
  return SUPPORTED_LANGS.has(segment) ? segment : DEFAULT_LANG;
};
