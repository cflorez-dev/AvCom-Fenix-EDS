import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { TripTypeToggle } from './trip-type-toggle.js';

const html = htm.bind(h);

/**
 * TripTypeToggleSample - Showcase de TripTypeToggle
 */
export const TripTypeToggleSample = () => {
  const [tripType1, setTripType1] = useState('round-trip');
  const [tripType2, setTripType2] = useState('one-way');
  const [tripType3, setTripType3] = useState('round-trip');

  return html`
    <div class="flex flex-col gap-[var(--spacing-x-x-large)] p-[var(--spacing-x-large)]">
      <!-- Header -->
      <div>
        <h1 class="text-[var(--heading-h600-size)] font-[var(--heading-h600-weight)] text-[var(--text-normal-primary)] mb-[var(--spacing-small)]">
          TripTypeToggle Component
        </h1>
        <p class="text-[var(--paragraph-p300-size)] text-[var(--text-normal-secondary)]">
          Segmented Control para seleccionar tipo de viaje (Figma node-id: 2742-6596)
        </p>
      </div>

      <!-- Ejemplo interactivo 1: Ida y vuelta seleccionado -->
      <section>
        <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-medium)] text-[var(--text-normal-primary)]">
          Ejemplo 1: "Ida y vuelta" seleccionado (Estado 1 y 3)
        </h2>
        <div class="flex flex-col gap-[var(--spacing-small)]">
          <${TripTypeToggle}
            value=${tripType1}
            onChange=${setTripType1}
          />
          <p class="text-[var(--paragraph-p200-size)] text-[var(--text-normal-secondary)]">
            Valor actual: <strong>${tripType1}</strong>
          </p>
          <p class="text-sm text-[var(--text-normal-secondary)]">
            Prueba: Haz click en "Solo ida" o usa Tab + Enter para cambiar
          </p>
        </div>
      </section>
      
      <!-- Ejemplo interactivo 2: Con 3 opciones personalizadas -->
      <section>
        <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-medium)] text-[var(--text-normal-primary)]">
          Ejemplo 2: Con 3 opciones personalizadas
        </h2>
        <div class="flex flex-col gap-[var(--spacing-small)]">
          <${TripTypeToggle}
            options=${[
              { value: 'round-trip', label: 'Ida y vuelta' },
              { value: 'one-way', label: 'Solo ida' },
              { value: 'multi-city', label: 'Multidestino' }
            ]}
            value=${tripType2}
            onChange=${setTripType2}
          />
          <p class="text-[var(--paragraph-p200-size)] text-[var(--text-normal-secondary)]">
            Valor actual: <strong>${tripType2}</strong>
          </p>
        </div>
      </section>

      <!-- Con Custom ClassName -->
      <section>
        <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-medium)] text-[var(--text-normal-primary)]">
          Con Custom ClassName (shadow-lg adicional)
        </h2>
        <${TripTypeToggle}
          value=${tripType3}
          onChange=${setTripType3}
          customClassName="shadow-lg"
        />
      </section>
    </div>
  `;
};

export default TripTypeToggleSample;
