/**
 * Darksite Chrome — carga el header/footer propios del darksite en las landings
 * de detalle de afectación de vuelo (`/darksite/{lang}/...`), en vez del chrome
 * general del sitio. Corre en loadLazy, ANTES del loadHeader/loadFooter normal.
 *
 * Gating (decisión cerrada): la página cae bajo `AV_DARKSITE_DETAIL_PAGES_ROOT`
 * (environment.json, default `/darksite/`) Y el darksite está `enabled` en el CF
 * — con bypass en entorno author para que el autor SIEMPRE vea el chrome al
 * editar. No se filtra por POS: el usuario ya pasó el gate del interstitial.
 *
 * Entrega LEAN (iteración 1): monta los organismos DS `HeaderDarksite`
 * (variant='light') y `FooterBottom` (variant='darksite-light') vía Preact con
 * props por defecto. Iteración 2 (pendiente): migrar a un bloque autor-able
 * `blocks/header-darksite` (espejo de `blocks/footer-bottom`) para exponer las
 * opciones al autor sin tocar código.
 *
 * Spec: docs/superpowers/specs/2026-07-07-darksite-design.md §3.5 / §7bis.5
 */
import { h, render } from '@dropins/tools/preact.js';
import { HeaderDarksite } from '../../../design-system/organisms/header/header-darksite/header-darksite.js';
import { FooterBottom } from '../../../design-system/organisms/footer/footer-bottom/footer-bottom.js';
import { getAlternatePageForLanguage } from '../header/hreflang-redirection.js';
import { readCachedState, fetchDarksiteState } from './darksite.service.js';
import {
  DEFAULT_LANG, readDetailPagesRoot, isUnderDetailRoot, detectDarksiteLang,
} from './darksite-detail.js';

// Re-export para compatibilidad con consumidores/tests previos de este módulo.
export { isUnderDetailRoot, detectDarksiteLang } from './darksite-detail.js';

// Endónimos (cada idioma en su propio idioma) — estándar i18n. Estos labels
// migrarán al modelo UE del bloque header-darksite en la iteración 2.
const LANGUAGE_OPTIONS = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Português' },
  { value: 'fr', label: 'Français' },
];

const BACK_LABEL = {
  es: 'Ir a avianca.com',
  en: 'Go to avianca.com',
  pt: 'Ir para avianca.com',
  fr: 'Aller à avianca.com',
};

/**
 * Author/UE env: mismo criterio que darksite-gate.isAuthorEnvironment. Se
 * re-declara aquí (en vez de importar el gate) para no arrastrar las molecules
 * pesadas del overlay en cada landing de detalle.
 */
const isAuthorEnvironment = () => {
  try {
    return !!(
      window.xwalk?.isAuthorEnv
      || window.hlx?.aue
      || document.querySelector('meta[name="urn:auecon:aemconnection"]')
    );
  } catch (e) {
    return false;
  }
};

/**
 * Resuelve el destino del selector de idioma reusando el mecanismo del sitio:
 * `alternate-page-{lang}` autorado en page properties. Si esa landing no tiene
 * alternate configurado para el idioma pedido, cae al hub del darksite en ese
 * idioma (`{rootBase}/{lang}/`) en vez del `/{lang}/` genérico del sitio, que
 * sacaría al usuario del árbol darksite.
 */
export const resolveLanguageTarget = (targetLang, rootBase) => {
  let authored = '';
  try {
    authored = getAlternatePageForLanguage(targetLang);
  } catch (e) {
    authored = '';
  }
  return authored || `${rootBase}/${targetLang}/`;
};

const mountHeader = (header, lang, rootBase) => {
  if (!header) return;
  header.classList.add('darksite-chrome', 'darksite-chrome-header');
  const onLanguageChange = (code) => {
    if (!code || code === lang) return;
    window.location.href = resolveLanguageTarget(code, rootBase);
  };
  render(h(HeaderDarksite, {
    variant: 'light',
    logoUrl: '/',
    logoAlt: 'Avianca',
    backUrl: '/',
    backLabel: BACK_LABEL[lang] || BACK_LABEL[DEFAULT_LANG],
    languageOptions: LANGUAGE_OPTIONS,
    defaultLanguage: lang,
    onLanguageChange,
  }), header);
};

const mountFooter = (footer) => {
  if (!footer) return;
  footer.classList.add('darksite-chrome', 'darksite-chrome-footer');
  render(h(FooterBottom, { variant: 'darksite-light' }), footer);
};

/**
 * Decide y (si aplica) monta el chrome darksite en las landings de detalle.
 * @param {Document} [doc=document]
 * @returns {Promise<boolean>} true si tomó el control del header/footer — el
 *   caller (loadLazy) debe entonces SALTAR el loadHeader/loadFooter normal.
 */
export async function maybeLoadDarksiteChrome(doc = document) {
  const header = doc.querySelector('header');
  const footer = doc.querySelector('footer');
  if (!header && !footer) return false;

  let pathname = '';
  try {
    pathname = window.location.pathname;
  } catch (e) {
    return false;
  }

  const root = await readDetailPagesRoot();
  if (!isUnderDetailRoot(pathname, root)) return false;

  // Gating: author env siempre ve el chrome (preview); en vivo, solo si el CF
  // está enabled. Reusa la caché SWR del service (poblada por el gate en
  // loadEager); solo hace fetch acotado si no hay caché en la primera visita.
  let enabled = isAuthorEnvironment();
  if (!enabled) {
    const state = readCachedState() || await fetchDarksiteState();
    enabled = state?.enabled === true;
  }
  if (!enabled) return false;

  const rootBase = String(root).replace(/\/+$/, '');
  const lang = detectDarksiteLang(pathname, root);
  mountHeader(header, lang, rootBase);
  mountFooter(footer);
  return true;
}

export default maybeLoadDarksiteChrome;
