import { h } from '@dropins/tools/preact.js';
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from '@dropins/tools/preact-hooks.js';
import htm from 'htm';

// Design System Components
import { Button } from '../../atoms/button/button.js';
import { TripTypeToggle } from '../../atoms/trip-type-toggle/trip-type-toggle.js';
import { ActionButton } from '../../atoms/action-button/action-button.js';
import { TopActionButtons } from '../../molecules/top-action-buttons/top-action-buttons.js';
import { OriginDestinationSelector } from '../../molecules/origin-destination-selector/origin-destination-selector.js';
import { DateRangePicker } from '../../molecules/date-range-picker/date-range-picker.js';
import { PassengerSelector } from '../../molecules/passenger-selector/passenger-selector.js';
import { Icon } from '../../atoms/icon/icon.js';
import { getStoredLanguage, getStoredCountry } from '../../../scripts/services/header/language-country-selector.js';
import { fetchAEMData } from '../../../scripts/utils/aem-data.js';
import gtmMartech from '../../../scripts/gtm-martech.js';

const html = htm.bind(h);

const getEndpointUrl = async () => {
  const config = await fetchAEMData('environment');
  return config.data.find((item) => item.Key === 'AV_BOOKINGBOX_CONTROLLER')?.Text ?? '';
};

const getFlightType = (origin, destination) => {
  if (!origin || !destination) return 'NA';
  return origin.countryId === destination.countryId ? 'Domestic' : 'International';
};

/**
 * BookingBox - Master flight search component with step-based flow
 *
 * ## Props
 * - `actionButtons`: `Array<ActionButtonConfig>` – Action buttons for top section (max 5).
 * - `defaultTripType`: `"round-trip" | "one-way"` – Initial trip type (default: `"round-trip"`).
 * - `defaultOrigin`: `CityOption | null` – Initial origin city.
 * - `defaultDestination`: `CityOption | null` – Initial destination city.
 * - `defaultDepartureDate`: `Date | null` – Initial departure date.
 * - `defaultReturnDate`: `Date | null` – Initial return date.
 * - `defaultPassengers`: `PassengerCounts` – Initial passenger count.
 * - `defaultCabinClass`: `"economy" | "business"` – Initial cabin class.
 * - `disabledDatesByRoute`: `Record<string, string[]>` – Disabled dates by route
 *   (e.g., {'BOG-MAD': ['2026-01-15']}).
 * - `onChange`: `(field: string, value: any) => void` – Callback when any value changes (tracking).
 * - `onStepOpen`: `(step: StepType) => void` – Callback when a step opens (tracking).
 * - `customClassName`: `string` – Additional CSS classes.
 *
 * @example
 * ```javascript
 * <${BookingBox}
 *   defaultTripType="round-trip"
 *   onChange=${(field, value) => console.log('Changed:', field, value)}
 * />
 * ```
 */
export const BookingBox = ({
  // CMS Configuration
  actionButtons = [],

  // Default Values
  defaultTripType = 'round-trip',
  defaultOrigin = null,
  defaultDestination = null,
  defaultDepartureDate = null,
  defaultReturnDate = null,
  defaultPassengers = {
    adults: 1,
    youth: 0,
    children: 0,
    infants: 0,
  },
  defaultCabinClass = 'economy',

  // Callbacks
  onChange,
  onStepOpen,

  // Styling
  customClassName = '',
  i18n = {},
  ...rest
}) => {
  // ========== FORM VALUES ==========
  const [tripType, setTripType] = useState(defaultTripType);
  const [origin, setOrigin] = useState(defaultOrigin);
  const [destination, setDestination] = useState(defaultDestination);
  const [departureDate, setDepartureDate] = useState(defaultDepartureDate);
  const [returnDate, setReturnDate] = useState(defaultReturnDate);
  const [passengers, setPassengers] = useState(defaultPassengers);
  const [cabinClass, setCabinClass] = useState(defaultCabinClass);

  // ========== UI STATE ==========
  const [activeStep, setActiveStep] = useState(null);
  const [routeSubStep, setRouteSubStep] = useState('origin'); // 'origin' | 'destination'
  const [dateSubStep, setDateSubStep] = useState('departure'); // 'departure' | 'return'
  const [validationErrors, setValidationErrors] = useState({});
  const [isSticky, setIsSticky] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false,
  );
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // ========== REFS ==========
  const bookingBoxRef = useRef(null);
  const sentinelRef = useRef(null);
  const observerRef = useRef(null);

  // ========== STEP ORDER ==========
  const STEP_ORDER = ['route', 'dates', 'passengers'];

  const getStepIndex = useCallback((step) => STEP_ORDER.indexOf(step), []);

  const getPreviousStep = useCallback((currentStep) => {
    const currentIndex = getStepIndex(currentStep);
    return currentIndex > 0 ? STEP_ORDER[currentIndex - 1] : null;
  }, [getStepIndex]);

  // ========== VALIDATION HELPERS ==========
  const isStepComplete = useCallback((step) => {
    switch (step) {
      case 'route':
        return origin !== null && destination !== null;
      case 'dates':
        if (tripType === 'one-way') {
          return departureDate !== null;
        }
        return departureDate !== null && returnDate !== null;
      case 'passengers':
        return passengers.adults >= 1;
      default:
        return false;
    }
  }, [origin, destination, tripType, departureDate, returnDate, passengers.adults]);

  const getFirstIncompleteStep = useCallback(
    () => STEP_ORDER.find((step) => !isStepComplete(step)) || null,
    [isStepComplete],
  );

  const validateAllFields = useCallback(() => {
    const errors = {};

    if (!origin) {
      errors.origin = true;
    }

    if (!destination) {
      errors.destination = true;
    }

    if (!departureDate) {
      errors.departureDate = true;
    }

    if (tripType === 'round-trip' && !returnDate) {
      errors.returnDate = true;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [origin, destination, departureDate, tripType, returnDate]);

  // ========== STEP FLOW HANDLERS ==========
  const openStep = useCallback((step) => {
    setActiveStep(step);
    setShowConfirmModal(false);
    if (onStepOpen) {
      onStepOpen(step);
    }
  }, [onStepOpen]);

  const closeStep = useCallback(() => {
    setActiveStep(null);
  }, []);

  // ========== FIELD HANDLERS ==========
  const handleTripTypeChange = useCallback((newTripType) => {
    setTripType(newTripType);

    if (onChange) {
      onChange('tripType', newTripType);
    }

    // Reset return date if switching to one-way
    if (newTripType === 'one-way') {
      setReturnDate(null);
      if (onChange) {
        onChange('returnDate', null);
      }
    }
  }, [onChange]);

  const handleRouteChange = useCallback(({ origin: newOrigin, destination: newDestination }) => {
    setOrigin(newOrigin);

    if (newDestination?.id && newOrigin?.id === newDestination.id) {
      setDestination(null);
    } else {
      setDestination(newDestination);
    }

    if (onChange) {
      onChange('origin', newOrigin);
      onChange('destination', newDestination);
    }

    // Clear validation errors
    setValidationErrors((prev) => {
      const updated = { ...prev };
      delete updated.origin;
      delete updated.destination;
      return updated;
    });
  }, [onChange]);

  const handleDateChange = useCallback(({ departure, return: returnD }) => {
    setDepartureDate(departure);
    setReturnDate(returnD);

    if (onChange) {
      onChange('departureDate', departure);
      onChange('returnDate', returnD);
    }

    // Clear validation errors
    setValidationErrors((prev) => {
      const updated = { ...prev };
      delete updated.departureDate;
      delete updated.returnDate;
      return updated;
    });

    // Auto-advance if dates complete
    const datesComplete = tripType === 'one-way'
      ? departure !== null
      : departure !== null && returnD !== null;

    if (datesComplete) {
      openStep('passengers');
    }
  }, [onChange, tripType, openStep]);

  const handlePassengerChange = useCallback((value) => {
    const { cabinClass: newCabinClass, ...newPassengers } = value;
    setPassengers(newPassengers);
    setCabinClass(newCabinClass);

    if (onChange) {
      onChange('passengers', newPassengers);
      onChange('cabinClass', newCabinClass);
    }

    if (isMobile) {
      const allStepsComplete = origin !== null
        && destination !== null
        && departureDate !== null
        && (tripType === 'one-way' || returnDate !== null)
        && newPassengers.adults >= 1;

      if (allStepsComplete) {
        setShowConfirmModal(true);
        closeStep();
      }
    }
  }, [onChange, isMobile, origin, destination, departureDate, tripType, returnDate, closeStep]);

  const handleBack = useCallback(() => {
    const prevStep = getPreviousStep(activeStep);
    if (prevStep) {
      openStep(prevStep);
    } else {
      closeStep();
    }
  }, [activeStep, getPreviousStep, openStep, closeStep]);

  const handleConfirmModalBack = useCallback(() => {
    setShowConfirmModal(false);
    openStep('passengers');
  }, [openStep]);

  const handleConfirmModalClose = useCallback(() => {
    setShowConfirmModal(false);
    closeStep();
  }, [closeStep]);

  const formatDateToDdMMM = useCallback((dateInput) => {
    const date = new Date(dateInput);

    const months = [
      'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
      'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
    ];

    const day = String(date.getDate()).padStart(2, '0');
    const month = months[date.getMonth()];

    return `${day}${month}`;
  }, []);

  const formatDateToYYYYMMDD = useCallback((dateInput) => {
    if (!dateInput) return 'NA';
    const date = new Date(dateInput);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }, []);

  const calculateDaysInAdvance = useCallback((futureDate) => {
    if (!futureDate) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const departure = new Date(futureDate);
    departure.setHours(0, 0, 0, 0);
    const diffTime = departure.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays : 0;
  }, []);

  // ========== SEARCH SUBMIT ==========
  const handleSearch = useCallback(async () => {
    if (!validateAllFields()) {
      const firstIncomplete = getFirstIncompleteStep();
      if (firstIncomplete) {
        openStep(firstIncomplete);
      }

      if (firstIncomplete === 'route') {
        if (!origin) {
          setRouteSubStep('origin');
        } else if (!destination) {
          setRouteSubStep('destination');
        }
      } else if (firstIncomplete === 'dates') {
        if (!departureDate) {
          setDateSubStep('departure');
        } else if (!returnDate) {
          setDateSubStep('return');
        }
      }
      return;
    }

    const payload = {
      cco: origin.iataCityCode,
      ccd: destination.iataCityCode,
      fi: formatDateToDdMMM(departureDate),
      ...(tripType !== 'round-trip' ? {} : { fr: formatDateToDdMMM(returnDate) }),
      na: passengers.adults,
      nn: passengers.children,
      ni: passengers.infants,
      jn: passengers.youth,
      lan: getStoredLanguage() || 'es',
      Pais: getStoredCountry() || 'CO',
      SistemaOrigen: 'AH',
      Device: 'Web',
    };

    const CONTROLLER_URL = await getEndpointUrl();
    const query = new URLSearchParams(payload).toString();
    const searchUrl = `${CONTROLLER_URL}?${query}`;

    // Track booking search event with callback to ensure it's sent before redirect
    gtmMartech.pushToDataLayer({
      event: 'search_flight',
      ecommerce: {
        search_term: `${origin.iataCityCode}-${destination.iataCityCode}`,
        page_location: window.location.href,
        page_referrer: document.referrer || 'NA',
        page_title: document.title,
        language: navigator.language.split('-')[0],
        screen_resolution: `${window.screen.width}x${window.screen.height}`,
        coupon: 'NA',
        event_category: 'AEM',
        adult_num: passengers.adults,
        child_num: passengers.children,
        infant_num: passengers.infants,
        trip_type: tripType === 'round-trip' ? 'RT' : 'OW',
        flight_type: getFlightType(origin, destination),
        flight_from: origin.iataTerminal || 'NA',
        flight_to: destination?.iataTerminal || 'NA',
        days_in_advance: calculateDaysInAdvance(departureDate),
        date_departure: formatDateToYYYYMMDD(departureDate),
        date_return: formatDateToYYYYMMDD(returnDate),
      },
      eventCallback: () => {
        window.location.href = searchUrl;
      },
      eventTimeout: 2000,
    });

    // Fallback redirect in case eventCallback doesn't fire
    setTimeout(() => {
      window.location.href = searchUrl;
    }, 2500);
  }, [
    validateAllFields,
    getFirstIncompleteStep,
    openStep,
    origin,
    destination,
    departureDate,
    tripType,
    returnDate,
    passengers,
    formatDateToDdMMM,
    formatDateToYYYYMMDD,
    calculateDaysInAdvance,
  ]);

  // ========== DESKTOP STICKY INTEGRATION ==========
  // Sticky only when header has fully hidden the box (next pixel after cover = sticky)
  const STICKY_HEADER_OFFSET_PX = 50; // same as md:top-[calc(var(--marquee-height,0px)+50px)]
  const SETUP_RETRY_MS = 80;
  const SETUP_RETRY_MAX = 25;

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const sentinelEl = sentinelRef.current;
    if (!sentinelEl) return undefined;

    const isDesktop = () => window.innerWidth >= 768;

    const getStickyRootMarginTop = () => {
      const marqueeHeightStr = getComputedStyle(document.documentElement)
        .getPropertyValue('--marquee-height')
        .trim();
      const marqueePx = Number.parseInt(marqueeHeightStr, 10) || 0;
      const headerBottom = marqueePx + STICKY_HEADER_OFFSET_PX;
      const boxHeight = bookingBoxRef.current?.offsetHeight ?? 0;
      // Trigger when bottom of box reaches header bottom: root top = headerBottom - boxHeight
      return { rootTop: headerBottom - boxHeight, boxHeight };
    };

    let observer = null;
    let retryCount = 0;
    let retryId = null;

    const setupObserver = () => {
      if (observer) {
        observer.disconnect();
        observer = null;
      }

      if (!isDesktop()) {
        setIsSticky(false);
        return;
      }

      const { rootTop, boxHeight } = getStickyRootMarginTop();

      // Don't create observer until we have a valid box height (ref may not be ready on first run)
      if (!bookingBoxRef.current || boxHeight <= 0) {
        if (retryCount < SETUP_RETRY_MAX) {
          retryCount += 1;
          retryId = setTimeout(setupObserver, SETUP_RETRY_MS);
        }
        return;
      }
      retryCount = 0;

      const rootMargin = rootTop > 0
        ? `-${rootTop}px 0px 0px 0px`
        : `${-rootTop}px 0px 0px 0px`;

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            setIsSticky(!entry.isIntersecting);
          });
        },
        {
          root: null,
          rootMargin,
          threshold: 0,
        },
      );

      observer.observe(sentinelEl);
      observerRef.current = observer;
    };

    const runSetup = () => {
      retryCount = 0;
      if (retryId) {
        clearTimeout(retryId);
        retryId = null;
      }
      requestAnimationFrame(() => {
        setupObserver();
      });
    };

    runSetup();

    const handleResize = () => {
      runSetup();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('header-template-ready', handleResize);
    window.addEventListener('header-resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('header-template-ready', handleResize);
      window.removeEventListener('header-resize', handleResize);
      if (retryId) clearTimeout(retryId);
      if (observer) {
        observer.disconnect();
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Detect viewport changes (mobile/desktop)
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleResize = () => {
      const newIsMobile = window.innerWidth < 768;
      if (newIsMobile !== isMobile) {
        setIsMobile(newIsMobile);
      }
    };

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isMobile]);

  // Block body scroll when any mobile modal/step is open (centralized)
  // This covers: route steps (city-selector), date steps (date-selector), and confirmation modal
  useEffect(() => {
    const shouldBlock = isMobile && (activeStep !== null || showConfirmModal);

    if (shouldBlock) {
      document.body.classList.add('!overflow-hidden');
    }

    return () => {
      document.body.classList.remove('!overflow-hidden');
    };
  }, [activeStep, showConfirmModal, isMobile]);

  // ========== OVERLAY BEHAVIOR ==========
  const shouldShowOverlay = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return activeStep !== null && window.innerWidth >= 768;
  }, [activeStep]);

  const handleOverlayClick = useCallback(() => {
    closeStep();
  }, [closeStep]);

  // ========== RESPONSIVE HELPERS ==========
  const shouldShowField = useCallback((field) => {
    // On desktop always show all fields
    if (!isMobile) return true;

    // On mobile, show progressively based on completed steps
    switch (field) {
      case 'dates':
        return isStepComplete('route');
      case 'passengers':
        return isStepComplete('route') && isStepComplete('dates');
      default:
        return false;
    }
  }, [isMobile, isStepComplete]);

  // ========== TAILWIND CLASSES ==========
  const stickyClasses = useMemo(
    () => (isSticky
      ? 'md:fixed md:top-[calc(var(--marquee-height,0px)+50px)] md:left-0 md:right-0 md:shadow-lg md:rounded-none shadow-[0px_2px_20px_2px_rgba(73,73,73,0.25)] py-5 px-8'
      : 'py-4 px-4 lg2:px-6 lg2:pt-5 lg2:pb-6 md:relative'),
    [isSticky],
  );

  const stickyGrid = useMemo(
    () => (isSticky
      ? 'md:grid-rows-[auto_auto] lg2:grid-rows-[auto] lg2:gap-y-0 max-w-[1248px] mx-auto md:relative'
      : 'md:grid-rows-[auto_auto_auto_auto] lg2:grid-rows-[auto_auto] lg2:gap-y-8'),
    [isSticky],
  );

  const layout = useMemo(
    () => (showConfirmModal && isMobile ? '' : 'shadow-[0px_0px_6px_0px_rgba(90,90,90,0.20)]'),
    [showConfirmModal, isMobile],
  );

  const finalClasses = useMemo(
    () => `${stickyClasses} ${layout} ${customClassName}`.trim(),
    [stickyClasses, layout, customClassName],
  );

  const someInputHasError = useMemo(
    () => !!(validationErrors?.origin
      || validationErrors?.destination
      || validationErrors?.departureDate
      || validationErrors?.returnDate),
    [validationErrors],
  );

  // ========== RENDER ==========
  return html`
    <div
      class="w-full ${showConfirmModal && isMobile ? 'fixed inset-0 bg-white z-[800] overflow-auto' : ''}"
      data-name="bookingBox"
      ...${rest}
    >
      <!-- Sentinel for IntersectionObserver -->
      <div ref=${sentinelRef} class="h-px w-full" aria-hidden="true"></div>

      <!-- Sticky placeholder: keeps layout space when booking box becomes fixed -->
      <div
        class=${`hidden md:block w-full pointer-events-none ${isSticky ? 'h-[290px]' : 'h-0'}`}
        aria-hidden="true"
      ></div>
      
      <!-- Overlay -->
      ${shouldShowOverlay() && html`
        <div
          class="booking-overlay fixed inset-0 bg-[var(--brand-primary)] opacity-70 z-[700] transition-opacity duration-[var(--transition-normal)] ease-in-out"
          onClick=${handleOverlayClick}
          aria-hidden="true"
        />
      `}

      ${showConfirmModal && isMobile && html`
          <!-- Header -->
          <div class="px-[16px] py-[24px] flex items-center justify-between">
            <button
              type="button"
              class="hover:opacity-60"
              onClick=${handleConfirmModalBack}
              aria-label=${i18n['bookingBox.aria.back'] || 'Regresar'}
            >
              <${Icon} icon="navigation/arrow-back" size="sm" />
            </button>
            <h2 class="!text-[18px] font-bold text-[var(--color-text-normal-primary)]">${i18n['bookingBox.labels.confirmSearch'] || 'Confirma tu búsqueda'}</h2>
            <button
              type="button"
              class="hover:opacity-60"
              onClick=${handleConfirmModalClose}
              aria-label=${i18n['bookingBox.aria.close'] || 'Cerrar'}
            >
               <${Icon} icon="navigation/close" size="sm" />
            </button>
          </div>
        `}

        <div ref=${bookingBoxRef} class="w-full rounded-4xl md:rounded-3xl bg-white z-[800] ${finalClasses} ${isSticky ? 'booking-box-sticky-enter' : ''}">
        <div class="grid w-full gap-4 md:gap-4 lg2:gap-3 md:col-span-full md:grid-cols-[auto_160px_minmax(117px,max-content)] lg2:grid-cols-[252px_auto_328px_160px_minmax(116px,max-content)] ${stickyGrid}">
            ${!isSticky && html`
                <div class="md:mb-2 lg2:mb-0 flex justify-center md:justify-start lg2:row-start-1 lg2:row-end-2 lg2:col-start-1 lg2:col-end-2">
                <${TripTypeToggle}
                    value=${tripType}
                    onChange=${handleTripTypeChange}
                    i18n=${i18n}
                />
                </div>
            `}

            <div class="lg2:row-start-2 md:col-span-full lg2:row-end-3 lg2:col-start-1 lg2:col-end-3 lg2:max-[560px] lg2:max-h-max">
            <${OriginDestinationSelector}
                origin=${origin}
                destination=${destination}
                onRouteChange=${handleRouteChange}
                activeStep=${activeStep === 'route' ? routeSubStep : null}
                onStepChange=${(step) => {
    if (step) {
      setRouteSubStep(step);
      if (activeStep !== 'route') {
        openStep('route');
      }
    } else {
      closeStep();
    }
  }}
    onRouteComplete=${() => {
    if (routeSubStep === 'destination') {
      openStep('dates');
      setDateSubStep('departure');
    }
  }}
                onClose=${closeStep}
                onBack=${handleBack}
                originDropdownPositionStyles="md:top-full lg2:top-[calc(100%+32px)] ${!isSticky ? 'lg2:left-[-24px]' : ''} ${someInputHasError ? 'lg2:top-[calc(100%+53px)]' : ''}"
                destinationDropdownPositionStyles="md:top-full lg2:top-[calc(100%+32px)] ${someInputHasError ? 'lg2:top-[calc(100%+53px)]' : ''}"
                originHasError=${validationErrors.origin}
                destinationHasError=${validationErrors.destination}
                i18n=${i18n}
            />
            </div>

            ${shouldShowField('dates') && html`
            <div class="lg2:row-start-2 lg2:row-end-3 lg2:col-start-3 lg2:col-end-4 lg2:max-h-max">
                <${DateRangePicker}
                mode=${tripType === 'round-trip' ? 'range' : 'single'}
                departureDate=${departureDate}
                returnDate=${returnDate}
                onDateChange=${handleDateChange}
                origin=${origin?.iataCityCode}
                destination=${destination?.iataCityCode}
                tripType=${tripType === 'round-trip' ? 'RT' : 'OW'}
                onTripTypeChange=${handleTripTypeChange}
                currentTripType=${tripType}
                activeStep=${activeStep === 'dates' ? dateSubStep : null}
                onStepChange=${(step) => {
    if (step) {
      setDateSubStep(step);
      openStep('dates');
    } else if (activeStep === 'dates') {
      closeStep();
    }
  }}
                onClose=${closeStep}
                onBack=${handleBack}
                departureDropdownPositionStyles="${isSticky ? 'top-[calc(100%+20px)]' : 'top-full'} md:left-0 lg2:left-auto lg2:right-0"
                returnDropdownPositionStyles="${isSticky ? 'top-[calc(100%+20px)]' : 'top-full'} md:left-0 lg2:left-auto lg2:right-0"
                departureRelative=${false}
                returnRelative=${false}
                departureHasError=${validationErrors.departureDate}
                returnHasError=${validationErrors.returnDate}
                i18n=${i18n}
                locale=${getStoredLanguage() || 'es'}
                />
            </div>
            `}

            ${shouldShowField('passengers') && html`
            <div class="lg2:row-start-2 lg2:row-end-3 lg2:col-start-4 lg2:col-end-5 lg2:max-h-max min-w-0">
                <${PassengerSelector}
                value=${{ ...passengers, cabinClass }}
                onChange=${handlePassengerChange}
                isOpen=${activeStep === 'passengers'}
                onOpenChange=${(open) => (open ? openStep('passengers') : closeStep())}
                onClose=${closeStep}
                onBack=${handleBack}
                dropdownPositionStyles="${isSticky ? 'top-[calc(100%+28px)]' : 'top-[calc(100%+8px)]'} right-0"
                containerRelative=${false}
                showCabinClass=${false}
                i18n=${i18n}
                />
            </div>
            `}

            <div class="mt-[8px] md:mt-0 lg2:row-start-2 lg2:row-end-3 lg2:col-start-5 lg2:col-end-6 lg2:max-h-max">
                <${Button}
                    variant="primary"
                    size="md"
                    onClick=${handleSearch}
                    customClassName="search-cta w-full md:w-auto"
                >
                    ${i18n['bookingBox.labels.search'] || 'Buscar'}
                </${Button}>
            </div>

            ${!isSticky && !showConfirmModal && html`
              <div class="overflow-hidden mt-[-2px] md:col-span-full md:mt-2 lg2:mt-0 lg2:row-start-1 lg2:row-end-2 lg2:col-start-2 lg2:col-end-6 lg2:max-h-max lg2:overflow-visible lg2:max-w-[920px] lg2:place-self-end lg2:w-full">
                <${TopActionButtons} customClassName="!justify-start lg2:!justify-end lg2:overflow-x-visible lg2:p-0">
                    ${actionButtons.map((btn) => html`
                    <${ActionButton}
                        key=${btn.label}
                        icon=${btn.icon}
                        label=${btn.text || btn.label}
                        href=${btn.href}
                        variant=${btn.variant || 'default'}
                        target=${btn.target || '_self'}
                    />
                    `)}
                </${TopActionButtons}>
              </div>
            `}
        </div>
        </div>
    </div>
  `;
};

export default BookingBox;
