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
}) => {
  const handleClick = (e) => {
    if (disabled) return;
    if (onClick) onClick(e);
  };

  const handleKeyDownInternal = (e) => {
    if (disabled) return;
    // If external onKeyDown is provided, call it first
    if (onKeyDown) {
      onKeyDown(e);
      return;
    }
    // Default behavior: Enter or Space triggers onClick
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onClick) onClick(e);
    }
  };

  const baseClasses = 'group w-full min-h-12 px-4 py-3 relative inline-flex justify-start items-center gap-4 transition-[background-color]';

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
      aria-label=${label}
      aria-disabled=${disabled}
      aria-pressed=${role === 'button' ? selected : undefined}
      aria-selected=${role === 'option' ? selected : undefined}
    >
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
        class="flex-1 inline-flex flex-col justify-center items-start ${description
    ? 'gap-1'
    : ''}"
      >
        <div
          class="self-stretch justify-start ${textClasses} text-base ${fontWeight}"
        >
          ${label}
        </div>
        ${description
        && html`
          <div
            class="self-stretch justify-start ${descriptionClasses} text-sm ${fontWeight}"
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
    </div>
  `;
};

export default ListItem;
