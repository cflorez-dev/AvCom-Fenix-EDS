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
const languageOptions = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'Inglés' },
  { value: 'pt', label: 'Portugués' },
  { value: 'fr', label: 'Francés' },
];

const longAddressOptions = [
  { value: 'addr1', label: 'Avenida Carrera 68 No. 45-23 Piso 9 Oficina 3, Bogotá' },
  { value: 'addr2', label: 'Calle 100 No. 15-20, Torre Norte, Piso 4, Bogotá' },
];

export const SelectSample = () => {
  const [normalValue, setNormalValue] = useState('');
  const [successValue, setSuccessValue] = useState('');
  const [errorValue, setErrorValue] = useState('');
  const [filledValue, setFilledValue] = useState('option1');
  const [disabledValue, setDisabledValue] = useState('option1');
  const [readonlyValue, setReadonlyValue] = useState('option1');
  const [interactiveOriginValue, setInteractiveOriginValue] = useState('');
  const [interactiveDestinationValue, setInteractiveDestinationValue] = useState('');
  const [darksiteLanguageValue, setDarksiteLanguageValue] = useState('es');
  const [darksiteLightLanguageValue, setDarksiteLightLanguageValue] = useState('es');
  const [truncatedValue, setTruncatedValue] = useState('addr1');
  const [requiredEmptyValue, setRequiredEmptyValue] = useState('');
  const [helperContentValue, setHelperContentValue] = useState('');

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
      <!-- Members Variant — "Label corto y claro" (Reglas de uso: Textos desbordados) -->
      <div>
        <h3 class="text-lg font-semibold mb-4 text-[var(--text-normal-primary)]">
          Members Variant — Label corto y claro
        </h3>
        <p class="text-[var(--text-normal-secondary)] mb-4">
          Si el label no cabe dentro del ancho del campo, el componente amplía su ancho en vez de
          partirlo en dos líneas o truncarlo. Compara con el caso "Normal State" de arriba, donde
          un label largo se desborda del campo.
        </p>
        <div class="flex flex-col gap-6 max-w-[320px]">
          <div>
            <p class="text-xs text-[var(--text-normal-secondary)] mb-2">Label corto (no crece)</p>
            <${Select}
              label="Nacionalidad"
              options=${sampleOptions}
              value=${normalValue}
              onChange=${setNormalValue}
              variant="members"
              required=${true}
            />
          </div>
          <div>
            <p class="text-xs text-[var(--text-normal-secondary)] mb-2">Label largo (amplía el ancho del campo)</p>
            <${Select}
              label="Nacionalidad de tu documento de viajeaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
              options=${sampleOptions}
              value=${normalValue}
              onChange=${setNormalValue}
              variant="members"
              required=${true}
            />
          </div>
        </div>
      </div>

      <!-- Members Variant — "Value truncado" (Reglas de uso: Textos desbordados) -->
      <div>
        <h3 class="text-lg font-semibold mb-4 text-[var(--text-normal-primary)]">
          Members Variant — Value truncado
        </h3>
        <p class="text-[var(--text-normal-secondary)] mb-4">
          El valor seleccionado puede truncarse horizontalmente (una sola línea, con elipsis) cuando
          excede el ancho del campo. Nunca se desborda en múltiples líneas ni se reduce el tamaño de
          fuente para forzar que quepa. Al hacer hover o focus se revela el texto completo mediante un
          tooltip.
        </p>
        <div class="max-w-[320px]">
          <${Select}
            label="Dirección"
            options=${longAddressOptions}
            value=${truncatedValue}
            onChange=${setTruncatedValue}
            variant="members"
            truncateOption=${true}
          />
        </div>
      </div>

      <!-- Members Variant — "Input obligatorio" (Reglas de uso) -->
      <div>
        <h3 class="text-lg font-semibold mb-4 text-[var(--text-normal-primary)]">
          Members Variant — Input obligatorio
        </h3>
        <p class="text-[var(--text-normal-secondary)] mb-4">
          Todo campo obligatorio se identifica con un asterisco (*) junto al label. Si se deja el
          dropdown sin seleccionar tras perder el foco (blur), el campo activa automáticamente el
          estado <code>error</code> y muestra el mensaje "Este campo es obligatorio." en el helper text.
          Haz click en el select y luego fuera de él (sin elegir opción) para ver el error.
        </p>
        <div class="max-w-[320px]">
          <${Select}
            label="Nacionalidad"
            options=${sampleOptions}
            value=${requiredEmptyValue}
            onChange=${setRequiredEmptyValue}
            variant="members"
            required=${true}
          />
        </div>
      </div>

      <!-- Members Variant — "Uso del helper text" (Reglas de uso) -->
      <div>
        <h3 class="text-lg font-semibold mb-4 text-[var(--text-normal-primary)]">
          Members Variant — Uso del helper text
        </h3>
        <p class="text-[var(--text-normal-secondary)] mb-4">
          El helper text ajusta automáticamente su contenido en múltiples líneas (idealmente no más de
          dos) sin desbordarse del ancho del campo. Cuando el campo activa <code>isError</code>, el
          helper text se muestra en su variante de error (con ícono de alerta), reemplazando al mensaje
          informativo — nunca se muestran ambos a la vez.
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <${Select}
            label="Nacionalidad"
            options=${sampleOptions}
            value=${helperContentValue}
            onChange=${setHelperContentValue}
            variant="members"
            helperText="Selecciona la nacionalidad exactamente como aparece en tu documento de viaje vigente."
          />
          <${Select}
            label="Nacionalidad"
            options=${sampleOptions}
            value=""
            variant="members"
            required=${true}
            state="error"
            helperText="Este campo es obligatorio."
          />
        </div>
      </div>

      <!-- Members Variant — Diferencia entre deshabilitado y solo lectura (Reglas de uso) -->
      <div>
        <h3 class="text-lg font-semibold mb-4 text-[var(--text-normal-primary)]">
          Members Variant — Deshabilitado vs. Solo lectura
        </h3>
        <p class="text-[var(--text-normal-secondary)] mb-4">
          Ambos estados impiden cambiar la selección, pero <code>disabled</code> bloquea el foco por completo
          y atenúa el color de texto/ícono, mientras que <code>readonly</code> sigue siendo enfocable por
          teclado (con anillo de foco visible) y conserva un color de texto legible. Presiona Tab para
          navegar entre los dos campos y comprueba la diferencia.
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <${Select}
            label="Deshabilitado (disabled)"
            options=${sampleOptions}
            value="option1"
            variant="members"
            disabled=${true}
            helperText="No es enfocable ni interactuable."
          />
          <${Select}
            label="Solo lectura (readonly)"
            options=${sampleOptions}
            value="option1"
            variant="members"
            readonly=${true}
            helperText="Enfocable por teclado; no abre el dropdown."
          />
        </div>
      </div>

      <!-- Info Tooltip Icon -->
      <div>
        <h3 class="text-lg font-semibold mb-4 text-[var(--text-normal-primary)]">
          Info Tooltip Icon (tooltipContent)
        </h3>
        <p class="text-[var(--text-normal-secondary)] mb-4">
          Ícono de información renderizado fuera del borde del campo (a su derecha), tal como indica el
          diseño; muestra un tooltip al hover o focus por teclado.
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <${Select}
            label="Nacionalidad"
            options=${sampleOptions}
            value=${normalValue}
            onChange=${setNormalValue}
            required=${true}
            tooltipContent="Selecciona la nacionalidad tal como aparece en tu documento de viaje."
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

      <!-- Darksite Language Dropdown (Dark Background) -->
      <div>
        <h3 class="text-lg font-semibold mb-4 text-[var(--text-normal-primary)]">
          Darksite Language Dropdown — Dark Background
        </h3>
        <div class="bg-[#1B1B1B] p-12 rounded-lg flex justify-end">
          <${Select}
            options=${languageOptions}
            value=${darksiteLanguageValue}
            onChange=${setDarksiteLanguageValue}
            theme="darksite-dark"
          />
        </div>
      </div>

      <!-- Darksite Language Dropdown (Light Background) -->
      <div>
        <h3 class="text-lg font-semibold mb-4 text-[var(--text-normal-primary)]">
          Darksite Language Dropdown — Light Background
        </h3>
        <div class="bg-white p-12 rounded-lg border border-[#E0E0E0] flex justify-end">
          <${Select}
            options=${languageOptions}
            value=${darksiteLightLanguageValue}
            onChange=${setDarksiteLightLanguageValue}
            theme="darksite-light"
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
