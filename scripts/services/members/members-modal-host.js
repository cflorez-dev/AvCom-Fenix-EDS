import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import { MembersModal } from '../../../design-system/organisms/user-session/members-modal.js';
import { getModalDescriptorSync, loadModalDescriptor } from './members-i18n.js';
import { isPortalPage } from './page-type.js';
import { loadMembersConfig } from './members-config.js';
import { sanitizeHTMLAsync } from '../../utils/sanitize.js';
import { getRetries, incRetries } from './members-error.js';

const html = htm.bind(h);

/**
 * Host central de los modales de Members (1255601). `showMembersModal(modalKey, opts)`:
 *  1. Track 2 gate (P8): el modal de EXPIRACIÓN (session-expired) es PO-gated. El dropin redirige
 *     antes y cierra limpio (Opción A), así que con el flag off NO se renderiza.
 *  2. Gating de reintentos (P4): al llegar a maxRetries (default 3) se deja de auto-mostrar y se
 *     permite navegar; si el usuario está en una página de Portal (perfil) y el error persiste, se
 *     RE-MUESTRA ahí (sin seguir incrementando).
 *  3. Resuelve el descriptor (CF → fallback local → generic-error) y renderiza `MembersModal` por
 *     el patrón imperativo de `showPendingErrorModal` (div host + render).
 *  4. Dismissals (X / click-fuera / CTA primaria de recarga) → incrementan el contador y recargan.
 *
 * Fuente de modales = `config.modals` del CF (loadMembersConfig); el registro local de members-i18n
 * es la red de seguridad si el CF cae (§5 override 2026-06-16).
 */

// Track 2 (expiración) PO-gated: no construimos el path de refresh propio (Opción B). Para
// habilitar el modal de expiración inline hay que reabrir el plan (ciclo 2).
const TRACK2_EXPIRY_MODAL_ENABLED = false;

const DEFAULT_MAX_RETRIES = 3;

/**
 * Adapta un modal CRUDO del CF (`config.modals[key]`) al descriptor que consume `MembersModal`.
 * `body.html` se SANITIZA (XSS) con `sanitizeHTMLAsync` — nunca crudo (§5 override #2).
 * @param {Object} cfModal
 * @returns {Promise<Object|null>}
 */
export async function cfModalToProps(cfModal) {
  if (!cfModal) return null;
  // El CF envuelve el cuerpo en `<p>`, que arrastra márgenes y font-size del `p` GLOBAL del sitio
  // (rompe el alto y la tipografía del modal vs Figma). Tras sanitizar, desenvolvemos los `<p>` a
  // contenido inline (párrafos separados con <br>) → hereda el 18px/centrado del contenedor, sin
  // márgenes. Patrón "usar inline en vez de <p>" (memoria global-p-clamp).
  const safeHtml = await sanitizeHTMLAsync(cfModal.body?.html || '');
  const description = safeHtml
    .replace(/<\/p>\s*<p[^>]*>/gi, '<br>')
    .replace(/<\/?p[^>]*>/gi, '');
  return {
    // El CF manda `icon` como content-reference de imagen del DAM → resolvemos su `_publishUrl`
    // (string https que ModalAviancaLayout pinta como <img>). Retrocompatible: si viniera como
    // string (modelo viejo) o sin _publishUrl, cae al valor tal cual.
    // eslint-disable-next-line no-underscore-dangle
    icon: cfModal.icon?._publishUrl || cfModal.icon,
    iconAlt: cfModal.iconAlt,
    title: cfModal.title,
    description,
    primaryCtaLabel: cfModal.primaryCtaLabel,
    primaryCtaAction: cfModal.primaryCtaAction,
    primaryCtaUrl: cfModal.primaryCtaUrl,
    secondaryCtaLabel: cfModal.secondaryCtaLabel,
    secondaryCtaAction: cfModal.secondaryCtaAction,
    secondaryCtaUrl: cfModal.secondaryCtaUrl,
    dismissible: cfModal.dismissible,
    maxRetries: cfModal.maxRetries,
  };
}

/**
 * Placeholder aislado de la frontera CF previa (persisted query dedicada de modales). Ya NO es la
 * fuente: el CF vive en `config.modals` (loadMembersConfig). Se conserva por compatibilidad y para
 * marcar la frontera; lanza si se invoca.
 */
// eslint-disable-next-line no-unused-vars
export async function fetchMembersModals(locale) {
  throw new Error('getMembersModals no provista: la fuente de modales es config.modals (CF)');
}

/** Resuelve el descriptor de un modal: CF (config.modals) → fallback local → generic-error. */
async function resolveDescriptor(modalKey, cfg) {
  // 1) CF: la fuente real en runtime (§5 override #1). loadMembersConfig cachea tras el boot.
  try {
    const config = cfg || await loadMembersConfig();
    const cfModal = config && config.modals ? config.modals[modalKey] : null;
    if (cfModal) {
      const props = await cfModalToProps(cfModal);
      if (props) return props;
    }
  } catch (e) { /* CF caído → red de seguridad local */ }
  // 2) Fallback local autorado (Paso 1).
  const local = await loadModalDescriptor(modalKey);
  if (local) return local;
  // 3) Catch-all: generic-error (§5 override #4) para keys sin descriptor local (ej. http_400).
  return getModalDescriptorSync('generic-error');
}

/**
 * Muestra el modal de `modalKey` aplicando el gating de Track 2 y de reintentos.
 * @param {string} modalKey
 * @param {{pathname?:string, cfg?:Object}} [opts] pathname/config (default: location + config)
 * @returns {Promise<void>}
 */
export async function showMembersModal(modalKey, { pathname, cfg } = {}) {
  if (!modalKey) return;
  // Track 2 gate (P8): expiración PO-gated → no se renderiza con el flag off.
  if (modalKey === 'session-expired' && !TRACK2_EXPIRY_MODAL_ENABLED) return;

  // Resolvemos la config UNA vez (si no la pasaron) y la reusamos en el descriptor Y en el gating.
  // Sin esto, los call-sites que no pasan cfg (ej. members-auth.route) dejaban isPortalPage
  // con cfg undefined → portalRoutes=[] → el re-show en perfil nunca disparaba.
  let config = cfg;
  if (!config) {
    try { config = await loadMembersConfig(); } catch (e) { config = null; }
  }

  const descriptor = await resolveDescriptor(modalKey, config);
  if (!descriptor) return;

  // Gating de reintentos (P4): al llegar a maxRetries dejamos de auto-mostrar y permitimos navegar;
  // EXCEPTO si estamos en una página de Portal (perfil) y el error persiste → re-mostrar ahí.
  const maxRetries = Number(descriptor.maxRetries) || DEFAULT_MAX_RETRIES;
  const winLoc = typeof window !== 'undefined' ? window.location : null;
  const path = pathname ?? (winLoc ? winLoc.pathname : '');
  const atLimit = getRetries() >= maxRetries;
  if (atLimit && !isPortalPage(path, config)) return;

  const hostEl = document.createElement('div');
  hostEl.id = 'members-modal-host';
  document.body.appendChild(hostEl);

  // Dismissals = "reintento" (P4): X / click-fuera / CTA recarga → incrementar + recargar.
  // En el re-show de Portal (ya en el límite) NO seguimos incrementando.
  const retryAndReload = () => {
    if (!atLimit) incRetries();
    window.location.reload();
  };
  // La acción 'home' del descriptor (ej. generic-error secundaria, session-expired) NO cuenta como
  // reintento: navega a home. La resuelve MembersModal por el descriptor (no la override-amos acá).
  const primaryIsHome = descriptor.primaryCtaAction === 'home';
  const onPrimary = primaryIsHome ? undefined : retryAndReload;

  render(html`
    <${MembersModal}
      modalKey=${modalKey}
      descriptor=${descriptor}
      isOpen=${true}
      onClose=${retryAndReload}
      onPrimary=${onPrimary}
    />
  `, hostEl);
}

export default showMembersModal;
