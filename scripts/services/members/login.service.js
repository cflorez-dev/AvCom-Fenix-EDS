import { loadLmScript, whenLmReady } from './lm-script.loader.js';
import { loadMembersConfig } from './members-config.js';

/**
 * Inicia el flujo de login de Lifemiles: carga el script y delega en window.lmLogin.
 * NO setea window.__LM_LOGIN_CONFIG__ — el script lo arma solo cargando su env-config
 * por host (hosteado por Lifemiles). NO construye sesión real (1255354).
 * @param {string} lang idioma de navegación (default: lang del documento o 'pt').
 * @returns {Promise} resuelve onSuccess del script; rechaza si lmLogin no está o falla.
 */
// eslint-disable-next-line import/prefer-default-export
export async function login(lang = document.documentElement.lang || 'pt') {
  // Guardar la ruta de origen para el retorno (la usa redirect-login si loginReturnTo='origin').
  try {
    sessionStorage.setItem('members-return-to', window.location.pathname + window.location.search);
  } catch (e) { /* sessionStorage no disponible → se cae al home del POS */ }
  const cfg = await loadMembersConfig();
  await loadLmScript();
  // El script asigna window.lmLogin ASYNC (después de bajar su env-config por host), así que
  // justo tras loadLmScript puede no existir todavía — por eso el primer click "se perdía".
  // Esperamos esa asignación event-driven, con techo de 10s: en red lenta espera lo necesario;
  // si LM no responde, el guard de abajo rechaza y Anonymous lo loguea (no rompe la página).
  let timer;
  const timeout = new Promise((resolve) => { timer = setTimeout(resolve, 10000); });
  await Promise.race([whenLmReady('lmLogin'), timeout]);
  clearTimeout(timer);
  // lmLogin es binario (popup vs redirect). El CF emite 'redirect'|'window'|'fullscreen'
  // (+ 'popup' legacy): cualquier modo distinto de 'redirect'/vacío se trata como popup
  // ('window'/'fullscreen' → popup hasta que Lifemiles soporte fullscreen explícito).
  const isPopup = !!cfg.loginMode && cfg.loginMode !== 'redirect';
  return new Promise((resolve, reject) => {
    if (typeof window.lmLogin !== 'function') {
      reject(new Error('lmLogin no disponible'));
      return;
    }
    window.lmLogin(lang, isPopup, { onSuccess: resolve, onError: reject });
  });
}
