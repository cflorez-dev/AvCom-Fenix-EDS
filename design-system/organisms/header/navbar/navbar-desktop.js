import { h, render } from '@dropins/tools/preact.js';
import { useEffect, useRef, useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { NavbarDropdown } from '../../../molecules/navbar-dropdown/navbar-dropdown.js';
import { Megamenu } from '../../../molecules/megamenu/megamenu.js';

const html = htm.bind(h);

/**
 * NavbarDesktop - Componente de navegación desktop del header
 *
 * ## Props
 * - `sections`: `Array` – Array de objetos con la estructura de navegación:
 *   `[{ itemLabel: string, url: string, subItems?: Array }]`.
 * - `customClassName`: Clases CSS adicionales.
 * - `...rest`: Otras propiedades válidas.
 */
export const NavbarDesktop = ({
  sections = [],
  accentColor = '',
  customClassName = '',
  ...rest
}) => {
  const [openDropdownIndex, setOpenDropdownIndex] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isPositionCalculated, setIsPositionCalculated] = useState(false);
  const navRef = useRef(null);
  const overlayRef = useRef(null);
  const portalRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Close megamenu on ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpenDropdownIndex(null);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Create portal container outside header for megamenu panels.
  // This ensures the header stacking context (z-index:1000) paints above
  // the megamenu portal (z-index:999).
  useEffect(() => {
    let portal = document.getElementById('megamenu-portal');
    if (!portal) {
      portal = document.createElement('div');
      portal.id = 'megamenu-portal';
      portal.style.cssText = 'position:relative;z-index:999;';
      const header = document.querySelector('header');
      if (header && header.parentNode) {
        header.parentNode.insertBefore(portal, header.nextSibling);
      } else {
        document.body.appendChild(portal);
      }
    }
    portalRef.current = portal;
    return () => {
      if (portalRef.current) {
        render(null, portalRef.current);
      }
    };
  }, []);

  // Render megamenu panels into the portal as a separate Preact tree.
  // Using render() (not appendChild) keeps reconciliation correct.
  useEffect(() => {
    if (!portalRef.current) return;
    const megamenuVNodes = sections.map((section, index) => {
      if (!section.megamenu) return null;
      const {
        columns: mmCols = [], cmsBlock: mmCms = null,
        formType: mmForm = null, formLabel: mmFormLabel = '',
      } = section.megamenu;
      const isOpen = openDropdownIndex === index;
      return html`
        <${Megamenu}
          key=${`megamenu-panel-${index}`}
          columns=${mmCols}
          cmsBlock=${mmCms}
          formType=${mmForm}
          formLabel=${mmFormLabel}
          isOpen=${isOpen}
          isPositionCalculated=${isPositionCalculated}
          onMouseLeave=${() => {}}
        />
      `;
    }).filter(Boolean);
    render(html`${megamenuVNodes}`, portalRef.current);
  }, [openDropdownIndex, isPositionCalculated, sections]);

  // Auto-close megamenu when viewport shrinks below desktop (<1024). Otherwise
  // the overlay div (z-index 999) leaks into mobile/tablet because it lives in
  // <main> and isn't tied to the .header-navbar-desktop visibility CSS, leaving
  // a dark scrim over the page until the user clicks somewhere.
  useEffect(() => {
    if (openDropdownIndex === null) return undefined;
    const handleResize = () => {
      if (window.innerWidth < 1024) setOpenDropdownIndex(null);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [openDropdownIndex]);

  // Allow transition after open
  useEffect(() => {
    if (openDropdownIndex !== null) {
      const rafId = requestAnimationFrame(() => setIsPositionCalculated(true));
      return () => cancelAnimationFrame(rafId);
    }
    setIsPositionCalculated(false);
    return () => {};
  }, [openDropdownIndex]);

  // Overlay for megamenu panels (mirrors NavbarDropdown overlay logic)
  useEffect(() => {
    const openSection = openDropdownIndex !== null ? sections[openDropdownIndex] : null;
    const isMegamenuOpen = openSection?.megamenu
      && (
        openSection.megamenu.columns?.length > 0
        || openSection.megamenu.cmsBlock
        || openSection.megamenu.formType
      );

    if (isMegamenuOpen) {
      const mainElement = document.querySelector('main') || document.body;
      const overlay = document.createElement('div');
      overlay.className = 'navbar-dropdown-overlay';
      overlay.style.cssText = [
        'position:fixed;',
        'top:0;left:0;right:0;bottom:0;',
        'background-color:rgba(27,27,27,0.70);',
        'z-index:998;',
        'pointer-events:auto;',
        'cursor:pointer;',
      ].join('');
      overlay.addEventListener('click', () => setOpenDropdownIndex(null));
      mainElement.appendChild(overlay);
      overlayRef.current = overlay;
    } else if (overlayRef.current && overlayRef.current.parentNode) {
      overlayRef.current.parentNode.removeChild(overlayRef.current);
      overlayRef.current = null;
    }

    return () => {
      if (overlayRef.current && overlayRef.current.parentNode) {
        overlayRef.current.parentNode.removeChild(overlayRef.current);
        overlayRef.current = null;
      }
    };
  }, [openDropdownIndex, sections]);

  const handleSubItemClick = (subItem) => {
    if (subItem.url) {
      window.location.href = subItem.url;
    }
  };

  const handleDropdownToggle = (index, isOpen) => {
    setOpenDropdownIndex(isOpen ? index : null);
  };

  const handleMegamenuToggle = (index) => {
    const willOpen = openDropdownIndex !== index;
    if (willOpen) {
      // Notify other header dropdowns (e.g. LanguageSearch) so they can close.
      window.dispatchEvent(new CustomEvent('avi:megamenu-open', { detail: { index } }));
    }
    setOpenDropdownIndex(willOpen ? index : null);
  };

  // Close any open megamenu when LanguageSearch opens, so only one
  // header dropdown is visible at a time.
  useEffect(() => {
    const handleLangSearchOpen = () => setOpenDropdownIndex(null);
    window.addEventListener('avi:language-search-open', handleLangSearchOpen);
    return () => {
      window.removeEventListener('avi:language-search-open', handleLangSearchOpen);
    };
  }, []);

  return html`
    <div
      class="relative h-full flex items-center ${customClassName}"
      style=${accentColor ? { '--header-offers': accentColor } : undefined}
      ...${rest}
    >
    <nav
      ref=${navRef}
      class="relative z-[10] flex items-center justify-center gap-0 max-h-[69px] h-full"
      role="navigation"
      aria-label="Navegación principal desktop"
    >
      ${sections.map((section, index) => {
    const hasMegamenu = section.megamenu && (
      section.megamenu.columns?.length > 0 || section.megamenu.cmsBlock || section.megamenu.formType
    );
    const hasSubItems = section.subItems && section.subItems.length > 0;
    const isOpen = openDropdownIndex === index;

    if (hasMegamenu) {
      return html`
        <div
          key=${section.url || index}
          class=${`
            group relative px-5 py-6 flex items-center justify-center h-full
            cursor-pointer transition-colors after:absolute ${isScrolled ? 'after:bottom-0' : 'after:bottom-[-4px]'} after:z-[20]
            after:left-0 after:right-0 after:h-0 after:transition-colors
            ${isOpen ? 'after:border-b-[4px] after:border-[var(--header-offers)]' : 'after:border-b-[4px] after:border-transparent hover:after:border-[var(--header-offers)]'}
            focus-visible:after:border-[var(--header-offers)] focus-visible:outline-none
          `}
          data-navbar-megamenu="true"
          role="button"
          tabIndex="0"
          aria-expanded=${isOpen}
          aria-haspopup="true"
          onClick=${() => handleMegamenuToggle(index)}
          onKeyDown=${(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleMegamenuToggle(index); } }}
        >
          <div class="absolute transition-all ${isScrolled ? 'top-0 h-full' : 'top-[-3px] h-[calc(100%+8px)]'} left-0 right-0 w-full border-2 border-transparent group-focus-visible:border-[var(--color-border-stroke-focus)] hidden group-focus-visible:block pointer-events-none z-1"></div>
          <span class=${`
            h-[21px] flex items-center justify-center
            font-sans leading-none text-[var(--logo-avianca-secondary)] text-center whitespace-nowrap
            transition-colors
            ${isOpen ? 'font-bold text-[0.95rem]' : 'font-normal text-base group-hover:font-bold group-hover:text-[0.95rem]'}
          `}>
            ${section.itemLabel}
          </span>

        </div>
      `;
    }

    if (hasSubItems) {
      return html`
        <${NavbarDropdown}
          key=${section.url || index}
          label=${section.itemLabel}
          subItems=${section.subItems}
          isActive=${false}
          isOpen=${isOpen}
          onToggle=${(isOpenState) => handleDropdownToggle(index, isOpenState)}
          onSubItemClick=${handleSubItemClick}
          isScrolled=${isScrolled}
        />
      `;
    }

    return html`
      <a
        key=${section.url || index}
        href=${section.url || '#'}
        class=${`
          group !decoration-none relative flex items-end justify-center px-5 py-6 items-center
          cursor-pointer transition-colors no-underline self-stretch h-full 
          after:absolute ${isScrolled ? 'after:bottom-0' : 'after:bottom-[-4px]'} after:left-0 after:right-0 after:h-0 after:border-b-[4px] after:border-transparent after:z-[20]
          hover:after:border-[var(--header-offers)] 
          focus-visible:after:border-[var(--header-offers)]
          after:transition-colors 
          focus-visible:outline-none
          `}
      >
        <div class="absolute transition-all ${isScrolled ? 'top-0 h-full' : 'top-[-3px] h-[calc(100%+8px)]'} left-0 right-0 w-full border-2 border-transparent group-focus-visible:border-[var(--color-border-stroke-focus)] hidden group-focus-visible:block pointer-events-none z-1"></div>
        <span class=${`
          self-center
            h-[21px] flex items-center justify-center font-sans font-normal 
            group-focus-visible:font-bold
            group-hover:font-bold text-base leading-none text-[var(--logo-avianca-secondary)] text-center whitespace-nowrap transition-colors
            group-hover:text-[0.95rem]
          `}>
          ${section.itemLabel}
        </span>
      </a>
    `;
  })}
    </nav>
    </div>
  `;
};

export default NavbarDesktop;
