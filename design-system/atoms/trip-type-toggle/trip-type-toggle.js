import { h } from '@dropins/tools/preact.js';
import htm from 'htm';

const html = htm.bind(h);

/**
 * TripTypeToggle - Segmented Control para seleccionar tipo de viaje
 *
 * ## Props
 * - `options`: `Array<{ value: string, label: string }>` – Opciones del toggle.
 * - `value`: `string` – Valor seleccionado actual.
 * - `onChange`: `function` – Callback cuando cambia la selección.
 * - `customClassName`: `string` – Clases CSS adicionales.
 * - `...rest`: Otras propiedades válidas.
 *
 * ## Diseño (Figma node-id: 2742-6596)
 * - Container: Background #efefef, padding 2px, rounded 32px
 * - Selected: Background white, shadow medium, font bold, z-index 2
 * - Unselected: Background #efefef, font normal, z-index 1
 * - Height: 48px, Min-width: 130px por opción
 *
 * ## Estados (6 total según node-id: 2739-32864) en orden:
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
 * ## Ejemplo de uso
 * ```javascript
 * <${TripTypeToggle}
 *   options=${[
 *     { value: 'round-trip', label: 'Ida y vuelta' },
 *     { value: 'one-way', label: 'Solo ida' }
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
  // Default options con traducciones
  const defaultOptions = [
    { value: 'round-trip', label: i18n['bookingBox.labels.roundTrip'] || 'Ida y vuelta' },
    { value: 'one-way', label: i18n['bookingBox.labels.oneWay'] || 'Solo ida' },
  ];
  const finalOptions = options || defaultOptions;
  // Performance: Handler estable
  const handleSelect = (optionValue) => {
    if (onChange && optionValue !== value) {
      onChange(optionValue);
    }
  };

  // Accessibility: Keyboard navigation con arrow keys (estándar radiogroup)
  const handleKeyDown = (e) => {
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
  };

  // Performance: Optimizar classes con template strings y transiciones específicas
  const getButtonClasses = (optionValue) => {
    const isSelected = value === optionValue;

    if (isSelected) {
      // Estados 1-2: Selected (default + focus)
      return 'z-10 bg-background-card-lighter shadow-[0px_2px_20px_2px_rgba(73,73,73,0.25)] !font-bold';
    }

    // Estados 3-6: Unselected (default, hover, pressed, focus)
    return 'z-0 bg-[#efefef] font-normal leading-6 hover:bg-background-brand-secondary-hover active:bg-zinc-300';
  };

  return html`
    <div
      role="radiogroup"
      aria-label=${i18n['bookingBox.aria.selectTripType'] || 'Selecciona tipo de viaje'}
      class="bg-[#efefef] flex isolate items-center p-[2px] rounded-[32px] max-w-max ${customClassName}"
      onKeyDown=${handleKeyDown}
      data-name="tripTypeToggle"
      ...${rest}
    >
  ${finalOptions.map((option) => {
    const isSelected = value === option.value;
    return html`
      <button
        key=${option.value}
        type="button"
        role="radio"
        aria-checked=${isSelected}
        class="inline-flex justify-center items-center min-w-[130px] min-h-[40px] md:min-h-[48px] px-3 py-2 rounded-[32px] shrink-0 relative cursor-pointer text-center focus-within:outline focus-within:outline-2 focus-within:outline-border-stroke-focus
              transition-[background-color,box-shadow,font-weight]
              ${getButtonClasses(option.value)}"
        onClick=${() => handleSelect(option.value)}
        tabindex=${isSelected ? 0 : -1}
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
