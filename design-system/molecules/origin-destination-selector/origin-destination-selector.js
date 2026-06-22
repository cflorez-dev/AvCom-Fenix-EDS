import { h } from '@dropins/tools/preact.js';
import { useState, useEffect, useCallback, useMemo } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { CitySelector } from '../city-selector/city-selector.js';
import { SwapButton } from '../../atoms/swap-button/swap-button.js';
import {
  fetchCities,
  getDefaultOriginAiata,
  findDefaultOriginCity,
  resolveNextDestination,
} from './origin-destination-selector.service.js';
import {
  GEO_NEAREST_AIRPORT_REFRESHED_EVENT,
  SET_BOOKING_DESTINATION_EVENT,
  persistUserOriginSelection,
  clearUserOriginSelection,
} from '../../../scripts/utils/event-constants.js';

const html = htm.bind(h);

// Constants
const MOBILE_BREAKPOINT = 768;
const CITY_CONTAINER_CLASSES = 'flex-1';

/**
 * OriginDestinationSelector - Integrated origin and destination component with swap
 *
 * ## Props
 * - `origin`: `CityOption | null` – Selected origin city.
 * - `destination`: `CityOption | null` – Selected destination city.
 * - `onRouteChange`: `(route: { origin, destination }) => void` – Callback when route changes.
 * - `onRouteComplete`: `(route: { origin, destination }) => void` – Callback when both fields are complete (for auto-opening dates).
 * - `activeStep`: `"origin" | "destination" | null` – Active step controlled from parent (optional).
 * - `onStepChange`: `(step: "origin" | "destination" | null) => void` – Callback when active step changes.
 * - `autoOpenNext`: `boolean` – Auto-open destination after selecting origin (default: true).
 * - `disableSwap`: `boolean` – Disable swap button (default: false).
 * - `showHeader`: `boolean` – Show header in mobile step modal (default: true).
 * - `onBack`: `() => void` – Callback for back button (step modal).
 * - `onClose`: `() => void` – Callback to close step.
 * - `customClassName`: `string` – Additional CSS classes.
 * - `disabled`: `boolean` – If disabled (default: false).
 * - `...rest`: Other properties.
 *
 * ## Design (Figma)
 * - Desktop Horizontal: Origin + Swap (center) + Destination
 * - Mobile Vertical: Origin on top, Destination below, Swap on right
 *
 * ## Behavior
 * - **Auto-open destination**: After selecting origin (if autoOpenNext=true)
 * - **Exclude cities**: Origin cannot be destination and vice versa (automatic filtering)
 * - **Smart swap**: If one is empty after swap, auto-open that field
 * - **Step control**: Can be controlled (activeStep) or uncontrolled (internal useState)
 * - **Fetch cities**: Automatically fetches cities on load (with sessionStorage cache)
 *
 * ## Usage Example
 *
 * ```javascript
 * <${OriginDestinationSelector}
 *   origin=${origin}
 *   destination=${destination}
 *   onRouteChange=${({ origin, destination }) => {
 *     setOrigin(origin);
 *     setDestination(destination);
 *   }}
 *   onRouteComplete=${({ origin, destination }) => {
 *     setActiveStep('dates');
 *   }}
 *   activeStep=${activeStep}
 *   onStepChange=${setActiveStep}
 * />
 * ```
 *
 * ## Optimizations
 * - ⚡ Performance: useCallback for handlers, useMemo for exclude lists
 * - ♿ Accessibility: ARIA labels, keyboard navigation via CitySelector
 * - 🏆 Best practices: Controlled/uncontrolled state, cleanup effects, smart caching
 */
export const OriginDestinationSelector = ({
  origin = null,
  destination = null,
  onRouteChange,
  onRouteComplete,
  activeStep,
  onStepChange,
  autoOpenNext = true,
  disableSwap = false,
  showHeader = true,
  onBack,
  onClose,
  customClassName = '',
  disabled = false,
  originDropdownPositionStyles = '',
  destinationDropdownPositionStyles = '',
  originHasError = false,
  destinationHasError = false,
  skipAutoOrigin = false,
  i18n = {},
  ...rest
}) => {
  // Internal step state if not controlled
  const [internalActiveStep, setInternalActiveStep] = useState(null);
  const currentActiveStep = activeStep !== undefined ? activeStep : internalActiveStep;

  // State for cities fetched from service
  const [fetchedCities, setFetchedCities] = useState([]);
  const [filteredDestinations, setFilteredDestinations] = useState([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [citiesError, setCitiesError] = useState(null);

  // Auto-detect mobile viewport
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false,
  );

  // Resize listener to detect viewport changes
  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth < MOBILE_BREAKPOINT;
      if (newIsMobile !== isMobile) {
        setIsMobile(newIsMobile);
      }
    };

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isMobile]);

  // Fetch cities from API on component mount
  useEffect(() => {
    const loadCities = async () => {
      setIsLoadingCities(true);
      setCitiesError(null);

      try {
        const cities = await fetchCities({
          originCode: '',
          destinationCode: '',
        });

        setFetchedCities(cities);

        if (skipAutoOrigin) return;

        const defaultOriginAiata = await getDefaultOriginAiata();
        if (defaultOriginAiata && cities.length) {
          const defaultOrigin = findDefaultOriginCity(cities, defaultOriginAiata);

          if (defaultOrigin && onRouteChange) {
            onRouteChange({ origin: defaultOrigin, destination: destination ?? null });
          }
        }
      } catch (error) {
        console.error('Error loading cities:', error);
        setCitiesError(error.message || 'Error loading cities');
      } finally {
        setIsLoadingCities(false);
      }
    };

    loadCities();
  }, []); // Load only once on mount

  // Late-grant refresh: when W3C geolocation resolves after the lazy phase
  // (user accepted the prompt post-render), re-evaluate the default origin
  // so the booking box reflects the newly-detected nearest airport without
  // requiring a page reload.
  useEffect(() => {
    const handleRefresh = async () => {
      if (skipAutoOrigin) return;
      if (!fetchedCities.length) return;
      try {
        const newOriginAiata = await getDefaultOriginAiata();
        if (!newOriginAiata) return;
        const newOrigin = findDefaultOriginCity(fetchedCities, newOriginAiata);
        if (newOrigin && onRouteChange) {
          onRouteChange({ origin: newOrigin, destination: destination ?? null });
        }
      } catch (_) { /* swallow — best-effort refresh */ }
    };
    window.addEventListener(GEO_NEAREST_AIRPORT_REFRESHED_EVENT, handleRefresh);
    return () => {
      window.removeEventListener(GEO_NEAREST_AIRPORT_REFRESHED_EVENT, handleRefresh);
    };
  }, [fetchedCities, onRouteChange, destination, skipAutoOrigin]);

  // Load destinations when origin changes
  useEffect(() => {
    setFilteredDestinations([]);
    const loadDestinations = async () => {
      setIsLoadingCities(true);
      try {
        const destinationOptions = await fetchCities({
          // Combinability must be queried by the physical TERMINAL, not the
          // metropolitan city code. Multi-airport cities (e.g. Chicago: city
          // CHI / terminal ORD) return HTTP 404 when queried by city code, so
          // selecting them as origin would leave the destination list empty.
          // Single-airport cities have terminal === city, so this is a no-op
          // for them. Falls back to the city code defensively.
          originCode: origin.iataTerminal || origin.iataCityCode,
          destinationCode: '',
          useCache: false,
        });

        setFilteredDestinations(destinationOptions);
      } catch (error) {
        console.error('Error filtering destinations:', error);
        setFilteredDestinations([]);
      } finally {
        setIsLoadingCities(false);
      }
    };

    if (origin) {
      loadDestinations();
    }
  }, [origin]);

  // Handler for step change (stable with useCallback)
  const handleStepChange = useCallback((step) => {
    setInternalActiveStep(step);
    if (onStepChange) {
      onStepChange(step);
    }
  }, [onStepChange]);

  // Handler for origin selection
  const handleOriginSelect = useCallback((city) => {
    // PBI CU-189 CA4 regla 3: al cambiar de origen teniendo un destino, el destino
    // se limpia (el useEffect de `origin` recalcula las opciones disponibles).
    const nextDestination = resolveNextDestination(origin, city, destination);

    // PBI 1216373 rule 6.5 ("Usuario elige origen EN BOOKING BOX"):
    // the Booking Box is the ONE module authorized to persist the user's origin
    // choice into sessionStorage so it survives reloads and is read back as the
    // top-priority source by `getDefaultOriginAiata`. Clear the persisted entry
    // if the selection is empty so a stale value doesn't stick around.
    if (city?.iataCityCode) {
      persistUserOriginSelection({
        originIataCode: city.iataCityCode,
        originName: city.name || '',
      });
    } else {
      clearUserOriginSelection();
    }

    if (onRouteChange) {
      onRouteChange({ origin: city, destination: nextDestination });
    }

    // If route becomes complete → notify completion
    if (city && nextDestination && onRouteComplete) {
      onRouteComplete({ origin: city, destination: nextDestination });
    }

    // Auto-open destination (if autoOpenNext)
    if (autoOpenNext && city) {
      handleStepChange('destination');
    }
    // DO NOT close if no auto-open - let BookingBox control the flow
  }, [origin, onRouteChange, onRouteComplete, destination, autoOpenNext, handleStepChange]);

  // Handler for destination selection
  const handleDestinationSelect = useCallback((city) => {
    if (onRouteChange) {
      onRouteChange({ origin, destination: city });
    }

    // If route becomes complete → notify completion
    if (origin && city) {
      if (onRouteComplete) {
        onRouteComplete({ origin, destination: city });
      }
    }

    // DO NOT close automatically - let BookingBox control the flow
    // BookingBox will open 'dates' if route is complete
  }, [onRouteChange, onRouteComplete, origin]);

  // Listener: external request to set the destination from a promotional card.
  // Replaces the previous behavior of redirecting to a destination landing page.
  // The card click dispatches `SET_BOOKING_DESTINATION_EVENT` with an IATA code;
  // we resolve it against the cities we already loaded and reuse the same
  // selection handler the user would trigger manually.
  useEffect(() => {
    const handleSetDestination = (event) => {
      const { iataCode } = event.detail || {};
      if (!iataCode) return;
      const target = iataCode.toUpperCase();

      // Prefer destinations valid for the current origin; fall back to the
      // full city list if the origin filter hasn't been applied yet.
      const pool = filteredDestinations.length ? filteredDestinations : fetchedCities;
      if (!pool.length) return;

      const matched = pool.find(
        (c) => c.iataCityCode?.toUpperCase() === target
          || c.iataTerminal?.toUpperCase() === target,
      );
      if (!matched) return;

      handleDestinationSelect(matched);

      if (typeof document === 'undefined' || typeof window === 'undefined') return;

      // On desktop the booking box collapses into a sticky/fixed compact
      // bar once the user scrolls past it; only the origin/destination row
      // stays visible there. Scrolling back to the top of the page brings
      // the booking box to its expanded layout (origin, destination,
      // dates, passengers, search button) so the user lands on a full
      // form ready to submit.
      const reduceMotion = typeof window.matchMedia === 'function'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    };

    window.addEventListener(SET_BOOKING_DESTINATION_EVENT, handleSetDestination);
    return () => {
      window.removeEventListener(SET_BOOKING_DESTINATION_EVENT, handleSetDestination);
    };
  }, [filteredDestinations, fetchedCities, handleDestinationSelect]);

  // Handler for swap
  const handleSwap = useCallback(() => {
    if (disabled) return;

    // 1. Swap values (origin ↔ destination)
    const newOrigin = destination;
    const newDestination = origin;

    if (onRouteChange) {
      onRouteChange({
        origin: newOrigin,
        destination: newDestination,
      });
    }

    if (!newOrigin) {
      // Origin empty → open it
      handleStepChange('origin');
    } else if (!newDestination) {
      // Destination empty → open it
      handleStepChange('destination');
    }
  }, [disabled, onRouteChange, onRouteComplete, origin, destination, handleStepChange]);

  // Calculate if swap is disabled (memoized)
  // IMPORTANT: Swap should always work, even with both fields empty
  const isSwapDisabled = useMemo(
    () => disableSwap || disabled,
    [disableSwap, disabled],
  );

  // Handlers for CitySelector (open/close)
  const handleOriginOpenChange = useCallback((isOpen) => {
    handleStepChange(isOpen ? 'origin' : null);
  }, [handleStepChange]);

  const handleDestinationOpenChange = useCallback((isOpen) => {
    handleStepChange(isOpen ? 'destination' : null);
  }, [handleStepChange]);

  // Handler for back navigation (destination → origin, origin → close)
  const handleBackNavigation = useCallback(() => {
    if (currentActiveStep === 'destination') {
      // From destination → go back to origin
      handleStepChange('origin');
    } else if (currentActiveStep === 'origin') {
      // From origin → close completely
      handleStepChange(null);
      // If parent callback exists, call it
      if (onBack) {
        onBack();
      }
      // Fallback: call parent's onBack
    } else if (onBack) {
      onBack();
    }
  }, [currentActiveStep, handleStepChange, onBack]);

  // Handler for close (always closes completely)
  const handleCloseNavigation = useCallback(() => {
    handleStepChange(null);
    if (onClose) {
      onClose();
    }
  }, [handleStepChange, onClose]);

  // Layout classes (responsive) - Mobile first
  const containerClasses = useMemo(() => `
    ${customClassName}
  `.trim(), [customClassName]);

  return html`
    <div
      class=${`relative ${containerClasses}`}
      data-name="originDestinationSelector"
      ...${rest}
    >
      <!-- Grouped container with shared borders -->
      <div class="flex flex-col md:flex-row outline outline-1 outline-offset-[-1px] outline-[var(--color-border-default)] rounded-[8px] bg-background-input-default overflow-hidden">
        <!-- Origin -->
        <div class=${CITY_CONTAINER_CLASSES}>
          <${CitySelector}
            label=${i18n['bookingBox.labels.origin'] || 'Origen'}
            value=${origin}
            cities=${fetchedCities}
            onChange=${handleOriginSelect}
            isOpen=${currentActiveStep === 'origin'}
            onOpenChange=${handleOriginOpenChange}
            showHeader=${showHeader}
            onBack=${handleBackNavigation}
            onClose=${handleCloseNavigation}
            required
            iconInputName="action/plane"
            variant=${isMobile ? 'grouped-first' : 'grouped-left'}
            containerRelative=${false}
            positionDropdownStyles=${originDropdownPositionStyles}
            hasError=${originHasError}
            showErrorMessage=${false}
            i18n=${i18n}
            isLoading=${isLoadingCities}
            stepTitle=${i18n['bookingBox.stepTitles.selectOrigin'] || '¿A dónde vas a volar?'}
          />
        </div>

        <!-- Swap Button - Mobile (bottom right of Origin) -->
        <div class="absolute right-4 top-1/2 -translate-y-1/2 z-10 md:hidden">
          <${SwapButton}
            onClick=${handleSwap}
            disabled=${isSwapDisabled}
            i18n=${i18n}
          />
        </div>

        <!-- Swap Button - Desktop (center between Origin and Destination) -->
        <div class="hidden md:flex items-center justify-center absolute left-1/2 top-[26.5px] -translate-x-1/2 -translate-y-1/2 z-10">
          <${SwapButton}
            onClick=${handleSwap}
            disabled=${isSwapDisabled}
            i18n=${i18n}
          />
        </div>

        <!-- Separator -->
        <div class="h-[1px] mx-4 md:mx-0 md:h-auto md:w-[1px] md:my-2 bg-[var(--color-border-input-default)] flex-shrink-0" aria-hidden="true"></div>

        <!-- Destination -->
        <div class=${CITY_CONTAINER_CLASSES}>
          <${CitySelector}
            label=${i18n['bookingBox.labels.destination'] || 'Destino'}
            value=${destination}
            cities=${filteredDestinations}
            onChange=${handleDestinationSelect}
            isOpen=${currentActiveStep === 'destination'}
            onOpenChange=${handleDestinationOpenChange}
            showHeader=${showHeader}
            onBack=${handleBackNavigation}
            onClose=${handleCloseNavigation}
            required
            iconInputName="action/plane-landing"
            variant=${isMobile ? 'grouped-last' : 'grouped-right'}
            containerRelative=${false}
            positionDropdownStyles=${destinationDropdownPositionStyles}
            hasError=${destinationHasError}
            showErrorMessage=${false}
            i18n=${i18n}
            isLoading=${isLoadingCities}
            stepTitle=${i18n['bookingBox.stepTitles.selectDestination'] || '¿A dónde vas a volar?'}
          />
        </div>
      </div>

      ${(originHasError || destinationHasError) && html`
        <div class="mt-[4px] hidden md:flex md:gap-x-[1px]">
          <div class="flex-1 min-h-[21px]">
            ${originHasError && html`
              <div class="flex items-start font-normal text-sm leading-5 text-[var(--alert-error-icon-bg)]">
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
          <div class="flex-1 min-h-[21px]">
            ${destinationHasError && html`
              <div class="flex items-start font-normal text-sm leading-5 text-[var(--alert-error-icon-bg)]">
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
        </div>
      `}
    </div>
  `;
};

export default OriginDestinationSelector;
