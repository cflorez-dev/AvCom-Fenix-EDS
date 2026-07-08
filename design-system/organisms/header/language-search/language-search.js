import { h } from '@dropins/tools/preact.js';
import {
  useState,
  useRef,
  useEffect,
  useMemo,
} from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Button } from '../../../atoms/button/button.js';
import { PosForm } from '../pos-form/pos-form.js';
import loadSVGIcon from '../../../../scripts/utils/svg.helper.js';
import { Icon } from '../../../atoms/icon/icon.js';

const html = htm.bind(h);

/**
 * Builds an absolute path for a module using codeBasePath
 * @param {string} relativePath - Relative path from codeBasePath
 * @returns {string} Absolute URL to the module
 */
function buildModulePath(relativePath) {
  const codeBasePath = window.hlx?.codeBasePath || '';
  const cleanPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;

  // If codeBasePath is empty, build absolute URL from origin
  if (!codeBasePath) {
    return `${window.location.origin}${cleanPath}`;
  }

  // If codeBasePath is already absolute, use it directly
  if (codeBasePath.startsWith('http://') || codeBasePath.startsWith('https://')) {
    return `${codeBasePath}${cleanPath}`.replace(/\/+/g, '/');
  }

  // If codeBasePath is relative, build absolute URL
  const basePath = codeBasePath.startsWith('/') ? codeBasePath : `/${codeBasePath}`;
  return `${window.location.origin}${basePath}${cleanPath}`.replace(/\/+/g, '/');
}

/**
 * Dynamically imports the language-country-selector service
 * @returns {Promise<Object>} Promise that resolves to the service module
 */
async function loadLanguageCountrySelectorService() {
  const servicePath = buildModulePath('/scripts/services/header/language-country-selector.js');
  try {
    const module = await import(servicePath);
    return module;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load language-country-selector service:', error);
    // Fallback: try relative path as last resort
    try {
      return await import('../../../../scripts/services/header/language-country-selector.js');
    } catch (fallbackError) {
      // eslint-disable-next-line no-console
      console.error('Failed to load language-country-selector service (fallback):', fallbackError);
      throw fallbackError;
    }
  }
}

/**
 * LanguageSearch - Language/country (POS) search and selector component
 *
 * ## Props
 * - `showSearchButton`: boolean - Whether to show the search button
 * - `searchButtonLabel`: string - Search button text (default: "Buscar")
 * - `posAvailable`: array - List of available POS (e.g.: ["es-col", "en-us"])
 * - `defaultPos`: string - Default selected POS (e.g.: "es-col")
 * - `maxVisibleOptions`: number - Maximum visible options without scroll (default: 4)
 * - `onSearchClick`: function - Callback when search button is clicked
 * - `onPosChange`: function - Callback when selected POS changes
 * - `labels`: Object | null - Object with custom labels (optional)
 *   - `title`: string | null - Selector title
 *   - `countryLabel`: string | null - Label for country selector
 *   - `languageLabel`: string | null - Label for language selector
 *   - `confirmLabel`: string | null - Label for confirm button
 *   - `confirmButtonText`: string | null - Confirm button text
 * - `customClassName`: string - Additional CSS classes
 * - `...rest`: Other valid properties
 */
export const LanguageSearch = ({
  showSearchButton = false,
  searchButtonLabel = 'Buscar',
  posAvailable = [],
  defaultPos = '',
  maxVisibleOptions = 4,
  onSearchClick,
  onPosChange,
  labels = null,
  customClassName = '',
  ...rest
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isHover, setIsHover] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [hoveredItemIndex, setHoveredItemIndex] = useState(null);
  const [searchIcon, setSearchIcon] = useState(null);
  const [showPosForm, setShowPosForm] = useState(false);
  const [service, setService] = useState(null);
  const [selectedPos, setSelectedPos] = useState(defaultPos);
  const dropdownRef = useRef(null);
  const overlayRef = useRef(null);
  const mouseDownRef = useRef(false);

  // Load the language-country-selector service dynamically
  useEffect(() => {
    let isMounted = true;

    const loadService = async () => {
      try {
        const loadedService = await loadLanguageCountrySelectorService();
        if (isMounted) {
          setService(loadedService);
          
          // Get normalizePos and validatePos functions
          const normalizePos = loadedService.normalizePos || ((pos, fallback) => fallback || 'es-col');
          const validatePos = loadedService.validatePos || (() => false);
          
          // Initialize selectedPos from cookies or defaultPos after service is loaded
          const storedPosValue = loadedService.getStoredPos();
          
          // Normalize and validate the stored POS
          let initialPos = storedPosValue;
          if (initialPos && validatePos(initialPos)) {
            initialPos = normalizePos(initialPos);
          } else {
            // If stored POS is invalid, use defaultPos
            initialPos = defaultPos;
          }

          // Normalize and validate defaultPos
          if (initialPos) {
            initialPos = normalizePos(initialPos);
            if (validatePos(initialPos)) {
              setSelectedPos(initialPos);
              // console.log('[LanguageSearch] Initialized with POS:', initialPos);
            } else {
              const fallbackPos = normalizePos('');
              setSelectedPos(fallbackPos);
              // eslint-disable-next-line no-console
              console.warn('[LanguageSearch] Invalid defaultPos, using fallback:', fallbackPos);
            }
          } else {
            const fallbackPos = normalizePos('');
            setSelectedPos(fallbackPos);
            // eslint-disable-next-line no-console
            console.warn('[LanguageSearch] No POS available, using fallback:', fallbackPos);
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[LanguageSearch] Failed to load service:', error);
        // Set fallback POS even if service fails to load
        setSelectedPos('es-col');
      }
    };

    loadService();

    return () => {
      isMounted = false;
    };
  }, [defaultPos]);

  // Get service functions (with fallbacks if service not loaded yet)
  const getStoredPos = service?.getStoredPos || (() => null);
  const setStoredPos = service?.setStoredPos || (() => {});
  const navigateToPOS = service?.navigateToPOS || (() => {});
  const getStorageEventName = service?.getStorageEventName || (() => 'pos-storage-change');
  const formatPosForDisplay = service?.formatPosForDisplay || ((pos) => pos || '');
  const parsePos = service?.parsePos || (() => ({ language: '', country: '' }));
  const buildPos = service?.buildPos || ((lang, country) => `${lang}-${country}`);
  const getCountries = service?.getCountries || (() => []);
  const getLanguages = service?.getLanguages || (() => []);
  const getCountryFlagPath = service?.getCountryFlagPath || (() => null);
  const normalizePos = service?.normalizePos || ((pos, fallback) => fallback || 'es-col');
  const validatePos = service?.validatePos || (() => false);
  const getAllowedLanguages = service?.getAllowedLanguages || null;
  const getDefaultLanguage = service?.getDefaultLanguage || null;

  // Get all countries and languages from service (recalculate when service is loaded)
  // Ensure flag paths are always absolute URLs
  const allCountries = useMemo(() => {
    if (!service || !service.getCountries) return [];
    const countries = service.getCountries();
    // Ensure all flag paths are absolute URLs
    return countries.map(country => ({
      ...country,
      flagPath: country.flagPath && !country.flagPath.startsWith('http') 
        ? `${window.location.origin}${country.flagPath.startsWith('/') ? '' : '/'}${country.flagPath}`
        : country.flagPath
    }));
  }, [service]);

  const allLanguages = useMemo(() => {
    if (!service || !service.getLanguages) return [];
    return service.getLanguages();
  }, [service]);

  // Parse current selected POS to get current country and language
  // (updates when selectedPos changes)
  // Ensure we always have valid values by normalizing and validating
  const normalizedSelectedPos = normalizePos(selectedPos || '');
  const parsedPos = parsePos(normalizedSelectedPos);
  const currentLanguage = parsedPos.language || 'es';
  const currentCountry = parsedPos.country || 'col';

  // Get flag path for current country
  const currentFlagPath = currentCountry ? getCountryFlagPath(currentCountry) : null;

  // Listen to cookie changes from other components
  useEffect(() => {
    if (!service) return;

    const handleStorageChange = (event) => {
      if (!event.detail) return;
      if (event.detail.pos) {
        setSelectedPos(event.detail.pos);
      } else if (event.detail.language !== undefined || event.detail.country !== undefined) {
        const stored = service.getStoredPos?.();
        if (stored) {
          const normalized = normalizePos(stored);
          if (validatePos(normalized)) setSelectedPos(normalized);
        }
      }
    };

    const eventName = getStorageEventName();
    window.addEventListener(eventName, handleStorageChange);

    return () => {
      window.removeEventListener(eventName, handleStorageChange);
    };
  }, [service]);

  // Update selectedPos when defaultPos changes or when stored value changes
  useEffect(() => {
    if (!service) return;

    const stored = getStoredPos();
    let newPos = stored || defaultPos;
    
    // Normalize and validate the POS before setting
    if (newPos) {
      newPos = normalizePos(newPos);
      if (validatePos(newPos)) {
        setSelectedPos(newPos);
        // console.log('[LanguageSearch] Updated selectedPos:', newPos);
      } else {
        const fallbackPos = normalizePos('');
        setSelectedPos(fallbackPos);
        // eslint-disable-next-line no-console
        console.warn('[LanguageSearch] Invalid POS, using fallback:', fallbackPos);
      }
    } else {
      const fallbackPos = normalizePos('');
      setSelectedPos(fallbackPos);
      // eslint-disable-next-line no-console
      console.warn('[LanguageSearch] No POS available, using fallback:', fallbackPos);
    }
  }, [defaultPos, service]);

  // Load search icon
  useEffect(() => {
    if (showSearchButton) {
      const loadIcon = async () => {
        try {
          const codeBasePath = window.hlx?.codeBasePath || '';
          const iconPath = `${codeBasePath}/icons/search-icon.svg`;
          const iconSVG = await loadSVGIcon(iconPath);
          setSearchIcon(iconSVG);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error loading search icon:', error);
        }
      };
      loadIcon();
    }
  }, [showSearchButton]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        // Don't close if click is on overlay (already handled in overlay)
        if (event.target.classList.contains('language-search-overlay')) {
          return;
        }
        setIsDropdownOpen(false);
        setIsFocused(false);
        setShowPosForm(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Close this dropdown whenever a megamenu panel opens, so only one
  // header dropdown is visible at a time.
  useEffect(() => {
    const handleMegamenuOpen = () => {
      setIsDropdownOpen(false);
      setShowPosForm(false);
      setIsFocused(false);
    };
    window.addEventListener('avi:megamenu-open', handleMegamenuOpen);
    return () => {
      window.removeEventListener('avi:megamenu-open', handleMegamenuOpen);
    };
  }, []);

  // Create and remove overlay in main
  useEffect(() => {
    if (isDropdownOpen) {
      // Find main element or use body as fallback
      const mainElement = document.querySelector('main') || document.body;

      // Create overlay directly in main (or body if main doesn't exist)
      const overlay = document.createElement('div');
      overlay.className = 'language-search-overlay fixed inset-0 bg-[rgba(27,27,27,0.70)] z-[800] cursor-pointer';
      overlay.addEventListener('click', () => {
        setIsDropdownOpen(false);
        setIsFocused(false);
        setShowPosForm(false);
      });
      mainElement.appendChild(overlay);
      overlayRef.current = overlay;
    }

    // Remove overlay when dropdown closes
    if (!isDropdownOpen && overlayRef.current && overlayRef.current.parentNode) {
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
  }, [isDropdownOpen]);

  // Format POS for display: "es-col" -> "COL - ES" (country-language)
  const formatPosDisplay = (pos) => formatPosForDisplay(pos);

  const handleDropdownToggle = (e) => {
    e.preventDefault();
    if (isDropdownOpen) {
      setIsDropdownOpen(false);
      setIsFocused(false);
      setShowPosForm(false);
      e.currentTarget.blur();
      return;
    }
    // Notify other header dropdowns (e.g. Megamenu) so they can close.
    window.dispatchEvent(new CustomEvent('avi:language-search-open'));
    setShowPosForm(true);
    setIsDropdownOpen(true);
  };

  // Handle mouse down to detect mouse clicks vs keyboard navigation
  const handleMouseDown = () => {
    mouseDownRef.current = true;
    // Reset after a short delay to allow focus event to check it
    setTimeout(() => {
      mouseDownRef.current = false;
    }, 0);
  };

  // Handle focus - only show focus outline when navigating with keyboard (Tab)
  const handleFocus = () => {
    // Only set focus state if it wasn't triggered by a mouse click
    if (!mouseDownRef.current) {
      setIsFocused(true);
    }
  };

  // Handle blur
  const handleBlur = () => {
    setIsFocused(false);
    mouseDownRef.current = false;
  };

  const handlePosFormConfirm = (data) => {
    const { language, country } = data;
    const newPos = buildPos(language, country);

    // Normalize and validate before setting
    const normalizedPos = normalizePos(newPos);
    if (validatePos(normalizedPos)) {
      setSelectedPos(normalizedPos);
      // Save to cookies
      setStoredPos(normalizedPos);
      setIsDropdownOpen(false);
      setShowPosForm(false);

      if (onPosChange) {
        onPosChange(normalizedPos);
      }
      // console.log('[LanguageSearch] POS confirmed:', normalizedPos);

      // Navigate to the new POS path (explicit user action)
      navigateToPOS(normalizedPos);
    } else {
      // eslint-disable-next-line no-console
      console.error('[LanguageSearch] Invalid POS from form:', newPos);
    }
  };

  const handlePosFormClose = () => {
    setShowPosForm(false);
    setIsDropdownOpen(false);
  };

  const handlePosSelect = (pos) => {
    // Normalize and validate before setting
    const normalizedPos = normalizePos(pos);
    if (validatePos(normalizedPos)) {
      setSelectedPos(normalizedPos);
      // Save to cookies
      setStoredPos(normalizedPos);
      setIsDropdownOpen(false);
      setShowPosForm(false);
      if (onPosChange) {
        onPosChange(normalizedPos);
      }
      // console.log('[LanguageSearch] POS selected:', normalizedPos);

      // Navigate to the new POS path (explicit user action)
      navigateToPOS(normalizedPos);
    } else {
      // eslint-disable-next-line no-console
      console.error('[LanguageSearch] Invalid POS selected:', pos);
    }
  };

  const handleSearchClick = (e) => {
    e.preventDefault();
    if (onSearchClick) {
      onSearchClick(e);
    }
  };

  // Render icon as Preact vnode using dangerouslySetInnerHTML
  const renderIcon = (iconElement) => {
    if (!iconElement) return null;
    return html`
      <span
        dangerouslySetInnerHTML=${{ __html: iconElement.outerHTML }}
        class="inline-flex items-center"
      />
    `;
  };

  return html`
    <div
      class=${`avi-language-search h-[48px] flex items-center justify-center flex-row gap-[16px] ${customClassName}`}
      ...${rest}
    >
      ${showSearchButton && html`
        <div class="flex">
          <${Button}
            variant="secondary"
            size="sm"
            onClick=${handleSearchClick}
            customClassName="language-search-button px-[12px]"
          >
            <span class="flex flex-row gap-[8px] items-center">
            <div class="w-[16px] h-[16px]">
                 <${Icon}  icon="action/search" size="s"/>
            </div>
              <span class="text-sm not-italic text-[var(--font-size-small)] font-[var(--font-weight-regular)]">
                ${searchButtonLabel}
              </span>
            </span>
          </${Button}>
        </div>
      `}

      <div class="relative inline-flex" ref=${dropdownRef}>
        <${Button}
          variant="secondary"
          size="sm"
          onClick=${handleDropdownToggle}
          aria-label=${currentLanguage
            ? `Seleccionar país e idioma: ${formatPosDisplay(selectedPos)}, idioma ${currentLanguage.toUpperCase()}`
            : 'Seleccionar país e idioma'}
          aria-expanded=${isDropdownOpen}
          data-open=${isDropdownOpen ? 'true' : 'false'}
          customClassName="px-[12px]"
          borderActiveColor="alert-success-border"
          borderFocusColor="alert-success-border"
        >
          <div class="flex flex-row items-center gap-[8px]">
            ${currentFlagPath ? html`
              <img
                src=${currentFlagPath}
                alt=""
                class="block w-[16px] h-[16px] object-contain flex-shrink-0"
                loading="eager"
                decoding="async"
              />
            ` : html`
              <span class="w-5 h-[15px] flex-shrink-0" />
            `}
            <span class="m-0 not-italic font-[family-name:var(--font-family-primary)] font-[var(--font-weight-regular)] text-[length:var(--font-size-small)] text-[var(--text-normal-primary)]">
              ${formatPosDisplay(selectedPos)}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              class=${`transition-transform duration-200 flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : 'rotate-0'}`}
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M11.06 5.72656L8 8.7799L4.94 5.72656L4 6.66656L8 10.6666L12 6.66656L11.06 5.72656Z"
                fill="currentColor"
              />
            </svg>
          </div>
        </${Button}>

        ${isDropdownOpen && showPosForm && html`
          <div class="absolute top-[calc(100%+6px)] right-0 w-[360px] max-w-[90vw] bg-[var(--bg-brand-primary-lighter)] rounded-2xl shadow-[0_2px_20px_2px_rgba(73,73,73,0.25)] p-[var(--padding-24)] z-[1000] overflow-visible">
            <${PosForm}
              countries=${allCountries}
              languages=${allLanguages}
              initialCountry=${currentCountry}
              initialLanguage=${currentLanguage}
              onConfirm=${handlePosFormConfirm}
              onClose=${handlePosFormClose}
              title=${labels?.title || null}
              countryLabel=${labels?.countryLabel || null}
              languageLabel=${labels?.languageLabel || null}
              confirmButtonText=${labels?.confirmButtonText || null}
              getAllowedLanguages=${getAllowedLanguages}
              getDefaultLanguage=${getDefaultLanguage}
            />
          </div>
        `}
        ${isDropdownOpen && !showPosForm && posAvailable.length > 0 && html`
          <div class="absolute top-[calc(100%+var(--gap-8))] right-0 w-[300px] bg-[var(--bg-brand-primary-lighter)] rounded-2xl shadow-[var(--shadow-medium)] py-[var(--padding-8)] px-0 overflow-hidden z-[1000] flex flex-col" style=${`max-height: ${maxVisibleOptions * 48}px`}>
            <div class=${`p-2 flex flex-col gap-[var(--gap-4)] ${posAvailable.length > maxVisibleOptions ? 'overflow-y-auto' : 'overflow-visible'}`}>
              ${posAvailable.map((pos, index) => {
                const { country } = parsePos(pos);
                const countryData = allCountries.find((c) => c.value === country);
                const isHovered = hoveredItemIndex === index;
                const isLast = index === posAvailable.length - 1;
                return html`
                  <button
                    key=${pos}
                    class=${`flex gap-[var(--gap-8)] items-center w-full cursor-pointer transition-[var(--transition-colors)] py-[var(--padding-12)] px-[var(--padding-16)] border-none ${isHovered ? 'bg-[var(--dropdown-item-hover-bg)]' : 'bg-transparent'} ${isLast ? 'rounded-[var(--border-radius-medium)]' : 'rounded-none'}`}
                    onClick=${() => handlePosSelect(pos)}
                    onMouseEnter=${() => setHoveredItemIndex(index)}
                    onMouseLeave=${() => setHoveredItemIndex(null)}
                    type="button"
                    aria-selected=${pos === selectedPos}
                  >
                    ${countryData && html`
                      <span class="inline-flex items-center w-5 h-[15px] mr-2">
                        <img
                          src=${countryData.flagPath}
                          alt=${countryData.label}
                          class="w-full h-full object-contain"
                          loading="lazy"
                          decoding="async"
                        />
                      </span>
                    `}
                    <span class="m-0 not-italic" style="font-family: var(--font-family-primary); font-weight: var(--font-weight-regular); font-size: var(--font-size-small); color: var(--text-normal-primary);">
                      ${formatPosDisplay(pos)}
                    </span>
                    ${pos === selectedPos && html`
                      <span class="ml-auto text-sm">✓</span>
                    `}
                  </button>
                `;
              })}
            </div>
          </div>
        `}
      </div>
    </div>
  `;
};

export default LanguageSearch;
