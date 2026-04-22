import { h } from '@dropins/tools/preact.js';
import {
  useState, useEffect, useMemo, useCallback,
} from '@dropins/tools/preact-hooks.js';
import htm from 'htm';

const html = htm.bind(h);

/**
 * TripTypeToggle - Segmented Control for selecting trip type
 *
 * ## Props
 * - `options`: `Array<{ value: string, label: string }>` – Toggle options.
 * - `value`: `string` – Currently selected value.
 * - `onChange`: `function` – Callback when selection changes.
 * - `customClassName`: `string` – Additional CSS classes.
 * - `...rest`: Other valid properties.
 *
 * ## Design (Figma node-id: 2742-6596)
 * - Container: Background #efefef, padding 2px, rounded 32px
 * - Selected: Background white, medium shadow, bold font, z-index 2
 * - Unselected: Background #efefef, normal font, z-index 1
 * - Height: 48px, Min-width: 130px per option
 *
 * ## States (6 total according to node-id: 2739-32864) in order:
 * 1. **Default-Selected**:
 *    - Background: bg-background-card-lighter
 *    - Shadow: 0px 2px 20px 2px rgba(73,73,73,0.25)
 *    - Font: bold, leading normal
 *    - No outline
 *
 * 2. **Focus-Selected**:
 *    - Background: bg-background-card-lighter
 *    - Shadow: 0px 2px 20px 2px rgba(73,73,73,0.25)
 *    - Font: bold, leading normal
 *    - Outline: outline-2 outline-border-stroke-focus
 *
 * 3. **Default-Unselected**:
 *    - Background: bg-zinc-100
 *    - Shadow: none
 *    - Font: normal, leading-6
 *    - No outline
 *
 * 4. **Hover-Unselected**:
 *    - Background: bg-background-brand-secondary-hover
 *    - Shadow: none
 *    - Font: normal, leading-6
 *    - No outline
 *
 * 5. **Pressed-Unselected**:
 *    - Background: bg-zinc-300
 *    - Shadow: none
 *    - Font: normal, leading-6
 *    - No outline
 *
 * 6. **Focus-Unselected**:
 *    - Background: bg-zinc-100
 *    - Shadow: none
 *    - Font: normal, leading-6
 *    - Outline: outline-2 outline-border-stroke-focus
 *
 * ## Usage Example
 * ```javascript
 * <${TripTypeToggle}
 *   options=${[
 *     { value: 'round-trip', label: 'Round trip' },
 *     { value: 'one-way', label: 'One way' }
 *   ]}
 *   value=${tripType}
 *   onChange=${setTripType}
 * />
 * ```
 */
export const TripTypeToggle = ({
  options,
  value = 'round-trip',
  onChange,
  customClassName = '',
  i18n = {},
  ...rest
}) => {
  // Default options with translations
  const defaultOptions = useMemo(
    () => [
      { value: 'round-trip', label: i18n['bookingBox.labels.roundTrip'] || 'Round trip' },
      { value: 'one-way', label: i18n['bookingBox.labels.oneWay'] || 'One way' },
    ],
    [i18n],
  );

  const finalOptions = useMemo(
    () => options || defaultOptions,
    [options, defaultOptions],
  );

  // Animation state for sliding background
  const [selectedIndex, setSelectedIndex] = useState(
    finalOptions.findIndex((opt) => opt.value === value),
  );

  // Sync animation when value changes externally
  useEffect(() => {
    const newIndex = finalOptions.findIndex((opt) => opt.value === value);
    if (newIndex !== -1 && newIndex !== selectedIndex) {
      setSelectedIndex(newIndex);
    }
  }, [value, finalOptions, selectedIndex]);

  // Performance: Stable handler
  const handleSelect = useCallback((optionValue) => {
    if (onChange && optionValue !== value) {
      onChange(optionValue);
    }
  }, [onChange, value]);

  // Accessibility: Keyboard navigation with arrow keys (radiogroup standard)
  const handleKeyDown = useCallback((e) => {
    const currentIndex = finalOptions.findIndex((opt) => opt.value === value);
    let newIndex = currentIndex;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        newIndex = (currentIndex + 1) % finalOptions.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        newIndex = (currentIndex - 1 + finalOptions.length) % finalOptions.length;
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = finalOptions.length - 1;
        break;
      default:
        return;
    }

    if (newIndex !== currentIndex) {
      handleSelect(finalOptions[newIndex].value);
    }
  }, [finalOptions, value, handleSelect]);

  const ariaLabel = useMemo(
    () => i18n['bookingBox.aria.selectTripType'] || 'Select trip type',
    [i18n],
  );

  // Animation: Background transform
  const backgroundTransform = useMemo(
    () => `translateX(${selectedIndex * 100}%)`,
    [selectedIndex],
  );

  // Performance: Optimize classes with template strings and specific transitions
  const getButtonClasses = useCallback((optionValue) => {
    const isSelected = value === optionValue;

    if (isSelected) {
      // States 1-2: Selected (default + focus)
      return 'z-10 !font-bold';
    }

    // States 3-6: Unselected (default, hover, pressed, focus)
    return 'z-0 bg-transparent font-normal leading-6 hover:bg-background-brand-secondary-hover active:bg-alert-dismiss-hover';
  }, [value]);

  return html`
    <div
      role="radiogroup"
      aria-label=${ariaLabel}
      class="bg-[#efefef] flex isolate items-center p-[2px] rounded-[32px] max-w-max relative ${customClassName}"
      onKeyDown=${handleKeyDown}
      data-name="tripTypeToggle"
      ...${rest}
    >
      <!-- Animated background -->
      <div
        class="absolute top-[2px] left-[2px] min-w-[130px] min-h-[40px] md:min-h-[48px] rounded-[32px] bg-background-card-lighter shadow-[0px_2px_20px_2px_rgba(73,73,73,0.25)] pointer-events-none transition-transform duration-300 ease-in-out"
        style=${{ transform: backgroundTransform }}
      />
  ${finalOptions.map((option) => {
    const isSelected = value === option.value;
    return html`
      <button
        key=${option.value}
        type="button"
        role="radio"
        aria-checked=${isSelected}
        class="inline-flex justify-center items-center min-w-[130px] min-h-[40px] md:min-h-[48px] px-3 py-2 rounded-[32px] shrink-0 relative cursor-pointer text-center focus-visible:outline-2 focus-visible:outline-border-stroke-focus transition-colors ${getButtonClasses(option.value)}"
        onClick=${() => handleSelect(option.value)}
      >
        <div class="flex-1 flex items-center text-center justify-center text-[var(--text-normal-primary)] text-base min-h-[21px] ${isSelected ? 'leading-none' : 'leading-6'}">
          ${option.label}
        </div>
      </button>
    `;
  })}
  </div>
  `;
};

export default TripTypeToggle;
