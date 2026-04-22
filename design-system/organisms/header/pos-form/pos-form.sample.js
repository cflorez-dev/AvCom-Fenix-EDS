import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { PosForm } from './pos-form.js';

const html = htm.bind(h);

// Sample countries with flags
const sampleCountries = [
  { value: 'co', label: 'Colombia (COP)', flag: '🇨🇴' },
  { value: 'cr', label: 'Costa Rica (USD)', flag: '🇨🇷' },
  { value: 'ec', label: 'Ecuador (USD)', flag: '🇪🇨' },
  { value: 'sv', label: 'El Salvador (USD)', flag: '🇸🇻' },
  { value: 'gt', label: 'Guatemala (GTQ)', flag: '🇬🇹' },
  { value: 'mx', label: 'Mexico (MXN)', flag: '🇲🇽' },
  { value: 'pa', label: 'Panama (USD)', flag: '🇵🇦' },
  { value: 'pe', label: 'Peru (PEN)', flag: '🇵🇪' },
];

// Sample languages
const sampleLanguages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Espanol' },
  { value: 'fr', label: 'Francais' },
  { value: 'pt', label: 'Portugues' },
];

/**
 * PosFormSample - Showcase component demonstrating PosForm usage
 */
export const PosFormSample = () => {
  const [selectedData, setSelectedData] = useState(null);
  const [showForm1, setShowForm1] = useState(true);
  const [showForm2, setShowForm2] = useState(true);
  const [showForm3, setShowForm3] = useState(true);

  const handleConfirm = (data) => {
    setSelectedData(data);
    console.log('Form submitted:', data);
  };

  const handleClose = (formNumber) => {
    console.log(`Form ${formNumber} close requested`);
    if (formNumber === 1) setShowForm1(false);
    if (formNumber === 2) setShowForm2(false);
    if (formNumber === 3) setShowForm3(false);
  };

  return html`
    <div class="p-8 space-y-12 bg-white">
      <div>
        <h2 class="text-2xl font-bold mb-6 text-[var(--text-normal-primary)]">
          POS Form Component - Location & Language Selection
        </h2>
        <p class="text-[var(--text-normal-secondary)] mb-4">
          Form for selecting country/region and language with validation and callbacks.
        </p>
        ${selectedData && html`
          <div class="p-4 bg-[var(--bg-page-light)] rounded-lg">
            <p class="font-semibold text-[var(--text-normal-primary)]">Last Selection:</p>
            <p class="text-[var(--text-normal-secondary)]">
              Country: ${selectedData.country} | Language: ${selectedData.language}
            </p>
          </div>
        `}
      </div>

      <!-- Basic Form -->
      ${showForm1 && html`
        <div>
          <h3 class="text-lg font-semibold mb-4 text-[var(--text-normal-primary)]">
            Basic Form
          </h3>
          <div class="max-w-md border-2 border-[var(--border-stroke-default)] rounded-lg p-6">
            <${PosForm}
              countries=${sampleCountries}
              languages=${sampleLanguages}
              onConfirm=${handleConfirm}
              onClose=${() => handleClose(1)}
            />
          </div>
          ${!showForm1 && html`
            <button
              onClick=${() => setShowForm1(true)}
              class="mt-4 px-4 py-2 bg-[var(--brand-primary)] text-white rounded-lg"
            >
              Show Form Again
            </button>
          `}
        </div>
      `}

      <!-- Form with Pre-selected Values -->
      ${showForm2 && html`
        <div>
          <h3 class="text-lg font-semibold mb-4 text-[var(--text-normal-primary)]">
            Form with Pre-selected Values
          </h3>
          <div class="max-w-md border-2 border-[var(--border-stroke-default)] rounded-lg p-6">
            <${PosForm}
              countries=${sampleCountries}
              languages=${sampleLanguages}
              initialCountry="co"
              initialLanguage="es"
              onConfirm=${handleConfirm}
              onClose=${() => handleClose(2)}
            />
          </div>
        </div>
      `}

      <!-- Form in Modal-like Container -->
      ${showForm3 && html`
        <div>
          <h3 class="text-lg font-semibold mb-4 text-[var(--text-normal-primary)]">
            Form in Modal-like Container (No External Margins)
          </h3>
          <div class="max-w-md bg-white rounded-2xl shadow-lg p-8">
            <${PosForm}
              countries=${sampleCountries}
              languages=${sampleLanguages}
              onConfirm=${handleConfirm}
              onClose=${() => handleClose(3)}
            />
          </div>
        </div>
      `}

      <!-- Custom Labels & Text -->
      <div>
        <h3 class="text-lg font-semibold mb-4 text-[var(--text-normal-primary)]">
          Custom Labels & Button Text
        </h3>
        <div class="max-w-md border-2 border-[var(--border-stroke-default)] rounded-lg p-6">
          <${PosForm}
            countries=${sampleCountries}
            languages=${sampleLanguages}
            title="Choose Your Settings"
            countryLabel="Select Country"
            countryPlaceholder="Pick a country"
            languageLabel="Select Language"
            languagePlaceholder="Pick a language"
            confirmButtonText="Save Settings"
            onConfirm=${handleConfirm}
            onClose=${() => console.log('Custom form closed')}
          />
        </div>
      </div>

      <!-- Usage Instructions -->
      <div class="border-t pt-8">
        <h3 class="text-lg font-semibold mb-4 text-[var(--text-normal-primary)]">
          Usage Instructions
        </h3>
        <div class="space-y-4 text-[var(--text-normal-secondary)]">
          <div>
            <h4 class="font-semibold text-[var(--text-normal-primary)] mb-2">Props:</h4>
            <ul class="list-disc list-inside space-y-1 ml-4">
              <li><code class="text-sm bg-gray-100 px-1 rounded">countries</code> - Array of countries with value, label, and optional flag</li>
              <li><code class="text-sm bg-gray-100 px-1 rounded">languages</code> - Array of languages with value and label</li>
              <li><code class="text-sm bg-gray-100 px-1 rounded">initialCountry</code> - Pre-selected country value</li>
              <li><code class="text-sm bg-gray-100 px-1 rounded">initialLanguage</code> - Pre-selected language value</li>
              <li><code class="text-sm bg-gray-100 px-1 rounded">onConfirm</code> - Callback (country, language) => void</li>
              <li><code class="text-sm bg-gray-100 px-1 rounded">onClose</code> - Callback when close button clicked</li>
            </ul>
          </div>
          <div>
            <h4 class="font-semibold text-[var(--text-normal-primary)] mb-2">Features:</h4>
            <ul class="list-disc list-inside space-y-1 ml-4">
              <li>✅ Both fields required for form submission</li>
              <li>✅ Success state (green border) when option selected</li>
              <li>✅ Disabled confirm button until both fields filled</li>
              <li>✅ Close button emits onClose event</li>
              <li>✅ Form submission emits onConfirm with data</li>
              <li>✅ No external margins (container controls spacing)</li>
              <li>✅ Fully accessible with keyboard navigation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;
};

export default PosFormSample;
