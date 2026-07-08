import { h } from '@dropins/tools/preact.js';
import { useEffect, useRef, useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { CabinUpgradeForm } from '../../organisms/forms/cabin-upgrade-form/cabin-upgrade-form.js';
import { MMBForm } from '../../organisms/forms/mmb-form/mmb-form.js';
import { SSCIForm } from '../../organisms/forms/ssci-form/ssci-form.js';
import loadSVGIcon from '../../../scripts/utils/svg.helper.js';

const html = htm.bind(h);

// Inject responsive grid styles once
const MEGAMENU_STYLE_ID = 'megamenu-grid-styles';
if (!document.getElementById(MEGAMENU_STYLE_ID)) {
  const s = document.createElement('style');
  s.id = MEGAMENU_STYLE_ID;
  s.textContent = [
    // Grid layout
    '.megamenu-grid{display:grid;column-gap:16px;row-gap:16px}',
    '@media(min-width:768px)and(max-width:1023px){',
    '.megamenu-grid{grid-template-columns:repeat(var(--mc,3),1fr)}',
    '.megamenu-banner{grid-column:1/-1}',
    '}',
    '@media(min-width:1024px){',
    '.megamenu-grid{grid-template-columns:repeat(var(--mc,3),1fr)}',
    '.megamenu-grid.has-banner{grid-template-columns:repeat(var(--mc,3),1fr) 2fr}',
    '.megamenu-grid.has-banner.has-form{grid-template-columns:repeat(var(--mc,3),1fr) 1px 2fr}',
    '}',
    // At 1248px+ columns use fixed Figma widths for precise sizing
    '@media(min-width:1248px){',
    '.megamenu-grid.has-banner{grid-template-columns:repeat(var(--mc,3),var(--col-w,240px)) 1fr}',
    '.megamenu-grid.has-banner.has-form{grid-template-columns:repeat(var(--mc,3),var(--col-w,240px)) 1px 1fr}',
    '.megamenu-banner{max-width:var(--banner-max-w,460px)!important}',
    '}',
    // Tight-space case: 3 cols + banner between 1248-1340px → expand condor bgSVG
    // from 75% to 85% so the curve reaches further left and the mesh stays visible.
    '@media(min-width:1248px) and (max-width:1340px){',
    '.megamenu-grid.has-banner[style*="--mc: 3"] .secondary-banner-condor-overlay svg.absolute,',
    '.megamenu-grid.has-banner[style*="--mc:3"] .secondary-banner-condor-overlay svg.absolute{',
    'width:85%!important;}',
    '.megamenu-grid.has-banner[style*="--mc: 3"] .secondary-banner-content,',
    '.megamenu-grid.has-banner[style*="--mc:3"] .secondary-banner-content{',
    'position:relative;}',
    '}',
    // Adapt any CMS block inside the banner slot to fill the available space.
    // Done here (not in secondary-banner.js) to keep that component untouched.
    // The slot already provides rounded corners + overflow-hidden.
    // Selectors use 3+ classes to beat the (0,2,0)/(0,2,1) specificity of
    // the cms-secondary-banner.css rules that add padding-inline:32px,
    // margin-inline:auto and width:auto on these elements.
    '.megamenu-banner .cms-secondary-banner{height:100%;}',
    '.megamenu-banner .cms-secondary-banner .cms-secondary-banner-content{height:100%;padding:0;}',
    '.megamenu-banner .cms-secondary-banner .cms-secondary-banner-content>div{',
    'max-width:100%;width:100%;height:100%;margin:0;padding-bottom:0;border-radius:0;box-shadow:none;}',
    // Apply 16px border-radius to the megamenu-banner slot only when its child
    // is the secondary-banner-variant (left). At >=1024px Tailwind utility on
    // the slot is overridden, so we enforce it here with higher specificity.
    '@media(min-width:1024px){',
    '.megamenu-banner:has([data-name="secondary-banner"][data-image-position="left"]){',
    'border-radius:16px;}',
    '}',
    // Keyboard focus indicator for CTAs inside the secondary-banner-variant.
    // Tailwind v4 wraps utilities in :where() (specificity 0) so other project
    // rules can override them. We use a stronger selector here to guarantee a
    // visible focus ring matching the Button atom (WCAG 2.4.7).
    '[data-name="secondary-banner"][data-image-position="left"] a:focus-visible{',
    'outline:2px solid var(--border-stroke-focus,#1d9bf0);',
    'outline-offset:4px;}',
  ].join('');
  document.head.appendChild(s);
}

/**
 * MegamenuItem - Single link inside a megamenu column
 *
 * ## Props
 * - `label`: `string` – Link text.
 * - `url`: `string` – Link href.
 * - `openMode`: `'default'|'icon'|'newtab'|'icon-newtab'` – Controls icon & target.
 */
// Cache loaded SVG icons to avoid repeated fetch calls
const svgIconCache = {};

async function loadCachedSVGIcon(path) {
  if (!svgIconCache[path]) {
    svgIconCache[path] = loadSVGIcon(path);
  }
  return svgIconCache[path];
}

export const MegamenuItem = ({
  label, url = '#', openMode = 'default', iconName = '',
}) => {
  const [arrowIcon, setArrowIcon] = useState(null);
  const [namedIcon, setNamedIcon] = useState(null);
  const [openInNewIcon, setOpenInNewIcon] = useState(null);
  const isNewTab = openMode === 'newtab' || openMode === 'icon-newtab';

  // Always load arrow-fordware.svg — same as NavbarDropdown
  useEffect(() => {
    const codeBasePath = window.hlx?.codeBasePath || '';
    loadCachedSVGIcon(`${codeBasePath}/icons/arrow-fordware.svg`).then(setArrowIcon);
    loadCachedSVGIcon(`${codeBasePath}/icons/navigation/open-in-new-12.svg`).then(setOpenInNewIcon);
  }, []);

  // Load named icon when iconName is provided
  useEffect(() => {
    if (!iconName) { setNamedIcon(null); return; }
    const codeBasePath = window.hlx?.codeBasePath || '';
    loadCachedSVGIcon(`${codeBasePath}/icons/${iconName}.svg`).then((svg) => {
      // eslint-disable-next-line max-len
      // loadSVGIcon never rejects — check if it returned a real SVG or empty fallback
      if (svg && svg.children.length > 0) {
        setNamedIcon(svg);
      } else {
        setNamedIcon(null);
      }
    });
  }, [iconName]);

  const renderSvgIcon = (svgEl, size = '12') => {
    if (!svgEl) return null;
    const cloned = svgEl.cloneNode(true);
    cloned.setAttribute('width', size);
    cloned.setAttribute('height', size);
    // Append the already-parsed SVG node directly via a ref callback instead of
    // serializing it back to a string and re-injecting through
    // dangerouslySetInnerHTML (a DOM XSS sink). renderSvgIcon is a plain helper,
    // not a component, so it must stay hook-free — a ref callback is safe here.
    const attachSvg = (spanEl) => {
      if (spanEl) spanEl.replaceChildren(cloned);
    };
    return html`
      <span
        class="inline-flex items-center justify-center"
        ref=${attachSvg}
      />
    `;
  };

  // Show icon only when iconName is explicitly provided OR openMode requests one.
  // Items with openMode 'default'/'newtab' and no iconName render without any icon.
  // Author controls icon visibility via ?ueLinkMode regardless of internal/external URL.
  const wantsIcon = !!iconName || openMode === 'icon' || openMode === 'icon-newtab';
  const getIcon = () => {
    // Named icon from author always takes priority
    if (namedIcon) return namedIcon;
    // icon-newtab → external link icon; icon → arrow icon
    if (openMode === 'icon-newtab') return openInNewIcon;
    return arrowIcon;
  };
  const iconToRender = wantsIcon ? getIcon() : null;

  return html`
    <li class="group/megaitem flex items-center self-start -mx-3
               rounded-[8px]
               hover:bg-[var(--color-background-brand-secondary-hover)]
               active:bg-[var(--color-background-brand-secondary-active)]
               transition-colors">
      <a
        href=${url}
        target=${isNewTab ? '_blank' : undefined}
        rel=${isNewTab ? 'noopener noreferrer' : undefined}
        class="relative group/megalink
               px-3 py-[var(--spacing-small)] no-underline
               font-[var(--paragraph-p300-family)] font-medium text-[16px]
               text-[var(--text-normal-secondary)] leading-[var(--line-height-normal)]
               tracking-[var(--paragraph-p300-letter-spacing)]
               focus-visible:outline-none"
      >
        <span
          class="absolute inset-0 rounded-[4px]
                 border-2 border-[var(--border-stroke-focus)]
                 opacity-0 group-focus-visible/megalink:opacity-100
                 pointer-events-none"
          aria-hidden="true"
        />
        <span class="relative group-hover/megaitem:font-bold group-hover/megaitem:text-[var(--text-normal-primary)] !leading-[21px]">${label}</span>
        ${iconToRender && html`
          <span class="relative inline-flex items-center justify-center w-4 h-4 ml-[4px] align-middle
                       text-[var(--text-normal-secondary)] group-hover/megaitem:text-[var(--text-normal-primary)]">
            ${renderSvgIcon(iconToRender, '12')}
          </span>
        `}
      </a>
    </li>
  `;
};

/**
 * MegamenuColumn - Column of grouped links with optional title
 *
 * ## Props
 * - `title`: `string` – Column heading.
 * - `items`: `Array<{ label, url, openMode }>` – Links.
 */
const MegamenuColumn = ({ title = '', items = [] }) => html`
  <div class="flex flex-col gap-[var(--spacing-medium)]">
    ${title && html`
      <p class="font-bold leading-[26px] tracking-normal text-[#2B3C46] !m-0">
        ${title}
      </p>
    `}
    <ul class="list-none !p-0 !m-0 flex flex-col">
      ${items.map((item) => html`
        <${MegamenuItem}
          key=${item.url || item.label}
          label=${item.label}
          url=${item.url}
          openMode=${item.openMode}
          iconName=${item.iconName}
        />
      `)}
    </ul>
  </div>
`;

// Exact column widths from Figma at 1440px desktop:
// 1 col → 411px | 2 cols → 304px each | 3 cols → 240px each
const COL_WIDTHS = { 1: '411px', 2: '304px', 3: '240px' };

// Banner max-width per column count at 1248px+ (Figma spec):
// 1 col → 821px | 2 cols → 608px | 3 cols → 480px
const BANNER_MAX_W = { 1: '821px', 2: '608px', 3: '480px' };

/**
 * Megamenu - Full-width dropdown panel for the desktop navbar.
 *
 * ## Props
 * - `columns`: `Array<{ title: string, items: Array }>` – 1 to 3 content columns.
 * - `cmsBlock`: `Element|null` – Optional DOM element cloned into the banner slot (2fr).
 * - `formType`: `string|null` – When set, renders a form in the banner slot instead of cmsBlock.
 * - `formLabel`: `string` – Optional title displayed above the form in the banner slot.
 * - `isOpen`: `boolean` – Controlled open state.
 * - `isScrolled`: `boolean` – Whether the header is in scrolled state.
 * - `isPositionCalculated`: `boolean` – Used for transition timing.
 * - `onMouseLeave`: `function` – Callback when mouse leaves the panel.
 * - `customClassName`: `string` – Additional CSS classes.
 */
export const Megamenu = ({
  columns = [],
  cmsBlock = null,
  formType = null,
  formLabel = '',
  isOpen = false,
  isPositionCalculated = false,
  onMouseLeave,
  customClassName = '',
}) => {
  const bannerRef = useRef(null);
  const panelRef = useRef(null);
  const hasBanner = formType ? true : !!cmsBlock;
  const colCount = columns.length;

  // Position the fixed panel flush under the sticky header.
  // Using position:fixed + left:0/right:0 avoids negative-left hacks
  // that depend on timing-sensitive getBoundingClientRect readings.
  // requestAnimationFrame defers the first update until after the browser
  // has applied sticky positioning and resolved --marquee-height.
  // ResizeObserver tracks header height changes during CSS transitions so the
  // panel follows the header as it grows/shrinks (e.g. sticky → full height).
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return () => {};
    // Batch scroll/resize updates in rAF so the panel's `top` write is aligned
    // with the paint frame of the header's CSS height transition (200ms). This
    // eliminates 1-frame lag jitter where the panel briefly sits above/below
    // the header's animated edge — visible during fast scroll on Windows.
    let rafPending = 0;
    let lastTop = -1;
    const write = () => {
      rafPending = 0;
      const header = document.querySelector('header');
      if (!header) return;
      const top = header.getBoundingClientRect().bottom;
      if (top === lastTop) return;
      lastTop = top;
      el.style.top = `${top}px`;
    };
    const update = () => {
      if (rafPending) return;
      rafPending = requestAnimationFrame(write);
    };
    const rafId = requestAnimationFrame(write);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, { passive: true });

    // Watch header size changes (scrolled ↔ full-height transitions)
    // Also observe marquesina container so panel repositions when it dismisses
    // eslint-disable-next-line max-len
    // (marquesina dismissal shrinks the container to 0, changing header.getBoundingClientRect().bottom)
    const header = document.querySelector('header');
    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(update);
      if (header) ro.observe(header);
      const marquesinaContainer = document.querySelector('.marquesina-global-container');
      if (marquesinaContainer) ro.observe(marquesinaContainer);
    }

    return () => {
      cancelAnimationFrame(rafId);
      if (rafPending) cancelAnimationFrame(rafPending);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update);
      if (ro) ro.disconnect();
    };
  }, []);

  // Recalculate position every time the panel opens to avoid stale top values.
  // This handles the case where the user scrolled while the panel was closed
  // and the scroll listener may not have fired (e.g. programmatic scroll or
  // very fast interaction before the passive listener could update).
  useEffect(() => {
    if (!isOpen) return;
    const el = panelRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      const header = document.querySelector('header');
      if (!header) return;
      el.style.top = `${header.getBoundingClientRect().bottom}px`;
    });
  }, [isOpen]);

  // Clone the CMS block content into the banner slot (only when no formType).
  // Uses MutationObserver to re-clone whenever the source block updates async content
  // (e.g. SVG decorations injected after fetch). Disconnects when banner is unmounted
  // or formType changes.
  useEffect(() => {
    if (!bannerRef.current || !cmsBlock || formType) return undefined;

    const syncClone = () => {
      if (!bannerRef.current) return;
      bannerRef.current.innerHTML = '';
      const clone = cmsBlock.cloneNode(true);
      clone.style.display = '';
      // Tag .secondary-banner-content with column count class
      const bannerContent = clone.querySelector('.secondary-banner-content');
      if (bannerContent) {
        bannerContent.classList.add(`megamenu-column${colCount}`);
      }
      // Tag banner root with column count word for layout adjustments per column count.
      const colWord = { 1: 'one', 2: 'two', 3: 'three' }[colCount];
      if (colWord) {
        const bannerRoot = clone.querySelector('[data-name="secondary-banner"]');
        if (bannerRoot) {
          bannerRoot.classList.add(`megamenu-content-${colWord}`);
        }
      }
      bannerRef.current.appendChild(clone);
    };

    syncClone();

    const observer = new MutationObserver(syncClone);
    observer.observe(cmsBlock, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [cmsBlock, formType]);

  const transitionClasses = isPositionCalculated
    ? 'transition-[opacity,transform] duration-300 ease-in-out'
    : '';
  const visibilityClasses = isOpen && isPositionCalculated
    ? 'opacity-100 translate-y-0 pointer-events-auto'
    : 'opacity-0 pointer-events-none';

  const renderBannerContent = () => {
    if (formType === 'cabin-upgrade') {
      return html`
        <div class="flex flex-col gap-6 h-full justify-start">
          ${formLabel && html`
            <p class="font-bold leading-[100%] tracking-normal text-[#2B3C46] !m-0">
              ${formLabel}
            </p>
          `}
          <${CabinUpgradeForm} stackedLayout=${true} />
        </div>
      `;
    }
    if (formType === 'mmb') {
      // The label is read from i18n (`mmbForm.megamenuLabel`) and rendered by
      // the organism itself in simplified mode. The `formLabel` field from the
      // block model remains only for cabin-upgrade (previous branch).
      return html`
        <div class="flex flex-col gap-6 h-full justify-start">
          <${MMBForm} simplified=${true} buttonBelow=${true} context="megamenu" />
        </div>
      `;
    }
    if (formType === 'ssci') {
      // Same wrapper as MMB. The label is read from `ssciForm.megamenuLabel`
      // by the organism in simplified mode.
      return html`
        <div class="flex flex-col gap-6 h-full justify-start">
          <${SSCIForm} simplified=${true} buttonBelow=${true} context="megamenu" />
        </div>
      `;
    }
    if (cmsBlock) {
      return html`<div ref=${bannerRef} class="h-full" />`;
    }
    return null;
  };

  return html`
    <div
      ref=${panelRef}
      class=${`
        fixed left-0 right-0
        z-[1000]
        ${isOpen ? 'visible' : 'invisible'}
        ${transitionClasses}
        ${visibilityClasses}
        ${customClassName}
      `}
      onMouseLeave=${onMouseLeave}
      role="region"
      aria-label="Megamenu"
    >
      <div
        class="bg-[var(--bg-brand-primary-lighter)] shadow-[0_2px_20px_2px_rgba(73,73,73,0.25)]
               p-[var(--spacing-x-x-large)]"
      >
        <div
          class=${`max-w-xl mx-auto megamenu-grid${hasBanner ? ' has-banner' : ''}${formType ? ' has-form' : ''}`}
          style=${{
    '--mc': colCount,
    '--col-w': COL_WIDTHS[colCount] || '240px',
    '--banner-max-w': BANNER_MAX_W[colCount] || '460px',
  }}
        >
          ${columns.map((col, i) => html`
            <${MegamenuColumn}
              key=${col.title || i}
              title=${col.title}
              items=${col.items}
            />
          `)}

          ${hasBanner && html`
            <svg class=${`self-stretch${formType ? '' : ' hidden'}`} xmlns="http://www.w3.org/2000/svg" width="1" height="100%" fill="none">
              <line x1="0.5" y1="0%" x2="0.5" y2="100%" stroke="#D9D9D9" stroke-dasharray="2 2" />
            </svg>
          `}

          ${hasBanner && html`
            <div class=${`megamenu-banner ${formType ? 'overflow-visible' : 'overflow-hidden'} min-h-[160px] max-h-[220px] xl:max-h-[222px] h-full max-w-[460px]${formType ? ' bg-white' : ''}`}>
              ${renderBannerContent()}
            </div>
          `}
        </div>
      </div>
    </div>
  `;
};

export default Megamenu;
