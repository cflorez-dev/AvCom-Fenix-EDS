import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { Icon } from '../icon/icon.js';

const html = htm.bind(h);

/**
 * ListItem - Atomic component for rendering an interactive list item
 *
 * @param {Object} props - Component properties
 * @param {string} props.label - Primary text for the item
 * @param {string} props.description - Secondary descriptive text (optional)
 * @param {string} props.iconBefore - Icon name before text (e.g., "flags/colombia-flag")
 * @param {boolean} props.iconBeforeIsFlag - If iconBefore is a flag (no color change)
 * @param {string} props.iconAfter - Icon name after text (e.g., "navigation/chevron-right")
 * @param {boolean} props.iconAfterIsFlag - If iconAfter is a flag (no color change)
 * @param {boolean} props.selected - If item is selected (shows green bar and bold text)
 * @param {boolean} props.showSelectedIcon - If check icon should be shown when selected
 * @param {boolean} props.disabled - If item is disabled
 * @param {Function} props.onClick - Click handler function
 * @param {Function} props.onKeyDown - KeyDown handler function (optional, overrides default)
 * @param {string} props.customClassName - Additional CSS classes
 * @param {string} props.role - ARIA role ('button' or 'option', default: 'button')
 * @param {('default'|'sidemenu')} [props.size='default'] - Vertical density.
 *   - `default`: `py-3` (12px → row ~48px). Use case: dropdowns, language selectors,
 *     option lists where compactness matters.
 *   - `sidemenu`: `py-6` (24px → row ~72px). Use case: Members side menu
 *     (Figma 80:13852 family) y cualquier menú lateral mobile donde el item
 *     debe ser tap-friendly. Mantiene el resto del styling (hover/active/selected/focus)
 *     idéntico al variant default.
 * @param {string|null} [props.href=null] - Si se pasa, el item se renderiza como
 *   `<a>` (link nativo) en vez de `<div role="button">`. Habilita Enter de browser,
 *   right-click → "abrir en nueva pestaña" y todas las semantics nativas.
 * @param {string|null} [props.target=null] - target del `<a>` (ej. `_blank` para
 *   externos). Solo aplica con `href`.
 * @param {string|null} [props.rel=null] - rel del `<a>` (ej. `noopener noreferrer`).
 *   Solo aplica con `href`.
 * @param {string|null} [props.ariaLabel=null] - Override del aria-label. Si es
 *   null, se usa `label`. Útil cuando el SR debe escuchar más contexto que el
 *   texto visible (ej. label + "abre en nueva ventana").
 * @param {string|null} [props.ariaCurrent=null] - aria-current del item (ej.
 *   `'page'` cuando el item apunta a la URL actual). Útil para listas de
 *   navegación.
 * @param {boolean} [props.lineClamp2=false] - Trunca `label` y `description` a
 *   máximo 2 líneas con ellipsis (Figma Members menu 131:9830). Internamente
 *   usa `-webkit-line-clamp` (soportado por todos los browsers actuales).
 */
export const ListItem = ({
  label = 'label',
  description = null,
  iconBefore = null,
  iconBeforeIsFlag = false,
  iconAfter = null,
  iconAfterIsFlag = false,
  selected = false,
  showSelectedIcon = true,
  disabled = false,
  onClick = null,
  onKeyDown = null,
  customClassName = '',
  role = 'button',
  size = 'default',
  href = null,
  target = null,
  rel = null,
  ariaLabel = null,
  ariaCurrent = null,
  lineClamp2 = false,
}) => {
  const handleClick = (e) => {
    if (disabled) {
      // Si es un <a>, evitar la navegación cuando está disabled.
      if (href) e.preventDefault();
      return;
    }
    if (onClick) onClick(e);
  };

  const handleKeyDownInternal = (e) => {
    if (disabled) return;
    // External onKeyDown override.
    if (onKeyDown) {
      onKeyDown(e);
      return;
    }
    // Default behavior: Enter or Space triggers onClick. Cuando el item es un
    // `<a>` con `href`, el browser ya maneja Enter nativo — solo manejamos
    // Space (que en links nativos no dispara click). Si solo hay onClick (sin
    // href), manejamos ambas teclas.
    if (e.key === 'Enter' && !href) {
      e.preventDefault();
      if (onClick) onClick(e);
    } else if (e.key === ' ') {
      e.preventDefault();
      if (onClick) onClick(e);
      else if (href) e.currentTarget.click();
    }
  };

  // Vertical padding por size (Members SideMenu spec usa py-6 / 24px).
  // El resto del layout es idéntico entre variants.
  const verticalPadding = size === 'sidemenu' ? 'py-6' : 'py-3';
  const baseClasses = `group w-full min-h-12 px-4 ${verticalPadding} relative inline-flex justify-start items-center gap-4 transition-[background-color]`;

  const interactiveClasses = disabled
    ? 'opacity-60'
    : 'cursor-pointer bg-background-brand-secondary-default hover:bg-background-brand-secondary-hover active:bg-background-brand-primary-active focus:outline-none focus-visible:[box-shadow:inset_0_0_0_2px_var(--color-border-stroke-focus)]';

  const textClasses = disabled
    ? 'text-[var(--color-neutral-400)]'
    : 'text-[var(--color-text-normal-primary)] group-active:text-[var(--color-text-normal-lighter)]';

  const descriptionClasses = disabled
    ? 'text-[var(--color-neutral-400)]'
    : 'text-[var(--color-text-normal-secondary)] group-active:text-[var(--color-text-normal-lighter)]';

  const fontWeight = selected ? 'font-bold' : 'font-normal';

  // Truncado a 2 líneas con ellipsis (Figma Members menu 131:9830). Se aplica
  // sobre el texto del label (y description si existiera). `min-w-0` en el
  // wrapper flex es CRÍTICO para que el clamp funcione dentro de un row con
  // íconos (sin él, el flex item nunca shrinkea y el texto desborda en una sola
  // línea infinita en lugar de truncar).
  const lineClampClasses = lineClamp2
    ? 'overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] break-words'
    : '';
  const labelWrapperFlexClasses = lineClamp2 ? 'min-w-0' : '';

  // Classes for iconBefore wrapper
  const getIconBeforeWrapperClasses = () => {
    if (iconBeforeIsFlag || disabled) {
      return 'w-6 h-6 relative';
    }
    return 'w-6 h-6 relative [&_svg_path]:fill-[currentColor] '
      + 'text-[var(--color-text-normal-primary)] '
      + 'group-active:text-[var(--color-icon-brand-primary)]';
  };

  // Classes for iconAfter wrapper
  const getIconAfterWrapperClasses = () => {
    const iconAfterBase = 'relative flex items-center justify-center';
    if (iconAfterIsFlag || disabled) {
      return iconAfterBase;
    }
    return `${iconAfterBase} [&_svg_path]:fill-[currentColor] `
      + 'text-[var(--color-text-normal-primary)] '
      + 'group-active:text-[var(--color-icon-brand-primary)]';
  };

  // Classes for selected icon: green by default, white when active
  const getSelectedIconWrapperClasses = () => {
    const selectedIconBase = 'relative flex items-center justify-center';
    if (disabled) {
      return selectedIconBase;
    }
    return `${selectedIconBase} [&_svg_path]:fill-[currentColor] `
      + 'text-[var(--color-alert-success-border)] '
      + 'group-active:text-[var(--color-icon-brand-primary)]';
  };

  const iconBeforeWrapperClasses = getIconBeforeWrapperClasses();
  const iconAfterWrapperClasses = getIconAfterWrapperClasses();
  const selectedIconWrapperClasses = getSelectedIconWrapperClasses();

  const barColor = disabled
    ? 'bg-[var(--color-neutral-400)]'
    : 'bg-[var(--color-alert-success-border)]';

  // Aria-label final: si llega override explícito, lo usamos; si no, cae a
  // `label`. Útil para sufijos contextuales (ej. "abre en nueva ventana").
  const finalAriaLabel = ariaLabel || label;

  // Render del contenido común (icons + texto + chevron). Es idéntico para
  // `<a>` y `<div>`, solo cambia el wrapper.
  const innerContent = html`
      ${iconBefore
      && html`
        <div class="${iconBeforeWrapperClasses}">
          <${Icon}
            icon=${iconBefore}
            size="xl"
            color=${iconBeforeIsFlag || disabled ? undefined : 'currentColor'}
          />
        </div>
      `}

      <div
        class="flex-1 inline-flex flex-col justify-center items-start ${labelWrapperFlexClasses} ${description
  ? 'gap-1'
  : ''}"
      >
        <div
          class="self-stretch justify-start ${textClasses} text-base ${fontWeight} ${lineClampClasses}"
        >
          ${label}
        </div>
        ${description
        && html`
          <div
            class="self-stretch justify-start ${descriptionClasses} text-sm ${fontWeight} ${lineClampClasses}"
          >
            ${description}
          </div>
        `}
      </div>

      ${(() => {
    if (selected && showSelectedIcon) {
      return html`
        <div class="${selectedIconWrapperClasses}">
          <${Icon}
            icon="alert/success"
            size="xl"
            color=${disabled ? undefined : 'currentColor'}
          />
        </div>
      `;
    }
    if (iconAfter) {
      return html`
        <div class="${iconAfterWrapperClasses}">
          <${Icon}
            icon=${iconAfter}
            size="xl"
            color=${iconAfterIsFlag || disabled ? undefined : 'currentColor'}
          />
        </div>
      `;
    }
    return html`
      <div class="relative flex items-center justify-center"></div>
    `;
  })()}

      ${selected
      && html`
        <div
          class="w-[4px] h-9 left-0 top-1/2 -translate-y-1/2 absolute ${barColor}"
        ></div>
      `}
  `;

  // Si llega `href`, renderizamos un `<a>` (link nativo): habilita Enter del
  // browser, right-click → "abrir en pestaña", drag-as-link, etc. Si no, el
  // legacy `<div role="button">`. NO ponemos `role` en el `<a>` (los browsers
  // lo anuncian como "link" por default — overridearlo confunde al SR).
  if (href) {
    return html`
      <a
        class="${baseClasses} ${interactiveClasses} no-underline ${customClassName}"
        data-name="list-item"
        data-disabled=${disabled}
        data-selected=${selected}
        href=${disabled ? undefined : href}
        target=${target || undefined}
        rel=${rel || undefined}
        onClick=${handleClick}
        onKeyDown=${handleKeyDownInternal}
        tabindex=${disabled ? -1 : 0}
        aria-label=${finalAriaLabel}
        aria-disabled=${disabled}
        aria-current=${ariaCurrent || undefined}
      >
        ${innerContent}
      </a>
    `;
  }

  return html`
    <div
      class="${baseClasses} ${interactiveClasses} ${customClassName}"
      data-name="list-item"
      data-disabled=${disabled}
      data-selected=${selected}
      onClick=${handleClick}
      onKeyDown=${handleKeyDownInternal}
      tabindex=${disabled ? -1 : 0}
      role=${role}
      aria-label=${finalAriaLabel}
      aria-disabled=${disabled}
      aria-pressed=${role === 'button' ? selected : undefined}
      aria-selected=${role === 'option' ? selected : undefined}
      aria-current=${ariaCurrent || undefined}
    >
      ${innerContent}
    </div>
  `;
};

export default ListItem;
