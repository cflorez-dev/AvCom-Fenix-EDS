import { loadLmScript, whenLmReady } from './lm-script.loader.js';
import { getStoredLanguage } from '../header/language-country-selector.js';
import { loadMembersConfig } from './members-config.js';

/**
 * Cierra la sesión de Lifemiles. `window.lmLogout()` (lo expone el script LM):
 *  1. Borra las cookies de sesión (access_token, id_token, refresh_token, userinfo).
 *  2. Redirige al logout de Keycloak (LOGOUT_URL_BASE) → mata la sesión SSO →
 *     vuelve a `redirectAfterLogout` = /members/auth/redirect-logout, donde el handler
 *     (members-auth.route.js#handleRedirectLogout) limpia el estado local a anonymous,
 *     emite el evento cross-tab y redirige según la config (home del POS o URL custom).
 *
 * Es el espejo de `login.service.js`. NO seteamos __LM_LOGIN_CONFIG__: el script lo
 * arma solo y lmLogout lo lee de ahí.
 *
 * Fallback: si el script LM no está disponible (ej. Lifemiles caído), navegamos directo
 * a la ruta puente para limpiar al menos el estado local — el usuario NUNCA queda
 * atrapado logueado por una caída del proveedor.
 */

/** Ruta puente de logout con idioma del POS y URL custom (CU-292). Handler valida query param. */
async function logoutBridge() {
  const lang = getStoredLanguage() || document.documentElement.lang || 'pt';
  let bridge = `/${lang}/members/auth/redirect-logout`;
  try {
    const cfg = await loadMembersConfig();
    // Si logout.redirectTo seteado, pasarlo como query param (?redirectTo=/path).
    // Vacío = home del POS (default). Handler valida same-origin.
    if (cfg.logout?.redirectTo) {
      const param = encodeURIComponent(cfg.logout.redirectTo);
      bridge += `?redirectTo=${param}`;
    }
  } catch (e) { /* fallback sin custom redirect */ }
  return bridge;
}

// eslint-disable-next-line import/prefer-default-export
export async function logout() {
  try {
    await loadLmScript();
  } catch (e) { /* el script no cargó → caemos al fallback local de abajo */ }

  // lmLogout lo asigna el script ASYNC (tras su env-config), así que puede no existir justo
  // después de loadLmScript. Esperamos esa asignación con techo de 3s: si LM está caído y no la
  // asigna, el timeout nos lleva al fallback local (el usuario nunca queda colgado ni atrapado
  // logueado, ni hacemos un logout local incompleto que dejaría viva la sesión SSO).
  let timer;
  const timeout = new Promise((resolve) => { timer = setTimeout(resolve, 3000); });
  await Promise.race([whenLmReady('lmLogout'), timeout]);
  clearTimeout(timer);

  if (typeof window.lmLogout === 'function') {
    // lmLogout borra cookies y redirige (Keycloak → redirect-logout). No retorna control.
    window.lmLogout();
    return;
  }

  // Fallback (LM no disponible): limpiar estado local vía la ruta puente.
  const bridge = await logoutBridge();
  window.location.assign(bridge);
}
