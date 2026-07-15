import { showLoader as showCmsLoader } from '../loader/loader.service.js';
import { loadLmScript, whenLmReady } from './lm-script.loader.js';
import { loadMembersConfig } from './members-config.js';
import { classifyMembersError } from './members-error.js';
import { setSession } from './session.store.js';
import { emitCrossTab, MEMBERS_EVENTS } from './session.events.js';
import { getStoredLanguage } from '../header/language-country-selector.js';

const RETURN_TO_KEY = 'members-return-to';
const PENDING_ERROR_KEY = 'members-auth-pending-error';

/** Home del POS/locale: el POS da el idioma → home (ej. '/pt/'). */
function homeForPos() {
  const lang = getStoredLanguage() || document.documentElement.lang || 'pt';
  return `/${lang}/`;
}

/**
 * Muestra la cortina del bloque `cms-loader` (loader de marca autorado en /members/auth/*)
 * mientras el puente procesa. La cortina la decora `loadEager`; esperamos a que esté en el
 * DOM (techo ~1s vía rAF) y la mostramos vía loader.service. `loadLazy` NO la oculta en rutas
 * auth (guard en scripts.js), así que se mantiene hasta que el handler redirige.
 */
async function showLoader() {
  const nextFrame = () => new Promise((r) => {
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(r);
    else setTimeout(r, 16);
  });
  try {
    for (let i = 0; i < 60; i += 1) {
      // Entorno sin DOM o ya desmontado (tests): salir sin romper.
      if (typeof document === 'undefined' || typeof document.querySelector !== 'function') return;
      if (document.querySelector('.section.cms-loader-container')) break;
      // eslint-disable-next-line no-await-in-loop
      await nextFrame();
    }
    showCmsLoader(true);
  } catch (e) { /* sin curtain / entorno sin DOM: no-op */ }
}

/** Redirect a home guardando el error como pending (se muestra al cargar home). */
function redirectHomeWithError(code = 'auth') {
  try { sessionStorage.setItem(PENDING_ERROR_KEY, code); } catch (e) { /* ignore */ }
  window.location.assign(homeForPos());
}

/** callback → corre lmCompleteLogin (el script setea cookies + redirige a redirectAfterLogin).
 *  Si la callback vuelve con `?error=` (IdP/Keycloak rechazó, ej. One Tap sin PKCE) NO hay code
 *  que canjear: redirigimos al home + pending modal en vez de clavarse en /callback. */
async function handleCallback() {
  const params = new URLSearchParams(window.location.search);
  const err = params.get('error');
  if (err) {
    // eslint-disable-next-line no-console
    console.error('[members] callback error:', err, '·', params.get('error_description') || '');
    redirectHomeWithError(err);
    return;
  }
  await loadLmScript();
  await whenLmReady('lmCompleteLogin'); // event-driven, sin poll/timeout (robusto en red lenta)
  // lmCompleteLogin canjea el code y redirige en éxito; ante error DEVUELVE un string `E.EON.*`
  // (verificado: One Tap sin code_verifier/PKCE → `E.EON.6`). Si falla, redirigimos al home
  // + pending modal (la callback vuelve con `?code=`, no `?error=`, así que el guard de
  // arriba no lo cubre).
  let result;
  try {
    result = await window.lmCompleteLogin();
  } catch (e) {
    result = 'E.EON.exception';
  }
  if (typeof result === 'string' && result.startsWith('E.EON')) {
    // eslint-disable-next-line no-console
    console.error('[members] lmCompleteLogin falló:', result);
    redirectHomeWithError(result);
  }
}

/** ¿`p` es una ruta same-origin relativa segura ('/algo')? Descarta absolutas y
 * protocol-relative ('//evil.com') por si el valor (sessionStorage o CF) fue manipulado. */
const isSafePath = (p) => typeof p === 'string' && p.startsWith('/') && !p.startsWith('//');

/**
 * redirect-login → placeholder de sesión (real = 1255354), emite login-success
 * y redirige según el destino CONFIGURABLE desde el CF (authConfig.loginReturnTo):
 *  - 'origin' → vuelve a la página donde se hizo click (ruta guardada en sessionStorage).
 *  - 'url'    → a la ruta fija `authConfig.loginReturnUrl` (ej. '/es/members'), per-locale.
 *  - cualquier otro valor ('home' / ausente) → home del POS.
 * Solo se aceptan rutas same-origin relativas ('/algo'); el resto cae al home (anti open-redirect).
 */
async function handleRedirectLogin() {
  const cfg = await loadMembersConfig();
  setSession({ status: 'authenticated' });
  emitCrossTab(MEMBERS_EVENTS.LOGIN_SUCCESS, {});
  let dest = homeForPos();
  if (cfg.loginReturnTo === 'origin') {
    const saved = sessionStorage.getItem(RETURN_TO_KEY);
    if (isSafePath(saved)) dest = saved;
  } else if (cfg.loginReturnTo === 'url' && isSafePath(cfg.loginReturnUrl)) {
    dest = cfg.loginReturnUrl;
  }
  sessionStorage.removeItem(RETURN_TO_KEY);
  window.location.assign(dest);
}

/** redirect-logout → limpia estado a anonymous, emite logout, redirige según config. */
async function handleRedirectLogout() {
  setSession({ status: 'anonymous', user: null, error: null });
  emitCrossTab(MEMBERS_EVENTS.LOGOUT, {});
  sessionStorage.removeItem(RETURN_TO_KEY);
  // CU-292: logout.redirectTo desde config (query ?redirectTo=...). Valida same-origin.
  const params = new URLSearchParams(window.location.search);
  let dest = homeForPos();
  const customDest = params.get('redirectTo');
  if (customDest && customDest.startsWith('/') && !customDest.startsWith('//')) {
    dest = decodeURIComponent(customDest);
  }
  window.location.assign(dest);
}

/** Lee el pending auth-error de sessionStorage, lo CLASIFICA y muestra su modal sobre home
 *  (cada page load) vía el host central. Errores de callback (`?error=`, `E.EON.*`) → su key del
 *  CF; lo no reconocido cae a `generic-error`. Reusa el sistema único de modales (1255601). */
export async function showPendingErrorModal() {
  let code;
  try { code = sessionStorage.getItem(PENDING_ERROR_KEY); } catch (e) { code = null; }
  if (!code) return;
  try { sessionStorage.removeItem(PENDING_ERROR_KEY); } catch (e) { /* ignore */ }
  const key = classifyMembersError(code) || 'generic-error';
  // Carga lazy del host (no eager-importar la UI de modales en el bundle de la ruta puente).
  const { showMembersModal } = await import('./members-modal-host.js');
  await showMembersModal(key);
}

const ROUTES = [
  { match: '/members/auth/callback', handler: handleCallback },
  { match: '/members/auth/redirect-login', handler: handleRedirectLogin },
  { match: '/members/auth/redirect-logout', handler: handleRedirectLogout },
];

/**
 * Disparador por ruta de las páginas-puente members/auth/* (reemplaza al bloque members-auth).
 * Detecta la ruta, muestra el loader y corre la lógica del modo. Se invoca desde scripts.js.
 */
// eslint-disable-next-line import/prefer-default-export
export async function handleAuthRoute() {
  const route = ROUTES.find((r) => window.location.pathname.includes(r.match));
  if (!route) return;
  showLoader();
  await route.handler();
}
