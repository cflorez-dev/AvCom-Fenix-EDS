import { h } from '@dropins/tools/preact.js';
import { useCallback, useMemo } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';

const html = htm.bind(h);

/**
 * Incrementer - Numeric control with circular icons
 *
 * ## Props
 * - `value`: `number` – Current value (default: 0).
 * - `min`: `number` – Minimum allowed value (default: 0).
 * - `max`: `number` – Maximum allowed value (default: 99).
 * - `onChange`: `function` – Callback when value changes (newValue) => void.
 * - `disabled`: `boolean` – If disabled (default: false).
 * - `label`: `string` – Optional label for accessibility.
 * - `customClassName`: `string` – Additional CSS classes.
 * - `...rest`: Other properties.
 *
 * ## Design (Figma node-id: 12284-13229)
 * - Buttons: 33.8px circular with Remove/Add linear icons
 * - Number: min-w-40, text-2xl (24px), font-bold, Red Hat Display
 * - Gap: 4px (gap-1)
 * - States:
 *   - On: Color #1b1b1b (black)
 *   - Off: Color #969696 (disabled gray)
 *
 * ## Usage Example
 * ```javascript
 * <${Incrementer}
 *   value=${count}
 *   min=${0}
 *   max=${9}
 *   onChange=${setCount}
 *   label="Adults"
 * />
 * ```
 */
export const Incrementer = ({
  value = 0,
  min = 0,
  max = 99,
  onChange,
  disabled = false,
  label = '',
  customClassName = '',
  ...rest
}) => {
  // ========== COMPUTED VALUES ==========
  const currentValue = useMemo(() => Number(value), [value]);

  const isDecrementDisabled = useMemo(
    () => disabled || currentValue <= min,
    [disabled, currentValue, min],
  );

  const isIncrementDisabled = useMemo(
    () => disabled || currentValue >= max,
    [disabled, currentValue, max],
  );

  // Aria labels
  const decrementAriaLabel = useMemo(
    () => (label ? `Decrease ${label}` : 'Decrease'),
    [label],
  );

  const incrementAriaLabel = useMemo(
    () => (label ? `Increase ${label}` : 'Increase'),
    [label],
  );

  // ========== EVENT HANDLERS ==========
  const handleDecrement = useCallback(() => {
    if (disabled || currentValue <= min || !onChange) return;
    onChange(currentValue - 1);
  }, [disabled, currentValue, min, onChange]);

  const handleIncrement = useCallback(() => {
    if (disabled || currentValue >= max || !onChange) return;
    onChange(currentValue + 1);
  }, [disabled, currentValue, max, onChange]);

  // ========== RENDER ==========
  return html`
    <div
      class="inline-flex justify-center items-center gap-[4px] ${customClassName}"
      data-name="incrementer"
      ...${rest}
    >
      <!-- Decrease Button (Remove icon) -->
      <button
        type="button"
        class="flex items-center transition-opacity duration-200 rounded-full
            ${isDecrementDisabled ? 'text-border-default' : 'cursor-pointer text-[var(--text-normal-primary)] hover:text-[var(--color-border-input-positive)]'}
            focus-visible:outline-border-stroke-focus focus-visible:text-[var(--color-border-input-positive)]
          "
        onClick=${handleDecrement}
        disabled=${isDecrementDisabled}
        aria-label=${decrementAriaLabel}
        aria-disabled=${isDecrementDisabled}
        data-state=${isDecrementDisabled ? 'Off' : 'On'}
      >
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="presentation">
        <path d="M13 2.16699C14.4985 2.16699 15.9067 2.4509 17.2246 3.01953C18.5427 3.58828 19.69 4.35996 20.665 5.33496C21.64 6.30996 22.4117 7.45734 22.9805 8.77539C23.5491 10.0933 23.833 11.5016 23.833 13C23.833 14.4985 23.5491 15.9067 22.9805 17.2246C22.4117 18.5427 21.64 19.69 20.665 20.665C19.69 21.64 18.5427 22.4117 17.2246 22.9805C15.9067 23.5491 14.4984 23.833 13 23.833C11.5015 23.833 10.0933 23.5491 8.77539 22.9805C7.45734 22.4117 6.30996 21.64 5.33496 20.665C4.35996 19.69 3.58828 18.5427 3.01953 17.2246C2.4509 15.9067 2.16699 14.4985 2.16699 13C2.16699 11.5016 2.4509 10.0933 3.01953 8.77539C3.58828 7.45734 4.35996 6.30996 5.33496 5.33496C6.30996 4.35996 7.45733 3.58828 8.77539 3.01953C10.0933 2.4509 11.5015 2.16699 13 2.16699ZM13 4.33301C10.5806 4.33301 8.53171 5.17337 6.85254 6.85254C5.17337 8.53171 4.33301 10.5806 4.33301 13C4.33301 15.4194 5.17337 17.4683 6.85254 19.1475C8.53171 20.8266 10.5806 21.667 13 21.667C15.4194 21.667 17.4683 20.8266 19.1475 19.1475C20.8266 17.4683 21.667 15.4194 21.667 13C21.667 10.5806 20.8266 8.53171 19.1475 6.85254C17.4683 5.17337 15.4194 4.33301 13 4.33301ZM18.417 11.917V14.083H7.58301V11.917H18.417Z"
        fill="currentColor"/>
      </svg>
      </button>

      <!-- Number Display -->
      <p class="min-w-[40px] text-center text-text-normal-primary font-bold leading-[normal] !m-0 min-h-[32px]">
        ${currentValue}
      </p>

      <!-- Increase Button (Add icon) -->
      <button
        type="button"
        class="flex items-center transition-opacity duration-200 rounded-full
              ${isIncrementDisabled ? 'text-[#969696]' : 'cursor-pointer text-[var(--text-normal-primary)] hover:text-[var(--color-border-input-positive)]'}
              focus-visible:outline-border-stroke-focus focus-visible:text-[var(--color-border-input-positive)]
              "
        onClick=${handleIncrement}
        disabled=${isIncrementDisabled}
        aria-label=${incrementAriaLabel}
        aria-disabled=${isIncrementDisabled}
        data-state=${isIncrementDisabled ? 'Off' : 'On'}
      >
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="presentation">
        <path d="M13 2.16699C14.4985 2.167 15.9067 2.45088 17.2246 3.01953C18.5425 3.58821 19.6891 4.36015 20.6641 5.33496C21.6391 6.30996 22.4117 7.45733 22.9805 8.77539C23.5491 10.0933 23.833 11.5016 23.833 13C23.833 14.4984 23.5491 15.9067 22.9805 17.2246C22.4117 18.5427 21.6391 19.6891 20.6641 20.6641C19.6891 21.6391 18.5427 22.4117 17.2246 22.9805C15.9067 23.5491 14.4984 23.833 13 23.833C11.5016 23.833 10.0933 23.5491 8.77539 22.9805C7.45733 22.4117 6.30996 21.6391 5.33496 20.6641C4.36015 19.6891 3.58821 18.5425 3.01953 17.2246C2.45088 15.9067 2.167 14.4985 2.16699 13C2.16699 11.5016 2.45092 10.0933 3.01953 8.77539C3.58828 7.45733 4.35996 6.30996 5.33496 5.33496C6.30996 4.35996 7.45733 3.58828 8.77539 3.01953C10.0933 2.45092 11.5016 2.16699 13 2.16699ZM13 4.33301C10.5806 4.33301 8.53073 5.1724 6.85156 6.85156C5.1724 8.53073 4.33301 10.5806 4.33301 13C4.33303 15.4192 5.17268 17.4684 6.85156 19.1475C8.53073 20.8266 10.5806 21.667 13 21.667C15.4194 21.667 17.4683 20.8266 19.1475 19.1475C20.8266 17.4683 21.667 15.4194 21.667 13C21.667 10.5806 20.8266 8.53073 19.1475 6.85156C17.4684 5.17268 15.4192 4.33303 13 4.33301ZM14.083 7.58301V11.917H18.417V14.083H14.083V18.417H11.917V14.083H7.58301V11.917H11.917V7.58301H14.083Z"
        fill="currentColor"/>
      </svg>
      </button>
    </div>
  `;
};

export default Incrementer;
