import { h } from '@dropins/tools/preact.js';
import {
  useCallback,
  useRef,
  useMemo,
} from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Icon } from '../icon/icon.js';

const html = htm.bind(h);

// Constants for state-based styling (defined outside component for performance)
// `outline-offset-[-1px]` mantiene el borde consistente entre el input standalone
// (OW / solo ida) y el contenedor agrupado del rango (RT / ida y vuelta), que ya usa
// ese offset; sin el, el outline del standalone se dibujaba 1px por fuera y el borde
// "cambiaba" al pasar de RT a OW (bug 1286625). Es el mismo patron que city-selector,
// origin-destination-selector y el input atom.
const STATE_CLASSES = {
  normal: 'outline outline-1 outline-offset-[-1px] outline-neutral-400',
  disabled: 'outline outline-1 outline-offset-[-1px] outline-border-input-disabled',
};

const LABEL_STATE_CLASSES = {
  normal: 'text-text-normal-secondary',
  disabled: 'text-text-input-disabled-label',
};

/**
 * DateInput - Read-only input for selecting dates with pointer cursor
 *
 * ## Props
 * - `label`: `string` – Input label (e.g., "Departure", "Return").
 * - `value`: `string` – Formatted value to display (e.g., "Mon 15 Jan 2026").
 * - `onClick`: `function` – Callback when input is clicked.
 * - `variant`: `"standalone" | "grouped-left" | "grouped-right"` – Visual variant (default: "standalone").
 *   - `standalone`: Standalone input with full border radius
 *   - `grouped-left`: First input in a group (left border radius only)
 *   - `grouped-right`: Last input in a group (right border radius only)
 * - `customClassName`: `string` – Additional CSS classes.
 * - `disabled`: `boolean` – If true, input is disabled.
 * - `active`: `boolean` – If true, input shows active/focused state (default: false).
 * - `containerRelative`: `boolean` – If true, container has relative positioning (default: true).
 * - `required`: `boolean` – If true, input is required.
 * - `...rest`: Other HTML props.
 *
 * ## Design (Figma)
 * - Node ID: 2742-3748 - DateInput with calendar icon
 *
 * ## Behavior
 * - **Read-only**: Manual typing is not allowed
 * - **Pointer cursor**: Indicates clickability
 * - **Hover**: Shows green bottom border (visual affordance)
 * - **Focus**: Green bottom border (keyboard navigation)
 * - **Floating label**: Always floats when value is present
 *
 * ## Structure
 * ```javascript
 * <DateInput
 *   label="Departure"
 *   value="Mon 15 Jan 2026"
 *   onClick={handleOpenCalendar}
 * />
 * ```
 *
 * ## Usage Examples
 *
 * ### Standalone
 * ```javascript
 * <${DateInput}
 *   label="Departure"
 *   value=${departureFormatted}
 *   onClick=${handleOpenCalendar}
 * />
 * ```
 *
 * ### Grouped (inside DateRangePicker)
 * ```javascript
 * <${DateInput}
 *   label="Departure"
 *   value=${departureFormatted}
 *   onClick=${handleOpenDeparture}
 *   variant="grouped-left"
 * />
 * <${DateInput}
 *   label="Return"
 *   value=${returnFormatted}
 *   onClick=${handleOpenReturn}
 *   variant="grouped-right"
 * />
 * ```
 *
 * @example
 * <${DateInput}
 *   label="Departure"
 *   value="Mon 15 Jan 2026"
 *   onClick=${() => console.log('Open calendar')}
 * />
 */
export const DateInput = ({
  label = '',
  value = '',
  onClick,
  variant = 'standalone',
  customClassName = '',
  disabled = false,
  active = false,
  containerRelative = true,
  hasError = false,
  showErrorMessage = true,
  i18n = {},
  ...rest
}) => {
  // ========== STATE ==========
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const inputRef = useRef(null);

  // ========== EVENT HANDLERS ==========
  // Handle click on the input (open calendar if not disabled)
  const handleClick = useCallback((e) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    if (onClick) {
      onClick(e);
    }
  }, [disabled, onClick]);

  // Handle keyboard events (Enter/Space to open calendar)
  const handleKeyDown = useCallback((e) => {
    // Enter or Space opens the calendar
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault();
      if (onClick) {
        onClick(e);
      }
    }
  }, [disabled, onClick]);

  // ========== COMPUTED VALUES ==========

  // Should the label float?
  const shouldFloat = value || active;

  // Determine actual state (memoized to avoid recalculation)
  const actualState = useMemo(() => (disabled ? 'disabled' : 'normal'), [disabled]);
  const isInteractive = !disabled;

  // ========== STYLING ==========

  // Container classes (memoized for performance)
  const containerClasses = useMemo(() => {
    // Border radius: solo esquinas SUPERIORES para grouped
    // (la línea verde al fondo maneja su propio border-radius)
    // Radio fijo en 8px (Figma bradius-8px-m). NO usar `rounded-*-lg`: el tema
    // del proyecto redefine --radius-lg a 0.8rem (12.8px), así que las esquinas
    // agrupadas salían más grandes que el standalone y el input cambiaba de radio
    // al pasar de RT (grouped) a OW (standalone). Fijar 8px las empareja.
    let borderRadiusClass = 'rounded-[8px]';
    if (variant === 'grouped-left') {
      borderRadiusClass = 'rounded-tl-[8px]';
    } else if (variant === 'grouped-right') {
      borderRadiusClass = 'rounded-tr-[8px]';
    }

    // Outline only for standalone
    const outlineClass = variant === 'standalone' ? STATE_CLASSES[actualState] : '';

    // En grouped mode, el padre ya tiene bg-background-input-default
    const isGrouped = variant !== 'standalone';
    const bgClass = isGrouped
      ? (actualState === 'disabled' ? 'bg-background-input-disabled' : '')
      : (actualState === 'disabled' ? 'bg-background-input-disabled' : 'bg-background-input-default');

    return `
      flex flex-col w-full group/dateInput overflow-hidden
      ${bgClass}
      ${borderRadiusClass}
      transition-all duration-[var(--transition-normal)]
      ${outlineClass}
      ${isInteractive ? 'cursor-pointer' : ''}
    `.trim();
  }, [actualState, isInteractive, variant, hasError, active]);

  // Clases de la línea verde: ancho, alineamiento y border-radius
  // Para grouped: calc(100% - 4px) centrado + border-radius en esquinas
  // que coinciden con el contenedor padre (rounded-[8px])
  const greenLineClasses = useMemo(() => {
    switch (variant) {
      case 'grouped-left':
        return 'w-[calc(100%-4px)] self-center rounded-bl-[8px]';
      case 'grouped-right':
        return 'w-[calc(100%-4px)] self-center rounded-br-[8px]';
      default:
        return 'w-full';
    }
  }, [variant]);

  // Label classes (memoized to avoid recalculation)
  const labelClasses = useMemo(() => `
    pointer-events-none
    transition-all duration-200 ease-in-out
    font-[var(--font-weight-regular)] tracking-[var(--letter-spacing-normal)]
    ${LABEL_STATE_CLASSES[actualState]}
    ${shouldFloat ? 'absolute top-[7px] text-xs leading-[16px] left-0' : 'text-sm leading-5'}
    ${hasError ? '!text-[var(--alert-error-icon-bg)]' : ''}
  `.trim(), [actualState, shouldFloat, hasError]);

  // Input classes (memoized to avoid recalculation)
  const inputClasses = useMemo(() => `
    w-full bg-transparent !border-0 !outline-none p-0 cursor-pointer
    !text-base leading-5
    ${shouldFloat ? 'relative top-[10px] !font-[var(--font-weight-bold)] h-[20px]' : 'absolute inset-0 opacity-0 cursor-pointer'}
    ${actualState === 'disabled' ? 'text-text-input-disabled' : 'text-text-normal-primary'}
  `.trim(), [shouldFloat, actualState]);

  // ========== RENDER ==========
  return html`
    <div
      class=${`${containerRelative ? 'relative' : ''} flex-1 ${customClassName} group-date-input-container`}
      data-name="dateInput"
      ref=${containerRef}
      onKeyDown=${handleKeyDown}
      ...${rest}
    >
      <!-- Trigger + Error wrapper (relative for error positioning without affecting layout) -->
      <div class="relative">
      <div
        ref=${triggerRef}
        onClick=${handleClick}
        class=${containerClasses}
      >
        <!-- Content Row -->
        <div class="flex items-center gap-2 w-full h-[52px] px-4">
          <!-- Icon (Calendar) -->
          <span
            class="flex-shrink-0 flex items-center ${actualState === 'disabled' ? 'opacity-50' : ''}"
            aria-hidden="true"
          >
            <${Icon}
              icon="action/calendar"
              size="m"
              customClassName=${actualState === 'disabled' ? '[&_path]:fill-icon-input-disabled' : ''}
            />
          </span>

          <!-- Input Container -->
          <div class="relative flex-1 flex items-center min-h-full">
            <!-- Floating Label -->
            ${label && html`
              <label
                for=${`${label}-date-input`}
                class=${labelClasses}
              >
                ${label}
              </label>
            `}

            <!-- Content (Display Value) -->
            <div class="flex-1 flex flex-col justify-center min-w-0">
              <input
                ref=${inputRef}
                id=${`${label}-date-input`}
                type="text"
                value=${value}
                disabled=${disabled}
                readOnly
                tabIndex=${disabled ? -1 : 0}
                class=${inputClasses}
                role="button"
                aria-label=${label || ''}
              />
            </div>
          </div>
        </div>
        <!-- End Content Row -->

        <!-- Bottom line: red when error, green on hover/focus/active when no error -->
        <div class=${`h-[3px] ${greenLineClasses} transition-colors duration-[var(--transition-normal)] ${hasError ? 'bg-[var(--alert-error-border)]' : 'bg-transparent group-hover/dateInput:bg-border-input-positive group-focus-within/dateInput:bg-border-input-positive'} ${active && !hasError ? '!bg-border-input-positive' : ''}`} aria-hidden="true"></div>
      </div>

      <!-- Error message (absolute: floats below trigger without affecting layout) -->
      ${showErrorMessage && hasError && html`
        <div class="absolute top-full left-0 min-h-[21px] hidden md:flex items-start mt-[4px] font-normal text-sm leading-5 text-[var(--alert-error-icon-bg)]">
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
    </div>
  `;
};

export default DateInput;
