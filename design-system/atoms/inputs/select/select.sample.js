import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Select } from './select.js';

const html = htm.bind(h);

// Sample options
const sampleOptions = [
  { value: 'option1', label: 'label' },
  { value: 'option2', label: 'label' },
  { value: 'option3', label: 'label' },
  { value: 'option4', label: 'label' },
  { value: 'option5', label: 'label' },
];

/**
 * SelectSample - Showcase component demonstrating all Select states and variants
 */
export const SelectSample = () => {
  const [normalValue, setNormalValue] = useState('');
  const [successValue, setSuccessValue] = useState('');
  const [errorValue, setErrorValue] = useState('');
  const [filledValue, setFilledValue] = useState('option1');
  const [disabledValue, setDisabledValue] = useState('option1');
  const [readonlyValue, setReadonlyValue] = useState('option1');
  const [interactiveOriginValue, setInteractiveOriginValue] = useState('');
  const [interactiveDestinationValue, setInteractiveDestinationValue] = useState('');

  return html`
    <div class="p-8 space-y-12 bg-white">
      <div>
        <h2 class="text-2xl font-bold mb-6 text-[var(--text-normal-primary)]">
          Select Component - All States
        </h2>
        <p class="text-[var(--text-normal-secondary)] mb-8">
          Custom dropdown selector with multiple states, keyboard navigation, and accessibility features.
        </p>
      </div>

      <!-- Normal State -->
      <div>
        <h3 class="text-lg font-semibold mb-4 text-[var(--text-normal-primary)]">
          Normal State
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <${Select}
            label="label"
            placeholder="label*"
            options=${sampleOptions}
            value=${normalValue}
            onChange=${setNormalValue}
            state="normal"
            helperText="Helper Text"
            required=${true}
            iconName="action/plane"
          />
        </div>
      </div>

      <!-- Success State -->
      <div>
        <h3 class="text-lg font-semibold mb-4 text-[var(--text-normal-primary)]">
          Success State
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <${Select}
            label="label"
            placeholder="label*"
            options=${sampleOptions}
            value=${successValue}
            onChange=${setSuccessValue}
            state="success"
            helperText="Helper Text"
            required=${true}
            iconName="action/plane"
          />
        </div>
      </div>

      <!-- Error State -->
      <div>
        <h3 class="text-lg font-semibold mb-4 text-[var(--text-normal-primary)]">
          Error State
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <${Select}
            label="label"
            placeholder="label*"
            options=${sampleOptions}
            value=${errorValue}
            onChange=${setErrorValue}
            state="error"
            helperText="Helper Text"
            required=${true}
            iconName="action/plane"
          />
        </div>
      </div>

      <!-- With Value -->
      <div>
        <h3 class="text-lg font-semibold mb-4 text-[var(--text-normal-primary)]">
          With Selected Value
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <${Select}
            label="label"
            placeholder="label*"
            options=${sampleOptions}
            value=${filledValue}
            onChange=${setFilledValue}
            state="normal"
            helperText="Helper Text"
            required=${true}
            iconName="action/plane"
          />
          <${Select}
            label="label"
            placeholder="label*"
            options=${sampleOptions}
            value=${filledValue}
            onChange=${setFilledValue}
            state="error"
            helperText="Helper Text"
            required=${true}
            iconName="action/plane"
          />
        </div>
      </div>

      <!-- Disabled State -->
      <div>
        <h3 class="text-lg font-semibold mb-4 text-[var(--text-normal-primary)]">
          Disabled State
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <${Select}
            label="label"
            placeholder="label*"
            options=${sampleOptions}
            value=${disabledValue}
            onChange=${setDisabledValue}
            disabled=${true}
            helperText="Helper Text"
            required=${true}
            iconName="action/plane"
          />
        </div>
      </div>

      <!-- Readonly State -->
      <div>
        <h3 class="text-lg font-semibold mb-4 text-[var(--text-normal-primary)]">
          Readonly State
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <${Select}
            label="label"
            placeholder="label*"
            options=${sampleOptions}
            value=${readonlyValue}
            onChange=${setReadonlyValue}
            readonly=${true}
            helperText="Helper Text"
            required=${true}
            iconName="action/plane"
          />
        </div>
      </div>

      <!-- Interactive Examples -->
      <div>
        <h3 class="text-lg font-semibold mb-4 text-[var(--text-normal-primary)]">
          Interactive Examples
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <!-- Normal with real interaction -->
          <${Select}
            label="Select Origin"
            placeholder="Choose your city"
            options=${[
              { value: 'bog', label: 'Bogotá (BOG)' },
              { value: 'mde', label: 'Medellín (MDE)' },
              { value: 'cali', label: 'Cali (CLO)' },
              { value: 'ctg', label: 'Cartagena (CTG)' },
              { value: 'baq', label: 'Barranquilla (BAQ)' },
            ]}
            value=${interactiveOriginValue}
            onChange=${setInteractiveOriginValue}
            state="normal"
            helperText="Select your departure city"
            iconName="action/plane"
          />

          <!-- Success with validation message -->
          <${Select}
            label="Select Destination"
            placeholder="Choose your destination"
            options=${[
              { value: 'mia', label: 'Miami (MIA)' },
              { value: 'nyc', label: 'New York (JFK)' },
              { value: 'mad', label: 'Madrid (MAD)' },
              { value: 'bcn', label: 'Barcelona (BCN)' },
              { value: 'mex', label: 'México (MEX)' },
            ]}
            value=${interactiveDestinationValue}
            onChange=${setInteractiveDestinationValue}
            state="success"
            helperText="Valid destination selected"
            iconName="action/plane"
          />
        </div>
      </div>

      <!-- Keyboard Navigation Info -->
      <div class="border-t pt-8">
        <h3 class="text-lg font-semibold mb-4 text-[var(--text-normal-primary)]">
          Keyboard Navigation
        </h3>
        <ul class="list-disc list-inside space-y-2 text-[var(--text-normal-secondary)]">
          <li><kbd class="px-2 py-1 bg-gray-100 rounded">Tab</kbd> - Focus select</li>
          <li><kbd class="px-2 py-1 bg-gray-100 rounded">Enter</kbd> or <kbd class="px-2 py-1 bg-gray-100 rounded">Space</kbd> - Open/close dropdown or select focused option</li>
          <li><kbd class="px-2 py-1 bg-gray-100 rounded">↓</kbd> - Navigate down in options</li>
          <li><kbd class="px-2 py-1 bg-gray-100 rounded">↑</kbd> - Navigate up in options</li>
          <li><kbd class="px-2 py-1 bg-gray-100 rounded">Esc</kbd> - Close dropdown</li>
        </ul>
      </div>
    </div>
  `;
};

export default SelectSample;
