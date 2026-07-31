import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { Icon } from '../icon/icon.js';

const html = htm.bind(h);

/**
 * FloatingActionButton — FAB de gamificación sobre las barras de progreso
 * elite (1271694, AC bloque 10.1; specs §B partes d-e).
 *
 * Botón circular 40×40 (ícono 24) que abre el AcceleratorTooltip. Estados:
 * Default (blanco + sombra) / Hover y Pressed (borde magenta) / Focus (anillo
 * focus-visible). El POSICIONAMIENTO sobre el punto de avance lo hace el
 * caller (se monta en el fab-slot de la barra).
 *
 * A11y: `aria-expanded` refleja el tooltip abierto; `aria-haspopup="dialog"`;
 * activable por teclado (button nativo → Enter/Space).
 *
 * ## Props
 * - `icon`: string | vnode — key del catálogo `/icons/` (ej. 'action/plane',
 *   barra avianca) o vnode custom. Default: rayo inline (total/cenit — el
 *   catálogo no tiene bolt; SVG local hasta que diseño entregue el asset).
 * - `onClick`: () => void — toggle del tooltip.
 * - `expanded`: boolean — estado del tooltip (aria-expanded).
 * - `ariaLabel`: string — label accesible (i18n `fabAriaLabel`).
 * - `customClassName`: string.
 */
export const FabBoltIcon = () => html`
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" class="w-6 h-6">
    <path
      d="M13.4 2.4 5.6 12.9c-.3.4 0 .9.5.9h4.4l-1.6 7.1c-.1.6.6.9 1 .5l8.5-10.6c.3-.4 0-1-.5-1h-4.6l1.2-6.9c.1-.6-.7-.9-1.1-.5Z"
      fill="#B50080"
    />
  </svg>
`;

export const FloatingActionButton = ({
  icon = null,
  onClick = null,
  expanded = false,
  ariaLabel = '',
  customClassName = '',
  ...rest
}) => {
  let iconEl;
  if (typeof icon === 'string' && icon) {
    iconEl = html`<${Icon} icon=${icon} size="xl" />`;
  } else if (icon) {
    iconEl = icon;
  } else {
    iconEl = html`<${FabBoltIcon} />`;
  }

  return html`
    <button
      type="button"
      onClick=${onClick}
      aria-expanded=${expanded}
      aria-haspopup="dialog"
      aria-label=${ariaLabel || undefined}
      class=${`flex items-center justify-center w-10 h-10 rounded-full bg-white
        shadow-[0_2px_8px_rgba(27,27,27,0.25)] border-2 border-transparent
        hover:border-[#B50080] active:border-[#B50080] active:bg-[#FDF2F9]
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B50080]
        motion-safe:transition-colors ${customClassName}`}
      data-name="floating-action-button"
      data-expanded=${expanded}
      ...${rest}
    >
      ${iconEl}
    </button>
  `;
};

export default FloatingActionButton;
