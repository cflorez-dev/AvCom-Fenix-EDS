import { login } from './login.service.js';
import { isPortalPage } from './page-type.js';
import { getMembersConfigSync } from './members-config.js';
import { isDevSessionMockEnabled } from './members-data.mock.js';

/**
 * Guardia de zona privada (1263924, Sub A; alinea con "Bloque 1 — Acceso y
 * privacidad" del 1263921).
 *
 * En páginas del Portal (`isPortalPage`), si la sesión NO está activa, redirige al
 * LOGIN usando el FLUJO EXISTENTE del proyecto (`login()` → guarda return-to +
 * `lmLogin`). NO reintroduce el redirect del script (`refreshLoginFlag=true`), que
 * rompe PKCE con E.EON.6: el silent refresh (camino `false`) ya lo intentó
 * `session.service` antes de transicionar a `expired`; si falló, tratamos al
 * usuario como no-logueado y redirigimos manualmente acá.
 *
 * Se invoca desde `session.service` SOLO en las transiciones a `anonymous`
 * (sin cookie) y `expired` (token revocado tras silent refresh fallido) — nunca
 * desde el valor inicial del signal, evitando redirigir a un usuario logueado
 * antes de validar la cookie.
 */
let guarding = false;

export function resetGuard() {
  guarding = false;
}

/** Home del POS/locale para el fallback. En una ruta del Portal el 1er segmento ES el
 * idioma (`/{lang}/members`); si no parece idioma, cae a `document.lang` → 'es'. Se deriva
 * del path (sin acoplar a otros servicios) para que el fallback sea robusto y síncrono. */
function homeForPos() {
  const seg = window.location.pathname.split('/')[1] || '';
  const lang = /^[a-z]{2}$/.test(seg) ? seg : (document.documentElement.lang || 'es');
  return `/${lang}/`;
}

/**
 * Redirige al login si estamos en una página del Portal y sin sesión. No-op fuera
 * del Portal (Home/corporativa se quedan donde están) o si ya se está redirigiendo.
 */
// eslint-disable-next-line import/prefer-default-export
export function guardPortalSession() {
  if (guarding || typeof window === 'undefined') return;
  // AEM author / Universal Editor: NUNCA redirigir dentro del editor (rompía la
  // autoría de páginas del Portal). Mismo idiom de detección que scripts.js
  // (markUniversalEditor). El guard real solo aplica en páginas publicadas.
  try {
    const isAuthorEnv = !!(
      window.xwalk?.isAuthorEnv
      || window.hlx?.aue
      || (typeof document !== 'undefined'
        && document.querySelector('meta[name="urn:auecon:aemconnection"]'))
      || (window.location.hostname.includes('author-')
        && window.location.pathname.startsWith('/content/'))
    );
    if (isAuthorEnv) return;
  } catch (e) { /* señales de author no disponibles → seguir con el guard normal */ }
  // MOCK-CLEANUP-1263924: modo mock dev (localhost + ?mockMembers=1) → NUNCA
  // redirigir. Quitar junto con el resto del andamiaje mock al cerrar el PBI.
  if (isDevSessionMockEnabled()) return;
  try {
    const cfg = getMembersConfigSync();
    if (!isPortalPage(window.location.pathname, cfg)) return;
    guarding = true;
    // Flujo de login existente. En modo 'redirect' (config actual) navega antes de
    // resolver, así que el `.then` no corre; la cortina (members-gate-pending) se
    // mantiene hasta esa navegación → sin flash de contenido.
    login()
      .then(() => {
        // Modo popup (no es la config actual): onSuccess resuelve SIN navegar. Quitamos
        // la cortina para no dejar la página en blanco y liberamos el lock.
        document.documentElement.classList.remove('members-gate-pending');
        guarding = false;
      })
      .catch(() => {
        // login NO pudo arrancar (LM no listo/timeout/env-config del host no registrado).
        // NO revelamos el contenido del Portal a un anónimo → fallback al home del POS.
        // La cortina sigue puesta hasta esta navegación, así que no hay flash.
        guarding = false;
        try { window.location.assign(homeForPos()); } catch (e) { /* no-op */ }
      });
  } catch (e) {
    // La guardia JAMÁS debe romper el flujo de sesión (fail-soft): ante cualquier
    // error (config no disponible, etc.) no redirige y libera el lock.
    guarding = false;
  }
}
