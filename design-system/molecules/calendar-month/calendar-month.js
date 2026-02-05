import { h } from '@dropins/tools/preact.js';
import { useMemo } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { WeekdayHeader } from '../../atoms/weekday-header/weekday-header.js';
import { MonthGrid } from '../month-grid/month-grid.js';

const html = htm.bind(h);

/**
 * CalendarMonth - Full month calendar (title + weekdays + grid)
 *
 * ## Props
 * - `locale`: `string` – Locale code (e.g., 'es-CO', 'en-US', 'pt-BR'). Default: 'es-CO'.
 * - `year`: `number` – Year of the month.
 * - `month`: `number` – Month (0-11).
 * - `departureDate`: `Date | null` – Selected departure date.
 * - `returnDate`: `Date | null` – Selected return date.
 * - `hoveredDate`: `Date | null` – Currently hovered date (for range preview).
 * - `onDayClick`: `function` – Callback when a day is clicked.
 * - `onDayHover`: `function` – Callback when a day is hovered.
 * - `pricingData`: `Object` – Pricing object.
 * - `disabledDates`: `Array<string>` – Disabled dates from CMS.
 * - `minDate`: `Date | null` – Minimum selectable date.
 * - `showWeekdayHeader`: `boolean` – Show weekday header (default: true).
 * - `isFirstMonth`: `boolean` – If true, applies reduced top padding (default: false).
 * - `customClassName`: `string` – Additional CSS classes.
 * - `...rest`: Other HTML props.
 *
 * ## Design (Figma)
 * - Node ID: 2742-3893 - Full calendar
 * - Navigation arrows are in the parent component (DateSelector)
 *
 * ## Behavior
 * - Renders month/year title
 * - Renders WeekdayHeader with weekday names
 * - Renders MonthGrid with days of the month
 * - NO navigation (arrows are in the parent)
 *
 * ## Usage Examples
 *
 * ### Inside DateSelector
 * ```javascript
 * <${CalendarMonth}
 *   locale="es-CO"
 *   year=${2026}
 *   month=${0}
 *   departureDate=${departureDate}
 *   returnDate=${returnDate}
 *   onDayClick=${handleDayClick}
 *   pricingData=${pricingData}
 * />
 * ```
 *
 * @example
 * <${CalendarMonth}
 *   locale="en-US"
 *   year=${2026}
 *   month=${0}
 *   onDayClick=${handleClick}
 * />
 */
export const CalendarMonth = ({
  locale = 'es-CO',
  year,
  month,
  departureDate = null,
  returnDate = null,
  hoveredDate = null,
  onDayClick,
  onDayHover,
  pricingData = {},
  disabledDates = [],
  minDate = null,
  showWeekdayHeader = true,
  isFirstMonth = false,
  customClassName = '',
  ...rest
}) => {
  // ========== COMPUTED ==========

  // Format month and year according to locale
  const monthTitle = useMemo(() => {
    const date = new Date(year, month, 1);
    const monthName = new Intl.DateTimeFormat(locale, { month: 'long' }).format(date);
    const yearNumber = date.getFullYear();

    // Capitalize first letter and format as "Enero 2026" (without "de")
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    return `${capitalizedMonth} ${yearNumber}`;
  }, [locale, year, month]);

  // ========== STYLING ==========

  const containerClasses = useMemo(
    () => `flex flex-col ${customClassName}`.trim(),
    [customClassName],
  );

  // ========== RENDER ==========
  return html`
    <div 
      class=${containerClasses}
      data-name="calendarMonth"
      ...${rest}
    >
      <!-- Month/Year Title -->
      <div
        class="flex items-center ${isFirstMonth ? 'pt-[16px]' : 'pt-[24px]'} pb-[8px] md:justify-center md:min-h-14 md:py-3"
        aria-live="polite"
        aria-atomic="true"
      >
        <span class="text-base font-[var(--font-weight-bold)] text-[var(--text-normal-primary)] leading-[normal]">${monthTitle}</span>
      </div>

      <!-- Weekday Header -->
      ${showWeekdayHeader && html`
        <${WeekdayHeader} locale=${locale} customClassName="my-[4px]"/>
      `}

      <!-- Month Grid -->
      <${MonthGrid}
        year=${year}
        month=${month}
        departureDate=${departureDate}
        returnDate=${returnDate}
        hoveredDate=${hoveredDate}
        onDayClick=${onDayClick}
        onDayHover=${onDayHover}
        pricingData=${pricingData}
        disabledDates=${disabledDates}
        minDate=${minDate}
      />
    </div>
  `;
};

export default CalendarMonth;
