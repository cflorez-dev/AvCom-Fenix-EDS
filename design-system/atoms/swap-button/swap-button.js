import { h } from '@dropins/tools/preact.js';
import { useState, useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';

const html = htm.bind(h);

// Constants
const MOBILE_BREAKPOINT = 768;

/**
 * SwapButton - Botón circular para intercambiar valores entre origen y destino
 *
 * ## Props
 * - `onClick`: `function` – Callback al hacer click.
 * - `disabled`: `boolean` – Si el botón está deshabilitado (default: false).
 * - `customClassName`: `string` – Clases CSS adicionales.
 * - `...rest`: Otras propiedades válidas.
 *
 * ## Variantes (según Figma node-id: 2739-33033)
 * - **Mobile** (44x44px): Flechas verticales, background white, border #949494, icon 24x24px
 * - **Desktop** (22x22px): Flechas horizontales, background white, border #949494, icon 16x16px
 * - **Disabled**: Background #f5f5f5, border #d9d9d9, icon gray
 *
 * ## Comportamiento
 * - Click effect: trigger rotation animation 180° acumulativa (sin regreso visible)
 * - Accessibility: aria-label="Intercambiar origen y destino"
 * - Keyboard: Enter o Space para activar
 *
 * ## Ejemplo de uso
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
  // Performance: Rotación acumulativa para evitar regreso visible
  const [rotationDegrees, setRotationDegrees] = useState(0);

  // Auto-detect viewport mobile
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false,
  );

  // Listener de resize para detectar cambios de viewport
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

  // Handler para click con animación acumulativa
  const handleClick = (e) => {
    if (disabled || !onClick) return;

    // Incrementar rotación acumulativa (sin regreso visible)
    setRotationDegrees((prev) => prev + 180);

    // Call onClick callback
    onClick(e);
  };

  // Keyboard handler
  const handleKeyDown = (e) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e);
    }
  };

  // Clases según viewport y estado
  const size = isMobile ? 'size-[44px]' : 'size-[22px]';
  const iconSize = isMobile ? 'size-[24px]' : 'size-[16px]';
  const padding = 'p-[2.2px]';

  // Performance: Pre-calcular clases base (template string)
  const baseClasses = `${size} ${padding} rounded-[22px] border border-solid flex items-center justify-center transition-all duration-200 outline-none ${
    disabled
      ? 'bg-[#f5f5f5] border-[#d9d9d9] cursor-not-allowed'
      : 'bg-white border-[#949494] cursor-pointer'
  } ${customClassName}`;

  // Performance: Icon rotation acumulativa (sin regreso visible)
  const iconContainerStyles = {
    transition: 'transform 200ms ease-in-out',
    transform: `rotate(${rotationDegrees}deg)`,
    transformOrigin: 'center',
  };

  // Accessibility: SVG Icons - swap_vert (mobile) / swap_horiz (desktop)
  // Mobile: Flechas verticales
  const swapIconMobile = html`
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
      <path
        d="M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3L5 6.99h3V14h2V6.99h3L9 3z"
        fill=${disabled ? '#949494' : '#1b1b1b'}
      />
    </svg>
  `;

  // Desktop: Flechas horizontales
  const swapIconDesktop = html`
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
        fill=${disabled ? '#949494' : '#1b1b1b'}
      />
    </svg>
  `;

  const swapIcon = isMobile ? swapIconMobile : swapIconDesktop;

  return html`
    <button
      type="button"
      class=${baseClasses}
      onClick=${handleClick}
      onKeyDown=${handleKeyDown}
      disabled=${disabled}
      aria-label=${i18n['bookingBox.labels.swap'] || 'Intercambiar origen y destino'}
      aria-disabled=${disabled}
      data-name="swapButton"
      data-device=${isMobile ? 'mobile' : 'desktop'}
      data-disabled=${disabled}
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
