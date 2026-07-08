import { h } from '@dropins/tools/preact.js';
import htm from 'htm';

const html = htm.bind(h);

/**
 * NavItem - Item de navegación de Members (Figma 14:25206).
 *
 * El layout es responsive automático:
 *  - <768px (mobile): h-72px, full row, label medium 20px + icono arrow-forward 24×24.
 *  - ≥768px (desktop): h-76px (default) o h-50px (compact), label centrado 16px,
 *    transición a bold en hover/active.
 *
 * Estados (uniformes desktop):
 *  - default + !active: bg transparente, texto regular
 *  - hover   + !active: bg #e9e9e9, texto bold
 *  - default + active : underline 4px verde, texto bold
 *  - hover   + active : bg #e9e9e9 + underline 4px verde, texto bold
 *
 * Mobile: solo soporta size=default y NO renderiza estado active visualmente
 * (Figma no especifica diseño para active mobile). El focus ring sí se
 * renderiza en mobile (necesario para usuarios con teclado externo).
 *
 * A11y:
 *  - `<button>` por default, `<a>` cuando hay `href`.
 *  - `aria-current="page"` cuando `active`.
 *  - Focus ring custom (azul `--color-border-stroke-focus`) vía `:focus-visible`
 *    (solo teclado). Reemplaza el outline nativo.
 *  - Transitions envueltas en `motion-safe:` (respeta `prefers-reduced-motion`).
 *
 * Props
 * @param {string} label
 *   Texto visible del item.
 * @param {string} [size='default']
 *   'default' (h-76px desktop) | 'compact' (h-50px desktop). Mobile ignora este prop.
 * @param {boolean} [active=false]
 *   Resalta el item con underline verde + bold (solo visible en desktop).
 * @param {string} [device='auto']
 *   'auto' (responsive por viewport, default) | 'mobile' (fuerza layout mobile,
 *   muestra icono arrow-forward) | 'desktop' (fuerza layout desktop). Útil para
 *   previews / showcases. En producción dejar 'auto'.
 * @param {string} [href]
 *   Si se pasa, renderiza un `<a>` en lugar de `<button>`. Coexiste con `onClick`.
 * @param {Function} [onClick]
 *   Handler de click. Coexiste con `href` (útil para tracking).
 * @param {string} [customClassName='']
 *   Clases extra aplicadas al elemento raíz.
 */

// -------------------------------------------------------------------------
// IMPORTANTE: Tailwind escanea el código fuente buscando clases LITERALES.
// No detecta nombres construidos dinámicamente (ej. `${prefix}px-[12px]`).
// Por eso usamos strings literales completos, uno por cada combinación, y
// los hoisteamos a nivel de módulo (se evalúan UNA SOLA VEZ al cargar).
// -------------------------------------------------------------------------

// ----- Layout / contenedor raíz -----
const ROOT_AUTO = 'h-[72px] w-[151px] gap-[var(--spacing-x-small,8px)] justify-start md:h-[76px] md:w-auto md:gap-0 md:justify-center md:px-[12px] md:border-b-4 md:border-solid md:hover:bg-[var(--color-background-brand-secondary-hover)]';
const ROOT_AUTO_COMPACT = 'h-[72px] w-[151px] gap-[var(--spacing-x-small,8px)] justify-start md:h-[50px] md:w-auto md:gap-0 md:justify-center md:px-[12px] md:border-b-4 md:border-solid md:hover:bg-[var(--color-background-brand-secondary-hover)]';
const ROOT_DESKTOP = 'h-[76px] w-auto justify-center px-[12px] border-b-4 border-solid hover:bg-[var(--color-background-brand-secondary-hover)]';
const ROOT_DESKTOP_COMPACT = 'h-[50px] w-auto justify-center px-[12px] border-b-4 border-solid hover:bg-[var(--color-background-brand-secondary-hover)]';
const ROOT_MOBILE = 'h-[72px] w-[151px] gap-[var(--spacing-x-small,8px)] justify-start';

// ----- Border color (underline verde 4px en active, solo desktop) -----
const BORDER_DESKTOP_ACTIVE = 'border-[var(--color-icon-accent-positive)]';
const BORDER_DESKTOP_INACTIVE = 'border-transparent';
const BORDER_AUTO_ACTIVE = 'md:border-[var(--color-icon-accent-positive)]';
const BORDER_AUTO_INACTIVE = 'md:border-transparent';

// ----- Label -----
const LABEL_MOBILE = 'text-[20px] leading-[26px] font-medium text-left flex-1 min-w-0';
const LABEL_AUTO_ACTIVE = `${LABEL_MOBILE} md:text-[16px] md:leading-none md:flex-none md:text-center md:font-bold`;
const LABEL_AUTO_INACTIVE = `${LABEL_MOBILE} md:text-[16px] md:leading-none md:flex-none md:text-center md:font-normal md:group-hover:font-bold`;
const LABEL_DESKTOP_ACTIVE = 'text-[16px] leading-none flex-none text-center font-bold whitespace-nowrap';
const LABEL_DESKTOP_INACTIVE = 'text-[16px] leading-none flex-none text-center font-normal group-hover:font-bold whitespace-nowrap';

// ----- Focus ring -----
// Sobresale 4px por todos los lados del NavItem (Figma 9-17761 / 9-17762 + 2px extra).
// La clase `ds-focus-ring` es un hook estable para overrides en sample/showcase
// (NO es una utilidad Tailwind, solo un nombre para selectores `[&_.ds-focus-ring]`).
// `motion-safe:` respeta `prefers-reduced-motion`.
const FOCUS_RING_BASE = 'ds-focus-ring absolute pointer-events-none rounded-[4px] border-2 border-transparent group-focus-visible:border-[var(--color-border-stroke-focus)] motion-safe:transition-colors motion-safe:duration-150';
const FOCUS_RING_DESKTOP_ACTIVE = `${FOCUS_RING_BASE} inset-[-4px_-4px_-8px_-4px]`;
const FOCUS_RING_DESKTOP_INACTIVE = `${FOCUS_RING_BASE} inset-[-4px]`;
const FOCUS_RING_MOBILE = `${FOCUS_RING_BASE} inset-[-4px]`;
// Auto: simétrico en mobile, expandido abajo en md+ cuando active.
const FOCUS_RING_AUTO_ACTIVE = `${FOCUS_RING_BASE} inset-[-4px] md:inset-[-4px_-4px_-8px_-4px]`;
const FOCUS_RING_AUTO_INACTIVE = `${FOCUS_RING_BASE} inset-[-4px]`;

// ----- Icono arrow-forward (solo mobile) -----
const ICON_DEVICE_MOBILE = '';
const ICON_DEVICE_DESKTOP = 'hidden';
const ICON_DEVICE_AUTO = 'md:hidden';

// ----- Base del root (estable) -----
const BASE_ROOT = 'group relative box-border flex items-center cursor-pointer select-none no-underline motion-safe:transition-colors motion-safe:duration-150 ease-in-out text-[var(--color-text-normal-primary)] focus:outline-none focus-visible:outline-none';

const ArrowForwardIcon = ({ deviceClass }) => html`
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
    class=${`flex-shrink-0 aspect-square ${deviceClass}`}
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M12 4L10.59 5.41L16.17 11H4V13H16.17L10.59 18.59L12 20L20 12L12 4Z"
      fill="currentColor"
    />
  </svg>
`;

export const NavItem = ({
  label = '',
  size = 'default',
  active = false,
  device = 'auto',
  href = null,
  onClick = null,
  customClassName = '',
  children,
  ...rest
}) => {
  // ----- Lookup de clases según device + size + active -----
  let layoutClasses;
  let borderColorClass = '';
  let labelTextClasses;
  let focusRingClasses;
  let iconDeviceClass;

  if (device === 'desktop') {
    layoutClasses = size === 'compact' ? ROOT_DESKTOP_COMPACT : ROOT_DESKTOP;
    borderColorClass = active ? BORDER_DESKTOP_ACTIVE : BORDER_DESKTOP_INACTIVE;
    labelTextClasses = active ? LABEL_DESKTOP_ACTIVE : LABEL_DESKTOP_INACTIVE;
    focusRingClasses = active ? FOCUS_RING_DESKTOP_ACTIVE : FOCUS_RING_DESKTOP_INACTIVE;
    iconDeviceClass = ICON_DEVICE_DESKTOP;
  } else if (device === 'mobile') {
    layoutClasses = ROOT_MOBILE;
    labelTextClasses = LABEL_MOBILE;
    focusRingClasses = FOCUS_RING_MOBILE;
    iconDeviceClass = ICON_DEVICE_MOBILE;
  } else {
    layoutClasses = size === 'compact' ? ROOT_AUTO_COMPACT : ROOT_AUTO;
    borderColorClass = active ? BORDER_AUTO_ACTIVE : BORDER_AUTO_INACTIVE;
    labelTextClasses = active ? LABEL_AUTO_ACTIVE : LABEL_AUTO_INACTIVE;
    focusRingClasses = active ? FOCUS_RING_AUTO_ACTIVE : FOCUS_RING_AUTO_INACTIVE;
    iconDeviceClass = ICON_DEVICE_AUTO;
  }

  const cleanClasses = `${BASE_ROOT} ${layoutClasses} ${borderColorClass} ${customClassName}`
    .replace(/\s+/g, ' ')
    .trim();

  const cleanLabelClasses = `whitespace-nowrap ${labelTextClasses}`;

  const dataAttrs = {
    'data-name': 'navItem',
    'data-size': size,
    'data-active': active ? 'true' : 'false',
    'data-device': device,
  };

  const inner = html`
    <span class=${focusRingClasses} aria-hidden="true"></span>
    <span class=${cleanLabelClasses}>${label || children}</span>
    <${ArrowForwardIcon} deviceClass=${iconDeviceClass} />
  `;

  if (href) {
    return html`
      <a
        href=${href}
        class=${cleanClasses}
        onClick=${onClick}
        aria-current=${active ? 'page' : null}
        ...${dataAttrs}
        ...${rest}
      >
        ${inner}
      </a>
    `;
  }

  return html`
    <button
      type="button"
      class=${cleanClasses}
      onClick=${onClick}
      aria-current=${active ? 'page' : null}
      ...${dataAttrs}
      ...${rest}
    >
      ${inner}
    </button>
  `;
};

export default NavItem;
