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
 * Paleta por `tone` para reusar el breadcrumb sobre distintas superficies:
 * - `light` (default): fondo claro (blocks/breadcrumb) → gris tertiary sobre
 *   blanco, activo en primary/black.
 * - `dark`: fondo oscuro tipo gradient de tier (members hero, elite header)
 *   → `#D9D9D9` para home icon + trail no-activo, blanco para el activo,
 *   mismo tratamiento en todos los tiers (Figma 518:24516 y variantes).
 */
const TONE = {
  light: {
    home: 'text-normal-tertiary hover:text-[var(--color-text-normal-primary)] active:text-[var(--color-text-normal-primary)]',
    active: 'text-[var(--color-text-normal-primary)] font-bold',
    inactive: 'text-normal-tertiary font-normal hover:underline hover:text-[var(--color-text-normal-primary)] active:text-[var(--color-text-normal-primary)] active:underline focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-[-1px] focus-visible:outline-[var(--color-border-stroke-focus)] transition-colors duration-200',
    separator: 'text-normal-tertiary',
    // Tipografía default (16/24, `text-base` de Tailwind) para AEM block
    // genérico sobre fondo claro. NO tocar sin revisar breadcrumb en QA.
    text: 'text-base',
  },
  dark: {
    // Home + trail no-activo + separadores todos en `--text-normal-light`
    // (#D9D9D9 en Figma 518:24516). Activo en `--text-normal-lighter` (blanco).
    // Focus outline usa el token del DS `--color-border-stroke-focus` para
    // mantener consistencia con el resto de componentes en hero oscuro.
    home: 'text-[var(--text-normal-light)] hover:text-[var(--text-normal-lighter)] active:text-[var(--text-normal-lighter)]',
    active: 'text-[var(--text-normal-lighter)] font-bold',
    inactive: 'text-[var(--text-normal-light)] font-normal hover:underline hover:text-[var(--text-normal-lighter)] active:text-[var(--text-normal-lighter)] active:underline focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-[-1px] focus-visible:outline-[var(--color-border-stroke-focus)] transition-colors duration-200',
    separator: 'text-[var(--text-normal-light)]',
    // Tipografía del breadcrumb en members dashboard (Figma):
    //  - `<1024px`  → 14/19 (Figma 518:24516 mobile/tablet).
    //  - `≥1024px`  → 16/21 (Figma desktop /members/profile, AVAEMF2P20-200).
    // Sin `text-sm`/`text-base` porque su line-height default (20/24) no
    // coincide con el spec — forzamos ambos ejes con arbitrarios.
    text: 'text-[14px] leading-[19px] lg:text-[16px] lg:leading-[21px]',
  },
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
 * @param {{home:string, active:string, inactive:string}} props.palette
 *   - Colores derivados de `tone` en el `Breadcrumb` padre. Se inyecta acá para
 *     no re-leer el `tone` en cada Item y mantener a la molécula "tonta".
 */
const BreadcrumbItem = ({
  label,
  url,
  isHome,
  isActive,
  onClick,
  homeLabel,
  palette,
  alwaysShowHomeLabel = false,
}) => {
  const handleClick = (e) => {
    if (!isActive && onClick) {
      e.preventDefault();
      onClick(url);
    }
  };

  // `palette.text` inyecta la escala tipográfica desde el TONE del padre.
  // Con tone="dark" (members) queda 14/19 → 16/21 en ≥1024px; con tone="light"
  // queda text-base (16/24). Los colores (active/inactive/home) también salen
  // del TONE, usando tokens del DS (`--text-normal-light`/`--text-normal-lighter`)
  // en la variante dark para consistencia con hero elite. Clases LITERALES por
  // rama en TONE (no interpolamos tokens) para que el scanner de Tailwind v4
  // las compile correctamente.
  const baseClasses = `justify-start ${palette.text}`;
  const stateClasses = isActive ? palette.active : palette.inactive;

  const itemClasses = 'whitespace-nowrap flex-shrink-0';

  if (isHome) {
    return html`
      <a
        href=${url}
        class="flex justify-start items-center gap-[6px] ${palette.home} hover:underline active:underline focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-[-1px] focus-visible:outline-[var(--color-border-stroke-focus)] transition-colors duration-200 ${isActive ? 'pointer-events-none' : ''}"
        onClick=${handleClick}
        aria-current=${isActive ? 'page' : undefined}
        aria-label=${homeLabel || 'Inicio'}
      >
        ${/* customSize={18} obliga al Icon a usar width/height inline en px y
            NO caer en el fallback `w-5 h-5` (20×20) que aplica cuando se pasa
            un booleano. Sin wrapper de tamaño: el Icon renderiza exactamente
            18×18, con el path interno a 12×13.5 (viewBox 24×24, path bbox
            16×18 → escalado a 18 = 12×13.5). Ver Figma para `/members/profile`
            breadcrumb home icon. */ ''}
        <${Icon} icon="app/home" customSize=${18} color="currentColor" aria-hidden="true" />
        ${/* Label del home. Por defecto oculto en mobile (icon-only, breadcrumb
            genérico). `alwaysShowHomeLabel` lo muestra también en mobile — el
            header Members (1279360/elite) lo pide: Figma 1059:65517 muestra
            "🏠 Mi Lifemiles" con texto en mobile. Clases LITERALES por rama para
            el scanner de Tailwind v4. */ ''}
        <span class="${alwaysShowHomeLabel ? 'inline' : 'hidden md:inline'} ${baseClasses} font-normal" aria-hidden="true">
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
 * @param {'light'|'dark'} [props.tone='light'] - Tono cromático:
 *   - `light` (default): breadcrumb sobre fondo claro (AEM block generic).
 *   - `dark`: sobre gradient de tier / dark hero (members). Mismo look en
 *     TODOS los tiers (gold/black/elite/elite-plus) por decisión de producto
 *     (Figma 518:24516) — no varía por tier.
 */
const Breadcrumb = ({
  items = [],
  customClassName = '',
  onItemClick,
  homeLabel = 'Inicio',
  tone = 'light',
  alwaysShowHomeLabel = false,
}) => {
  if (!items || items.length === 0) {
    return null;
  }

  const palette = TONE[tone] || TONE.light;

  // Home stays pinned; the rest of the trail lives in a horizontally
  // scrollable area so every level remains reachable. The block's decorate()
  // (see blocks/breadcrumb/breadcrumb.js — updateScrollMask) applies an edge
  // fade-mask to signal hidden content on each side — works on any background,
  // no pseudo-element.
  const [homeItem, ...restItems] = items;
  // customSize={18} → SVG 18×18 (Figma). Con el chevron-right actual (viewBox
  // 16×16, path bbox 4.94×8), el path renderiza a 5.557×9 exacto (scale
  // 18/16 = 1.125). Pasar `true` caería en el fallback `w-5 h-5` = 20×20.
  // Wrapper responsive: 18×18 hasta <1024px, 24×24 (w-6/h-6) desde 1024px.
  // El color del separador sale de `palette.separator` (TONE) — dark usa
  // `--text-normal-light` para el hero elite, light usa `text-normal-tertiary`.
  const separator = () => html`
    <div class="breadcrumb-separator w-[18px] h-[18px] lg:w-6 lg:h-6 relative flex items-center justify-center ${palette.separator} flex-shrink-0" aria-hidden="true">
      <${Icon} icon="navigation/chevron-right" customSize=${18} color="currentColor" />
    </div>
  `;

  return html`
    <div>
      <${StructuredBreadcrumb} items=${items} />
      <nav
        class="breadcrumb-nav flex justify-start items-center gap-[6px] ${customClassName}"
        aria-label="Breadcrumb"
        data-name="breadcrumb"
        data-tone=${tone}
      >
        <${BreadcrumbItem}
          key="bc-home"
          ...${homeItem}
          onClick=${onItemClick}
          homeLabel=${homeLabel}
          palette=${palette}
          alwaysShowHomeLabel=${alwaysShowHomeLabel}
        />
        ${restItems.length > 0 && html`
          ${separator()}
          ${/* scroll-area SIN flex-gap y con -ml-3 para "comerse" el gap-3
              del nav padre. Así el separator externo queda flush contra el
              primer item del trail (ej. "Cuenta Lifemiles"), y los
              separadores internos también quedan flush contra sus vecinos
              (~3px de aire vienen del wrapper w-6 del chevron). Home ↔
              separator externo conserva sus 12px de nav gap. */ ''}
          <div class="breadcrumb-scroll-area flex justify-start items-center -ml-1 overflow-x-auto flex-1 min-w-0 scroll-smooth">
            ${restItems.map((item, index) => html`
              <${BreadcrumbItem}
                key=${`bc-${index + 1}`}
                ...${item}
                onClick=${onItemClick}
                homeLabel=${homeLabel}
                palette=${palette}
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
