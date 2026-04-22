import { h } from '@dropins/tools/preact.js';
import { useEffect, useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { NavbarDropdown } from '../../../molecules/navbar-dropdown/navbar-dropdown.js';

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
  customClassName = '',
  ...rest
}) => {
  const [openDropdownIndex, setOpenDropdownIndex] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);

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

  const handleSubItemClick = (subItem) => {
    // Navigate to sub-item URL
    if (subItem.url) {
      window.location.href = subItem.url;
    }
  };

  const handleDropdownToggle = (index, isOpen) => {
    if (isOpen) {
      // Si se abre un dropdown, cerrar cualquier otro que esté abierto
      setOpenDropdownIndex(index);
    } else {
      // Si se cierra, limpiar el estado
      setOpenDropdownIndex(null);
    }
  };

  return html`
    <nav
      class="flex items-center justify-center gap-0 max-h-[69px] h-full ${customClassName}"
      role="navigation"
      aria-label="Navegación principal desktop"
      ...${rest}
    >
      ${sections.map((section, index) => {
    const hasSubItems = section.subItems && section.subItems.length > 0;

    if (hasSubItems) {
      return html`
        <${NavbarDropdown}
          key=${section.url || index}
          label=${section.itemLabel}
          subItems=${section.subItems}
          isActive=${false}
          isOpen=${openDropdownIndex === index}
          onToggle=${(isOpen) => handleDropdownToggle(index, isOpen)}
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
  `;
};

export default NavbarDesktop;
