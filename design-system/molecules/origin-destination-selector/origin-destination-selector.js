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

/**
 * OriginDestinationSelector - Componente integrado de origen y destino con swap
 *
 * ## Props
 * - `origin`: `CityOption | null` – Ciudad de origen seleccionada.
 * - `destination`: `CityOption | null` – Ciudad de destino seleccionada.
 * - `onRouteChange`: `(route: { origin, destination }) => void` – Callback cuando cambia la ruta.
 * - `onRouteComplete`: `(route: { origin, destination }) => void` – Callback cuando ambos campos están completos (para auto-open fechas).
 * - `activeStep`: `"origin" | "destination" | null` – Step activo controlado desde padre (opcional).
 * - `onStepChange`: `(step: "origin" | "destination" | null) => void` – Callback cuando cambia step activo.
 * - `autoOpenNext`: `boolean` – Auto-abrir destination después de seleccionar origin (default: true).
 * - `disableSwap`: `boolean` – Deshabilitar swap button (default: false).
 * - `showHeader`: `boolean` – Mostrar header en mobile step modal (default: true).
 * - `onBack`: `() => void` – Callback para botón back (step modal).
 * - `onClose`: `() => void` – Callback para cerrar step.
 * - `customClassName`: `string` – Clases CSS adicionales.
 * - `disabled`: `boolean` – Si está deshabilitado (default: false).
 * - `...rest`: Otras propiedades.
 *
 * ## Diseño (Figma)
 * - Desktop Horizontal: Origen + Swap (centro) + Destino
 * - Mobile Vertical: Origen arriba, Destino abajo, Swap a la derecha
 *
 * ## Comportamiento
 * - **Auto-open destination**: Después de seleccionar origen (si autoOpenNext=true)
 * - **Exclude cities**: Origen no puede ser destino y viceversa (filtrado automático)
 * - **Swap inteligente**: Si uno vacío después de swap, auto-abrir ese campo
 * - **Step control**: Puede ser controlado (activeStep) o no controlado (useState interno)
 * - **Fetch cities**: Consulta ciudades automáticamente al cargar (con cache en sessionStorage)
 *
 * ## Ejemplo de uso
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
 * ## Optimizaciones
 * - ⚡ Performance: useCallback para handlers, useMemo para exclude lists
 * - ♿ Accessibility: ARIA labels, keyboard navigation via CitySelector
 * - 🏆 Best practices: Estado controlado/no controlado, cleanup effects, cache inteligente
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
  // Estado interno para step si no es controlado
  const [internalActiveStep, setInternalActiveStep] = useState(null);
  const currentActiveStep = activeStep !== undefined ? activeStep : internalActiveStep;

  // Estado para ciudades obtenidas del servicio
  const [fetchedCities, setFetchedCities] = useState([]);
  const [filteredDestinations, setFilteredDestinations] = useState([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [citiesError, setCitiesError] = useState(null);

  // Auto-detect viewport mobile
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false,
  );

  // Listener de resize para detectar cambios de viewport
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

  // Fetch cities desde API al cargar el componente
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
        setCitiesError(error.message || 'Error cargando ciudades');
      } finally {
        setIsLoadingCities(false);
      }
    };

    loadCities();
  }, []); // Solo cargar una vez al montar

  // Cargar destinaciones cuando cambia el origen
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

  // Handler para cambio de step (estable con useCallback)
  const handleStepChange = useCallback((step) => {
    setInternalActiveStep(step);
    if (onStepChange) {
      onStepChange(step);
    }
  }, [onStepChange]);

  // Handler para selección de origen
  const handleOriginSelect = useCallback((city) => {
    if (onRouteChange) {
      onRouteChange({ origin: city, destination });
    }

    // Si ruta queda completa → notificar completitud
    if (city && destination && onRouteComplete) {
      onRouteComplete({ origin: city, destination });
    }

    // Auto-abrir destination (si autoOpenNext)
    if (autoOpenNext && city) {
      handleStepChange('destination');
    }
    // NO cerrar si no hay auto-open - dejar que BookingBox controle el flujo
  }, [onRouteChange, onRouteComplete, destination, autoOpenNext, handleStepChange]);

  // Handler para selección de destino
  const handleDestinationSelect = useCallback((city) => {
    if (onRouteChange) {
      onRouteChange({ origin, destination: city });
    }

    // 2. Si ruta queda completa → notificar completitud
    if (origin && city) {
      if (onRouteComplete) {
        onRouteComplete({ origin, destination: city });
      }
    }

    // NO cerrar automáticamente - dejar que BookingBox controle el flujo
    // BookingBox abrirá 'dates' si la ruta está completa
  }, [onRouteChange, onRouteComplete, origin]);

  // Handler para swap
  const handleSwap = useCallback(() => {
    if (disabled) return;

    // 1. Intercambiar valores (origin ↔ destination)
    const newOrigin = destination;
    const newDestination = origin;

    if (onRouteChange) {
      onRouteChange({
        origin: newOrigin,
        destination: newDestination,
      });
    }

    // 2. Si ambos completos después del swap → notificar y cerrar
    if (newOrigin && newDestination) {
      if (onRouteComplete) {
        onRouteComplete({ origin: newOrigin, destination: newDestination });
      }
    } else if (!newOrigin) {
      // Origin vacío → abrirlo
      handleStepChange('origin');
    } else if (!newDestination) {
      // Destination vacío → abrirlo
      handleStepChange('destination');
    }
  }, [disabled, onRouteChange, onRouteComplete, origin, destination, handleStepChange]);

  // Calcular si swap está deshabilitado (memoized)
  // IMPORTANTE: Swap debe funcionar siempre, incluso con ambos campos vacíos
  const isSwapDisabled = useMemo(
    () => disableSwap || disabled,
    [disableSwap, disabled],
  );

  // Handlers para CitySelector (abrir/cerrar)
  const handleOriginOpenChange = useCallback((isOpen) => {
    handleStepChange(isOpen ? 'origin' : null);
  }, [handleStepChange]);

  const handleDestinationOpenChange = useCallback((isOpen) => {
    handleStepChange(isOpen ? 'destination' : null);
  }, [handleStepChange]);

  // Handler para back navigation (destination → origin, origin → cerrar)
  const handleBackNavigation = useCallback(() => {
    if (currentActiveStep === 'destination') {
      // Desde destination → retroceder a origin
      handleStepChange('origin');
    } else if (currentActiveStep === 'origin') {
      // Desde origin → cerrar completamente
      handleStepChange(null);
      // Si hay callback del padre, llamarlo
      if (onBack) {
        onBack();
      }
      // Fallback: llamar onBack del padre
    } else if (onBack) {
      onBack();
    }
  }, [currentActiveStep, handleStepChange, onBack]);

  // Handler para close (siempre cierra completamente)
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

  // Contenedor agrupado (outline compartido)
  const groupedContainerClasses = `
    flex flex-col md:flex-row
    outline outline-1 outline-offset-[-1px] outline-neutral-400
    rounded-lg
    bg-background-input-default
  `;

  // Contenedores de ciudad (sin outline individual)
  const cityContainerClasses = 'flex-1';

  // Swap button positioning
  const swapContainerMobileClasses = 'absolute right-4 top-1/2 -translate-y-1/2 z-10 md:hidden';
  const swapContainerDesktopClasses = 'hidden md:flex items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10';

  return html`
    <div
      class=${`relative ${originHasError || destinationHasError ? 'mb-[25px]' : ''} ${containerClasses}`}
      data-name="originDestinationSelector"
      ...${rest}
    >
      <!-- Contenedor agrupado con bordes compartidos -->
      <div class=${groupedContainerClasses}>
        <!-- Origin -->
        <div class=${cityContainerClasses}>
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

        <!-- Separador -->
        <div class="h-[1px] mx-4 md:mx-0 md:h-auto md:w-[1px] md:my-2 bg-[var(--color-border-input-default)] flex-shrink-0" aria-hidden="true"></div>

        <!-- Destination -->
        <div class=${cityContainerClasses}>
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

      <!-- Swap Button - Mobile (bottom right del Origin) -->
      <div class=${swapContainerMobileClasses}>
        <${SwapButton}
          onClick=${handleSwap}
          disabled=${isSwapDisabled}
          i18n=${i18n}
        />
      </div>

      <!-- Swap Button - Desktop (centro entre Origin y Destination) -->
      <div class=${swapContainerDesktopClasses}>
        <${SwapButton}
          onClick=${handleSwap}
          disabled=${isSwapDisabled}
          i18n=${i18n}
        />
      </div>
    </div>
  `;
};

export default OriginDestinationSelector;
