import { h } from '@dropins/tools/preact.js';
import {
  useCallback,
  useRef,
  useMemo,
} from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Icon } from '../icon/icon.js';

const html = htm.bind(h);

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

  // Determine actual state
  const actualState = disabled ? 'disabled' : 'normal';
  const isInteractive = !disabled;

  // ========== STYLING ==========

  // State-based classes
  const stateClasses = {
    normal: 'outline outline-1 outline-offset-[-1px] outline-neutral-400',
    disabled: 'outline outline-1 outline-offset-[-1px] outline-border-input-disabled',
  };

  const labelStateClasses = {
    normal: 'text-text-normal-secondary',
    disabled: 'text-text-input-disabled-label',
  };

  // Container classes
  const containerClasses = useMemo(() => {
    // Border radius based on variant
    let borderRadiusClass = 'rounded-lg';
    if (variant === 'grouped-left') {
      borderRadiusClass = 'rounded-l-lg rounded-r-none';
    } else if (variant === 'grouped-right') {
      borderRadiusClass = 'rounded-l-none rounded-r-lg';
    }

    // Outline only for standalone
    const outlineClass = variant === 'standalone' ? stateClasses[actualState] : '';

    return `
      flex items-center gap-2 w-full h-[52px]
      px-4
      ${actualState === 'disabled' ? 'bg-background-input-disabled' : 'bg-background-input-default'}
      ${borderRadiusClass}
      transition-all duration-[var(--transition-normal)]
      ${outlineClass}
      border-b-[3px] border-b-transparent
      ${isInteractive ? 'hover:border-border-input-positive focus-within:border-border-input-positive cursor-pointer' : 'cursor-not-allowed'}
      ${active && !hasError ? '!border-border-input-positive' : ''}
      ${hasError ? '!border-[var(--alert-error-border)]' : ''}
    `.trim();
  }, [actualState, isInteractive, stateClasses, variant, hasError, active]);

  // ========== RENDER ==========
  return html`
    <div
      class=${`${containerRelative ? 'relative' : ''} flex flex-1 ${customClassName}`}
      data-name="dateInput"
      ref=${containerRef}
      onKeyDown=${handleKeyDown}
      ...${rest}
    >
    
      <div
        ref=${triggerRef}
        onClick=${handleClick}
        class=${containerClasses}
      >
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

         ${hasError && html`
          <div class="absolute top-full min-h-[21px] left-0 flex items-start mt-[4px] font-normal text-sm leading-5 text-[var(--alert-error-icon-bg)]">
            <svg
              class="w-4 h-4 mr-1 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <circle cx="10" cy="10" r="9" fill="currentColor" />
              <text x="10" y="14" text-anchor="middle" fill="white" font-size="12" font-weight="bold">i</text>
            </svg>
            <span class="">${i18n['bookingBox.labels.requiredField'] || 'This field is required'}</span>
          </div>
          `}

        <!-- Input Container -->
        <div class="relative flex-1 flex items-center min-h-full">
          <!-- Floating Label -->
          ${label && html`
            <label
              for=${`${label}-date-input`}
              class=${`
                pointer-events-none
                transition-all duration-200 ease-in-out
                font-[var(--font-weight-regular)] tracking-[var(--letter-spacing-normal)]
                ${labelStateClasses[actualState]}
                ${shouldFloat ? 'absolute top-[7px] text-xs leading-[16px] left-0' : 'text-sm leading-5'}
                ${hasError ? '!text-[var(--alert-error-icon-bg)]' : ''}
              `}
            >
              ${label}
            </label>
          `}

          <!-- Content (Display Value) -->
          <div class="flex-1 flex flex-col justify-center min-w-0">
            <!-- Hidden input for accessibility -->
            <input
              ref=${inputRef}
              id=${`${label}-date-input`}
              type="text"
              value=${value}
              disabled=${disabled}
              readOnly
              tabIndex=${disabled ? -1 : 0}
              class=${`
                w-full bg-transparent !border-0 !outline-none p-0 cursor-pointer
                !text-base leading-5
                ${shouldFloat ? 'relative top-[10px] !font-[var(--font-weight-bold)] h-[20px]' : 'absolute inset-0 opacity-0 cursor-pointer'}
                ${actualState === 'disabled' ? 'text-text-input-disabled cursor-not-allowed' : 'text-text-normal-primary'}
              `}
              role="button"
              aria-label=${label || ''}
              aria-readonly="true"
            />
          </div>
        </div>
      </div>
    </div>
  `;
};

export default DateInput;
