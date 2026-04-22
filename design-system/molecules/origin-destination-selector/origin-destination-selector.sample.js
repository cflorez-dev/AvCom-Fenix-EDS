import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { OriginDestinationSelector } from './origin-destination-selector.js';

const html = htm.bind(h);

/**
 * OriginDestinationSelectorSample - Showcase de OriginDestinationSelector
 *
 * Muestra:
 * - Desktop: Layout horizontal (Origen + Swap + Destino)
 * - Mobile: Layout vertical (Origen arriba con Swap, Destino abajo)
 * - Auto-open destination después de seleccionar origen
 * - Exclude cities (origen ≠ destino) - Filtrado automático
 * - Swap inteligente
 * - Fetch automático de ciudades desde API con cache
 * - Estados: Empty, Partial (solo origen), Complete (ambos), Swapped
 */
export const OriginDestinationSelectorSample = () => {
  const [route, setRoute] = useState({ origin: null, destination: null });
  const [activeStep, setActiveStep] = useState(null);
  const [routeCompleteLog, setRouteCompleteLog] = useState([]);

  const handleRouteChange = ({ origin, destination }) => {
    setRoute({ origin, destination });
  };

  const handleRouteComplete = ({ origin, destination }) => {
    // Simular auto-open de fechas
    const timestamp = new Date().toLocaleTimeString();
    setRouteCompleteLog((prev) => [
      ...prev,
      `${timestamp}: Ruta completa → ${origin?.name} (${origin?.iataCityCode}) → ${destination?.name} (${destination?.iataCityCode})`,
    ]);
    // En BookingBox real, aquí se abriría el step de fechas:
    // setActiveStep('dates');
  };

  const handleReset = () => {
    setRoute({ origin: null, destination: null });
    setActiveStep(null);
    setRouteCompleteLog([]);
  };

  return html`
    <div class="flex flex-col gap-[var(--spacing-x-x-large)] p-[var(--spacing-x-large)]">
      <!-- Header -->
      <div>
        <h1 class="text-[var(--heading-h600-size)] font-[var(--heading-h600-weight)] text-[var(--text-normal-primary)] mb-[var(--spacing-small)]">
          OriginDestination Selector Component
        </h1>
        <p class="text-[var(--paragraph-p300-size)] text-[var(--text-normal-secondary)]">
          Componente integrado de origen y destino con swap inteligente
        </p>
      </div>

      <!-- Estado Controlado (uso principal) -->
      <section>
        <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-medium)] text-[var(--text-normal-primary)]">
          Modo Controlado (Integración BookingBox)
        </h2>
        <div class="flex flex-col gap-[var(--spacing-medium)]">
          <${OriginDestinationSelector}
            origin=${route.origin}
            destination=${route.destination}
            onRouteChange=${handleRouteChange}
            onRouteComplete=${handleRouteComplete}
            activeStep=${activeStep}
            onStepChange=${setActiveStep}
            autoOpenNext=${true}
            showHeader=${true}
          />

          <!-- Summary & Controls -->
          <div class="flex flex-col gap-[var(--spacing-small)]">
            <!-- Summary -->
            <div class="p-4 bg-[var(--bg-page-light)] rounded-lg text-[var(--paragraph-p200-size)]">
              <p><strong>Origen:</strong> ${route.origin ? route.origin.value : 'No seleccionado'}</p>
              <p><strong>Destino:</strong> ${route.destination ? route.destination.value : 'No seleccionado'}</p>
              <p><strong>Step activo:</strong> ${activeStep || 'Ninguno'}</p>
            </div>

            <!-- Route Complete Log -->
            ${routeCompleteLog.length > 0 && html`
              <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 class="font-bold mb-2 text-green-800">onRouteComplete Events:</h4>
                <ul class="text-sm space-y-1">
                  ${routeCompleteLog.map((log) => html`<li key=${log} class="text-green-700">✅ ${log}</li>`)}
                </ul>
              </div>
            `}

            <!-- Reset Button -->
            <button
              onClick=${handleReset}
              class="px-4 py-2 bg-[var(--brand-primary)] text-white rounded-lg hover:opacity-80 transition-opacity self-start"
            >
              Reset
            </button>
          </div>
        </div>

        <div class="mt-[var(--spacing-medium)] p-[var(--spacing-medium)] bg-[var(--bg-page-light)] rounded-[var(--border-radius-medium)]">
          <h3 class="font-bold mb-[var(--spacing-small)]">Características:</h3>
          <ul class="list-disc list-inside space-y-[var(--spacing-x-small)] text-[var(--paragraph-p200-size)]">
            <li><strong>Fetch automático:</strong> Carga ciudades desde API al iniciar con cache en sessionStorage</li>
            <li><strong>Auto-open destination:</strong> Después de seleccionar origen</li>
            <li><strong>onRouteComplete callback:</strong> Se llama cuando ambos campos están completos (para auto-open fechas)</li>
            <li><strong>Exclude cities:</strong> Filtrado automático - origen no puede ser igual a destino</li>
            <li><strong>Swap inteligente:</strong> Funciona siempre (incluso con campos vacíos), auto-abre campo vacío después de swap</li>
            <li><strong>Desktop:</strong> Layout horizontal (Origen + Swap + Destino)</li>
            <li><strong>Mobile:</strong> Layout vertical (Origen arriba, Destino abajo)</li>
            <li><strong>Integración:</strong> Step modal compatible con BookingBox</li>
          </ul>
        </div>
      </section>
    </div>
  `;
};

export default OriginDestinationSelectorSample;
