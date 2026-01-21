import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { Icon } from '../icon/icon.js';

const html = htm.bind(h);

/**
 * CarouselNavigationButton - Navigation button for carousel
 * Matches Figma design specs with proper states (normal, hover, focus, press)
 *
 * ## Props
 * - `direction`: `"left" | "right"` – Button direction (determines icon and default position).
 * - `onClick`: `(event: Event) => void` – Click handler.
 * - `disabled`: `boolean` – Disabled state (default: `false`).
 * - `absolute`: `boolean` – If true, button has absolute positioning with top/translate (default: `true`). Set to false for fixed/static positioning.
 * - `absoluteTop`: `string` – Tailwind class for vertical positioning when absolute (default: `"top-1/2"`).
 * - `absoluteTranslate`: `string` – Tailwind class for transform translate when absolute (default: `"-translate-y-1/2"`).
 * - `customClassName`: `string` – Additional CSS classes for customization.
 * - `...rest`: Other valid HTML button attributes passed to the root element.
 *
 * ## Behavior
 * - **Absolute mode (default)**: Button positioned absolutely with left/right positioning, centered vertically. Ideal for overlaying on carousel container.
 * - **Fixed mode**: Button rendered without absolute positioning, allowing manual placement via customClassName or parent layout.
 * - **States**: Normal, hover (background #E9E9E9), focus (outline + shadow), active (background #D9D9D9, scale 95%).
 * - **Disabled**: Opacity 50%, cursor not-allowed, pointer-events none.
 *
 * @example
 * ```javascript
 * // Absolute positioning (default - carousel overlay)
 * <${CarouselNavigationButton}
 *   direction="left"
 *   onClick=${handlePrev}
 * />
 *
 * // Custom absolute positioning (top aligned)
 * <${CarouselNavigationButton}
 *   direction="right"
 *   onClick=${handleNext}
 *   absoluteTop="top-4"
 *   absoluteTranslate=""
 * />
 *
 * // Fixed positioning (manual layout)
 * <${CarouselNavigationButton}
 *   direction="right"
 *   onClick=${handleNext}
 *   absolute=${false}
 *   customClassName="ml-4"
 * />
 * ```
 */
export const CarouselNavigationButton = ({
  direction,
  onClick,
  disabled = false,
  absolute = true,
  absoluteTop = 'top-1/2',
  absoluteTranslate = '-translate-y-1/2',
  customClassName = '',
  ...rest
}) => {
  const iconName = direction === 'left' ? 'navigation/chevron-left' : 'navigation/chevron-right';
  const position = direction === 'left' ? 'left-0' : 'right-0';

  // ========== TAILWIND CLASSES (Layout & Structure) ==========
  const baseClasses = 'inline-flex items-center justify-center box-border cursor-pointer '
    + '!m-0 '
    + '!w-[32px] !h-[32px] '
    + '!px-0 !py-0 '
    + '!border !border-solid '
    + '!rounded-[var(--border-radius-full)] '
    + 'relative '
    + 'shrink-0 '
    + 'bg-white '
    + 'border-[#8d8d8d] '
    + 'shadow-[0_0_6px_2px_rgba(90,90,90,0.20)] ';

  // ========== DISABLED STATE ==========
  const disabledClasses = disabled
    ? '!opacity-50 !cursor-not-allowed pointer-events-none'
    : '';

  // ========== HOVER/FOCUS/ACTIVE STATES ==========
  const interactionClasses = disabled
    ? ''
    : 'hover:!bg-[#E9E9E9] '
      + 'focus-visible:!bg-[#E9E9E9] '
      + 'focus-visible:outline-none '
      + 'focus-visible:!shadow-[0px_2px_20px_2px_rgba(73,73,73,0.25),0_0_0_2px_white,0_0_0_4px_#1d9bf0] '
      + 'active:!bg-[#D9D9D9] active:scale-95 '
      + 'transition-all duration-[var(--transition-fast)] ';

  const finalClasses = [
    baseClasses,
    interactionClasses,
    disabledClasses,
    customClassName,
  ].join(' ').trim();

  // ========== BUTTON ELEMENT ==========
  const buttonElement = html`
    <button
      type="button"
      class=${finalClasses}
      onClick=${onClick}
      disabled=${disabled}
      aria-label=${direction === 'left' ? 'Previous' : 'Next'}
      data-name="carouselNavigationButton"
      data-mode="${direction}"
      ...${rest}
    >
      <${Icon} icon="${iconName}" size="s" />
    </button>
  `;

  // ========== RENDER WITH/WITHOUT ABSOLUTE POSITIONING ==========
  if (absolute) {
    const absoluteClasses = [
      'absolute',
      position,
      absoluteTop,
      absoluteTranslate,
      'z-30',
    ].filter(Boolean).join(' ');

    return html`
      <div class="${absoluteClasses}">
        ${buttonElement}
      </div>
    `;
  }

  return buttonElement;
};

export default CarouselNavigationButton;
