import { h } from '@dropins/tools/preact.js';
import { createPortal } from '@dropins/tools/preact-compat.js';
import { useState, useRef, useEffect, useMemo, useCallback } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Icon } from '../../atoms/icon/icon.js';

const html = htm.bind(h);

// Constants
const MOBILE_BREAKPOINT = 768;
const BLUR_DELAY = 200;
const DROPDOWN_MAX_WIDTH = '360px';

/**
 * Hook para pre-renderizar un Icon y tenerlo listo para usar en portals
 * @param {string} icon - Ruta del icono (ej: 'navigation/arrow-back')
 * @param {string} size - Tamaño del icono ('xs'|'sm'|'m'|'l'|'xl')
 * @param {string} color - Color del icono (opcional)
 * @returns {object} Ref con el HTML del icono renderizado
 */
const usePrerenderedIcon = (icon, size = 'm', color = '') => {
  const iconRef = useRef(null);

  useEffect(() => {
    const tempDiv = document.createElement('div');
    const iconElement = h(Icon, { icon, size, customClassName: color ? `[&_path]:fill-[${color}]` : '' });
    // Render icon to temp div for innerHTML extraction
    import('@dropins/tools/preact.js').then(({ render }) => {
      render(iconElement, tempDiv);
    });
    iconRef.current = tempDiv;

    // Cleanup
    return () => {
      if (iconRef.current && iconRef.current.parentNode) {
        iconRef.current.parentNode.removeChild(iconRef.current);
      }
    };
  }, [icon, size, color]);

  return iconRef;
};

/**
 * CitySelector - Selector de ciudades con búsqueda, modo step mobile/desktop
 *
 * ## Props
 * - `label`: `string` – Etiqueta del selector (e.g., "Origen", "Destino").
 * - `value`: `object` – Ciudad seleccionada: { code: 'BOG', name: 'Bogotá', country: 'Colombia' }.
 * - `cities`: `array` – Lista de ciudades disponibles.
 * - `onChange`: `function` – Callback al seleccionar ciudad (city) => void.
 * - `placeholder`: `string` – Placeholder del input (default: "Buscar ciudad...").
 *        Si false, BookingBox controla el header (default: true).
 * - `onBack`: `function` – Callback para botón back (cuando lo controla BookingBox).
 *        Si no se pasa, cierra el modal.
 * - `onClose`: `function` – Callback para botón close/X (cuando lo controla BookingBox).
 *        Si no se pasa, cierra el modal.
 * - `stepTitle`: `string` – Título del step (default: label).
 * - `showHeader`: `boolean` – Mostrar header en mobile.
 * - `variant`: `"standalone" | "grouped-first" | "grouped-last" | "grouped-left" | "grouped-right"` – Variante visual (default: "standalone").
 *   - `standalone`: Input individual con bordes completos
 *   - `grouped-first`: Primer input del grupo vertical (border-radius solo arriba)
 *   - `grouped-last`: Último input del grupo vertical (border-radius solo abajo)
 *   - `grouped-left`: Primer input del grupo horizontal (border-radius solo izquierda)
 *   - `grouped-right`: Último input del grupo horizontal (border-radius solo derecha)
 * - `customClassName`: `string` – Clases CSS adicionales.
 * - `disabled`: `boolean` – Si está deshabilitado.
 * - `required`: `boolean` – Si es requerido.
 * - `...rest`: Otras propiedades.
 *
 * ## Diseño (Figma)
 * - Trigger Mobile: node-id 2742-5320 - Input con icono
 * - Modal Mobile: node-id 2742-6376 - Full screen con búsqueda
 * - Popup Desktop: node-id 2742-6358 - Popup absolute
 * - Search Input: node-id 2742-6347 - Input con icono search
 *
 * ## Comportamiento
 * - **Mobile**: Modal full-screen con header, búsqueda y lista
 * - **Desktop**: Popup absolute (ancho/alto fijo) bajo el trigger
 * - **Búsqueda**: Filtra en tiempo real (name, code, country)
 * - **Highlighting**: Texto coincidente en bold
 * - **Auto-close**: Se cierra automáticamente al seleccionar una ciudad
 * - **Keyboard**: Tab, Enter, Escape, Arrow Up/Down
 * - **Click outside**: Cierra popup (solo desktop)
 *
 * ## Estructura Ciudad
 * ```javascript
 * {
 *   iataCityCode: 'BOG',    // IATA code
 *   name: 'Bogotá',         // City name
 *   country: 'Colombia',    // Country name
 *   terminal: 'Aeropuerto Internacional El Dorado', // Terminal name
 *   value: 'Bogotá, Aeropuerto Internacional El Dorado (BOG)', // Display value
 *   // ... otros campos (cityId, countryId, latitude, longitude, etc.)
 * }
 * ```
 *
 * ## Ejemplos de uso
 *
 * ### Modo Step (dentro de BookingBox) - Uso Principal
 * ```javascript
 * <${CitySelector}
 *   value=${origin}
 *   cities=${allCities}
 *   onChange=${setOrigin}
 *   placeholder="¿Desde dónde viajas?"
 *   onBack=${handlePreviousStep}
 *   onClose=${handleCloseBookingBox}
 *   stepTitle="¿Desde dónde viajas?"
 * />
 * ```
 *
 * ### Modo Standalone (uso independiente)
 * ```javascript
 * <${CitySelector}
 *   label="Origen"
 *   value=${origin}
 *   cities=${allCities}
 *   onChange=${setOrigin}
 *   placeholder="Buscar ciudad..."
 * />
 * ```
 *
 * ## Optimizaciones
 * - ⚡ Performance: Prop validation solo en desarrollo, pre-calculated classes
 * - ♿ Accessibility: ARIA labels, keyboard navigation, focus management
 * - 🏆 Best practices: Portal rendering, click outside detection, cleanup effects
 */
export const CitySelector = ({
  label = '',
  value = null,
  cities = [],
  onChange,
  placeholder = '',
  onBack,
  onClose,
  stepTitle,
  showHeader = true,
  variant = 'standalone',
  customClassName = '',
  disabled = false,
  hasError = false,
  showErrorMessage = true,
  iconInputName = 'action/plane',
  positionDropdownStyles = 'top-full left-0 right-0',
  containerRelative = true,
  isOpen: isOpenProp,
  onOpenChange,
  i18n = {},
  isLoading = false,
  ...rest
}) => {
  // Determine step title
  const actualStepTitle = useMemo(
    () => stepTitle || label || (i18n['bookingBox.labels.whereTo'] || '¿Dónde?'),
    [stepTitle, label, i18n],
  );

  // Estado controlado/no controlado para isOpen
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = isOpenProp !== undefined ? isOpenProp : internalIsOpen;
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [isMobile, setIsMobile] = useState(false);
  const [desktopListHasScrollbar, setDesktopListHasScrollbar] = useState(false);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const tabKeyPressedRef = useRef(false);
  const desktopListRef = useRef(null);

  // Helper para cambiar estado de isOpen (controlado o no controlado)
  const setIsOpenState = useCallback((newIsOpen) => {
    setInternalIsOpen(newIsOpen);
    if (onOpenChange) {
      onOpenChange(newIsOpen);
    }
  }, [onOpenChange]);

  // Pre-renderizar iconos para usar en portal
  const arrowBackIconRef = usePrerenderedIcon('navigation/arrow-back', 'sm');
  const closeIconRef = usePrerenderedIcon('navigation/close', 'sm');

  // Detectar viewport mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile, { passive: true });

    return () => {
      window.removeEventListener('resize', checkMobile, { passive: true });
    };
  }, []);
  // Filter cities basándose en searchQuery (memoized)
  const filteredCities = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return cities || [];

    return (cities || []).filter((city) => (
      city.name.toLowerCase().includes(query)
      || city.iataCityCode.toLowerCase().includes(query)
      || city.country.toLowerCase().includes(query)
    ));
  }, [cities, searchQuery]);

  // Handlers (useCallback para estabilidad)
  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    }

    // Solo cerrar automáticamente en modo NO controlado
    // En modo controlado, el padre maneja el estado
    if (isOpenProp === undefined) {
      setIsOpenState(false);
      setSearchQuery('');
      setFocusedIndex(-1);
    }
  }, [onBack, isOpenProp, setIsOpenState]);

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    }

    if (isOpenProp === undefined) {
      setIsOpenState(false);
      setSearchQuery('');
      setFocusedIndex(-1);
    }
  }, [onClose, isOpenProp, setIsOpenState]);

  // Cerrar dropdown/modal al hacer click fuera (solo desktop)
  useEffect(() => {
    const handleClickOutside = (event) => {
      // En mobile, el modal tiene botones propios de cierre
      if (isMobile) return;

      // En desktop, cerrar si click es fuera del dropdown
      if (
        dropdownRef.current
        && !dropdownRef.current.contains(event.target)
        && triggerRef.current
        && !triggerRef.current.contains(event.target)
      ) {
        setIsOpenState(false);
        setSearchQuery('');
        setFocusedIndex(-1);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, isMobile, handleClose, setIsOpenState]);

  // Focus input cuando se abre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Detectar si la lista desktop tiene scrollbar (pr-4 cuando no hay scroll, pr-[4px] cuando hay scroll)
  useEffect(() => {
    if (!isOpen || isMobile || !desktopListRef.current || filteredCities.length === 0) {
      setDesktopListHasScrollbar(false);
      return () => {};
    }
    const el = desktopListRef.current;
    const checkScrollbar = () => {
      setDesktopListHasScrollbar(el.scrollHeight > el.clientHeight);
    };
    checkScrollbar();
    const ro = new ResizeObserver(checkScrollbar);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isOpen, isMobile, filteredCities.length]);

  // Handlers (useCallback para estabilidad)
  const handleToggle = useCallback(() => {
    if (disabled) return;

    // Abrir si está cerrado
    if (!isOpen) {
      setIsOpenState(true);
    }
  }, [disabled, isOpen, setIsOpenState]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Tab') {
      tabKeyPressedRef.current = true;
      return;
    }

    // Open dropdown on Enter, Space, or any printable character
    if (!disabled) {
      // Check if it's a printable character (length 1) or Enter/Space
      const isPrintableChar = e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
      const isActionKey = e.key === 'Enter' || e.key === ' ';

      if (isPrintableChar || isActionKey) {
        if (!isOpen) {
          setIsOpenState(true);
        }
      }
    }
  }, [disabled, isOpen, setIsOpenState]);

  const handleFocus = useCallback(() => {
    if (isOpenProp === undefined && !isOpen) {
      setIsOpenState(true);
    }
    // Only show keyboard focus ring if Tab key was pressed
    if (tabKeyPressedRef.current) {
      tabKeyPressedRef.current = false;
    }
  }, [isOpen, isOpenProp, setIsOpenState]);

  const handleBlur = useCallback(() => {
    tabKeyPressedRef.current = false;

    // NO auto-cerrar cuando está en modo controlado
    if (isOpenProp === undefined && !isMobile) {
      setTimeout(() => {
        setIsOpenState(false);
        setSearchQuery('');
        setFocusedIndex(-1);
      }, BLUR_DELAY);
    }
  }, [isMobile, isOpenProp, setIsOpenState]);

  const handleCitySelect = useCallback((city) => {
    // 1. Notificar cambio al padre
    if (onChange) {
      onChange(city);
    }

    // 2. Solo cerrar automáticamente en modo NO controlado
    if (isOpenProp === undefined) {
      setIsOpenState(false);
      setSearchQuery('');
      setFocusedIndex(-1);
    } else {
      // En modo controlado, solo limpiar búsqueda
      setSearchQuery('');
      setFocusedIndex(-1);
    }
  }, [onChange, isOpenProp, setIsOpenState]);

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
    setFocusedIndex(-1); // Reset focus on new search
    
    // Ensure dropdown is open when typing
    if (!isOpen && isOpenProp === undefined) {
      setIsOpenState(true);
    }
  }, [isOpen, isOpenProp, setIsOpenState]);

  // Keyboard navigation (only when dropdown is open)
  const handleDropdownKeyDown = useCallback((e) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        handleClose();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = prev + 1;
          return next < filteredCities.length ? next : prev;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = prev - 1;
          return next >= 0 ? next : -1;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filteredCities.length) {
          handleCitySelect(filteredCities[focusedIndex]);
        }
        break;
      default:
        break;
    }
  }, [isOpen, handleClose, filteredCities, focusedIndex, handleCitySelect]);

  // Highlight matching text (memoized)
  const highlightMatch = useCallback((text, searchTerm) => {
    if (!searchTerm) return text;

    const index = text.toLowerCase().indexOf(searchTerm.toLowerCase());
    if (index === -1) return text;

    const before = text.slice(0, index);
    const match = text.slice(index, index + searchTerm.length);
    const after = text.slice(index + searchTerm.length);

    return html`${before}<strong>${match}</strong>${after}`;
  }, []);

  // Render city item (memoized)
  const renderCityItem = useCallback((city, index) => {
    const isSelected = value && value.iataCityCode === city.iataCityCode;
    const isItemFocused = focusedIndex === index;

    return html`
      <button
        id=${`city-option-${index}`}
        key=${city.id || city.iataCityCode}
        type="button"
        class="
          w-full p-4 text-left cursor-pointer transition-[background-color]
          min-h-[81px]
          ${isItemFocused ? 'bg-background-card-lighter' : 'bg-background-brand-secondary-default'}
          ${isSelected ? 'bg-background-brand-primary-lighter relative' : ''}
          hover:bg-[var(--bg-hover-light)] group
          focus-visible:border-[var(--color-border-stroke-focus)] focus-visible:outline-none focus-visible:border-2
          active:bg-[var(--state-hover-darken)] active:text-[var(--text-brand-light)]
          border-b border-border-stroke-default
        "
        onClick=${() => handleCitySelect(city)}
        onKeyDown=${handleKeyDown}
        role="option"
        aria-selected=${isSelected}
      >
        ${isSelected && html`
          <div class="h-9 w-[4px] bg-[var(--green-primary)] absolute left-0 top-0 bottom-0 my-auto" aria-hidden="true"></div>
        `}
        <div class="flex flex-col gap-[4px]">
          <!-- Primera fila: Ciudad, País y Código IATA -->
          <div class="flex justify-between items-center">
            <div class="flex-1 text-base leading-6 text-text-normal-primary group-active:text-text-normal-lighter">
              ${searchQuery ? highlightMatch(`${city.name}, ${city.country}`, searchQuery) : `${city.name}, ${city.country}`}
            </div>
            <div class="text-sm leading-5 text-text-normal-primary group-active:text-text-normal-lighter">
              ${searchQuery ? highlightMatch(city.iataCityCode, searchQuery) : city.iataCityCode}
            </div>
          </div>
          <!-- Segunda fila: Terminal -->
          <div class="text-sm leading-5 text-text-normal-secondary min-h-[21px] group-active:text-text-normal-lighter">
            ${city.terminal}
          </div>
        </div>
      </button>
    `;
  }, [value, focusedIndex, handleCitySelect, searchQuery, highlightMatch]);

  // Display value
  const displayValue = useMemo(
    () => (value ? `${value.name} (${value.iataCityCode})` : ''),
    [value],
  );

  // Determine if label should float
  const shouldFloat = useMemo(
    () => value || isOpen || searchQuery,
    [value, isOpen, searchQuery],
  );

  // Determine actual state (similar to Input component)
  const actualState = useMemo(
    () => (disabled ? 'disabled' : 'normal'),
    [disabled],
  );

  const isInteractive = useMemo(
    () => !disabled,
    [disabled],
  );

  // State-based styling classes (similar a Input component)
  const stateClasses = {
    normal: 'outline outline-1 outline-offset-[-1px] outline-neutral-400',
  };

  const labelStateClasses = {
    normal: 'text-text-normal-secondary',
  };

  // Pre-calculated container classes (memoized)
  const containerClasses = useMemo(() => {
    // Border radius según variant
    // Para grouped: solo redondear esquinas SUPERIORES para que la línea verde
    // al fondo no se recorte por overflow-hidden + border-radius inferior
    let borderRadiusClass = 'rounded-lg';
    if (variant === 'grouped-first') {
      borderRadiusClass = 'rounded-t-lg rounded-b-none';
    } else if (variant === 'grouped-last') {
      borderRadiusClass = 'rounded-none';
    } else if (variant === 'grouped-left') {
      borderRadiusClass = 'rounded-tl-lg';
    } else if (variant === 'grouped-right') {
      borderRadiusClass = 'rounded-tr-lg';
    }

    // Solo aplicar outline cuando es standalone (grouped ya tiene outline en contenedor padre)
    const outlineClass = variant === 'standalone' ? stateClasses[actualState] : '';

    // En grouped mode, el padre ya tiene bg-background-input-default,
    // así el trigger puede ser transparente y no se escapa fondo por las esquinas
    const isGrouped = variant !== 'standalone';
    const bgClass = isGrouped ? '' : 'bg-background-input-default';

    return `
      flex flex-col w-full group/trigger overflow-hidden
      ${borderRadiusClass}
      ${bgClass}
      ${outlineClass}
      transition-all duration-[var(--transition-normal)]
      ${isInteractive ? 'cursor-text' : ''}
    `.trim();
  }, [actualState, isInteractive, stateClasses, variant]);

  // Clases de la línea verde: ancho, alineamiento y border-radius
  // Para grouped: calc(100% - 4px) centrado + border-radius en esquinas
  // que coinciden con el contenedor padre (rounded-[8px])
  const greenLineClasses = useMemo(() => {
    switch (variant) {
      case 'grouped-left':
        return 'w-[calc(100%-4px)] self-center rounded-bl-lg';
      case 'grouped-right':
        return 'w-[calc(100%-4px)] self-center rounded-br-lg';
      case 'grouped-last':
        return 'w-[calc(100%-4px)] self-center rounded-b-lg';
      default:
        return 'w-full';
    }
  }, [variant]);

  return html`
    <div
      class=${`${containerRelative ? 'relative' : ''} ${customClassName}`}
      data-name="citySelector"
      ref=${containerRef}
      onKeyDown=${handleKeyDown}
      ...${rest}
    >
      <!-- Trigger + Error wrapper (relative for error positioning without affecting layout) -->
      <div class="relative">
      <!-- Trigger Input Container (flex-col: content row + green line) -->
      <div
        ref=${triggerRef}
        onClick=${handleToggle}
        class=${containerClasses}
      >
        <!-- Content Row -->
        <div class="flex items-center gap-2 w-full h-[50px] lg2:h-[52px] px-4">
          <span class="flex-shrink-0 flex items-center" aria-hidden="true">
            <${Icon} icon=${iconInputName} size="m" customClassName=${iconInputName === 'action/plane' ? '[&_svg]:pt-[3.33px] [&_svg]:pb-[1.28px] [&_svg]:pl-[0.42px] [&_svg]:pr-[2.31px]' : ''}/>
          </span>

          <div class="relative flex-1 flex items-center min-h-full">
              ${label && html`
                <label
                  for=${`${label}-input`}
                  class=${`
                    
                    pointer-events-none
                    transition-all duration-200 ease-in-out
                    font-[var(--font-weight-regular)] tracking-[var(--letter-spacing-normal)]
                    ${labelStateClasses[actualState]}
                    ${shouldFloat
    ? 'absolute top-[7px] text-xs leading-[16px] left-0'
    : 'text-sm leading-5'}
                    ${!isMobile && hasError ? '!text-[var(--alert-error-icon-bg)]' : ''}
                  `}
                >
                  ${label}
                </label>
              `}

              <!-- Content (Input Field) -->
              <div class="flex-1 flex flex-col justify-center min-w-0">
                <!-- Desktop: Input único con estados manejados por clases -->
                ${!isMobile && html`
                  <input
                    ref=${inputRef}
                    id=${`${label}-input`}
                    type="text"
                    value=${isOpen ? searchQuery : displayValue}
                    placeholder=${shouldFloat ? placeholder : ''}
                    onInput=${handleSearchChange}
                    onFocus=${handleFocus}
                    onBlur=${handleBlur}
                    onKeyDown=${handleDropdownKeyDown}
                    autocomplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    class=${`
                      w-full bg-transparent !border-0 !outline-none p-0 text-ellipsis cursor-text
                      !text-base leading-5
                      ${shouldFloat ? 'relative top-2 !font-[var(--font-weight-bold)] h-[20px]' : 'absolute inset-0 opacity-0 cursor-pointer'}
                      text-text-normal-primary
                    `}
                    role="combobox"
                    aria-label=${label || 'Buscar ciudad'}
                    aria-expanded=${isOpen}
                    aria-haspopup="listbox"
                    aria-autocomplete="list"
                    aria-activedescendant=${focusedIndex >= 0 ? `city-option-${focusedIndex}` : ''}
                    aria-controls="city-listbox"
                  />
                `}

                <!-- Mobile: Solo mostrar valor seleccionado -->
                ${isMobile && value && !isOpen && html`
                  <div
                    class="relative top-2 left-[2px] text-text-normal-primary font-[var(--font-weight-bold)] text-base leading-5"
                  >
                    ${displayValue}
                  </div>
                `}
              </div>
              <!-- End Content -->
          </div>
        </div>
        <!-- End Content Row -->

        <!-- Bottom line: red when error, green on hover/focus when no error -->
        <div class=${`h-[3px] ${greenLineClasses} transition-colors duration-[var(--transition-normal)] ${hasError && !isMobile ? 'bg-[var(--alert-error-border)]' : 'bg-transparent group-hover/trigger:bg-border-input-positive group-focus-within/trigger:bg-border-input-positive'}`} aria-hidden="true"></div>
      </div>

      <!-- Error message (absolute: floats below trigger without affecting layout) -->
      ${showErrorMessage && !isMobile && hasError && html`
        <div class="absolute top-full left-0 min-h-[21px] flex items-start mt-[4px] font-normal text-sm leading-5 text-[var(--alert-error-icon-bg)]">
          <svg
            class="w-4 h-4 mr-1 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <circle cx="10" cy="10" r="9" fill="currentColor" />
            <text x="10" y="14" text-anchor="middle" fill="white" font-size="12" font-weight="bold">i</text>
          </svg>
          <span>${i18n['bookingBox.labels.requiredField'] || 'This field is required'}</span>
        </div>
      `}
      </div>
      <!-- End Trigger + Error wrapper -->

      <!-- Desktop Popup (sin input de búsqueda - ya está en trigger) -->
      ${isOpen && !isMobile && html`
        <div
          class=${`absolute ${positionDropdownStyles} px-4 py-6 pr-0  bg-background-card-lighter rounded-[24px]  max-h-[376px] min-h-[376px] max-w-[${DROPDOWN_MAX_WIDTH}] min-w-[${DROPDOWN_MAX_WIDTH}] overflow-hidden z-50 flex flex-col`}
          ref=${dropdownRef}
          role="listbox"
          aria-label=${label || 'Lista de ciudades'}
        >
        ${filteredCities.length > 0 && !isLoading ? html`
          <div class="self-stretch justify-start text-text-normal-secondary text-base font-bold">${i18n['bookingBox.labels.results'] || 'Resultados'}</div>
        ` : ''}
          <!-- Cities List -->
          <div ref=${desktopListRef} class=${`flex-1 overflow-y-auto ${desktopListHasScrollbar ? 'pr-[4px]' : 'pr-4'}`}>
            ${filteredCities.length > 0 && !isLoading ? html`
                ${filteredCities.map((city, index) => renderCityItem(city, index))}
            ` : html`
                ${!isLoading ? html`
                  <div class="px-4 py-3 text-[var(--brand-primary)] border-b border-border-stroke-default text-base leading-[normal]">
                    ${i18n['bookingBox.labels.noResultsFound'] || 'No se encontraron ciudades'}
                  </div>
                ` : ''}
            `}
          </div>
        </div>
      `}

      <!-- Mobile Modal -->
      ${isOpen && isMobile && html`
      <div class="fixed inset-0 bg-background-card-lighter z-[700] flex flex-col max-w-[100vw] min-h-svh">
        <!-- Header (condicional - solo si showHeader=true) -->
        ${showHeader && html`
          <div class="px-[var(--spacing-medium)] py-[var(--spacing-x-large)] flex items-center justify-between">
            <!-- Back Button -->
            <button
              type="button"
              class="hover:opacity-60 transition-opacity duration-[var(--transition-fast)]"
              onClick=${handleBack}
              aria-label="Volver"
            >
              ${arrowBackIconRef.current && html`<div class="flex" dangerouslySetInnerHTML=${{ __html: arrowBackIconRef.current.innerHTML }} />`}
            </button>

            <!-- Title -->
            <h2
              class="!text-[18px] font-bold text-[var(--color-text-normal-primary)] min-h-[24px]"
            >
              ${actualStepTitle}
            </h2>

            <!-- Close Button -->
            <button
              type="button"
              class="hover:opacity-60 transition-opacity duration-[var(--transition-fast)]"
              onClick=${handleClose}
              aria-label="Cerrar"
            >
              ${closeIconRef.current && html`<div class="flex" dangerouslySetInnerHTML=${{ __html: closeIconRef.current.innerHTML }} />`}
            </button>
          </div>
        `}

        <!-- Content -->
        <div class="overflow-hidden flex-1 px-[var(--spacing-x-x-large)] pt-[var(--spacing-medium)] pb-0 flex flex-col ">
          <!-- Search Input (flex-col: content row + green line) -->
          <div
            class="flex flex-col w-full bg-background-input-default rounded-lg overflow-hidden transition-all duration-[var(--transition-normal)]
            outline outline-neutral-400 group/mobileInput min-h-[53px]
            ${isInteractive ? 'cursor-text' : ''}"
          >
            <!-- Content Row -->
            <!-- mobile input -->
            <div class="flex items-center gap-2 w-full h-[50px] lg2:h-[52px] px-4 min-h-[50px] lg2:min-h-[52px]">
              <span class="flex-shrink-0 flex items-center" aria-hidden="true">
                <${Icon} icon=${iconInputName} size="m" customClassName=${iconInputName === 'action/plane' ? '[&_svg]:pt-[3.33px] [&_svg]:pb-[1.28px] [&_svg]:pl-[0.42px] [&_svg]:pr-[2.31px]' : ''}/>
              </span>
              <div class="relative flex-1 flex items-center min-h-full">
              <!-- Floating Label -->
                ${label && html`
                  <label
                    for=${`${label}-input`}
                    class=${`
                      pointer-events-none
                      transition-all duration-200 ease-in-out
                      font-[var(--font-weight-regular)] tracking-[var(--letter-spacing-normal)]
                      ${labelStateClasses[actualState]}
                      ${shouldFloat
    ? 'absolute top-[7px] text-xs leading-[16px] left-0]'
    : 'text-sm leading-5'}
                    `}
                  >
                    ${label}
                  </label>
                `}

                <!-- Content (Input Field) -->
                <div class="flex-1 flex flex-col justify-center min-w-0">
                  <input
                    ref=${inputRef}
                    type="text"
                    value=${searchQuery}
                    placeholder=${shouldFloat ? placeholder : ''}
                    onInput=${handleSearchChange}
                    onKeyDown=${handleDropdownKeyDown}
                    onFocus=${handleFocus}
                    onBlur=${handleBlur}
                    autocomplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    class=${`
                      w-full bg-transparent !border-0 !outline-none p-0 text-ellipsis cursor-text
                      !text-base leading-5
                      ${shouldFloat ? 'relative top-2 !font-[var(--font-weight-bold)] h-[20px]' : 'absolute inset-0 opacity-0 cursor-pointer'}
                      text-text-normal-primary
                    `}
                    role="combobox"
                    aria-label=${label || 'Buscar ciudad'}
                    aria-expanded="true"
                    aria-haspopup="listbox"
                    aria-autocomplete="list"
                    aria-activedescendant=${focusedIndex >= 0 ? `city-option-${index}` : ''}
                    autoFocus
                  />
                </div>
                <!-- End Content -->
              </div>
            </div>
            <!-- End Content Row -->

            <!-- Green bottom line (straight, inside borders, no border-radius) -->
            <div class="w-full h-[3px] bg-transparent transition-colors duration-[var(--transition-normal)] group-hover/mobileInput:bg-border-input-positive group-focus-within/mobileInput:bg-border-input-positive" aria-hidden="true"></div>
          </div>

          ${filteredCities.length > 0 && !isLoading ? html`
            <div class="self-stretch justify-start text-text-normal-secondary text-base font-bold mt-[16px]">${i18n['bookingBox.labels.results'] || 'Resultados'}</div>
          ` : ''}
          ${filteredCities.length > 0 && !isLoading ? html`
            <div class="overflow-y-auto">
              ${filteredCities.map((city, index) => renderCityItem(city, index))}
            </div>
          ` : html`
                ${!isLoading ? html`
                  <div class="px-4 py-3 text-[var(--brand-primary)] border-b border-border-stroke-default text-base leading-[normal] mt-2">
                    ${i18n['bookingBox.labels.noResultsFound'] || 'No se encontraron ciudades'}
                  </div>
                ` : ''}
          `}
        </div>
      </div>
    `
}
    </div>
  `;
};

export default CitySelector;
