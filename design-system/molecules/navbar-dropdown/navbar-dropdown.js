import { h } from '@dropins/tools/preact.js';
import { useState, useRef, useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import loadSVGIcon from '../../../scripts/utils/svg.helper.js';
import { Icon } from '../../atoms/icon/icon.js';

const html = htm.bind(h);

/**
 * NavbarDropdown - Dropdown component for desktop navigation
 *
 * ## Props
 * - `label`: `string` – Navigation item label.
 * - `subItems`: `Array` – Array of objects with sub-items:
 *   `[{ itemLabel: string, url: string }]`.
 * - `isActive`: `boolean` – Whether the item is active (shows red bottom border).
 * - `isOpen`: `boolean` – Controls whether the dropdown is open (controlled from parent).
 * - `onToggle`: `function` – Callback when the dropdown opens/closes: `(isOpen) => void`.
 * - `customClassName`: Additional CSS classes.
 * - `onSubItemClick`: Callback function when clicking on a sub-item.
 * - `...rest`: Other valid properties.
 */
export const NavbarDropdown = ({
  label = '',
  subItems = [],
  isActive = false,
  isOpen: controlledIsOpen,
  onToggle,
  customClassName = '',
  onSubItemClick,
  isScrolled = false,
  ...rest
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = (value) => {
    if (controlledIsOpen !== undefined && onToggle) {
      onToggle(value);
    } else {
      setInternalIsOpen(value);
    }
  };
  const [hoveredItemIndex, setHoveredItemIndex] = useState(null);
  const [arrowIcon, setArrowIcon] = useState(null);
  const [isPositionCalculated, setIsPositionCalculated] = useState(false);
  const dropdownRef = useRef(null);
  const overlayRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    const loadIcon = async () => {
      try {
        const codeBasePath = window.hlx?.codeBasePath || '';
        const arrowIconPath = `${codeBasePath}/icons/arrow-fordware.svg`;
        const arrowIconSVG = await loadSVGIcon(arrowIconPath);
        setArrowIcon(arrowIconSVG);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error loading arrow icon:', error);
      }
    };

    loadIcon();
  }, []);

  // Create and remove overlay in main
  useEffect(() => {
    if (isOpen) {
      // Find main element or use body as fallback
      const mainElement = document.querySelector('main') || document.body;

      // Create overlay directly in main (or body if main doesn't exist)
      const overlay = document.createElement('div');
      overlay.className = 'navbar-dropdown-overlay';
      // Use inset: 0 or top/left/right/bottom to cover entire screen without including scrollbar
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(27, 27, 27, 0.70);
        z-index: 900;
        pointer-events: auto;
        cursor: pointer;
      `;
      overlay.addEventListener('click', () => setIsOpen(false));
      mainElement.appendChild(overlay);
      overlayRef.current = overlay;
    } else if (overlayRef.current && overlayRef.current.parentNode) {
      // Remove overlay when dropdown closes
      overlayRef.current.parentNode.removeChild(overlayRef.current);
      overlayRef.current = null;
    }

    return () => {
      // Cleanup: remove overlay if component unmounts
      if (overlayRef.current && overlayRef.current.parentNode) {
        overlayRef.current.parentNode.removeChild(overlayRef.current);
        overlayRef.current = null;
      }
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        // Don't close if click is on overlay (already handled in overlay)
        if (event.target.classList.contains('navbar-dropdown-overlay')) {
          return;
        }
        // Check if click is on another NavbarDropdown (another navbar option)
        const clickedNavbarItem = event.target.closest('[data-navbar-dropdown]');
        if (clickedNavbarItem && clickedNavbarItem !== dropdownRef.current) {
          // If clicking on another navbar option, close this dropdown
          // The new dropdown will open via its own handleToggle
          setIsOpen(false);
          return;
        }
        // Close only if click is outside any dropdown
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

  // Set position calculated flag for transition timing
  useEffect(() => {
    if (isOpen && dropdownRef.current && textRef.current) {
      // Use requestAnimationFrame to ensure DOM is ready
      const rafId = requestAnimationFrame(() => {
        setIsPositionCalculated(true);
      });

      return () => {
        cancelAnimationFrame(rafId);
      };
    }

    // Reset when closing
    setIsPositionCalculated(false);

    return () => {};
  }, [isOpen, label]);

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
  };

  const handleSubItemClick = (subItem, isExternalLink) => {
    if (subItem?.url) {
      if (isExternalLink) {
        window.open(subItem.url, '_blank', 'noopener');
      } else if (onSubItemClick) {
        onSubItemClick(subItem);
      } else {
        window.location.href = subItem.url;
      }
    }
    setIsOpen(false);
  };

  const handleMouseLeave = () => {
    setHoveredItemIndex(null);
  };

  // Render icon as Preact vnode using dangerouslySetInnerHTML
  const renderIcon = (svgElement, size = '24') => {
    if (!svgElement) return null;

    const clonedSvg = svgElement.cloneNode(true);
    clonedSvg.setAttribute('width', size);
    clonedSvg.setAttribute('height', size);

    return html`
      <span
        class="inline-flex items-center justify-center"
        dangerouslySetInnerHTML=${{ __html: clonedSvg.outerHTML }}
      />
    `;
  };

  // Styles
  const activeLabelSizeClass = 'text-[0.95rem]';
  const navItemOutlineStyle = (isActive || isOpen)
    ? 'after:border-b-[4px] after:border-[var(--header-offers)]'
    : 'after:border-b-[4px] after:border-transparent hover:after:border-[var(--header-offers)]';

  const navItemTextWeight = (isActive || isOpen)
    ? `font-bold ${activeLabelSizeClass}`
    : `font-normal hover:font-bold ${activeLabelSizeClass}`;

  // dropdownStyles migrated to Tailwind classes

  // subItemsListStyles migrated to Tailwind classes

  // getSubItemStyles migrated to Tailwind classes

  // subItemContentStyles migrated to Tailwind classes

  // getSubItemTextStyles migrated to Tailwind classes

  // getIconContainerStyles migrated to Tailwind classes

  return html`
    <div
      class=${`
        group relative px-5 py-6 flex items-center justify-center h-full 
        cursor-pointer transition-colors after:absolute ${isScrolled ? 'after:bottom-0' : 'after:bottom-[-4px]'} after:z-[20]
        after:left-0 after:right-0 after:h-0 after:transition-colors ${navItemOutlineStyle} 
        focus-visible:after:border-[var(--header-offers)] focus-visible:outline-none ${customClassName}`}
      onClick=${handleToggle}
      ref=${dropdownRef}
      data-navbar-dropdown="true"
      tabindex="0"
      ...${rest}
    >
    <div class="absolute transition-all ${isScrolled ? 'top-0 h-full' : 'top-[-3px] h-[calc(100%+8px)]'} left-0 right-0 w-full border-2 border-transparent group-focus-visible:border-[var(--color-border-stroke-focus)] hidden group-focus-visible:block pointer-events-none z-1"></div>
      <button
        class="bg-transparent border-none p-0 cursor-pointer w-full"
        type="button"
        onClick=${handleToggle}
        aria-expanded=${isOpen}
        aria-haspopup="true"
        tabindex="-1"
      >
        <span
          ref=${textRef}
          class="${navItemTextWeight} group-hover:font-bold group-focus-visible:font-bold text-center whitespace-nowrap transition-colors leading-[var(--line-height-100)] text-[var(--logo-avianca-secondary)] group-hover:${activeLabelSizeClass} group-focus-visible:${activeLabelSizeClass} ${isActive || isOpen ? activeLabelSizeClass : 'text-[16px]'}"
        >
          ${label}
        </span>
      </button>

      ${subItems && subItems.length > 0 && html`
        <div
          class="w-[276px] left-[-27px] absolute top-full ${isScrolled ? 'mt-0' : 'mt-[4px]'} z-[1000] ${isPositionCalculated ? 'transition-all duration-300 ease-in-out' : ''} ${isOpen && isPositionCalculated ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 pointer-events-none'} ${isOpen ? 'visible' : 'invisible'}"
          
          onMouseLeave=${handleMouseLeave}
        >
          <div class="bg-[var(--bg-brand-primary-lighter)] rounded-[24px] shadow-[0_0_6px_0_rgba(90,90,90,0.20)] py-[var(--padding-16)] px-[var(--padding-24)] min-w-max max-w-[580px] w-full">
            <ul class="list-none p-0 !m-0 flex flex-col gap-0">
              ${subItems.map((subItem, index) => {
    const isExternalLink = subItem.url.startsWith('http');
    return html`
                <li key=${subItem.url || subItem.itemLabel} class="group/sub-item flex flex-row items-center transition-transform" tabindex="-1">
                  <button
                    type="button"
                    class=${`group/subitem-button relative flex gap-[var(--spacing-medium)] 
                      items-center max-w-[580px] min-h-[var(--height-48)] py-[var(--padding-12)] 
                      w-full cursor-pointer transition-[var(--transition-colors)] 
                      bg-transparent border-none text-left focus-visible:outline-none
                      group-hover/sub-item:py-[12px] group-hover/sub-item:pr-0 group-hover/sub-item:pl-[8px]`}
                    onClick=${() => handleSubItemClick(subItem, isExternalLink)}
                    onMouseEnter=${() => setHoveredItemIndex(index)}
                    onMouseLeave=${() => setHoveredItemIndex(null)}
                    tabindex="0"
                  >
                    <div class="absolute transition-all top-0 left-0 right-0 w-full h-[100%] hidden group-focus-visible/subitem-button:block pointer-events-none z-1"></div>
                    <div class="flex flex-1 flex-col gap-[var(--spacing-tiny)] items-start justify-center">
                      <p class=${`
                          !m-0 w-full text-left transition-[var(--transition-colors)] 
                          font-[var(--paragraph-p300-family)] text-[16px] 
                          group-hover/sub-item:text-[var(--brand-secondary)]
                          leading-[var(--paragraph-p300-line-height)] tracking-[var(--paragraph-p300-letter-spacing)] 
                          text-[var(--text-normal-secondary)]
                          font-medium
                          group-hover/sub-item:font-bold
                          ${hoveredItemIndex === index ? 'text-[var(--brand-secondary)]' : 'text-[var(--text-normal-secondary)]'}
                        `}>
                        ${subItem.itemLabel}
                      </p>
                    </div>
                    <div class="w-6 h-6 inline-flex items-center justify-center shrink-0 transition-[var(--transition-colors)] ${hoveredItemIndex === index ? 'text-[var(--brand-secondary)]' : 'text-[var(--text-normal-secondary)]'}">
                      ${isExternalLink ? html`
                          <${Icon}
                            icon="navigation/open-in-new"
                            size="s"
                            color="var(--icon-color)"
                            customClassName=" [--icon-color:var(--color-text-normal-secondary)] group-hover/sub-item:[--icon-color:var(--color-background-brand-highlight-default)]"
                          />
                      ` : html`
                        ${renderIcon(arrowIcon, '24')}
                      `}
                    </div>
                  </button>
                </li>
              `;
  })}
            </ul>
          </div>
        </div>
      `}
    </div>
  `;
};

export default NavbarDropdown;
