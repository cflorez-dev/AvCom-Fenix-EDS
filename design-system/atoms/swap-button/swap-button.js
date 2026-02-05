import { h } from '@dropins/tools/preact.js';
import {
  useState, useEffect, useMemo, useCallback,
} from '@dropins/tools/preact-hooks.js';
import htm from 'htm';

const html = htm.bind(h);

// Constants
const MOBILE_BREAKPOINT = 768;
const ICON_COLOR_DISABLED = '#949494';
const ICON_COLOR_ENABLED = '#1b1b1b';

/**
 * SwapButton - Circular button to swap values between origin and destination
 *
 * ## Props
 * - `onClick`: `function` – Callback when clicked.
 * - `disabled`: `boolean` – If button is disabled (default: false).
 * - `customClassName`: `string` – Additional CSS classes.
 * - `...rest`: Other valid properties.
 *
 * ## Variants (according to Figma node-id: 2739-33033)
 * - **Mobile** (44x44px): Vertical arrows, white background, border #949494, icon 24x24px
 * - **Desktop** (22x22px): Horizontal arrows, white background, border #949494, icon 16x16px
 * - **Disabled**: Background #f5f5f5, border #d9d9d9, gray icon
 *
 * ## Behavior
 * - Click effect: trigger cumulative 180° rotation animation (no visible return)
 * - Accessibility: aria-label="Swap origin and destination"
 * - Keyboard: Enter or Space to activate
 *
 * ## Usage Example
 * ```javascript
 * <${SwapButton}
 *   onClick=${handleSwap}
 *   disabled=${!origin && !destination}
 * />
 * ```
 */
export const SwapButton = ({
  onClick,
  disabled = false,
  customClassName = '',
  i18n = {},
  ...rest
}) => {
  // Performance: Cumulative rotation to avoid visible return
  const [rotationDegrees, setRotationDegrees] = useState(0);

  // Auto-detect mobile viewport
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false,
  );

  // Resize listener to detect viewport changes
  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth < MOBILE_BREAKPOINT;
      if (newIsMobile !== isMobile) {
        setIsMobile(newIsMobile);
      }
    };

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isMobile]);

  // Handler for click with cumulative animation
  const handleClick = useCallback((e) => {
    if (disabled || !onClick) return;

    // Increment cumulative rotation (no visible return)
    setRotationDegrees((prev) => prev + 180);

    // Call onClick callback
    onClick(e);
  }, [disabled, onClick]);

  // Keyboard handler
  const handleKeyDown = useCallback((e) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e);
    }
  }, [disabled, handleClick]);

  // ========== COMPUTED VALUES ==========
  // Classes based on viewport and state
  const size = useMemo(() => (isMobile ? 'size-[44px]' : 'size-[22px]'), [isMobile]);
  const iconSize = useMemo(() => (isMobile ? 'size-[24px]' : 'size-[16px]'), [isMobile]);
  const padding = 'p-[2.2px]';

  const iconColor = useMemo(
    () => (disabled ? ICON_COLOR_DISABLED : ICON_COLOR_ENABLED),
    [disabled],
  );

  // Performance: Pre-calculate base classes
  const baseClasses = useMemo(
    () => `${size} ${padding} rounded-[22px] border border-solid flex items-center justify-center transition-all duration-200 outline-none ${
      disabled
        ? 'bg-[#f5f5f5] border-[#d9d9d9] cursor-not-allowed'
        : 'bg-white border-[#949494] cursor-pointer'
    } ${customClassName}`,
    [size, disabled, customClassName],
  );

  // Performance: Cumulative icon rotation (no visible return)
  const iconContainerStyles = useMemo(
    () => ({
      transition: 'transform 200ms ease-in-out',
      transform: `rotate(${rotationDegrees}deg)`,
      transformOrigin: 'center',
    }),
    [rotationDegrees],
  );

  // Accessibility: SVG Icons - swap_vert (mobile) / swap_horiz (desktop)
  // Mobile: Vertical arrows
  const swapIconMobile = useMemo(
    () => html`
    <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    class=${iconSize}
    aria-hidden="true"
    role="presentation"
  >
    <mask id="mask0_12405_40724" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
      <rect x="24" y="1.04907e-06" width="24" height="24" transform="rotate(90 24 1.04907e-06)" fill="#D9D9D9"/>
    </mask>
    <g mask="url(#mask0_12405_40724)">
      <path d="M4 7L9 2L14 7L12.575 8.4L10 5.825L10 13L8 13L8 5.825L5.425 8.4L4 7ZM10 17L11.425 15.6L14 18.175L14 11L16 11L16 18.175L18.575 15.6L20 17L15 22L10 17Z" fill=${iconColor}/>
    </g>
  </svg>
    `,
    [iconSize, iconColor],
  );

  // Desktop: Horizontal arrows
  const swapIconDesktop = useMemo(
    () => html`
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class=${iconSize}
        aria-hidden="true"
        role="presentation"
      >
        <path
          d="M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z"
          fill=${iconColor}
        />
      </svg>
    `,
    [iconSize, iconColor],
  );

  const swapIcon = useMemo(
    () => (isMobile ? swapIconMobile : swapIconDesktop),
    [isMobile, swapIconMobile, swapIconDesktop],
  );

  const ariaLabel = useMemo(
    () => i18n['bookingBox.labels.swap'] || 'Swap origin and destination',
    [i18n],
  );

  // ========== RENDER ==========
  return html`
    <button
      type="button"
      class=${baseClasses}
      onClick=${handleClick}
      onKeyDown=${handleKeyDown}
      disabled=${disabled}
      aria-label=${ariaLabel}
      aria-disabled=${disabled}
      data-name="swapButton"
      data-device=${isMobile ? 'mobile' : 'desktop'}
      data-disabled=${disabled}
      tabIndex="-1"
      ...${rest}
    >
      <div
        class="${iconSize} flex items-center justify-center"
        style=${iconContainerStyles}
        aria-hidden="true"
      >
        ${swapIcon}
      </div>
    </button>
  `;
};

export default SwapButton;
