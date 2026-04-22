import { h } from '@dropins/tools/preact.js';
import {
  useState,
  useRef,
  useEffect,
  useCallback,
} from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Icon } from '../../atoms/icon/icon.js';
import { ListItem } from '../../atoms/list-item/list-item.js';

const html = htm.bind(h);

const MOBILE_BREAKPOINT = '(max-width: 480px)';
const MOBILE_DROPDOWN_WIDTH = 200;
const DROPDOWN_VERTICAL_OFFSET = 8;

/**
 * HeadingDropdownSelector - A dropdown selector component with heading and value
 * Implements pixel-perfect design from Figma with all interaction states
 *
 * @param {string} label - Heading label text
 * @param {string} value - Currently selected value to display
 * @param {Array<string>} options - Array of option strings
 * @param {string} customClassName - Additional CSS classes
 * @param {Function} onChange - Callback when selection changes (receives selected option string)
 */
export const HeadingDropdownSelector = ({
  label = '',
  value = '',
  options = [],
  customClassName = '',
  onChange,
  ...rest
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobilePosition, setMobilePosition] = useState({ left: 0, top: 0 });
  const containerRef = useRef(null);
  const triggerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Track mobile breakpoint for conditional rendering/positioning
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;

    const mediaQuery = window.matchMedia(MOBILE_BREAKPOINT);
    const handleMediaChange = () => {
      setIsMobile(mediaQuery.matches);
    };

    handleMediaChange();
    mediaQuery.addEventListener('change', handleMediaChange);

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, []);

  const updateMobilePosition = useCallback(() => {
    if (!containerRef.current || !triggerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const centeredLeft = (window.innerWidth / 2) - (MOBILE_DROPDOWN_WIDTH / 2) - containerRect.left;
    const top = (triggerRect.bottom - containerRect.top) + DROPDOWN_VERTICAL_OFFSET;

    setMobilePosition({
      left: centeredLeft,
      top,
    });
  }, []);

  // Keep the mobile dropdown centered on resize/scroll while it is open
  useEffect(() => {
    if (!isMobile || !isOpen) return undefined;

    updateMobilePosition();

    const passiveOptions = { passive: true };
    window.addEventListener('resize', updateMobilePosition, passiveOptions);
    window.addEventListener('scroll', updateMobilePosition, passiveOptions);

    return () => {
      window.removeEventListener('resize', updateMobilePosition, passiveOptions);
      window.removeEventListener('scroll', updateMobilePosition, passiveOptions);
    };
  }, [isMobile, isOpen, updateMobilePosition]);

  const handleToggle = () => {
    const nextOpen = !isOpen;

    if (nextOpen && isMobile) {
      requestAnimationFrame(updateMobilePosition);
    }

    setIsOpen(nextOpen);
  };

  const handleOptionClick = (option) => {
    if (onChange) {
      onChange(option);
    }
    setIsOpen(false);
  };

  const handleOptionKeyDown = (e, option) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const listbox = e.currentTarget.closest('[role="listbox"]');
      if (!listbox) return;

      const optionElements = Array.from(listbox.querySelectorAll('[role="option"]'));
      const currentIndex = optionElements.indexOf(e.currentTarget);

      if (!e.shiftKey && currentIndex < optionElements.length - 1) {
        // Tab forward: move to next option
        setTimeout(() => {
          optionElements[currentIndex + 1]?.focus();
        }, 0);
      } else if (e.shiftKey && currentIndex > 0) {
        // Shift+Tab: move to previous option
        setTimeout(() => {
          optionElements[currentIndex - 1]?.focus();
        }, 0);
      } else if (!e.shiftKey && currentIndex === optionElements.length - 1) {
        // Last option with Tab: close dropdown and allow focus to move out
        setIsOpen(false);
      } else if (e.shiftKey && currentIndex === 0) {
        // First option with Shift+Tab: return focus to trigger button
        setIsOpen(false);
        setTimeout(() => {
          if (triggerRef.current) {
            triggerRef.current.focus();
          }
        }, 0);
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleOptionClick(option);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setTimeout(() => {
        if (triggerRef.current) {
          triggerRef.current.focus();
        }
      }, 0);
    }
  };

  const dropdownBaseClass = 'h-[221px] py-2 absolute bg-[var(--color-background-brand-primary-lighter)] rounded-2xl shadow-[0px_2px_20px_2px_rgba(73,73,73,0.25)] flex justify-start items-start overflow-hidden z-[9]';
  const desktopDropdownClass = `${dropdownBaseClass} w-[200px] left-0 top-[36px]`;

  const renderDropdown = (className, style = {}) => html`
    <div
      class=${className}
      role="listbox"
      aria-labelledby="heading-dropdown-trigger"
      style=${style}
    >
      <div
        data-scrollbar="true"
        class="flex-1 h-full inline-flex flex-col justify-start items-start overflow-y-scroll overflow-x-hidden"
      >
        ${options.map((option) => html`
          <${ListItem}
            key=${option}
            label=${option}
            selected=${option === value}
            showSelectedIcon=${true}
            role="option"
            onClick=${() => handleOptionClick(option)}
            onKeyDown=${(e) => handleOptionKeyDown(e, option)}
            customClassName="!min-h-[48px]"
          />
        `)}
      </div>
    </div>
  `;

  return html`
    <div
      class="self-stretch relative text-2xl font-bold leading-tight ${customClassName}"
      data-name="headingDropdownSelector"
      ref=${containerRef}
      ...${rest}
    >
      <span class="text-text-normal-primary">
        ${label}
      </span>
      ${' '}
      <span class="relative inline-block align-baseline">
        <button
          id="heading-dropdown-trigger"
          class="inline-flex items-center gap-1 bg-transparent border-none p-0 cursor-pointer group relative focus:outline-none focus-visible:outline-none align-baseline"
          onClick=${handleToggle}
          type="button"
          aria-expanded=${isOpen}
          aria-haspopup="listbox"
          ref=${triggerRef}
        >
          <span class=${`text-2xl font-bold ${isOpen ? 'text-text-link-active' : 'text-text-link-default group-hover:text-text-link-active group-active:text-text-link-active'}`}>
            ${value}
          </span>
          <span class=${`w-6 h-6 inline-flex items-center justify-center transition-transform duration-200 ${isOpen ? 'rotate-x-180' : 'rotate-x-0'}`} style=${{ transformStyle: 'preserve-3d' }}>
            <span class=${`${isOpen ? '[&_svg_path]:fill-icon-link-active' : '[&_svg_path]:fill-icon-link-default group-hover:[&_svg_path]:fill-icon-link-active group-active:[&_svg_path]:fill-icon-link-active'}`}>
              <${Icon} icon="navigation/expand-more" size="sm"/>
            </span>
          </span>
          <span class="absolute inset-[-2px] rounded border-2 border-[var(--border-stroke-focus)] border-solid opacity-0 group-focus-visible:opacity-100 pointer-events-none" />
        </button>

        ${!isMobile && isOpen && renderDropdown(desktopDropdownClass)}
      </span>

      ${isMobile && isOpen && renderDropdown(
    dropdownBaseClass,
    {
      width: `${MOBILE_DROPDOWN_WIDTH}px`,
      left: `${mobilePosition.left}px`,
      top: `${mobilePosition.top}px`,
    },
  )}
    </div>
  `;
};
export default HeadingDropdownSelector;
