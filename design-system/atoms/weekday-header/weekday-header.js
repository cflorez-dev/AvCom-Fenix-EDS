import { h } from '@dropins/tools/preact.js';
import { useMemo } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';

const html = htm.bind(h);

/**
 * WeekdayHeader - Row of weekday names (Mo, Tu, We, etc.)
 *
 * ## Props
 * - `locale`: `string` – Locale code (e.g., 'es-CO', 'en-US', 'pt-BR'). Default: 'es-CO'.
 * - `customClassName`: `string` – Additional CSS classes.
 * - `...rest`: Other HTML props.
 *
 * ## Design (Figma)
 * - Node ID: 2742-3893 - Calendar weekday header
 *
 * ## Behavior
 * - Automatically generates weekday names based on provided locale
 * - Short format: "Mo", "Tu", "We", "Th", "Fr", "Sa", "Su" (English)
 * - Responsive: uppercase on mobile, normal-case on desktop
 * - Centered text, primary color, bold
 *
 * ## Usage Examples
 *
 * ### Inside CalendarMonth
 * ```javascript
 * <${WeekdayHeader} locale="es-CO" />
 * ```
 *
 * @example
 * <${WeekdayHeader} locale="en-US" customClassName="mb-2" />
 */
export const WeekdayHeader = ({
  locale = 'es-CO',
  customClassName = '',
  ...rest
}) => {
  // ========== COMPUTED ==========

  // Generate array of weekday names based on locale
  const weekdays = useMemo(() => {
    const baseDate = new Date(2024, 0, 1); // Monday, Jan 1, 2024

    const days = [];
    for (let i = 0; i < 7; i += 1) {
      const day = new Date(baseDate);
      day.setDate(baseDate.getDate() + i);

      const formatted = new Intl.DateTimeFormat(locale, {
        weekday: 'short',
      }).format(day);

      // Capitalize first letter and remove trailing dot if present
      const capitalized = formatted.charAt(0).toUpperCase() + formatted.slice(1);
      const cleaned = capitalized.replace('.', '');
      const shorted = cleaned.slice(0, 2);

      days.push(shorted);
    }

    return days;
  }, [locale]);

  // ========== STYLING ==========

  const containerClasses = useMemo(
    () => `flex items-center justify-between border-b border-[var(--border-stroke-default)] ${customClassName}`.trim(),
    [customClassName],
  );

  const dayClasses = `
    flex items-center justify-center
    
    px-[var(--spacing-x-small)]
    py-[var(--spacing-tiny)]
    text-[length:var(--font-size-small)]
    font-[var(--font-weight-bold)]
    leading-[normal]
    text-[var(--text-normal-primary)]
    text-center
    uppercase md:normal-case
    !w-[42px]
    !h-[27px]
  `.trim();

  // ========== RENDER ==========
  return html`
    <div 
      class=${containerClasses}
      data-name="weekdayHeader"
      role="row"
      ...${rest}
    >
      ${weekdays.map((day) => html`
        <div 
          key=${day}
          class=${dayClasses}
          role="columnheader"
          aria-label=${day}
        >
          ${day}
        </div>
      `)}
    </div>
  `;
};

export default WeekdayHeader;
