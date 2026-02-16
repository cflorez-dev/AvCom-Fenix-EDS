import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { Icon } from '../../atoms/icon/icon.js';

const html = htm.bind(h);

/**
 * BreadcrumbItem component
 * @param {Object} props - Component props
 * @param {string} props.label - Item label
 * @param {string} props.url - Item URL
 * @param {boolean} props.isHome - Whether item is home
 * @param {boolean} props.isActive - Whether item is active/current
 * @param {Function} props.onClick - Click handler
 * @param {string} props.homeLabel - Home label text (for i18n)
 */
const BreadcrumbItem = ({
  label,
  url,
  isHome,
  isActive,
  onClick,
  homeLabel,
}) => {
  const handleClick = (e) => {
    if (!isActive && onClick) {
      e.preventDefault();
      onClick(url);
    }
  };

  const baseClasses = 'justify-start text-base';
  const stateClasses = isActive
    ? 'text-[var(--color-text-normal-primary)] font-bold'
    : 'text-normal-tertiary font-normal hover:underline hover:text-[var(--color-text-normal-primary)] active:text-[var(--color-text-normal-primary)] active:underline focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-[-1px] focus-visible:outline-[var(--color-border-stroke-focus)] transition-colors duration-200';

  const itemClasses = 'whitespace-nowrap flex-shrink-0';

  if (isHome) {
    return html`
      <a
        href=${url}
        class="flex justify-start items-center gap-[6px] text-normal-tertiary hover:text-[var(--color-text-normal-primary)] active:text-[var(--color-text-normal-primary)] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-[-1px] focus-visible:outline-[var(--color-border-stroke-focus)] transition-colors duration-200 ${isActive ? 'pointer-events-none' : ''}"
        onClick=${handleClick}
        aria-current=${isActive ? 'page' : undefined}
        aria-label=${homeLabel || 'Inicio'}
      >
        <div class="w-[1.125rem] h-[1.125rem] flex items-center justify-center flex-shrink-0">
          <${Icon} icon="app/home" customSize=${true} color="currentColor" aria-hidden="true" />
        </div>
        <span class="hidden md:inline ${baseClasses} font-normal text-normal-tertiary hover:text-[var(--color-text-normal-primary)] hover:underline active:text-[var(--color-text-normal-primary)] active:underline" aria-hidden="true">
          ${homeLabel || 'Inicio'}
        </span>
      </a>
    `;
  }

  if (isActive) {
    return html`
      <span 
        class="${baseClasses} ${stateClasses} ${itemClasses}"
        aria-current="page"
        title=${label}
      >
        ${label}
      </span>
    `;
  }

  return html`
    <a
      href=${url}
      class="${baseClasses} ${stateClasses} ${itemClasses}"
      onClick=${handleClick}
      title=${label}
    >
      ${label}
    </a>
  `;
};

/**
 * Breadcrumb component
 * @param {Object} props - Component props
 * @param {Array} props.items - Array of breadcrumb items
 * @param {string} props.items[].label - Item label
 * @param {string} props.items[].url - Item URL
 * @param {boolean} props.items[].isHome - Whether item is home
 * @param {boolean} props.items[].isActive - Whether item is active/current
 * @param {string} props.customClassName - Additional CSS classes
 * @param {Function} props.onItemClick - Click handler for items
 * @param {string} props.homeLabel - Home label text (from i18n)
 */
const Breadcrumb = ({
  items = [],
  customClassName = '',
  onItemClick,
  homeLabel = 'Inicio',
}) => {
  if (!items || items.length === 0) {
    return null;
  }

  const totalLevels = items.length;

  // Mobile: restrict to Home > Previous > Current when more than 3 levels
  let mobileItems = [...items];
  if (totalLevels > 3) {
    const homeItem = items[0]; // Home
    const previousItem = items[totalLevels - 2]; // Previous to current
    const currentItem = items[totalLevels - 1]; // Current/Active

    mobileItems = [homeItem, previousItem, currentItem];
  }

  // Desktop: always show all items
  const desktopItems = [...items];

  return html`
    <div>
      <nav 
        class="flex md:hidden justify-start items-center gap-2 ${customClassName}"
        aria-label="Breadcrumb"
        data-name="breadcrumb"
      >
        ${mobileItems.length > 0 && html`
          <${BreadcrumbItem} 
            key="mobile-home" 
            ...${mobileItems[0]} 
            onClick=${onItemClick}
            homeLabel=${homeLabel}
          />
        `}
        ${mobileItems.length > 1 && html`
          <div class="w-6 h-6 relative flex items-center justify-center text-normal-tertiary flex-shrink-0" aria-hidden="true">
            <${Icon} icon="navigation/chevron-right" customSize=${true} color="currentColor" />
          </div>
          <div class="flex items-center gap-2 overflow-x-auto breadcrumb-scroll-area flex-1 min-w-0 scroll-smooth">
            ${mobileItems.slice(1).map((item, index) => html`
              <${BreadcrumbItem} 
                key=${`mobile-${index + 1}`} 
                ...${item} 
                onClick=${onItemClick}
                homeLabel=${homeLabel}
              />
              ${index < mobileItems.length - 2 && html`
                <div class="w-6 h-6 relative flex items-center justify-center text-normal-tertiary flex-shrink-0" aria-hidden="true">
                  <${Icon} icon="navigation/chevron-right" customSize=${true} color="currentColor" />
                </div>
              `}
            `)}
          </div>
        `}
      </nav>
      
      <nav 
        class="hidden md:flex justify-start items-center gap-3 overflow-x-auto ${customClassName}"
        aria-label="Breadcrumb"
        data-name="breadcrumb"
      >
        ${desktopItems.map((item, index) => html`
          <${BreadcrumbItem} 
            key=${`desktop-${index}`} 
            ...${item} 
            onClick=${onItemClick}
            homeLabel=${homeLabel}
          />
          ${index < desktopItems.length - 1 && html`
            <div class="w-6 h-6 relative flex items-center justify-center text-normal-tertiary flex-shrink-0" aria-hidden="true">
              <${Icon} icon="navigation/chevron-right" customSize=${true} color="currentColor" />
            </div>
          `}
        `)}
      </nav>
    </div>
  `;
};

export default Breadcrumb;
