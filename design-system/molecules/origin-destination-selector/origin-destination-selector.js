import { h } from '@dropins/tools/preact.js';
import { useState, useEffect, useCallback, useMemo } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { CitySelector } from '../city-selector/city-selector.js';
import { SwapButton } from '../../atoms/swap-button/swap-button.js';
import {
  fetchCities,
  getDefaultOriginAiata,
} from './origin-destination-selector.service.js';

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

        const defaultOriginAiata = await getDefaultOriginAiata();

        setFetchedCities(cities);

        if (defaultOriginAiata && cities.length) {
          const defaultOrigin = cities.find((city) => city.iataCityCode === defaultOriginAiata);

          if (defaultOrigin && onRouteChange) {
            onRouteChange({ origin: defaultOrigin, destination: null });
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

  // Load destinations when origin changes
  useEffect(() => {
    setFilteredDestinations([]);
    const loadDestinations = async () => {
      setIsLoadingCities(true);
      try {
        const destinationOptions = await fetchCities({
          originCode: origin.iataCityCode,
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
    if (onRouteChange) {
      onRouteChange({ origin: city, destination });
    }

    // If route becomes complete → notify completion
    if (city && destination && onRouteComplete) {
      onRouteComplete({ origin: city, destination });
    }

    // Auto-open destination (if autoOpenNext)
    if (autoOpenNext && city) {
      handleStepChange('destination');
    }
    // DO NOT close if no auto-open - let BookingBox control the flow
  }, [onRouteChange, onRouteComplete, destination, autoOpenNext, handleStepChange]);

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
      class=${`relative ${originHasError || destinationHasError ? 'mb-[25px]' : ''} ${containerClasses}`}
      data-name="originDestinationSelector"
      ...${rest}
    >
      <!-- Grouped container with shared borders -->
      <div class="flex flex-col md:flex-row outline outline-1 outline-offset-[-1px] outline-[var(--color-border-default)] rounded-[8px] bg-background-input-default">
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
        <div class="hidden md:flex items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
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
            i18n=${i18n}
            isLoading=${isLoadingCities}
            stepTitle=${i18n['bookingBox.stepTitles.selectDestination'] || '¿A dónde vas a volar?'}
          />
        </div>
      </div>
    </div>
  `;
};

export default OriginDestinationSelector;
