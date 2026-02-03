import { h } from '@dropins/tools/preact.js';
import { useState, useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Button } from '../button/button.js';

const html = htm.bind(h);

/**
 * BackToTopButton - Button that appears after scroll and returns user to top
 *
 * ## Props
 * - `threshold`: `number` – Scroll pixels before button appears (default: `300`).
 * - `icon`: `string` – SVG icon path or component (default: arrow-up).
 * - `ariaLabel`: `string` – Accessibility label (default: `"Back to top"`).
 * - `customClassName`: `string` – Additional CSS classes.
 * - `position`: `object` – Position config: `{ bottom: '24px', right: '24px' }`.
 * - `variant`: `string` – Button variant from design system (default: `"secondary"`).
 * - `...rest`: Other valid button properties.
 *
 * ## Features
 * - ✅ Appears after scrolling down past threshold
 * - ✅ Smooth scroll to top on click
 * - ✅ Auto-hides when reaching top
 * - ✅ Uses Button atom from design system
 * - ✅ Accessible (ARIA labels, keyboard navigation)
 * - ✅ Responsive positioning
 */
export const BackToTopButton = ({
  threshold = 300,
  icon = null,
  ariaLabel = 'Back to top',
  customClassName = '',
  position = { bottom: '24px', right: '24px' },
  variant = 'secondary',
  ...rest
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Detect scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > threshold;
      setIsVisible(scrolled);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [threshold]);

  // Scroll to top handler
  const handleClick = (e) => {
    e.preventDefault();
    
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });

    // Optional: trigger custom callback if provided
    if (rest.onClick) {
      rest.onClick(e);
    }
  };

  // Container classes - Fixed positioning with Tailwind (always bottom-right corner)
  const containerClasses = 'fixed '
    + 'bottom-[20px] right-[20px] '
    + 'max-sm:bottom-[12px] max-sm:right-[12px] '
    + 'transition-all duration-[var(--transition-normal)] ease-[var(--ease-in-out)] '
    + 'z-[90] ' // Below modals (z-100), above content
    + (isVisible
      ? 'opacity-100 visible translate-y-0'
      : 'opacity-0 invisible translate-y-[10px]');

  // Default icon (arrow up) - Matches Figma design
  const defaultIcon = html`
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none"
      class="w-[24px] h-[24px]"
    >
      <g transform="translate(6, 8)">
        <path 
          fill-rule="evenodd" 
          clip-rule="evenodd" 
          d="M6 0L0 6L1.41 7.41L6 2.83L10.59 7.41L12 6L6 0Z" 
          fill="#1B1B1B"
        />
      </g>
    </svg>
  `;

  return html`
    <div
      class=${`${containerClasses} ${customClassName}`}
      aria-hidden=${!isVisible}
      data-name="backToTopButton"
    >
      <${Button}
        variant=${variant}
        size="md"
        iconOnly=${true}
        onClick=${handleClick}
        aria-label=${ariaLabel}
        tabIndex=${isVisible ? 0 : -1}
        customClassName="!w-[48px] !h-[48px] !min-w-[48px] !min-h-[48px] !rounded-[32px] !aspect-[1/1] !gap-0"
        ...${rest}
      >
        ${icon || defaultIcon}
      </${Button}>
    </div>
  `;
};

export default BackToTopButton;
