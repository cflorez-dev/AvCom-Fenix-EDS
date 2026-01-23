import { h } from '@dropins/tools/preact.js';
import { useState, useCallback, useEffect, useMemo } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { DateSelector } from '../date-selector/date-selector.js';

const html = htm.bind(h);

/**
 * DateRangePicker - Orquestador principal para selección de fechas (ida/regreso o solo ida)
 *
 * ## Props
 * - `mode`: `"single" | "range"` – Modo de selección (default: "range").
 *   - `single`: Solo fecha de ida (one way)
 *   - `range`: Ida + regreso (round trip)
 * - `departureDate`: `Date | null` – Fecha de ida seleccionada.
 * - `returnDate`: `Date | null` – Fecha de regreso seleccionada.
 * - `onDateChange`: `function` – Callback al cambiar fechas (recibe { departure, return }).
 * - `origin`: `string` – Código IATA origen (para pricing).
 * - `destination`: `string` – Código IATA destino (para pricing).
 * - `tripType`: `"RT" | "OW"` – Tipo de viaje (sincronizado con mode).
 * - `disabledDates`: `Array<string>` – Fechas deshabilitadas desde CMS (ISO strings).
 * - `customClassName`: `string` – Clases CSS adicionales.
 * - `disabled`: `boolean` – Si está deshabilitado.
 * - `required`: `boolean` – Si es requerido.
 * - `activeStep`: `"departure" | "return" | null` – Step activo (controlado desde BookingBox).
 * - `onStepChange`: `function` – Callback al cambiar step activo.
 * - `onClose`: `function` – Callback para cerrar (BookingBox).
 * - `onBack`: `function` – Callback para volver (BookingBox).
 * - `showHeader`: `boolean` – Mostrar header en mobile (default: true).
 * - `onTripTypeChange`: `function` – Callback cuando cambia tipo de viaje
 *   (para DateSelector mobile).
 * - `currentTripType`: `string` – Tipo de viaje actual
 *   ('round-trip' | 'one-way') para DateSelector mobile.
 * - `...rest`: Otras propiedades HTML.
 *
 * ## Diseño (Figma)
 * - Node ID: 2742-3748 - DateRangePicker grouped
 *
 * ## Comportamiento
 * - **mode="range"**: Muestra 2 DateInput agrupados (departure + return)
 * - **mode="single"**: Muestra solo 1 DateInput (departure)
 * - **Auto-open return**: Después de seleccionar departure, auto-abre return
 * - **Layout grouped**: Inputs con bordes compartidos (outline en contenedor padre)
 * - **Pricing**: Cada DateSelector fetch su propio pricing
 * - **Step integration**: Soporta control desde BookingBox vía activeStep
 *
 * ## Estados
 * - Empty: Sin fechas seleccionadas
 * - Departure selected: Solo departure seleccionada (auto-abre return si mode="range")
 * - Complete: Ambas fechas seleccionadas (si mode="range") o departure (si mode="single")
 *
 * ## Ejemplos de uso
 *
 * ### Round Trip (dentro de BookingBox)
 * ```javascript
 * <${DateRangePicker}
 *   mode="range"
 *   departureDate=${departureDate}
 *   returnDate=${returnDate}
 *   onDateChange=${handleDateChange}
 *   origin="BOG"
 *   destination="MAD"
 *   tripType="RT"
 *   activeStep=${activeStep}
 *   onStepChange=${setActiveStep}
 *   onClose=${handleClose}
 * />
 * ```
 *
 * ### One Way
 * ```javascript
 * <${DateRangePicker}
 *   mode="single"
 *   departureDate=${departureDate}
 *   onDateChange=${({ departure }) => setDepartureDate(departure)}
 *   origin="BOG"
 *   destination="MAD"
 *   tripType="RT"
 * />
 * ```
 *
 * @example
 * <${DateRangePicker}
 *   mode="range"
 *   departureDate=${new Date()}
 *   returnDate=${null}
 *   onDateChange=${handleChange}
 * />
 */
export const DateRangePicker = ({
  mode = 'range',
  departureDate = null,
  returnDate = null,
  onDateChange,
  origin = '',
  destination = '',
  tripType = 'RT',
  disabledDates = [],
  customClassName = '',
  locale = 'es-CO',
  required = false,
  activeStep: activeStepProp,
  onStepChange,
  onClose,
  onBack,
  showHeader = true,
  onTripTypeChange,
  currentTripType,
  departureDropdownPositionStyles = '',
  returnDropdownPositionStyles = '',
  departureRelative = true,
  returnRelative = true,
  departureHasError = false,
  returnHasError = false,
  i18n = {},
  ...rest
}) => {
  // ========== ESTADO ==========

  // Estado interno para manejar sub-steps (departure/return)
  const [internalActiveStep, setInternalActiveStep] = useState(null);

  // Determinar el activeStep efectivo:
  // - Si activeStepProp es null, usar internalActiveStep (cerrado)
  // - Si activeStepProp es 'departure', usar internalActiveStep (abierto, pero sub-step interno)
  // - Esto permite que DateRangePicker maneje la transición departure -> return internamente
  const activeStep = activeStepProp === null ? null : (internalActiveStep || activeStepProp);

  // Flag para saber si acabamos de cambiar departure (evita mostrar returnDate anterior)
  const [justChangedDeparture, setJustChangedDeparture] = useState(false);

  // ========== EFFECTS ==========

  // Sincronizar cuando activeStepProp cambia (abre/cierra desde BookingBox)
  useEffect(() => {
    if (activeStepProp === 'departure') {
      // Al abrir desde BookingBox, inicializar en departure
      setInternalActiveStep('departure');
    } else if (activeStepProp === null) {
      // Al cerrar desde BookingBox, resetear
      setInternalActiveStep(null);
      setJustChangedDeparture(false);
    }
  }, [activeStepProp]);

  // ========== HELPERS ==========

  const handleStepChange = useCallback((step) => {
    setInternalActiveStep(step);
    if (onStepChange) {
      onStepChange(step);
    }
  }, [onStepChange]);

  // ========== HANDLERS ==========

  const handleDepartureChange = useCallback((date) => {
    // Marcar que acabamos de cambiar departure
    setJustChangedDeparture(true);

    // Notificar cambio al padre
    if (onDateChange) {
      // En modo range, resetear returnDate cuando cambia departure
      onDateChange({
        departure: date,
        return: mode === 'range' ? null : returnDate,
      });
    }

    // Auto-open return si mode="range"
    if (mode === 'range') {
      handleStepChange('return');
    }
    // NO cerrar en mode="single" - dejar que BookingBox controle el flujo
  }, [mode, returnDate, onDateChange, handleStepChange]);

  const handleReturnChange = useCallback((date) => {
    // Resetear flag (ya seleccionamos el nuevo return)
    setJustChangedDeparture(false);

    // Notificar cambio al padre
    if (onDateChange) {
      onDateChange({
        departure: departureDate,
        return: date,
      });
    }

    // NO cerrar automáticamente - dejar que BookingBox controle el flujo
  }, [departureDate, onDateChange]);

  const handleDepartureOpen = useCallback(() => {
    handleStepChange('departure');
  }, [handleStepChange]);

  const handleReturnOpen = useCallback(() => {
    // Si abrimos manualmente return, resetear flag (no es auto-open)
    setJustChangedDeparture(false);
    handleStepChange('return');
  }, [handleStepChange]);

  const handleCloseDeparture = useCallback(() => {
    handleStepChange(null);
    if (onClose) {
      onClose();
    }
  }, [handleStepChange, onClose]);

  const handleCloseReturn = useCallback(() => {
    // Resetear flag al cerrar
    setJustChangedDeparture(false);
    handleStepChange(null);
    if (onClose) {
      onClose();
    }
  }, [handleStepChange, onClose]);

  const handleBackDeparture = useCallback(() => {
    handleStepChange(null);
    if (onBack) {
      onBack();
    }
  }, [handleStepChange, onBack]);

  const handleBackReturn = useCallback(() => {
    // Resetear flag al volver a departure
    setJustChangedDeparture(false);
    // Volver a departure
    handleStepChange('departure');
  }, [handleStepChange]);

  const handleDepartureOpenChange = (isOpen) => {
    if (isOpen) {
      handleDepartureOpen();
    } else {
      handleCloseDeparture();
    }
  };

  const handleReturnOpenChange = (isOpen) => {
    if (isOpen) {
      handleReturnOpen();
    } else {
      handleCloseReturn();
    }
  };

  // ========== COMPUTED ==========

  const isRange = useMemo(() => mode === 'range', [mode]);

  // Calculate initial month/year for return: use departureDate month if exists
  const returnStartMonth = useMemo(
    () => (departureDate ? departureDate.getMonth() : null),
    [departureDate],
  );

  const returnStartYear = useMemo(
    () => (departureDate ? departureDate.getFullYear() : null),
    [departureDate],
  );

  // Calculate initial month/year for departure: use departureDate month if exists
  // Calendar will open at selected date but navigation is always blocked before current month
  const departureStartMonth = useMemo(
    () => (departureDate ? departureDate.getMonth() : null),
    [departureDate],
  );

  const departureStartYear = useMemo(
    () => (departureDate ? departureDate.getFullYear() : null),
    [departureDate],
  );

  // ========== STYLING ==========

  // Container with Tailwind classes
  const containerClasses = useMemo(
    () => (isRange
      ? `flex items-center outline outline-1 outline-neutral-400 rounded-lg bg-background-input-default ${customClassName}`.trim()
      : customClassName),
    [isRange, customClassName],
  );

  // ========== RENDER ==========
  return html`
    <div
      class="${containerClasses} ${departureHasError || returnHasError ? 'mb-[25px]' : ''}"
      data-name="dateRangePicker"
      data-mode=${mode}
      ...${rest}
    >
      <!-- Departure DateSelector -->
      <${DateSelector}
        label=${i18n['bookingBox.labels.departure'] || 'Salida'}
        value=${departureDate}
        departureDate=${departureDate}
        onChange=${handleDepartureChange}
        mode=${tripType === 'RT' ? 'departure' : 'single'}
        returnDate=${returnDate}
        variant=${isRange ? 'grouped-left' : 'standalone'}
        origin=${origin}
        destination=${destination}
        tripType=${tripType}
        calendarTitle=${i18n['bookingBox.labels.whenToFly'] || '¿Cuándo quieres volar?'}
        stepTitle=${i18n['bookingBox.stepTitles.whenToFly'] || '¿Cuando vas a volar?'}
        isOpen=${activeStep === 'departure'}
        onOpenChange=${handleDepartureOpenChange}
        onBack=${handleBackDeparture}
        onClose=${handleCloseDeparture}
        onTripTypeChange=${onTripTypeChange}
        currentTripType=${currentTripType}
        required=${required}
        showHeader=${showHeader}
        customClassName="flex-1"
        desktopDropdownPositionStyles=${departureDropdownPositionStyles}
        containerRelative=${departureRelative}
        departureHasError=${departureHasError}
        startMonth=${departureStartMonth}
        startYear=${departureStartYear}
        restrictPrevNavigation=${false}
        i18n=${i18n}
        locale=${locale}
      />

      <!-- Return DateSelector (solo si mode="range") -->
      ${isRange && html`
        <div class="h-8.5 w-[1px] my-2 bg-[var(--color-border-input-default)] flex-shrink-0" aria-hidden="true"></div>
        <${DateSelector}
          label=${i18n['bookingBox.labels.return'] || 'Regreso'}
          value=${justChangedDeparture ? null : returnDate}
          onChange=${handleReturnChange}
          mode="return"
          returnDate=${justChangedDeparture ? null : returnDate}
          departureDate=${departureDate}
          variant="grouped-right"
          origin=${origin}
          destination=${destination}
          tripType=${tripType}
          calendarTitle=${i18n['bookingBox.labels.whenToFly'] || '¿Cuándo quieres volar?'}
          stepTitle=${i18n['bookingBox.stepTitles.whenToReturn'] || '¿Cuando vas a volar?'}
          isOpen=${activeStep === 'return'}
          onOpenChange=${handleReturnOpenChange}
          onBack=${handleBackReturn}
          onClose=${handleCloseReturn}
          onTripTypeChange=${onTripTypeChange}
          currentTripType=${currentTripType}
          required=${required}
          showHeader=${showHeader}
          customClassName="flex-1"
          desktopDropdownPositionStyles=${returnDropdownPositionStyles}
          containerRelative=${returnRelative}
          returnHasError=${returnHasError}
          startMonth=${returnStartMonth}
          startYear=${returnStartYear}
          restrictPrevNavigation=${true}
          i18n=${i18n}
          locale=${locale}
        />
      `}
    </div>
  `;
};

export default DateRangePicker;
