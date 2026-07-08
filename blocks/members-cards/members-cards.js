import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import { MembersCards } from '../../design-system/organisms/members-cards/members-cards.js';
import { getMembersConfigSync } from '../../scripts/services/members/members-config.js';
import { isPortalPage } from '../../scripts/services/members/page-type.js';

const html = htm.bind(h);

/**
 * Members Cards — bloque-puente delgado (1263921, "Bloque 4"). Mismo patrón que
 * `members-hero`: NO renderiza fields propios; monta el organism Preact
 * `MembersCards`, que lee la config de cards del CF `members-config` (con
 * fallback a `APP_CONFIG.cards`) + los copies de `members-i18n`.
 *
 * Sólo monta en páginas del Portal (`isPortalPage`); fuera de ellas se oculta
 * (no afecta otras páginas). En modo autor (Universal Editor) no transforma —
 * preserva el bloque editable (igual que `members-hero`).
 *
 * A diferencia del hero, el grid NO depende de la superficie ni del signal de
 * sesión (las 4 cards de navegación son datos de config puros), así que el puente
 * es aún más simple: author-guard + portal-gate + montar el organism.
 *
 * @param {Element} block
 */
export default function decorate(block) {
  // Modo autor (UE): preservar el bloque editable, no montar el organism.
  if (window.xwalk?.isAuthorEnv) {
    block.classList.add('members-cards-author-mode');
    const indicator = document.createElement('div');
    indicator.className = 'members-cards-author-indicator';
    indicator.textContent = '🃏 Members Cards (Author Mode)';
    block.insertBefore(indicator, block.firstChild);
    return;
  }

  // Gate de Portal: el grid sólo vive en páginas autenticadas del Portal
  // (Dashboard y similares). Fuera de esas rutas no monta.
  const cfg = getMembersConfigSync();
  const { pathname } = window.location;
  if (!isPortalPage(pathname, cfg)) {
    block.style.display = 'none';
    return;
  }

  // Puente: limpiar el placeholder y montar el organism.
  block.textContent = '';
  const container = document.createElement('div');
  container.className = 'members-cards-container';
  render(html`<${MembersCards} />`, container);
  block.appendChild(container);
}
