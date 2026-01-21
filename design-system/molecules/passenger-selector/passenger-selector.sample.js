import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { PassengerSelector } from './passenger-selector.js';

const html = htm.bind(h);

/**
 * PassengerSelectorSample - Showcase de PassengerSelector
 */
export const PassengerSelectorSample = () => {
  const [passengers, setPassengers] = useState({
    adults: 1,
    youth: 0,
    children: 0,
    infants: 0,
    cabinClass: false,
  });

  const [error, setError] = useState(null);

  const handleChange = (newPassengers) => {
    console.log('Passengers changed:', newPassengers);
    setPassengers(newPassengers);
    setError(null); // Clear error on valid change
  };

  const handleError = (errorMessage) => {
    console.error('Validation error:', errorMessage);
    setError(errorMessage);
  };

  return html`
    <div class="flex flex-col gap-[var(--spacing-x-x-large)] p-[var(--spacing-x-large)]">
      <!-- Header -->
      <div>
        <h1 class="text-[var(--heading-h600-size)] font-[var(--heading-h600-weight)] text-[var(--text-normal-primary)] mb-[var(--spacing-small)]">
          PassengerSelector Component
        </h1>
        <p class="text-[var(--paragraph-p300-size)] text-[var(--text-normal-secondary)]">
          Selector de pasajeros con reglas de validación complejas usando Incrementer de @dropins/tools
        </p>
      </div>

      <!-- Default Usage -->
      <section>
        <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-medium)] text-[var(--text-normal-primary)]">
          Uso Básico
        </h2>
        <div class="max-w-md">
          <${PassengerSelector}
            value=${passengers}
            onChange=${handleChange}
            onError=${handleError}
          />
        </div>
      </section>

      <!-- Current Selection Display -->
      <section>
        <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-medium)] text-[var(--text-normal-primary)]">
          Selección Actual
        </h2>
        <div class="p-[var(--spacing-medium)] bg-[var(--bg-page-light)] rounded-[var(--border-radius-medium)] max-w-md">
          <pre class="text-[var(--paragraph-p200-size)]">
${JSON.stringify(passengers, null, 2)}
          </pre>
        </div>
      </section>

      <!-- Without Cabin Class -->
      <section>
        <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-medium)] text-[var(--text-normal-primary)]">
          Sin Clase Cabina
        </h2>
        <div class="max-w-md">
          <${PassengerSelector}
            value=${{ adults: 2, youth: 0, children: 0, infants: 0, cabinClass: false }}
            onChange=${() => {}}
            showCabinClass=${false}
          />
        </div>
      </section>

      <!-- Validation Rules Demo -->
      <section>
        <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-medium)] text-[var(--text-normal-primary)]">
          Reglas de Validación
        </h2>
        <div class="flex flex-col gap-[var(--spacing-large)]">
          <!-- Regla 1: Adults 1-9 -->
          <div class="border-2 border-[var(--border-stroke-default)] rounded-lg p-[var(--spacing-medium)]">
            <h3 class="text-[var(--paragraph-p300-size)] font-bold mb-[var(--spacing-small)]">
              Regla 1: Adultos (1-9)
            </h3>
            <p class="text-[var(--paragraph-p200-size)] text-[var(--text-normal-secondary)] mb-[var(--spacing-medium)]">
              Mínimo 1 adulto, máximo 9 adultos
            </p>
            <${PassengerSelector}
              value=${{ adults: 5, youth: 0, children: 0, infants: 0, cabinClass: false }}
              onChange=${() => console.log('Changed')}
              showCabinClass=${false}
            />
          </div>

          <!-- Regla 2: Youth + Children max 8 -->
          <div class="border-2 border-[var(--border-stroke-default)] rounded-lg p-[var(--spacing-medium)]">
            <h3 class="text-[var(--paragraph-p300-size)] font-bold mb-[var(--spacing-small)]">
              Regla 2: Jóvenes + Niños (max 8)
            </h3>
            <p class="text-[var(--paragraph-p200-size)] text-[var(--text-normal-secondary)] mb-[var(--spacing-medium)]">
              Suma de jóvenes y niños no puede exceder 8
            </p>
            <${PassengerSelector}
              value=${{ adults: 1, youth: 4, children: 3, infants: 0, cabinClass: false }}
              onChange=${() => console.log('Changed')}
              onError=${(err) => console.error(err)}
              showCabinClass=${false}
            />
          </div>

          <!-- Regla 3: Infants max 1 per adult -->
          <div class="border-2 border-[var(--border-stroke-default)] rounded-lg p-[var(--spacing-medium)]">
            <h3 class="text-[var(--paragraph-p300-size)] font-bold mb-[var(--spacing-small)]">
              Regla 3: Infantes (max 1 por adulto)
            </h3>
            <p class="text-[var(--paragraph-p200-size)] text-[var(--text-normal-secondary)] mb-[var(--spacing-medium)]">
              Número de infantes no puede exceder número de adultos
            </p>
            <${PassengerSelector}
              value=${{ adults: 2, youth: 0, children: 0, infants: 2, cabinClass: false }}
              onChange=${() => console.log('Changed')}
              onError=${(err) => console.error(err)}
              showCabinClass=${false}
            />
          </div>

          <!-- Regla 4: Total max 9 -->
          <div class="border-2 border-[var(--border-stroke-default)] rounded-lg p-[var(--spacing-medium)]">
            <h3 class="text-[var(--paragraph-p300-size)] font-bold mb-[var(--spacing-small)]">
              Regla 4: Total Pasajeros (max 9)
            </h3>
            <p class="text-[var(--paragraph-p200-size)] text-[var(--text-normal-secondary)] mb-[var(--spacing-medium)]">
              Suma total de todos los pasajeros no puede exceder 9
            </p>
            <${PassengerSelector}
              value=${{ adults: 5, youth: 2, children: 2, infants: 0, cabinClass: false }}
              onChange=${() => console.log('Changed')}
              onError=${(err) => console.error(err)}
              showCabinClass=${false}
            />
          </div>
        </div>
      </section>

      <!-- With Cabin Class -->
      <section>
        <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-medium)] text-[var(--text-normal-primary)]">
          Con Clase Cabina
        </h2>
        <div class="max-w-md">
          <${PassengerSelector}
            value=${{ adults: 2, youth: 1, children: 0, infants: 0, cabinClass: true }}
            onChange=${() => console.log('Changed with cabin class')}
          />
        </div>
      </section>

      <!-- Error Handling Demo -->
      <section>
        <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-medium)] text-[var(--text-normal-primary)]">
          Manejo de Errores
        </h2>
        <div class="max-w-md">
          <${PassengerSelector}
            value=${passengers}
            onChange=${handleChange}
            onError=${handleError}
          />
          ${error && html`
            <div class="mt-[var(--spacing-medium)] p-[var(--spacing-medium)] bg-red-50 border-2 border-red-200 rounded-lg">
              <h3 class="font-bold text-red-700 mb-[var(--spacing-x-small)]">Error detectado:</h3>
              <p class="text-[var(--paragraph-p200-size)] text-red-600">${error}</p>
            </div>
          `}
        </div>
      </section>

      <!-- Edge Cases -->
      <section>
        <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-medium)] text-[var(--text-normal-primary)]">
          Casos Extremos
        </h2>
        <div class="flex flex-col gap-[var(--spacing-medium)]">
          <!-- Mínimo pasajeros (1 adulto) -->
          <div class="border-2 border-[var(--border-stroke-default)] rounded-lg p-[var(--spacing-medium)]">
            <h3 class="text-[var(--paragraph-p300-size)] font-bold mb-[var(--spacing-small)]">
              Mínimo: 1 Adulto
            </h3>
            <${PassengerSelector}
              value=${{ adults: 1, youth: 0, children: 0, infants: 0, cabinClass: false }}
              onChange=${() => {}}
              showCabinClass=${false}
            />
          </div>

          <!-- Máximo pasajeros (9 adultos) -->
          <div class="border-2 border-[var(--border-stroke-default)] rounded-lg p-[var(--spacing-medium)]">
            <h3 class="text-[var(--paragraph-p300-size)] font-bold mb-[var(--spacing-small)]">
              Máximo: 9 Adultos
            </h3>
            <${PassengerSelector}
              value=${{ adults: 9, youth: 0, children: 0, infants: 0, cabinClass: false }}
              onChange=${() => {}}
              showCabinClass=${false}
            />
          </div>

          <!-- Familia típica (2 adultos + 2 niños) -->
          <div class="border-2 border-[var(--border-stroke-default)] rounded-lg p-[var(--spacing-medium)]">
            <h3 class="text-[var(--paragraph-p300-size)] font-bold mb-[var(--spacing-small)]">
              Familia Típica: 2 Adultos + 2 Niños
            </h3>
            <${PassengerSelector}
              value=${{ adults: 2, youth: 0, children: 2, infants: 0, cabinClass: false }}
              onChange=${() => {}}
              showCabinClass=${false}
            />
          </div>

          <!-- Con infantes (2 adultos + 2 infantes) -->
          <div class="border-2 border-[var(--border-stroke-default)] rounded-lg p-[var(--spacing-medium)]">
            <h3 class="text-[var(--paragraph-p300-size)] font-bold mb-[var(--spacing-small)]">
              Con Infantes: 2 Adultos + 2 Infantes
            </h3>
            <${PassengerSelector}
              value=${{ adults: 2, youth: 0, children: 0, infants: 2, cabinClass: false }}
              onChange=${() => {}}
              showCabinClass=${false}
            />
          </div>
        </div>
      </section>

      <!-- Usage Instructions -->
      <section class="border-t pt-[var(--spacing-x-large)]">
        <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-medium)] text-[var(--text-normal-primary)]">
          Instrucciones de Uso
        </h2>
        <div class="bg-[var(--bg-page-light)] p-[var(--spacing-medium)] rounded-[var(--border-radius-medium)]">
          <h3 class="font-bold mb-[var(--spacing-small)]">Props:</h3>
          <ul class="list-disc list-inside space-y-[var(--spacing-x-small)] text-[var(--paragraph-p200-size)]">
            <li><code>value</code>: Objeto con conteo { adults, youth, children, infants, cabinClass }</li>
            <li><code>onChange</code>: Callback al cambiar (passengerData) => void</li>
            <li><code>onError</code>: Callback de validación (errorMessage) => void</li>
            <li><code>showCabinClass</code>: Mostrar checkbox de clase cabin (default: true)</li>
          </ul>
          
          <h3 class="font-bold mt-[var(--spacing-medium)] mb-[var(--spacing-small)]">Reglas de Validación:</h3>
          <ul class="list-disc list-inside space-y-[var(--spacing-x-small)] text-[var(--paragraph-p200-size)]">
            <li><strong>Adultos:</strong> 1-9 (mínimo 1, máximo 9)</li>
            <li><strong>Jóvenes + Niños:</strong> Máximo 8 en total</li>
            <li><strong>Infantes:</strong> Máximo 1 por adulto</li>
            <li><strong>Total:</strong> Máximo 9 pasajeros</li>
          </ul>
          
          <h3 class="font-bold mt-[var(--spacing-medium)] mb-[var(--spacing-small)]">Estructura de Datos:</h3>
          <pre class="bg-white p-[var(--spacing-small)] rounded mt-[var(--spacing-x-small)] overflow-x-auto text-[var(--paragraph-p200-size)]">
${`{
  adults: 1,      // 12+ años (1-9)
  youth: 0,       // 12-17 años (0-8)
  children: 0,    // 2-11 años (0-8)
  infants: 0,     // 0-2 años (0-adults)
  cabinClass: false // Checkbox
}`}
          </pre>
          
          <h3 class="font-bold mt-[var(--spacing-medium)] mb-[var(--spacing-small)]">Uso típico:</h3>
          <pre class="bg-white p-[var(--spacing-small)] rounded mt-[var(--spacing-x-small)] overflow-x-auto text-[var(--paragraph-p200-size)]">
${`<\${PassengerSelector}
  value=\${passengers}
  onChange=\${setPassengers}
  onError=\${handleError}
  showCabinClass=\${true}
/>`}
          </pre>
        </div>
      </section>
    </div>
  `;
};

export default PassengerSelectorSample;
