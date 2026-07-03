import { h } from '@dropins/tools/preact.js';
import {
  useState, useRef, useEffect, useCallback, useMemo,
} from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { DateInput } from '../../atoms/date-input/date-input.js';
import { CalendarMonth } from '../calendar-month/calendar-month.js';
import { PriceIndicator } from '../../atoms/price-indicator/price-indicator.js';
import { Icon } from '../../atoms/icon/icon.js';
import {
  getToday,
  getMaxBookingDate,
  getMonthsToRender,
  formatDate,
  getCheapestPrices,
  getCheapestPricesOutbound,
} from '../date-range-picker/date-range-picker.service.js';
import { CarouselNavigationButton } from '../../atoms/carousel-navigation-button/carousel-navigation-button.js';
import { WeekdayHeader } from '../../atoms/weekday-header/weekday-header.js';
import { TripTypeToggle } from '../../atoms/trip-type-toggle/trip-type-toggle.js';

const html = htm.bind(h);

// Constants
const MOBILE_BREAKPOINT = 768;
const MONTHS_TO_NAVIGATE = 2;

/**
 * Feature flag controlling return-month filtering behaviour.
 *
 * When enabled, the calendar in `mode="return"` will restrict the
 * visible/selectable months based on the chosen departure date
 * (e.g., only allowing return months on/after the departure month).
 *
 * This is intentionally `false` by default so the component shows the
 * full range of months while the feature is validated/rolled out.
 */
const RESTRICT_RETURN_START_MONTH = false;

/**
 * DateSelector - Date selector with input + calendar popup
 *
 * ## Props
 * - `label`: `string` – Input label (e.g., "Departure", "Return").
 * - `value`: `Date | null` – Selected date.
 * - `onChange`: `function` – Callback when date is selected (receives date).
 * - `mode`: `"single" | "departure" | "return"` – Selector mode (default: "single").
 *   - `single`: Standalone selector
 *   - `departure`: Departure selector (affects minDate of return)
 *   - `return`: Return selector (minDate = departureDate)
 * - `departureDate`: `Date | null` – Departure date (only for mode="return").
 * - `returnDate`: `Date | null` – Return date (only to show range in mode="departure").
 * - `origin`: `string` – IATA code for origin (for pricing).
 * - `destination`: `string` – IATA code for destination (for pricing).
 * - `tripType`: `"RT" | "OW"` – Trip type (for pricing).
 * - `disabledDates`: `Array<string>` – Disabled dates from CMS.
 * - `variant`: `"standalone" | "grouped-left" | "grouped-right"` – Visual variant.
 * - `customClassName`: `string` – Additional CSS classes.
 * - `disabled`: `boolean` – If true, selector is disabled.
 * - `required`: `boolean` – If true, selector is required.
 * - `containerRelative`: `boolean` – If true, container has relative positioning (default: true).
 * - `isOpen`: `boolean` – Controlled open state (optional).
 * - `onOpenChange`: `function` – Callback when open state changes.
 * - `onClose`: `function` – Callback when closed (for BookingBox).
 * - `onBack`: `function` – Callback for back button in mobile.
 * - `showHeader`: `boolean` – Show header in mobile (default: true).
 * - `stepTitle`: `string` – Step title in mobile.
 * - `showPriceIndicator`: `boolean` – Show price indicator legend (default: true).
 * - `priceIndicatorText`: `string` – Text for price indicator (default: "Find the best price").
 * - `calendarTitle`: `string` – Title for desktop calendar popup.
 * - `onTripTypeChange`: `function` – Callback when trip type changes (for mobile toggle).
 * - `currentTripType`: `string` – Current trip type ('round-trip' | 'one-way') for mobile toggle.
 * - `startMonth`: `number | null` – Mes inicial para abrir calendario (0-11, optional).
 * - `startYear`: `number | null` – Año inicial para abrir calendario (optional).
 * - `restrictPrevNavigation`: `boolean` – Si true, deshabilita navegación previa
 *   cuando está en mes inicial (default: false).
 * - `...rest`: Other HTML props.
 *
 * ## Design (Figma)
 * - Node ID: 2742-3748 - DateInput
 * - Node ID: 2742-3893 - Calendar popup
 * - Node ID: 2742-4083 - Mobile modal
 *
 * ## Behavior
 * - **Desktop**: Absolute popup below input with 2 months side by side
 * - **Mobile**: Full-screen modal with months in vertical scroll
 * - **Pricing**: Automatic fetch when calendar opens
 * - **Month navigation**: Desktop prev/next arrows, mobile infinite scroll
 * - **Auto-close**: Closes when date is selected (single/departure),
 *   stays open in return until confirmed
 * - **Click outside**: Closes popup (desktop only)
 *
 * ## Usage Examples
 *
 * ### Departure selector
 * ```javascript
 * <${DateSelector}
 *   label="Departure"
 *   value=${departureDate}
 *   onChange=${setDepartureDate}
 *   mode="departure"
 *   returnDate=${returnDate}
 *   origin="BOG"
 *   destination="MAD"
 *   tripType="RT"
 * />
 * ```
 *
 * ### Return selector
 * ```javascript
 * <${DateSelector}
 *   label="Return"
 *   value=${returnDate}
 *   onChange=${setReturnDate}
 *   mode="return"
 *   departureDate=${departureDate}
 *   origin="BOG"
 *   destination="MAD"
 *   tripType="RT"
 * />
 * ```
 *
 * @example
 * <${DateSelector}
 *   label="Departure"
 *   value=${date}
 *   onChange=${setDate}
 * />
 */
export const DateSelector = ({
  label = '',
  value = null,
  onChange,
  mode = 'single',
  locale = 'es-CO',
  departureDate = null,
  returnDate = null,
  origin = '',
  destination = '',
  disabledDates = [],
  variant = 'standalone',
  customClassName = '',
  disabled = false,
  required = false,
  containerRelative = true,
  isOpen: isOpenProp,
  onOpenChange,
  onClose,
  onBack,
  onFieldSelect,
  showHeader = true,
  stepTitle,
  showPriceIndicator = true,
  priceIndicatorText,
  calendarTitle = '',
  onTripTypeChange,
  currentTripType = 'round-trip',
  desktopDropdownPositionStyles = 'absolute top-full left-0 right-0',
  departureHasError = false,
  returnHasError = false,
  showErrorMessage = true,
  startMonth = null,
  startYear = null,
  restrictPrevNavigation = false,
  i18n = {},
  ...rest
}) => {
  // ========== STATE ==========
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = isOpenProp !== undefined ? isOpenProp : internalIsOpen;

  // Initialize synchronously from the viewport width so the mobile step modal
  // (`isOpen && isMobile`) renders on the very first paint. Initializing to
  // false and flipping it in a post-mount effect left a frame where this
  // freshly-mounted selector's modal was absent, exposing the Home page behind
  // it during the destination→dates transition (booking-box bug #4).
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false,
  );
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [pricingData, setPricingData] = useState({});
  const [hoveredDate, setHoveredDate] = useState(null);
  const [hasScrolled, setHasScrolled] = useState(false);

  const containerRef = useRef(null);
  const popupRef = useRef(null);
  const monthRefs = useRef({});
  const scrollContainerRef = useRef(null);
  const isProgrammaticScrollRef = useRef(false);

  // ========== HELPERS ==========

  const setIsOpenState = useCallback((newIsOpen) => {
    setInternalIsOpen(newIsOpen);
    if (onOpenChange) {
      onOpenChange(newIsOpen);
    }
  }, [onOpenChange]);

  // ========== EFFECTS ==========

  // Detect mobile viewport
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

  // Update calendar position when startMonth/startYear change and selector is open
  // Also reset scroll state on each open so TripTypeToggle is visible on fresh open
  useEffect(() => {
    // Reset scroll state on open/close and whenever the anchor month changes, so a
    // scroll in one view doesn't keep the TripTypeToggle/swap hidden in the next
    // (bug #6). NOTE: this alone is not enough for the departure→return jump — the
    // return view auto-scrolls to the departure month, and those programmatic
    // scroll events can re-set hasScrolled; the auto-scroll effect below clears it
    // again once the animation settles.
    setHasScrolled(false);
    if (isOpen && startMonth !== null && startYear !== null) {
      setCurrentMonth(startMonth);
      setCurrentYear(startYear);
    }
  }, [isOpen, startMonth, startYear]);


  // Mobile: Auto-scroll to startMonth when calendar opens
  useEffect(() => {
    if (!isMobile || !isOpen || startMonth === null || startYear === null) return;

    // Use setTimeout to ensure DOM is fully rendered
    const timer = setTimeout(() => {
      const monthElement = monthRefs.current[`${startYear}-${startMonth}`];
      if (monthElement) {
        isProgrammaticScrollRef.current = true;
        monthElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Reset after smooth scroll animation completes (~600ms) so user scrolls are detected normally.
        // Also force hasScrolled back to false: the programmatic scroll can leak a
        // late scroll event past the ref guard, which would otherwise hide the
        // TripTypeToggle/swap on the return view even though the user never scrolled (bug #6).
        setTimeout(() => {
          isProgrammaticScrollRef.current = false;
          setHasScrolled(false);
        }, 700);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isMobile, isOpen, startMonth, startYear]);

  // Fetch pricing for a specific month
  const fetchPricingForMonth = useCallback(async (year, month) => {
    if (!origin || !destination) return;

    try {
      let prices = {};
      if (mode === 'return' && departureDate) {
        // Fetch return pricing with outboundDate
        const outboundDateStr = `${departureDate.getFullYear()}-${String(departureDate.getMonth() + 1).padStart(2, '0')}-${String(departureDate.getDate()).padStart(2, '0')}`;

        prices = await getCheapestPricesOutbound({
          origin,
          destination,
          outboundDate: outboundDateStr,
          year,
          month,
        });
      } else {
        const tripTypeCode = currentTripType === 'round-trip' ? 'RT' : 'OW';
        // Fetch departure pricing (or single)
        prices = await getCheapestPrices({
          origin,
          destination,
          year,
          month,
          tripType: tripTypeCode,
        });
      }

      setPricingData((prev) => ({ ...prev, ...prices }));
    } catch (error) {
      // Error fetching pricing - fail silently
    }
  }, [origin, destination, mode, departureDate]);

  useEffect(() => {
    setPricingData({});
  }, [origin, destination, mode]);

  // Fetch pricing when calendar opens (DESKTOP ONLY - loads current + next month)
  useEffect(() => {
    if (!isOpen || !origin || !destination || isMobile) return;

    const fetchDesktopPricing = async () => {
      try {
        // Fetch current month
        await fetchPricingForMonth(currentYear, currentMonth);

        // Fetch next month
        const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
        const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
        await fetchPricingForMonth(nextYear, nextMonth);
      } catch {
        // Error fetching pricing - fail silently
      }
    };

    fetchDesktopPricing();
  }, [isOpen, origin, destination, currentMonth, currentYear, isMobile, fetchPricingForMonth]);

  // Mobile: Initial load of first 2 months
  useEffect(() => {
    if (!isOpen || !origin || !destination || !isMobile) return;

    const fetchInitialMobilePricing = async () => {
      try {
        const today = getToday();

        // Fetch current month
        await fetchPricingForMonth(today.getFullYear(), today.getMonth());

        // Fetch next month
        const nextMonth = today.getMonth() === 11 ? 0 : today.getMonth() + 1;
        const nextYear = today.getMonth() === 11 ? today.getFullYear() + 1 : today.getFullYear();
        await fetchPricingForMonth(nextYear, nextMonth);
      } catch {
        // Error fetching pricing - fail silently
      }
    };

    fetchInitialMobilePricing();
  }, [isOpen, origin, destination, isMobile, fetchPricingForMonth]);

  // Mobile: IntersectionObserver for lazy loading pricing
  useEffect(() => {
    if (!isMobile || !isOpen) return undefined;

    const observerOptions = {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const { year, month } = entry.target.dataset;
          if (year && month) {
            fetchPricingForMonth(parseInt(year, 10), parseInt(month, 10));
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all month elements
    Object.values(monthRefs.current).forEach((ref) => {
      if (ref) {
        observer.observe(ref);
      }
    });

    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, [isMobile, isOpen, fetchPricingForMonth]);

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    }

    if (isOpenProp === undefined) {
      setIsOpenState(false);
    }
  }, [onClose, isOpenProp, setIsOpenState]);

  // Click outside detection (desktop only)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobile) return;

      if (
        popupRef.current
        && !popupRef.current.contains(event.target)
        && containerRef.current
        && !containerRef.current.contains(event.target)
      ) {
        setIsOpenState(false);
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
  }, [isOpen, isMobile]);

  // ========== HANDLERS ==========

  const handleOpen = useCallback(() => {
    if (disabled) return;

    setIsOpenState(true);

    // Set to startMonth/startYear if provided, otherwise today
    if (startMonth !== null && startYear !== null) {
      setCurrentMonth(startMonth);
      setCurrentYear(startYear);
    } else {
      const today = getToday();
      setCurrentMonth(today.getMonth());
      setCurrentYear(today.getFullYear());
    }
  }, [disabled, startMonth, startYear, setIsOpenState]);

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    }

    if (isOpenProp === undefined) {
      setIsOpenState(false);
    }
  }, [onBack, isOpenProp, setIsOpenState]);

  const handleDayClick = useCallback((date) => {
    if (onChange) {
      onChange(date);
    }

    // Auto-close only in single or departure mode
    // In return mode, stays open until user confirms or closes
    if (mode === 'single' || mode === 'departure') {
      if (isOpenProp === undefined) {
        setIsOpenState(false);
      }
    }
  }, [onChange, mode, isOpenProp, setIsOpenState]);

  const handlePrevMonth = useCallback(() => {
    const newDate = new Date(currentYear, currentMonth - MONTHS_TO_NAVIGATE, 1);
    setCurrentMonth(newDate.getMonth());
    setCurrentYear(newDate.getFullYear());
  }, [currentMonth, currentYear]);

  const handleNextMonth = useCallback(() => {
    const newDate = new Date(currentYear, currentMonth + MONTHS_TO_NAVIGATE, 1);
    setCurrentMonth(newDate.getMonth());
    setCurrentYear(newDate.getFullYear());
  }, [currentMonth, currentYear]);

  const handleDayHover = useCallback((date) => {
    // Only track hover in return mode with departure date selected
    if (departureDate && date && date > departureDate) {
      setHoveredDate(date);
    } else {
      setHoveredDate(null);
    }
  }, [mode, departureDate]);

  const handleScroll = useCallback((e) => {
    if (isProgrammaticScrollRef.current) return;
    const { scrollTop } = e.target;
    setHasScrolled(scrollTop > 0);
  }, []);

  // ========== COMPUTED VALUES ==========

  const displayValue = useMemo(
    () => (value ? formatDate(value) : ''),
    [value],
  );

  const actualStepTitle = useMemo(
    () => stepTitle || label || (i18n['bookingBox.labels.whenToFly'] || '¿Cuándo quieres volar?'),
    [stepTitle, label, i18n],
  );

  const today = useMemo(() => getToday(), []);

  const maxDate = useMemo(() => getMaxBookingDate(), []);

  // Validate if prev/next are disabled
  // restrictPrevNavigation=true: use startMonth/startYear as limit (for return selector)
  // restrictPrevNavigation=false: ALWAYS use current month as limit (for departure selector)
  // This ensures departure can't navigate to past months even when opened in future month
  const limitYear = useMemo(() => {
    if (restrictPrevNavigation && startYear !== null) {
      return startYear;
    }
    return today.getFullYear();
  }, [restrictPrevNavigation, startYear, today]);

  const limitMonth = useMemo(() => {
    if (restrictPrevNavigation && startMonth !== null) {
      return startMonth;
    }
    return today.getMonth();
  }, [restrictPrevNavigation, startMonth, today]);

  const isCurrentMonth = useMemo(
    () => currentYear === limitYear && currentMonth === limitMonth,
    [currentYear, limitYear, currentMonth, limitMonth],
  );

  // Disable "next" once the LAST visible month reaches the max booking month. The
  // desktop calendar shows two months (current + current+1) and navigates in steps of
  // MONTHS_TO_NAVIGATE (2), so we cap on `currentMonth + 1` (the right/last month) and
  // use a >= comparison, NOT exact equality: an exact `=== maxDate.getMonth()` check
  // could be skipped by the 2-month step (e.g. May -> July, skipping June), never
  // disabling navigation and letting the user scroll years past the 355-day limit.
  const isMaxMonth = useMemo(
    () => (currentYear * 12 + currentMonth + 1) >= (maxDate.getFullYear() * 12 + maxDate.getMonth()),
    [currentYear, maxDate, currentMonth],
  );

  // MinDate for return mode
  const minDate = useMemo(
    () => (mode === 'return' && departureDate ? departureDate : null),
    [mode, departureDate],
  );

  // Months for mobile scroll
  const monthsToRender = useMemo(() => {
    let months = getMonthsToRender();

    // Desktop only: If RESTRICT_RETURN_START_MONTH=true and in return mode with startMonth/startYear,
    // filter months to start from startMonth
    // Mobile: Render all months but auto-scroll to startMonth (controlled via useEffect above)
    if (RESTRICT_RETURN_START_MONTH && !isMobile && mode === 'return' && startMonth !== null && startYear !== null) {
      months = months.filter(({ year, month }) => {
        if (year < startYear) return false;
        if (year === startYear && month < startMonth) return false;
        return true;
      });
    }

    return months;
  }, [isMobile, mode, startMonth, startYear]);

  // Check if there's pricing data available
  const hasPricingData = useMemo(
    () => Object.keys(pricingData).length > 0,
    [pricingData],
  );

  // Determine if input has error based on mode
  const hasInputError = useMemo(
    () => (mode === 'return' ? returnHasError : departureHasError),
    [mode, returnHasError, departureHasError],
  );

  // ========== RENDER ==========
  return html`
    <div
      class=${`${containerRelative ? 'relative' : ''} flex ${customClassName}  group-container`}
      data-name="dateSelector"
      ref=${containerRef}
      ...${rest}
    >
      <!-- DateInput (Trigger) -->
      <${DateInput}
        label=${label}
        value=${displayValue}
        onClick=${handleOpen}
        variant=${variant}
        disabled=${disabled}
        required=${required}
        containerRelative=${true}
        hasError=${hasInputError}
        showErrorMessage=${showErrorMessage}
        active=${isOpen}
        i18n=${i18n}
      />

      <!-- Desktop Popup -->
      ${isOpen && !isMobile && html`
        <div
          class="mt-2 p-6 flex flex-col gap-[16px] bg-background-card-lighter w-max rounded-[16px] shadow-[0px_2px_20px_2px_rgba(73,73,73,0.25)] z-50 absolute ${desktopDropdownPositionStyles}"
          ref=${popupRef}
          role="dialog"
          aria-label=${i18n['bookingBox.aria.selectDate'] || 'Select date'}
        >
          <!-- Header with Title and Price Indicator -->
          <div class="flex font-normal justify-between">
            ${calendarTitle && html`
              <div class="font-bold text-[var(--text-normal-primary)] text-base min-h-[21px] leading-none">
                ${calendarTitle}
              </div>
            `}
            ${showPriceIndicator && hasPricingData && html`
              <${PriceIndicator} text=${priceIndicatorText || i18n['bookingBox.labels.findBestPrice'] || 'Encuentra el mejor precio'} />
            `}
          </div>

          <!-- Desktop: 2 months side by side -->
          <div class="flex gap-[68px] relative">
            <!-- Left: Prev Arrow -->
            <${CarouselNavigationButton}
              direction="left"
              onClick=${handlePrevMonth}
              disabled=${isCurrentMonth}
              absolute=${true}
              absoluteTop="top-[12px]"
              absoluteTranslate="translate-y-0"
              customClassName="shadow-calendar-nav"
            />
            
            <!-- Current month -->
            <${CalendarMonth}
              year=${currentYear}
              month=${currentMonth}
              departureDate=${mode === 'departure' || mode === 'return' ? departureDate : value}
              returnDate=${mode === 'return' ? value : returnDate}
              hoveredDate=${hoveredDate}
              onDayClick=${handleDayClick}
              onDayHover=${handleDayHover}
              pricingData=${pricingData}
              disabledDates=${disabledDates}
              minDate=${minDate}
              showRangeHighlight=${mode !== 'single'}
              customClassName="mb-[10px]"
              isFirstMonth=${true}
              locale=${locale}
            />

            <!-- Next month -->
            <${CalendarMonth}
              year=${currentMonth === 11 ? currentYear + 1 : currentYear}
              month=${currentMonth === 11 ? 0 : currentMonth + 1}
              departureDate=${mode === 'departure' || mode === 'return' ? departureDate : value}
              returnDate=${mode === 'return' ? value : returnDate}
              hoveredDate=${hoveredDate}
              onDayClick=${handleDayClick}
              onDayHover=${handleDayHover}
              pricingData=${pricingData}
              disabledDates=${disabledDates}
              minDate=${minDate}
              showRangeHighlight=${mode !== 'single'}
              customClassName="mb-[10px]"
              locale=${locale}
            />

            <!-- Right: Next Arrow -->
            <${CarouselNavigationButton}
              direction="right"
              onClick=${handleNextMonth}
              disabled=${isMaxMonth}
              absolute=${true}
              absoluteTop="top-[12px]"
              absoluteTranslate="translate-y-0"
              customClassName="shadow-calendar-nav"
            />
          </div>
        </div>
      `}

      <!-- Mobile Modal (Fixed Positioning - No Portal) -->
      ${isOpen && isMobile && html`
        <div class="fixed inset-0 bg-background-card-lighter z-[700] flex flex-col max-w-[100vw] min-h-svh">
          <!-- Header -->
          ${showHeader && html`
            <div class="px-[var(--spacing-medium)] py-[var(--spacing-x-large)] flex flex-col gap-3 bg-background-card-lighter z-10">
              <!-- Top Row: Back, Title, Close -->
              <div class="flex items-center justify-between">
                <!-- Back Button -->
                <button
                  type="button"
                  class="hover:opacity-60 transition-opacity duration-[var(--transition-fast)]"
                  onClick=${handleBack}
                  aria-label=${i18n['bookingBox.labels.back'] || 'Back'}
                >
                  <${Icon} icon="navigation/arrow-back" size="sm" />
                </button>

                <!-- Title -->
                <h2 class="font-bold !text-[18px] text-[var(--color-text-normal-primary)] min-h-[24px]">
                  ${actualStepTitle}
                </h2>

                <!-- Close Button -->
                <button
                  type="button"
                  class="hover:opacity-60 transition-opacity duration-[var(--transition-fast)]"
                  onClick=${handleClose}
                  aria-label=${i18n['bookingBox.labels.close'] || 'Close'}
                >
                  <${Icon} icon="navigation/close" size="sm" />
                </button>
              </div>
            </div>
          `}

          <!-- Trip Type Toggle -->
          ${onTripTypeChange && !hasScrolled && html`
            <div class="px-[var(--spacing-x-x-large)] pt-4 flex justify-center">
              <${TripTypeToggle}
                value=${currentTripType}
                onChange=${onTripTypeChange}
                i18n=${i18n}
              />
            </div>
          `}

          <!-- Date Inputs -->
          <!-- Tapping a field jumps to that sub-step (bug #5). The fields used to
               be inert (pointer-events-none, no onClick) so the only way to edit a
               date was by re-selecting it in the calendar. -->
          <div class="flex my-6 px-[var(--spacing-x-x-large)]">
            ${(mode === 'departure' || mode === 'return') && html`
              <div class="flex flex-1 items-center outline outline-offset-[-1px] outline-neutral-400 rounded-lg bg-background-input-default overflow-hidden">
                <${DateInput}
                  label=${i18n['bookingBox.labels.departure'] || 'Salida'}
                  value=${formatDate(departureDate, 'numeric')}
                  variant="grouped-left"
                  containerRelative=${false}
                  active=${mode === 'departure'}
                  hasError=${false}
                  showErrorMessage=${showErrorMessage}
                  onClick=${() => mode !== 'departure' && onFieldSelect && onFieldSelect('departure')}
                  i18n=${i18n}
                />

                <!-- Separador -->
                <div class="h-[34px] w-[1px] my-2 bg-[var(--color-border-input-default)] flex-shrink-0" aria-hidden="true"></div>

                <${DateInput}
                  label=${i18n['bookingBox.labels.return'] || 'Regreso'}
                  value=${formatDate(returnDate, 'numeric')}
                  variant="grouped-right"
                  containerRelative=${false}
                  active=${mode === 'return'}
                  hasError=${false}
                  showErrorMessage=${showErrorMessage}
                  onClick=${() => mode !== 'return' && onFieldSelect && onFieldSelect('return')}
                  i18n=${i18n}
                />
              </div>
            `}
            ${mode === 'single' && html`
              <${DateInput}
                label=${label}
                value=${formatDate(value, 'numeric')}
                variant="standalone"
                containerRelative=${false}
                active=${true}
                hasError=${false}
                showErrorMessage=${showErrorMessage}
                active=${isOpen}
                i18n=${i18n}
              />
            `}
          </div>

          <div class="px-[var(--spacing-x-x-large)] ${hasScrolled ? 'shadow-[0_4px_6px_-2px_rgba(90,90,90,0.2)]' : ''}">
            <!-- Price Indicator -->
            ${showPriceIndicator && hasPricingData && html`
              <div class="flex mb-6">
                <${PriceIndicator} text=${priceIndicatorText || i18n['bookingBox.labels.findBestPrice'] || 'Encuentra el mejor precio'} />
              </div>
            `}

            <${WeekdayHeader} locale=${locale}/>
          </div>

          <!-- Content (Vertical scroll of months) -->
          <div 
            ref=${scrollContainerRef}
            onScroll=${handleScroll}
            class="flex-1 pl-[var(--spacing-x-x-large)] pr-[10px] mr-[10px] pb-[var(--spacing-x-x-large)] overflow-y-auto overscroll-contain"
          >
            <!-- Months in vertical scroll -->
            ${monthsToRender.map(({ year: y, month: m }, index) => html`
              <div
                ref=${(el) => { monthRefs.current[`${y}-${m}`] = el; }}
                data-year=${y}
                data-month=${m}
                data-month-key=${`${y}-${m}`}
              >
                <${CalendarMonth}
                  key=${`${y}-${m}`}
                  year=${y}
                  month=${m}
                  departureDate=${mode === 'departure' || mode === 'return' ? departureDate : value}
                  returnDate=${mode === 'return' ? value : returnDate}
                  onDayClick=${handleDayClick}
                  onDayHover=${handleDayHover}
                  pricingData=${pricingData}
                  disabledDates=${disabledDates}
                  minDate=${minDate}
                  showRangeHighlight=${mode !== 'single'}
                  customClassName="my-2"
                  showWeekdayHeader=${false}
                  isFirstMonth=${index === 0}
                  locale=${locale}
                />
              </div>
            `)}
          </div>
        </div>
      `}
    </div>
  `;
};

export default DateSelector;
