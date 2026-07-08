/**
 * Tipo de página para la lógica de logout cross-tab (1255576).
 *
 * "Página del Portal" = página de perfil del socio. Cuando una tab recibe un logout
 * desde OTRA tab y está en una página de Portal, se redirige a Home (P2=A). En Home o
 * páginas corporativas la tab se queda y solo actualiza el header a logged-out.
 */

/**
 * ¿`pathname` matchea `base` como SEGMENTO de ruta? Cubre el leaf pelado y el anidado,
 * sin falsos positivos (ej. `/remembers` NO matchea `/members`):
 *  - termina en `base`           → leaf pelado  (`/pt/members`        ~ `/members`)
 *  - contiene `base/`            → anidado      (`/pt/members/profile` ~ `/members`)
 * @param {string} pathname
 * @param {string} base  segmento sin barra final (ej. '/members', '/members/auth')
 * @returns {boolean}
 */
const matchesSegment = (pathname, base) => pathname.endsWith(base) || pathname.includes(`${base}/`);

/**
 * ¿La ruta actual es una "página del Portal" (perfil del socio)?
 * Portal = matchea (como segmento) algún `portalRoutes` y NINGÚN `portalExclude`.
 * Función pura: misma entrada → misma salida, sin efectos.
 * @param {string} pathname  window.location.pathname (ej. '/pt/members' o '/pt/members/profile')
 * @param {{portalRoutes?:string[], portalExclude?:string[]}} cfg  config de Members
 * @returns {boolean}
 */
// eslint-disable-next-line import/prefer-default-export
export function isPortalPage(pathname, cfg) {
  const routes = cfg?.portalRoutes || [];
  const exclude = cfg?.portalExclude || [];
  if (exclude.some((p) => matchesSegment(pathname, p))) return false;
  return routes.some((p) => matchesSegment(pathname, p));
}
