import { h } from '@dropins/tools/preact.js';
import { useState, useCallback, useMemo } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';

const html = htm.bind(h);

// Base button classes for all day cells
const BASE_BUTTON_CLASSES = `
  w-[30px] h-[30px]
  rounded-full
  flex items-center justify-center
  !text-[length:var(--font-size-small)]
  font-[var(--font-weight-regular)]
  transition-all duration-[var(--transition-fast)]
`.trim();

/**
 * DayCell - Calendar day cell with 12 visual states + pricing indicator
 *
 * ## Props
 * - `date`: `Date` – Date for this cell.
 * - `isDisabled`: `boolean` – If true, cell is disabled (past, > MAX_BOOKING_DAYS, CMS).
 * - `isSelected`: `boolean` – If true, cell is selected (departure or return).
 * - `isInRange`: `boolean` – If true, cell is in the selected range (between departure and return).
 * - `isRangeStart`: `boolean` – If true, cell is the start of the range (departure).
 * - `isRangeEnd`: `boolean` – If true, cell is the end of the range (return).
 * - `isHoverEnd`: `boolean` – If true, cell is the temporary end of range (hovered date).
 * - `isToday`: `boolean` – If true, cell is today.
 * - `pricingCategory`: `"low" | "medium" | "high" | null` – Price category for this day.
 * - `onClick`: `function` – Callback when clicked (receives date).
 * - `onHover`: `function` – Callback when hovered (receives date or null).
 * - `customClassName`: `string` – Additional CSS classes.
 * - `...rest`: Other HTML props.
 *
 * ## Design (Figma)
 * - Node ID: 2742-3893 - DayCell with all states
 *
 * ## Visual States (12 states)
 *
 * 1. Default (not selected)
 *    - Background: transparent
 *    - Text: `var(--text-normal-primary)`
 *    - Border: none
 *
 * 2. Hover (not selected, hover)
 *    - Background: `var(--bg-card-lighter)`
 *    - Text: `var(--text-normal-primary)`
 *    - Cursor: pointer
 *
 * 3. Today (current day)
 *    - Background: transparent
 *    - Text: `var(--brand-primary)`
 *    - Font-weight: bold
 *    - Border: `2px solid var(--brand-primary)`
 *
 * 4. Selected Start (departure)
 *    - Background: `var(--brand-primary)`
 *    - Text: white
 *    - Border-radius: left rounded, right square (if in range)
 *
 * 5. Selected End (return)
 *    - Background: `var(--brand-primary)`
 *    - Text: white
 *    - Border-radius: left square, right rounded
 *
 * 6. Selected Single (one way or no return)
 *    - Background: `var(--brand-primary)`
 *    - Text: white
 *    - Border-radius: fully rounded
 *
 * 7. In Range (between departure and return)
 *    - Background: `var(--bg-brand-primary-lighter)`
 *    - Text: `var(--text-normal-primary)`
 *    - Border-radius: square (no rounded)
 *
 * 8. Disabled (past, > MAX_BOOKING_DAYS, CMS)
 *    - Background: transparent
 *    - Text: `var(--text-normal-disabled)`
 *    - Cursor: not-allowed
 *    - Opacity: 0.4
 *
 * 9. Disabled + Today
 *    - Same as disabled but with primary border
 *
 * 10. Hover + In Range
 *    - Background: `var(--bg-brand-primary-lighter)` darkened
 *
 * 12. Empty (days outside current month)
 *    - Renders nothing (invisible)
 *
 * ## Behavior
 * - Click triggers onClick with date
 * - Disabled does not trigger onClick
 * - Hover only if not disabled
 * - Pricing indicator always visible if pricing data exists
 *
 * ## Usage Examples
 *
 * ### Normal day, not selected
 * ```javascript
 * <${DayCell}
 *   date=${new Date(2026, 0, 15)}
 *   onClick=${handleDayClick}
 *   pricingCategory="low"
 * />
 * ```
 *
 * ### Selected day (departure)
 * ```javascript
 * <${DayCell}
 *   date=${new Date(2026, 0, 15)}
 *   isSelected=${true}
 *   isRangeStart=${true}
 *   onClick=${handleDayClick}
 * />
 * ```
 *
 * ### Day in range
 * ```javascript
 * <${DayCell}
 *   date=${new Date(2026, 0, 16)}
 *   isInRange=${true}
 *   onClick=${handleDayClick}
 * />
 * ```
 *
 * @example
 * <${DayCell}
 *   date=${new Date(2026, 0, 15)}
 *   isToday=${true}
 *   pricingCategory="low"
 *   onClick=${handleClick}
 * />
 */
export const DayCell = ({
  date,
  isDisabled = false,
  isSelected = false,
  isInRange = false,
  isRangeStart = false,
  isRangeEnd = false,
  isHoverEnd = false,
  isToday = false,
  pricingCategory = null,
  onClick,
  onHover,
  customClassName = '',
  ...rest
}) => {
  // ========== STATE ==========
  const [isHovered, setIsHovered] = useState(false);

  // ========== EVENT HANDLERS ==========
  const handleClick = useCallback(() => {
    if (isDisabled || !date) return;
    if (onClick) {
      onClick(date);
    }
  }, [isDisabled, date, onClick]);

  const handleMouseEnter = useCallback(() => {
    if (!isDisabled) {
      setIsHovered(true);
      if (onHover) {
        onHover(date);
      }
    }
  }, [isDisabled, onHover, date]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    if (onHover) {
      onHover(null);
    }
  }, [onHover]);

  const handleKeyDown = useCallback((e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !isDisabled) {
      e.preventDefault();
      handleClick();
    }
  }, [isDisabled, handleClick]);

  // ========== COMPUTED ==========

  // If no date, render empty cell (outside current month)
  if (!date) {
    return html`<div class="w-full md:w-[42px]" data-name="dayCellEmpty" />`;
  }

  // Memoize day number extraction
  const dayNumber = useMemo(() => date.getDate(), [date]);

  // Memoize aria-label
  const ariaLabel = useMemo(
    () => `${dayNumber} ${isToday ? '(Hoy)' : ''}`,
    [dayNumber, isToday],
  );

  // Wrapper classes (100% width of parent, auto height) - handles range background
  const wrapperClasses = useMemo(() => {
    const base = 'w-full my-[4px] flex items-center justify-center';

    // In Range: gray background for full wrapper
    if (isInRange) {
      return `${base} bg-[var(--color-gray-100)]`;
    }

    // Range Start: gray background right half only (when there's a range or hover)
    if (isRangeStart && !isRangeEnd) {
      return `${base} bg-gradient-to-r from-transparent from-50% to-[var(--color-gray-100)] to-50%`;
    }

    // Range End (actual or hover): gray background left half only
    if ((isRangeEnd || isHoverEnd) && !isRangeStart) {
      return `${base} bg-gradient-to-l from-transparent from-50% to-[var(--color-gray-100)] to-50%`;
    }

    // Default: no background
    return base;
  }, [isInRange, isRangeStart, isRangeEnd, isHoverEnd]);

  // Button classes (30x30) - handles visual states
  const buttonClasses = useMemo(() => {
    const base = BASE_BUTTON_CLASSES;

    // Disabled + Today: show today border even when disabled
    if (isDisabled && isToday) {
      return `${base} cursor-not-allowed border-2 border-[var(--brand-primary)] text-[var(--text-normal-secondary)] bg-background-card-lighter`;
    }

    // Disabled state
    if (isDisabled) {
      return `${base} cursor-not-allowed text-[var(--text-normal-secondary)]`;
    }

    // Selected (departure or return) - black bg, white text
    if (isSelected || isRangeStart || isRangeEnd) {
      return `${base} cursor-pointer bg-[var(--brand-primary)] text-[var(--text-normal-lighter)]`;
    }

    // Hover or Hover End: black bg, white text (priority over inRange)
    if (isHovered || isHoverEnd) {
      return `${base} cursor-pointer bg-[var(--brand-primary)] text-[var(--text-normal-lighter)]`;
    }

    // In Range only (not start/end) - TRANSPARENT, black text
    if (isInRange) {
      return `${base} cursor-pointer bg-transparent text-[var(--text-normal-primary)]`;
    }

    // Today (not selected) - black border, no bg
    if (isToday) {
      return `${base} cursor-pointer border-2 border-[var(--brand-primary)] text-[var(--brand-primary)] bg-background-card-lighter`;
    }

    // With pricing: bg color by category
    if (pricingCategory) {
      let pricingBg = '';
      if (pricingCategory === 'low') {
        pricingBg = 'bg-[var(--price-indicator-low)]';
      } else if (pricingCategory === 'medium') {
        pricingBg = 'bg-[var(--price-indicator-medium)]';
      } else if (pricingCategory === 'high') {
        pricingBg = 'bg-[var(--price-indicator-high)]';
      }
      return `${base} cursor-pointer ${pricingBg} text-[var(--text-normal-primary)]`;
    }

    // Default: black text, no bg
    return `${base} cursor-pointer text-[var(--text-normal-primary)]`;
  }, [isDisabled, isSelected, isInRange,
    isRangeStart, isRangeEnd, isHoverEnd, isToday, isHovered, pricingCategory]);

  // ========== RENDER ==========
  return html`
    <div 
      class="w-full md:w-[42px] ${customClassName}"
      data-name="dayCellContainer"
    >
      <div 
        class=${wrapperClasses}
        data-name="dayCellWrapper"
      >
        <button
          type="button"
          class=${buttonClasses}
          data-name="dayCell"
          data-date=${date.toISOString()}
          onClick=${handleClick}
          onMouseEnter=${handleMouseEnter}
          onMouseLeave=${handleMouseLeave}
          onKeyDown=${handleKeyDown}
          disabled=${isDisabled}
          aria-label=${ariaLabel}
          aria-selected=${isSelected || isRangeStart || isRangeEnd}
          aria-disabled=${isDisabled}
          tabIndex=${isDisabled ? -1 : 0}
          role="button"
          ...${rest}
        >
          ${dayNumber}
        </button>
      </div>
    </div>
  `;
};

export default DayCell;
