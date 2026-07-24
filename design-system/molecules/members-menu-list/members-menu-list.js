import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { ListItem } from '../../atoms/list-item/list-item.js';

const html = htm.bind(h);

/**
 * MembersMenuList - Listado de items del drawer Members (Figma 115:8485 /
 * 115:8907).
 *
 * Recibe `items` (array tal cual lo devuelve el CF "Members Config" →
 * `menuItems[]`) y los renderiza como `<ListItem size="sidemenu">` con la
 * semántica correcta:
 *
 *  - **Internos** (`linkType === 'internal'` o ausente): renderiza un `<a
 *    href={item.link}>` con `iconAfter = item.icon` (típicamente
 *    `navigation/chevron-right`).
 *  - **Externos** (`linkType === 'external'`): el `<a>` lleva `target="_blank"`
 *    + `rel="noopener noreferrer"` y el aria-label se enriquece con
 *    `opensInNewWindowLabel` para que el SR anuncie "abre en nueva ventana".
 *  - **Logout** (`isLogout === true`): renderiza un `<div role="button">` (no
 *    es navegación), con `iconBefore = item.icon` (la flecha de salida va a la
 *    IZQUIERDA según Figma 115:8907), `onClick` cableado al callback
 *    `onLogout`, y un margin-top extra (`mt-6`) que crea el separador visual
 *    entre el resto del menú y la zona de "acción destructiva".
 *
 * Filtra `visible: false` y ordena por `sortOrder` ascendente. El componente es
 * pure render — no fetcha; el consumidor obtiene los items vía
 * `useMembersMenuItems()`.
 *
 * Truncado: cada item usa `lineClamp2` del átomo (Figma 131:9830 — 2 líneas
 * con ellipsis).
 *
 * ## Props
 * @param {Array} items - Array de menu items del CF. Cada item:
 *   `{ key, label, icon, link, linkType, visible, isLogout, sortOrder }`.
 * @param {Function} [onLogout=null] - Callback invocado al click en el item con
 *   `isLogout: true`. Si `null`, el item se omite del render.
 * @param {string} [currentPath] - Ruta actual (default `window.location.pathname`).
 *   Se usa para marcar `aria-current="page"` en el item cuyo `link` matchea.
 * @param {string} [opensInNewWindowLabel='abre en nueva ventana'] - Texto
 *   sufijo del aria-label de items externos (i18n).
 */
export const MembersMenuList = ({
  items = [],
  onLogout = null,
  currentPath = (typeof window !== 'undefined' ? window.location.pathname : ''),
  opensInNewWindowLabel = 'abre en nueva ventana',
}) => {
  if (!Array.isArray(items) || items.length === 0) return null;

  // Filtro + orden estables. El editor puede mandar `visible: undefined` (que
  // tratamos como `true` por compat con CFs viejos sin la flag) y `sortOrder`
  // numérico. Si dos items comparten sortOrder, conserva el orden del array.
  const visibleItems = items
    .filter((it) => it && it.visible !== false)
    .filter((it) => !it.isLogout || typeof onLogout === 'function')
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  // Separamos logout para meter un spacer flex entre los items y el logout
  // (Figma 115:8907 — logout siempre al bottom del drawer):
  //   - `flex-1` en el spacer => crece para llenar el espacio sobrante cuando
  //     el contenido cabe en el viewport, empujando al logout al bottom.
  //   - `min-h-[59px]` en el spacer => garantiza un gap mínimo de 59px entre
  //     el penaltimo item y el logout cuando los items desbordan y aparece
  //     scroll (de lo contrario el spacer colapsaría a 0 sin sobrante).
  // Para que esto funcione la `<ul>` debe poder ocupar todo el alto del slot
  // de children del Sidemenu (de ahí el `h-full flex flex-col` en la ul).
  const logoutItem = visibleItems.find((it) => it.isLogout) || null;
  const regularItems = visibleItems.filter((it) => !it.isLogout);

  return html`
    <ul
      class="w-full h-full flex flex-col list-none !m-0 pl-4"
      data-name="members-menu-list"
      role="list"
    >
      ${regularItems.map((item) => {
    const isExternal = item.linkType === 'external';
    const isCurrent = !!item.link && item.link === currentPath;

    // Divider visual: SOLO `border-b` entre filas (replicando separators del
    // Figma). El primer item NO lleva `border-t` porque queda pegado al
    // HeroHeader gradient (la balance card ya provee el cierre visual). El
    // último item del bloque sí cierra con su `border-b` y el spacer/logout
    // de abajo se separan visualmente con su propio diseño.
    const ariaLabel = isExternal
      ? `${item.label}, ${opensInNewWindowLabel}`
      : null;

    // CA5 (CU-295): ícono según `linkType` cuando el editor no eligió uno.
    // Si el CF trae `item.icon` lo respetamos (libertad editorial); si lo dejó
    // vacío, default por tipo: externo → `open-in-new`, interno → `chevron-right`.
    const itemIcon = item.icon
      || (isExternal ? 'navigation/open-in-new' : 'navigation/chevron-right');

    return html`
          <li
            class="w-full block"
            data-name="members-menu-item"
            data-key=${item.key}
          >
            <${ListItem}
              label=${item.label}
              iconAfter=${itemIcon}
              size="sidemenu"
              lineClamp2=${true}
              href=${item.link || '#'}
              target=${isExternal ? '_blank' : null}
              rel=${isExternal ? 'noopener noreferrer' : null}
              ariaLabel=${ariaLabel}
              ariaCurrent=${isCurrent ? 'page' : null}
              customClassName="border-b border-[var(--color-border-stroke-default)]"
            />
          </li>
        `;
  })}

      ${logoutItem && html`
        ${/* Spacer flex: crece cuando sobra espacio (logout al bottom)
            y mantiene 59px mínimo cuando hay scroll. aria-hidden +
            role=presentation para que SRs lo salteen. */ ''}
        <li
          class="flex-1 min-h-[59px] w-full list-none pointer-events-none"
          aria-hidden="true"
          role="presentation"
        ></li>
        <li
          class="w-full block"
          data-name="members-menu-item"
          data-key=${logoutItem.key}
        >
          <${ListItem}
            label=${logoutItem.label}
            iconBefore=${logoutItem.icon}
            size="sidemenu"
            lineClamp2=${true}
            onClick=${onLogout}
          />
        </li>
      `}
    </ul>
  `;
};

export default MembersMenuList;
