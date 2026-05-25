import { h } from '@dropins/tools/preact.js';
import { useState, useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import {
  getStoredPos,
  parsePos,
  formatPosForDisplay,
  getCountryFlagPath,
  getStorageEventName,
} from '../../../../scripts/services/header/language-country-selector.js';
import loadSVGIcon from '../../../../scripts/utils/svg.helper.js';
import { waitForHlxCodeBasePath, buildIconPath } from '../../../../scripts/utils/hlx.helper.js';

const html = htm.bind(h);

/**
 * LanguageSelectorButton - Componente de botón para selector de idioma/país
 * Solo renderiza el botón sin dropdown (el dropdown se maneja desde el componente padre)
 *
 * ## Props
 * - `onClick`: function - Callback cuando se hace click en el botón
 * - `customClassName`: string - Clases CSS adicionales
 * - `...rest`: Otras propiedades válidas
 */
export const LanguageSelectorButton = ({
  onClick,
  customClassName = '',
  ...rest
}) => {
  const [selectedPos, setSelectedPos] = useState('');
  const [chevronIcon, setChevronIcon] = useState(null);

  // Initialize selectedPos from cookies
  useEffect(() => {
    const stored = getStoredPos();
    if (stored) {
      setSelectedPos(stored);
    }
  }, []);

  // Load chevron icon
  useEffect(() => {
    const loadChevronIcon = async () => {
      try {
        const codeBasePath = await waitForHlxCodeBasePath({
          maxRetries: 30,
          retryDelay: 100,
        });

        const chevronIconPath = buildIconPath('chevron-right.svg', codeBasePath);
        const chevronIconSVG = await loadSVGIcon(chevronIconPath).catch((err) => {
          // eslint-disable-next-line no-console
          console.error('Error loading chevron icon:', chevronIconPath, err);
          return null;
        });

        setChevronIcon(chevronIconSVG);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error loading chevron icon:', error);
      }
    };

    loadChevronIcon();
  }, []);

  // Render icon as Preact vnode using dangerouslySetInnerHTML
  const renderIcon = (svgElement, size = null) => {
    if (!svgElement) return null;

    // Clone the SVG element to modify it
    const clonedSvg = svgElement.cloneNode(true);
    if (size) {
      clonedSvg.setAttribute('width', size);
      clonedSvg.setAttribute('height', size);
    }

    // Ensure paths use currentColor
    const paths = clonedSvg.querySelectorAll('path');
    paths.forEach((path) => {
      const fill = path.getAttribute('fill');
      const stroke = path.getAttribute('stroke');
      if (fill && fill !== 'none' && fill !== 'currentColor') {
        path.setAttribute('fill', 'currentColor');
      }
      if (stroke && stroke !== 'none' && stroke !== 'currentColor') {
        path.setAttribute('stroke', 'currentColor');
      }
    });

    return html`
      <span
        class="inline-flex items-center justify-center"
        dangerouslySetInnerHTML=${{ __html: clonedSvg.outerHTML }}
      />
    `;
  };

  // Listen to cookie changes from other components (e.g., header)
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.detail && event.detail.pos) {
        const newPos = event.detail.pos;
        setSelectedPos(newPos);
      }
    };

    window.addEventListener(getStorageEventName(), handleStorageChange);

    return () => {
      window.removeEventListener(getStorageEventName(), handleStorageChange);
    };
  }, []);

  // Parse current selected POS to get current country and language
  const { country: currentCountry, language: currentLanguage } = parsePos(selectedPos);
  const currentFlagPath = currentCountry ? getCountryFlagPath(currentCountry) : null;
  const displayText = formatPosForDisplay(selectedPos);
  // Keep language in aria-label for screen readers even though it's hidden visually
  const ariaLabel = currentLanguage
    ? `Seleccionar país e idioma: ${displayText}, idioma ${currentLanguage.toUpperCase()}`
    : 'Seleccionar país e idioma';

  return html`
    <button
      onClick=${onClick}
      type="button"
      aria-label=${ariaLabel}
      class="flex gap-2 items-center bg-[var(--bg-brand-primary-lighter)] hover:bg-[var(--state-hover-lighten)] cursor-pointer transition-all w-full justify-between focus:outline-2 focus:outline-[var(--focus-primary)] focus:outline-offset-2 ${customClassName}"
      ...${rest}
    >
      <div class="flex flex-row items-center gap-2">
        ${currentFlagPath ? html`
          <img
            src=${currentFlagPath}
            alt=""
            class="block w-6 h-4 object-contain shrink-0"
          />
        ` : html`
          <span class="w-5 h-[15px] shrink-0" />
        `}
        <span class="text-sm font-normal not-italic text-[var(--text-normal-primary)] m-0">
          ${displayText || 'Seleccionar'}
        </span>
      </div>
      <span class="w-6 h-6 inline-flex items-center justify-center shrink-0">
        ${renderIcon(chevronIcon, '12')}
      </span>
    </button>
  `;
};

export default LanguageSelectorButton;
