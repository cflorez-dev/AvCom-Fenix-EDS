import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import { MembersHero } from '../../design-system/organisms/members-hero/members-hero.js';
import { getMembersConfigSync } from '../../scripts/services/members/members-config.js';
import { isPortalPage } from '../../scripts/services/members/page-type.js';

const html = htm.bind(h);

/**
 * ¿La ruta actual es la página de Cuenta Lifemiles (`/{lang}/members/profile`)?
 *
 * Esta superficie tiene reglas específicas para el hero (CU-321):
 *  - Breadcrumb "Mi Lifemiles › Cuenta Lifemiles" visible.
 *  - SIN botón colapsable (hero siempre expandido).
 *  - `.members-hero-container` SIN padding vertical (el layout de la página lo aporta).
 *
 * Cualquier otra ruta del Portal (Dashboard, Mi Lifemiles landing, otras páginas
 * autenticadas que reusen el hero) invierte estas reglas: sin breadcrumb local,
 * con toggle colapsable, y con padding vertical en el contenedor.
 *
 * @param {string} pathname window.location.pathname
 * @returns {boolean}
 */
const isProfileSurface = (pathname) => /\/members\/profile(\/|$)/.test(pathname);

/**
 * Members Hero — bloque-puente delgado (1263924, Sub A). Patrón breadcrumb.js /
 * header-user-actions.js: NO renderiza fields propios; monta el organism Preact
 * `MembersHero`, que lee el signal `session.store` (poblado por `initSession()` en
 * el boot global de scripts.js) + el CF de Members.
 *
 * Reemplaza el placeholder `cms-loader` de la página de perfil (autoría). Sólo
 * monta en páginas del Portal (`isPortalPage`); fuera de ellas se oculta. En modo
 * autor (Universal Editor) no transforma (igual que header-user-actions).
 *
 * Detecta la superficie por pathname y le pasa al organism los flags
 * `showBreadcrumb` / `showToggle` correspondientes, y setea `data-surface` en el
 * contenedor para que el CSS local pueda ajustar paddings por superficie. Para
 * reutilizar el hero en una página nueva, agregar la ruta a la heurística
 * `isProfileSurface` (si debe comportarse como Cuenta Lifemiles) o dejarla fuera
 * (comportamiento reusable por default).
 *
 * @param {Element} block
 */
export default function decorate(block) {
  // Modo autor (UE): preservar el bloque editable, no montar el organism.
  if (window.xwalk?.isAuthorEnv) {
    block.classList.add('members-hero-author-mode');
    const indicator = document.createElement('div');
    indicator.className = 'members-hero-author-indicator';
    indicator.textContent = '👤 Members Hero (Author Mode)';
    block.insertBefore(indicator, block.firstChild);
    return;
  }

  // Gate de Portal: el hero autenticado sólo vive en /{lang}/members/profile y
  // similares. Fuera de esas rutas no monta (no afecta otras páginas).
  const cfg = getMembersConfigSync();
  const { pathname } = window.location;
  if (!isPortalPage(pathname, cfg)) {
    block.style.display = 'none';
    return;
  }

  // Reglas por superficie (ver `isProfileSurface` arriba y JSDoc del organism).
  //  - profile  → breadcrumb ✅, toggle ❌, sin padding vertical.
  //  - reusable → breadcrumb ❌, toggle ✅, con padding vertical (controlado en CSS).
  const isProfile = isProfileSurface(pathname);
  const surface = isProfile ? 'profile' : 'reusable';

  // Puente: limpiar el placeholder y montar el organism.
  block.textContent = '';
  const container = document.createElement('div');
  container.className = 'members-hero-container';
  container.dataset.surface = surface;
  render(
    html`<${MembersHero}
      showBreadcrumb=${isProfile}
      showToggle=${!isProfile}
    />`,
    container,
  );
  block.appendChild(container);
}
