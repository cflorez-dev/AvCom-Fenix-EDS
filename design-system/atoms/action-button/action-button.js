import { h } from '@dropins/tools/preact.js';
import { useMemo } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';

const html = htm.bind(h);

/**
 * ActionButton - Quick access button with icon and text for Booking Box top section
 *
 * ## Props
 * - `icon`: `string | VNode` – Icon (image path or SVG VNode).
 * - `label`: `string` – Button text (required for accessibility).
 * - `variant`: `"default" | "iconRight"` – Button variant (default: "default").
 * - `href`: `string` – Destination URL.
 * - `target`: `"_self" | "_blank"` – Link target (default: "_self").
 * - `onClick`: `function` – onClick callback (optional, if no href).
 * - `customClassName`: `string` – Additional CSS classes.
 * - `...rest`: Other valid properties.
 *
 * ## Variants
 * - **default**: Circular icon (32px) on left, text on right (Cars, Hotels, etc.)
 * - **iconRight**: Text on left, small icon (20px) on right (Buy with miles)
 *
 * ## States (from Figma design - node-id: 2742-3158)
 * 1. **Default**: White background, 6px shadow rgba(90,90,90,0.2), no outline
 * 2. **Focus**: 2px blue outline (#2196F3) with 2px offset
 * 3. **Hover**: Maintains default appearance (no visual changes)
 * 4. **Pressed**: Dark gray background (#E0E0E0)
 *
 * ## Usage Example
 * ```javascript
 * <${ActionButton}
 *   icon="/icons/calendar.svg"
 *   label="Cars"
 *   variant="default"
 *   href="/cars"
 * />
 *
 * <${ActionButton}
 *   icon="/icons/miles.svg"
 *   label="Buy with miles"
 *   variant="iconRight"
 *   href="/miles"
 * />
 * ```
 */
export const ActionButton = ({
  icon,
  label,
  variant = 'default',
  href,
  target = '_self',
  onClick,
  customClassName = '',
  ...rest
}) => {
  // Determine if it's a link or button
  const isLink = !!href;

  // Common CSS classes for all variants
  const commonClasses = 'inline-flex justify-start min-h-[48px] items-center gap-2 py-2 bg-[var(--bg-card-lighter)] rounded-4xl shadow-[0px_0px_6px_0px_rgba(90,90,90,0.2)] hover:shadow-[0px_2px_20px_2px_rgba(73,73,73,0.25)] box:active:shadow-[0px_2px_20px_2px_rgba(73,73,73,0.25)] !no-underline transition-[background-color,transform] duration-[var(--transition-normal)] cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-primary)]';

  // Variant-specific classes
  const variantClasses = variant === 'iconRight'
    ? 'self-stretch px-3 active:bg-background-brand-secondary-active'
    : 'pl-2 pr-3 active:bg-[var(--state-disabled)]';

  const baseClasses = `${commonClasses} ${variantClasses} ${customClassName}`;

  // Label typography classes (constant, defined once)
  const labelClasses = 'justify-center text-[var(--text-normal-primary)] text-base font-normal leading-4 whitespace-nowrap';

  // Memoize icon rendering to avoid recreation on every render
  const iconElement = useMemo(() => {
    if (!icon) return null;

    // Create icon content based on type (string or VNode)
    // Icons are tiny SVGs (<1KB) used in booking-box and top-action-buttons
    // (both always above-the-fold). Eager loading paints them with the
    // first frame instead of waiting for IntersectionObserver discovery.
    const iconContent = typeof icon === 'string'
      ? html`<img
          src=${icon}
          alt=""
          role="presentation"
          class="w-[15px] h-[15px] object-contain"
          loading="eager"
          decoding="async"
        />`
      : html`<div class="w-5 h-5 flex items-center justify-center" role="img" aria-hidden="true">${icon}</div>`;

    if (variant === 'iconRight') {
      // iconRight variant: small icon (15px) without background
      return html`
      <div class="w-[20px] h-[20px] flex justify-center items-center">
        <div class="w-[15px] h-[15px] flex justify-center items-center overflow-hidden" aria-hidden="true">
          ${iconContent}
        </div>
      </div>
      `;
    }

    // default variant: circular icon with zinc-100 background
    return html`
      <div
        class="w-8 h-8 p-1.5 bg-[#efefef] rounded-[66.67px] outline outline-[0.67px] outline-offset-[-0.67px] flex justify-center items-center gap-1.5 overflow-hidden"
        aria-hidden="true"
      >
        ${iconContent}
      </div>
    `;
  }, [icon, variant]);

  // Common props for both link and button
  const commonProps = {
    class: baseClasses,
    'data-name': 'actionButton',
    'data-variant': variant,
    ...rest,
  };

  // Content layout based on variant
  const content = variant === 'iconRight'
    ? html`
        <div class="${labelClasses}">${label}</div>
        ${iconElement}
      `
    : html`
        ${iconElement}
        <div class="${labelClasses}">${label}</div>
      `;

  // Render as link
  if (isLink) {
    return html`
      <a
        href=${href}
        target=${target}
        rel=${target === '_blank' ? 'noopener noreferrer' : undefined}
        ...${commonProps}
      >
        ${content}
      </a>
    `;
  }

  // Render as button
  return html`
    <button
      type="button"
      onClick=${onClick}
      ...${commonProps}
    >
      ${content}
    </button>
  `;
};

export default ActionButton;
