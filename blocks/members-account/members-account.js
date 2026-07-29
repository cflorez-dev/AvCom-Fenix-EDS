import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import { MembersAccount } from '../../design-system/organisms/members-account/members-account.js';
import { getMembersConfigSync } from '../../scripts/services/members/members-config.js';
import { isPortalPage } from '../../scripts/services/members/page-type.js';

const html = htm.bind(h);

/**
 * Members Account — bloque-puente delgado de la página "Gestión de mi cuenta"
 * (1279360, shell). Mismo patrón que `members-elite`: NO renderiza fields
 * propios; monta el organism Preact `MembersAccount` (header + tabs + contenido),
 * que lee sesión/config/i18n por sí mismo.
 *
 * Sólo monta en páginas del Portal (`isPortalPage`: `portalRoutes:['/members']`
 * matchea `/members/profile/account` anidado sin código nuevo); fuera de ellas se
 * oculta. En modo autor (Universal Editor) no transforma — preserva el bloque
 * editable (igual que `members-elite`).
 *
 * @param {Element} block
 */
export default function decorate(block) {
  // Modo autor (UE): preservar el bloque editable, no montar el organism.
  if (window.xwalk?.isAuthorEnv) {
    block.classList.add('members-account-author-mode');
    const indicator = document.createElement('div');
    indicator.className = 'members-account-author-indicator';
    indicator.textContent = '🗂️ Members Account (Author Mode)';
    block.insertBefore(indicator, block.firstChild);
    return;
  }

  // Gate de Portal: la página vive en una ruta autenticada del Portal
  // (`/members/profile/account`). Fuera de esas rutas no monta.
  const cfg = getMembersConfigSync();
  const { pathname } = window.location;
  if (!isPortalPage(pathname, cfg)) {
    block.style.display = 'none';
    return;
  }

  // Puente: limpiar el placeholder y montar el organism.
  block.textContent = '';
  const container = document.createElement('div');
  container.className = 'members-account-container';
  render(html`<${MembersAccount} />`, container);
  block.appendChild(container);
}
