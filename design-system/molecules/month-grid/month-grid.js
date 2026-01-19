import { h } from '@dropins/tools/preact.js';
import { useMemo } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { DayCell } from '../../atoms/day-cell/day-cell.js';
import {
  getToday,
  isSameDay,
  isInRange as checkIsInRange,
  isDateDisabled,
} from '../date-range-picker/date-range-picker.service.js';

const html = htm.bind(h);

const pricingCategory = (dayData) => {
  if (dayData?.minimumPriceGroup === 0) {
    return 'low';
  }

  if (dayData?.minimumPriceGroup === 1) {
    return 'medium';
  }

  if (dayData?.minimumPriceGroup === 2) {
    return 'high';
  }

  return null;
};

/**
 * MonthGrid - Month day grid with selection and pricing logic
 *
 * ## Props
 * - `year`: `number` – Year of the month.
 * - `month`: `number` – Month (0-11).
 * - `departureDate`: `Date | null` – Selected departure date.
 * - `returnDate`: `Date | null` – Selected return date.
 * - `hoveredDate`: `Date | null` – Currently hovered date (for range preview).
 * - `onDayClick`: `function` – Callback when a day is clicked (receives date).
 * - `onDayHover`: `function` – Callback when a day is hovered (receives date).
 * - `pricingData`: `Object` – Pricing object: { 'YYYY-MM-DD': price }.
 * - `disabledDates`: `Array<string>` – Disabled dates from CMS (ISO strings).
 * - `minDate`: `Date | null` – Minimum selectable date (for return >= departure).
 * - `customClassName`: `string` – Additional CSS classes.
 * - `...rest`: Other HTML props.
 *
 * ## Design (Figma)
 * - Node ID: 2742-3893 - Calendar grid
 *
 * ## Behavior
 * - Generates a 7x6 grid (42 cells) to cover all month combinations
 * - Fills empty days at the start (from previous month) and end (next month)
 * - Calculates each day's state: disabled, selected, inRange, today
 * - Applies pricing category to each day with available data
 * - Clicking a day triggers onDayClick with date
 *
 * ## State Logic
 * - **isDisabled**: Past dates, > MAX_BOOKING_DAYS, < minDate, CMS disabled
 * - **isSelected**: Day is departureDate or returnDate
 * - **isRangeStart**: Day is departureDate (if range)
 * - **isRangeEnd**: Day is returnDate (if range)
 * - **isInRange**: Day is between departureDate and returnDate
 * - **isToday**: Day is today
 * - **pricingCategory**: low/medium/high from pricing data
 *
 * ## Usage Examples
 *
 * ### Inside CalendarMonth
 * ```javascript
 * <${MonthGrid}
 *   year=${2026}
 *   month=${0}
 *   departureDate=${departureDate}
 *   returnDate=${returnDate}
 *   onDayClick=${handleDayClick}
 *   pricingData=${pricingData}
 *   disabledDates=${disabledDates}
 * />
 * ```
 *
 * @example
 * <${MonthGrid}
 *   year=${2026}
 *   month=${0}
 *   onDayClick=${handleClick}
 * />
 */
export const MonthGrid = ({
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
  customClassName = '',
  ...rest
}) => {
  // ========== COMPUTED ==========

  // Generate array of days for the month (with empty days at start/end)
  const days = useMemo(() => {
    // First day of the month
    const firstDay = new Date(year, month, 1);

    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // Day of week for the first day (0 = Sun, 1 = Mon, ..., 6 = Sat)
    // Adjust so Monday is 0
    let firstDayOfWeek = firstDay.getDay();
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Monday = 0

    // Total days in the month
    const daysInMonth = lastDay.getDate();

    // Array of days
    const daysArray = [];

    // Add empty days at the start (from previous month)
    for (let i = 0; i < firstDayOfWeek; i += 1) {
      daysArray.push(null);
    }

    // Add days of the current month
    for (let day = 1; day <= daysInMonth; day += 1) {
      daysArray.push(new Date(year, month, day));
    }

    // Add empty days at the end to complete 7x6 grid (42 cells)
    const totalCells = 42;
    while (daysArray.length < totalCells) {
      daysArray.push(null);
    }

    return daysArray;
  }, [year, month]);

  // Current date
  const today = useMemo(() => getToday(), []);

  // ========== HANDLERS ==========

  const handleDayClick = (date) => {
    if (onDayClick) {
      onDayClick(date);
    }
  };

  // ========== RENDER ==========
  return html`
    <div 
      class="grid grid-cols-7 ${customClassName}"
      data-name="monthGrid"
      role="grid"
      ...${rest}
    >
  ${days.map((date, index) => {
    // Empty day
    if (!date) {
      return html`<div key=${`empty-${index}`} class="min-w-[42px]" />`;
    }

    // Determine states
    const disabled = isDateDisabled(date, {
      minDate,
      disabledDates,
    });

    const selected = (departureDate && isSameDay(date, departureDate))
      || (returnDate && isSameDay(date, returnDate));

    const rangeStart = departureDate
        && (returnDate || hoveredDate) && isSameDay(date, departureDate);
    const rangeEnd = returnDate && isSameDay(date, returnDate);
    const isHoverEnd = !returnDate && hoveredDate && isSameDay(date, hoveredDate);

    // Calculate inRange: either with actual returnDate OR with hoveredDate (for preview)
    let inRange = false;
    if (departureDate && returnDate) {
      // Actual selected range
      inRange = checkIsInRange(date, departureDate, returnDate)
        && !rangeStart
        && !rangeEnd;
    } else if (departureDate && hoveredDate && hoveredDate > departureDate) {
      // Hover preview range
      inRange = checkIsInRange(date, departureDate, hoveredDate)
        && !isSameDay(date, departureDate)
        && !isSameDay(date, hoveredDate);
    }

    const todayCheck = isSameDay(date, today);

    // Pricing category
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    const dayPricingData = pricingData?.[dateStr];

    return html`
      <${DayCell}
        key=${dateStr}
        date=${date}
        isDisabled=${disabled}
        isSelected=${selected}
        isInRange=${inRange}
        isRangeStart=${rangeStart}
        isRangeEnd=${rangeEnd}
        isHoverEnd=${isHoverEnd}
        isToday=${todayCheck}
        pricingCategory=${pricingCategory(dayPricingData)}
        onClick=${handleDayClick}
        onHover=${onDayHover}
      />
    `;
  })}
    </div>
  `;
};

export default MonthGrid;
