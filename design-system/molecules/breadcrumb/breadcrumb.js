import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { Icon } from '../../atoms/icon/icon.js';

const html = htm.bind(h);

/**
 * Renders one structured breadcrumb item.
 * @param {Object} item
 * @param {number} index
 * @returns {import('preact').ComponentChild}
 */
const renderStructuredItem = (item, index) => {
  const itemMarkup = item.isActive
    ? html`
      <span itemprop="name">${item.label}</span>
      <meta itemprop="item" content=${item.url} />
    `
    : html`
      <a href=${item.url} itemprop="item">
        <span itemprop="name">${item.label}</span>
      </a>
    `;

  return html`
    <li
      key=${`structured-${index}`}
      itemprop="itemListElement"
      itemscope
      itemtype="https://schema.org/ListItem"
    >
      ${itemMarkup}
      <meta itemprop="position" content=${String(index + 1)} />
    </li>
  `;
};

/**
 * Semantic breadcrumb markup for search engines.
 * Rendered as visually hidden to avoid changing validated UI.
 * @param {Object} props
 * @param {Array} props.items
 */
const StructuredBreadcrumb = ({ items = [] }) => {
  if (!items.length) return null;

  return html`
    <nav class="sr-only" aria-label="Breadcrumb structured data" data-name="breadcrumb-structured">
      <ol itemscope itemtype="https://schema.org/BreadcrumbList">
        ${items.map((item, index) => renderStructuredItem(item, index))}
      </ol>
    </nav>
  `;
};

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
        class="flex justify-start items-center gap-[6px] text-normal-tertiary hover:text-[var(--color-text-normal-primary)] hover:underline active:text-[var(--color-text-normal-primary)] active:underline focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-[-1px] focus-visible:outline-[var(--color-border-stroke-focus)] transition-colors duration-200 ${isActive ? 'pointer-events-none' : ''}"
        onClick=${handleClick}
        aria-current=${isActive ? 'page' : undefined}
        aria-label=${homeLabel || 'Inicio'}
      >
        <div class="w-[1.125rem] h-[1.125rem] flex items-center justify-center flex-shrink-0">
          <${Icon} icon="app/home" customSize=${true} color="currentColor" aria-hidden="true" />
        </div>
        <span class="hidden md:inline ${baseClasses} font-normal" aria-hidden="true">
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

  // Home stays pinned; the rest of the trail lives in a horizontally
  // scrollable area so every level remains reachable. The block's decorate()
  // (see blocks/breadcrumb/breadcrumb.js — updateScrollMask) applies an edge
  // fade-mask to signal hidden content on each side — works on any background,
  // no pseudo-element.
  const [homeItem, ...restItems] = items;
  const separator = () => html`
    <div class="breadcrumb-separator w-6 h-6 relative flex items-center justify-center text-normal-tertiary flex-shrink-0" aria-hidden="true">
      <${Icon} icon="navigation/chevron-right" customSize=${true} color="currentColor" />
    </div>
  `;

  return html`
    <div>
      <${StructuredBreadcrumb} items=${items} />
      <nav
        class="breadcrumb-nav flex justify-start items-center gap-3 ${customClassName}"
        aria-label="Breadcrumb"
        data-name="breadcrumb"
      >
        <${BreadcrumbItem}
          key="bc-home"
          ...${homeItem}
          onClick=${onItemClick}
          homeLabel=${homeLabel}
        />
        ${restItems.length > 0 && html`
          ${separator()}
          <div class="breadcrumb-scroll-area flex justify-start items-center gap-3 overflow-x-auto flex-1 min-w-0 scroll-smooth">
            ${restItems.map((item, index) => html`
              <${BreadcrumbItem}
                key=${`bc-${index + 1}`}
                ...${item}
                onClick=${onItemClick}
                homeLabel=${homeLabel}
              />
              ${index < restItems.length - 1 && separator()}
            `)}
          </div>
        `}
      </nav>
    </div>
  `;
};

export default Breadcrumb;
