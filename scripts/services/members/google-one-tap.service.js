import { loadScript } from '../../aem.js';
import { loadMembersConfig } from './members-config.js';
import { getSession } from './session.store.js';
import { isMembersEnabled } from './members-flag.js';

const GSI_SRC = 'https://accounts.google.com/gsi/client';
const FREQ_COOKIE = 'members-onetap-shown';
// Default de frecuencia si el CF no la provee (restricción de Google + criterio PBI).
// El valor efectivo sale de `config.oneTap.frequencyHours` (CF "Members Config", CU-282).
const FREQ_HOURS = 24;

/**
 * Config One Tap por entorno.
 * CORRECCIÓN (Lifemiles, 2026-06-09): One Tap usa el MISMO realm/client del login normal —
 * realm `lm-uat` + client `avianca-web`. El `avianca-uat` anterior (de la guía) NO existe.
 * Al compartir realm con el login, el `code` lo procesa bien nuestra callback (`lmCompleteLogin`).
 */
const ONE_TAP_CONFIG = {
  uat: {
    googleClientId: '792645116726-08ej6rsr33uk5lasgfkv0t1psm4sh7st.apps.googleusercontent.com',
    loginUri: 'https://sso.lifemiles.net/auth/realms/lm-uat/broker/google/endpoint',
    authBase: 'https://sso.lifemiles.net/auth/realms/lm-uat/protocol/openid-connect/auth',
    realmClientId: 'avianca-web',
  },
  prd: {
    googleClientId: '240413171950-s6fsrkfts1dvj13nr4rdbvmr9ld6539c.apps.googleusercontent.com',
    // ⚠️ TODO: valores de PROD SIN confirmar por Lifemiles. Por analogía con uat
    // (lm-uat/avianca-web), prod sería realm `lm` + client `avianca-web`. CONFIRMAR con
    // Lifemiles antes de ir a prod (el `avianca` anterior era asunción, casi seguro errado).
    loginUri: 'https://sso.lifemiles.com/auth/realms/lm/broker/google/endpoint',
    authBase: 'https://sso.lifemiles.com/auth/realms/lm/protocol/openid-connect/auth',
    realmClientId: 'avianca-web',
  },
};

const getCookie = (name) => {
  const match = document.cookie.match(new RegExp(`(^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
};

/** ¿se mostró el prompt hace menos de `freqHours`? (frecuencia por usuario/dispositivo). */
function shownRecently(freqHours = FREQ_HOURS) {
  const ts = Number(getCookie(FREQ_COOKIE));
  if (!ts) return false;
  return (Date.now() - ts) < freqHours * 3600 * 1000;
}

/** Marca el prompt como mostrado (cookie con timestamp, expira en `freqHours`). */
function markShown(freqHours = FREQ_HOURS) {
  const expires = new Date(Date.now() + freqHours * 3600 * 1000).toUTCString();
  document.cookie = `${FREQ_COOKIE}=${Date.now()}; expires=${expires}; path=/; SameSite=Lax`;
}

/**
 * ¿La ruta actual está habilitada para One Tap? (CU-282 CA2). `corporatePaths` define dónde
 * se permite el prompt: `'/'` = Home (raíz o `/{lang}` o `/{lang}/`); el resto matchea por
 * SEGMENTO (mismo criterio que page-type). Lista vacía/ausente = sin restricción de ruta.
 * @param {string} pathname window.location.pathname
 * @param {string[]} corporatePaths rutas permitidas (del CF)
 * @returns {boolean}
 */
function isPathAllowed(pathname, corporatePaths) {
  if (!Array.isArray(corporatePaths) || corporatePaths.length === 0) return true;
  const path = pathname || '';
  return corporatePaths.some((p) => {
    if (p === '/') return /^\/([a-z]{2})?\/?$/.test(path); // Home (con/ sin prefijo de locale)
    const base = p.replace(/\/+$/, ''); // sin barra final
    return path.endsWith(base) || path.includes(`${base}/`);
  });
}

// PKCE para One Tap. El client `avianca-web` exige PKCE; en el login normal lo genera/guarda
// `lmLogin`, pero One Tap lo bypassa. Lo replicamos en las MISMAS claves de localStorage que lee
// `lmCompleteLogin` al volver a la callback (descubierto en vivo 2026-06-09).
// ⚠️ FRÁGIL: `lm-login-code-verifier` / `lm-login-state` son claves INTERNAS NO documentadas del
// script LM. Si Lifemiles las cambia, One Tap se rompe en silencio. Pedirles que lo oficialicen o
// que expongan un helper del flujo One Tap. Ver PENDIENTES / reporte.
const LM_VERIFIER_KEY = 'lm-login-code-verifier';
const LM_STATE_KEY = 'lm-login-state';

const b64url = (bytes) => btoa(String.fromCharCode(...bytes))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const randomToken = (nBytes) => {
  const a = new Uint8Array(nBytes);
  window.crypto.getRandomValues(a);
  return b64url(a);
};

/** Genera el par PKCE + state y guarda el verifier/state donde lmCompleteLogin los lee. */
async function preparePkce() {
  const verifier = randomToken(32); // 43 chars base64url → code_verifier PKCE válido
  const digest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  const challenge = b64url(new Uint8Array(digest));
  const state = randomToken(24);
  // Mismas claves que setea lmLogin → lmCompleteLogin las consume al volver a la callback.
  localStorage.setItem(LM_VERIFIER_KEY, verifier);
  localStorage.setItem(LM_STATE_KEY, state);
  return { challenge, state };
}

/** Arma la URL del broker Keycloak (realm lm-uat) con PKCE (S256) + state. */
function buildAuthUrl(cfg, lang, redirectUri, pkce) {
  const params = new URLSearchParams({
    client_id: cfg.realmClientId,
    response_type: 'code',
    scope: 'openid',
    ui_locales: lang,
    login_hint: 'web',
    kc_idp_hint: 'google',
    redirect_uri: redirectUri,
    code_challenge: pkce.challenge,
    code_challenge_method: 'S256',
    state: pkce.state,
  });
  return `${cfg.authBase}?${params.toString()}`;
}

/**
 * Inicializa Google One Tap. Solo si el usuario es anónimo y respeta la frecuencia 24h.
 * Tras elegir cuenta, Google devuelve un credential y redirigimos al broker de Lifemiles
 * (realm avianca-uat, kc_idp_hint=google), que vuelve a nuestra página callback.
 *
 * (Resuelto 2026-06-09: One Tap usa el realm `lm-uat` — el mismo del login — así que el `code`
 * lo procesa nuestra callback con `lmCompleteLogin`, sin handler aparte.)
 * TODO (Karen): opt-in de T&C (CMS vs consola Google) — hoy no se fuerza.
 */
// eslint-disable-next-line import/prefer-default-export
export async function initOneTap() {
  // Kill-switch maestro (defense-in-depth con el gate de scripts.js): con Members OFF
  // nunca se inyecta el script GSI de Google (accounts.google.com/gsi/client) ni el prompt.
  if (!(await isMembersEnabled())) return;
  if (getSession().status !== 'anonymous') return; // solo anónimo

  // Config del CF (CU-282): habilitación, frecuencia y rutas permitidas.
  const config = await loadMembersConfig();
  const oneTap = config.oneTap || {};
  if (oneTap.enabled === false) return; // gate de habilitación desde el CF
  // Gate de ruta: el caller (scripts.js) ya no filtra por Home — lo decide corporatePaths.
  if (!isPathAllowed(window.location.pathname, oneTap.corporatePaths)) return;
  const freqHours = oneTap.frequencyHours ?? FREQ_HOURS;
  if (shownRecently(freqHours)) return; // frecuencia configurable

  // TODO(Karen / sin superficie de UI): `oneTap.tcRequired`/`oneTap.tcText` (T&C autorado en el
  // CF) NO se renderizan: el prompt FedCM de Google One Tap no expone un slot de HTML propio.
  // Falta definir la superficie (banner/disclaimer + nodo Figma) para mostrarlo. Se lee del CF
  // pero queda pendiente (ver reporte). No se inventa UI acá.

  const { env } = config;
  const cfg = ONE_TAP_CONFIG[env] || ONE_TAP_CONFIG.uat;

  await loadScript(GSI_SRC, { async: '', defer: '' });
  if (!window.google?.accounts?.id) return; // SDK no disponible

  const lang = document.documentElement.lang || 'pt';
  // ⚠️ callback SIN prefijo de locale, mientras las páginas-puente viven bajo `/{lang}/...`.
  // El handler matchea por includes(), pero la página debe EXISTIR en esta ruta o da 404, y el
  // redirect_uri debe estar registrado así en el cliente avianca-uat. VERIFICAR al destrabar
  // One Tap (hoy bloqueado por origin_mismatch). No se cambia a ciegas: rompería el registro.
  const redirectUri = `${window.location.origin}/members/auth/callback`;

  window.google.accounts.id.initialize({
    client_id: cfg.googleClientId,
    login_uri: cfg.loginUri,
    // FedCM OBLIGATORIO: los Chrome modernos NO renderizan el prompt de One Tap sin esto.
    // Google migró One Tap a FedCM; el método legacy dependía de cookies de terceros que el
    // navegador ya bloquea, así que sin este flag la ventana "Continuar con Google" no aparece.
    use_fedcm_for_prompt: true,
    callback: (response) => {
      if (response?.credential) {
        // Generamos el PKCE (y lo guardamos donde lmCompleteLogin lo lee) ANTES de redirigir.
        preparePkce().then((pkce) => {
          window.location.assign(buildAuthUrl(cfg, lang, redirectUri, pkce));
        });
      }
    },
  });
  // Marcamos el cap de 24h SOLO si el prompt realmente se mostró/interactuó. Si Google lo
  // suprime (isNotDisplayed: cooldown, opt-out, sin sesión Google), NO lo contamos — así no
  // "quemamos" las 24h sin que el usuario lo haya visto.
  window.google.accounts.id.prompt((notification) => {
    if (notification?.isNotDisplayed?.()) return;
    markShown(freqHours);
  });
}
