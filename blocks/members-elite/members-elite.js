import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import { MembersElite } from '../../design-system/organisms/members-elite/members-elite.js';
import { getMembersConfigSync } from '../../scripts/services/members/members-config.js';
import { isPortalPage } from '../../scripts/services/members/page-type.js';

const html = htm.bind(h);

/**
 * Members Elite — bloque-puente delgado de la página "Progreso Elite y
 * beneficios" (1271689, Fase 1a). Mismo patrón que `members-cards`/`members-hero`:
 * NO renderiza fields propios; monta el organism Preact `MembersElite` (header +
 * tabs + contenido), que lee sesión/config/i18n por sí mismo.
 *
 * Sólo monta en páginas del Portal (`isPortalPage`: `portalRoutes:['/members']`
 * matchea `/members/profile/elite` anidado sin código nuevo); fuera de ellas se
 * oculta. En modo autor (Universal Editor) no transforma — preserva el bloque
 * editable (igual que `members-cards`).
 *
 * @param {Element} block
 */
export default function decorate(block) {
  // Modo autor (UE): preservar el bloque editable, no montar el organism.
  if (window.xwalk?.isAuthorEnv) {
    block.classList.add('members-elite-author-mode');
    const indicator = document.createElement('div');
    indicator.className = 'members-elite-author-indicator';
    indicator.textContent = '🏅 Members Elite (Author Mode)';
    block.insertBefore(indicator, block.firstChild);
    return;
  }

  // Gate de Portal: la página elite vive en una ruta autenticada del Portal
  // (`/members/profile/elite`). Fuera de esas rutas no monta.
  const cfg = getMembersConfigSync();
  const { pathname } = window.location;
  if (!isPortalPage(pathname, cfg)) {
    block.style.display = 'none';
    return;
  }

  // Puente: limpiar el placeholder y montar el organism.
  block.textContent = '';
  const container = document.createElement('div');
  container.className = 'members-elite-container';
  render(html`<${MembersElite} />`, container);
  block.appendChild(container);
}
