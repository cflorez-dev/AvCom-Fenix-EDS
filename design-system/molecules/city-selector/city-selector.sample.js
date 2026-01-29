import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { CitySelector } from './city-selector.js';

const html = htm.bind(h);

// Demo cities data
const DEMO_CITIES = [
  { id: 'CO-BOG-BOG', iataCityCode: 'BOG', name: 'Bogotá', country: 'Colombia', terminal: 'Aeropuerto Internacional El Dorado', value: 'Bogotá, Aeropuerto Internacional El Dorado (BOG)', active: true },
  { id: 'CO-MDE-MDE', iataCityCode: 'MDE', name: 'Medellín', country: 'Colombia', terminal: 'Aeropuerto Internacional José María Córdova', value: 'Medellín, Aeropuerto Internacional José María Córdova (MDE)', active: true },
  { id: 'CO-CLO-CLO', iataCityCode: 'CLO', name: 'Cali', country: 'Colombia', terminal: 'Aeropuerto Internacional Alfonso Bonilla Aragón', value: 'Cali, Aeropuerto Internacional Alfonso Bonilla Aragón (CLO)', active: true },
  { id: 'CO-CTG-CTG', iataCityCode: 'CTG', name: 'Cartagena', country: 'Colombia', terminal: 'Aeropuerto Internacional Rafael Núñez', value: 'Cartagena, Aeropuerto Internacional Rafael Núñez (CTG)', active: true },
  { id: 'CO-BAQ-BAQ', iataCityCode: 'BAQ', name: 'Barranquilla', country: 'Colombia', terminal: 'Aeropuerto Internacional Ernesto Cortissoz', value: 'Barranquilla, Aeropuerto Internacional Ernesto Cortissoz (BAQ)', active: true },
  { id: 'US-MIA-MIA', iataCityCode: 'MIA', name: 'Miami', country: 'Estados Unidos', terminal: 'Aeropuerto Internacional de Miami', value: 'Miami, Aeropuerto Internacional de Miami (MIA)', active: true },
  { id: 'US-JFK-JFK', iataCityCode: 'JFK', name: 'New York', country: 'Estados Unidos', terminal: 'Aeropuerto Internacional John F. Kennedy', value: 'New York, Aeropuerto Internacional John F. Kennedy (JFK)', active: true },
  { id: 'US-LAX-LAX', iataCityCode: 'LAX', name: 'Los Angeles', country: 'Estados Unidos', terminal: 'Aeropuerto Internacional de Los Ángeles', value: 'Los Angeles, Aeropuerto Internacional de Los Ángeles (LAX)', active: true },
  { id: 'ES-MAD-MAD', iataCityCode: 'MAD', name: 'Madrid', country: 'España', terminal: 'Aeropuerto Adolfo Suárez Madrid-Barajas', value: 'Madrid, Aeropuerto Adolfo Suárez Madrid-Barajas (MAD)', active: true },
  { id: 'ES-BCN-BCN', iataCityCode: 'BCN', name: 'Barcelona', country: 'España', terminal: 'Aeropuerto de Barcelona-El Prat', value: 'Barcelona, Aeropuerto de Barcelona-El Prat (BCN)', active: true },
  { id: 'UK-LHR-LHR', iataCityCode: 'LHR', name: 'London', country: 'Reino Unido', terminal: 'Aeropuerto de Londres-Heathrow', value: 'London, Aeropuerto de Londres-Heathrow (LHR)', active: true },
  { id: 'FR-CDG-CDG', iataCityCode: 'CDG', name: 'Paris', country: 'Francia', terminal: 'Aeropuerto de París-Charles de Gaulle', value: 'Paris, Aeropuerto de París-Charles de Gaulle (CDG)', active: true },
  { id: 'BR-GRU-GRU', iataCityCode: 'GRU', name: 'São Paulo', country: 'Brasil', terminal: 'Aeropuerto Internacional de Guarulhos', value: 'São Paulo, Aeropuerto Internacional de Guarulhos (GRU)', active: true },
  { id: 'BR-GIG-GIG', iataCityCode: 'GIG', name: 'Rio de Janeiro', country: 'Brasil', terminal: 'Aeropuerto Internacional de Galeão', value: 'Rio de Janeiro, Aeropuerto Internacional de Galeão (GIG)', active: true },
  { id: 'MX-MEX-MEX', iataCityCode: 'MEX', name: 'Mexico City', country: 'México', terminal: 'Aeropuerto Internacional Benito Juárez', value: 'Mexico City, Aeropuerto Internacional Benito Juárez (MEX)', active: true },
  { id: 'MX-CUN-CUN', iataCityCode: 'CUN', name: 'Cancún', country: 'México', terminal: 'Aeropuerto Internacional de Cancún', value: 'Cancún, Aeropuerto Internacional de Cancún (CUN)', active: true },
  { id: 'PE-LIM-LIM', iataCityCode: 'LIM', name: 'Lima', country: 'Perú', terminal: 'Aeropuerto Internacional Jorge Chávez', value: 'Lima, Aeropuerto Internacional Jorge Chávez (LIM)', active: true },
  { id: 'CL-SCL-SCL', iataCityCode: 'SCL', name: 'Santiago', country: 'Chile', terminal: 'Aeropuerto Internacional Arturo Merino Benítez', value: 'Santiago, Aeropuerto Internacional Arturo Merino Benítez (SCL)', active: true },
  { id: 'AR-EZE-EZE', iataCityCode: 'EZE', name: 'Buenos Aires', country: 'Argentina', terminal: 'Aeropuerto Internacional Ministro Pistarini', value: 'Buenos Aires, Aeropuerto Internacional Ministro Pistarini (EZE)', active: true },
  { id: 'EC-UIO-UIO', iataCityCode: 'UIO', name: 'Quito', country: 'Ecuador', terminal: 'Aeropuerto Internacional Mariscal Sucre', value: 'Quito, Aeropuerto Internacional Mariscal Sucre (UIO)', active: true },
];

/**
 * CitySelectorSample - Showcase de CitySelector en modo step
 *
 * Uso: Siempre dos selectores separados (Origen y Destino)
 *
 * Muestra:
 * - Origen y Destino visibles al mismo tiempo
 * - Se puede seleccionar en cualquier orden
 * - Trigger estilo Input (64px, outline-1, floating label)
 * - Desktop: Trigger editable (búsqueda en trigger, resultados en popup)
 * - Mobile: Trigger display only (búsqueda en modal)
 * - Required en todas las instancias
 */
export const CitySelectorSample = () => {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);

  const handleClose = () => {
    // En un caso real, esto cerraría el BookingBox completo
    setOrigin(null);
    setDestination(null);
  };

  return html`
    <div class="flex flex-col gap-[var(--spacing-x-x-large)] p-[var(--spacing-x-large)]">
      <!-- Header -->
      <div>
        <h1 class="text-[var(--heading-h600-size)] font-[var(--heading-h600-weight)] text-[var(--text-normal-primary)] mb-[var(--spacing-small)]">
          CitySelector Component
        </h1>
        <p class="text-[var(--paragraph-p300-size)] text-[var(--text-normal-secondary)]">
          Selector de ciudades con búsqueda, filtrado en tiempo real y highlighting
        </p>
      </div>

      <!-- Origen y Destino (Ambos visibles) -->
      <section>
        <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-medium)] text-[var(--text-normal-primary)]">
          Origen y Destino (Ambos visibles)
        </h2>
        <div class="flex flex-col gap-[var(--spacing-medium)] max-w-2xl">
          <!-- Origen -->
          <div>
            <${CitySelector}
              value=${origin}
              cities=${DEMO_CITIES}
              label="Origen"
              onChange=${setOrigin}
              isStandalone=${false}
              onClose=${handleClose}
              stepTitle="¿Desde dónde viajas?"
              showHeader=${true}
              required
            />
          </div>

          <!-- Destino -->
          <div>
            <${CitySelector}
              value=${destination}
              cities=${DEMO_CITIES}
              label="Destino"
              onChange=${setDestination}
              isStandalone=${false}
              onClose=${handleClose}
              stepTitle="¿A dónde viajas?"
              showHeader=${true}
              required
              iconInputName="action/plane-landing"
            />
          </div>

          <!-- Summary -->
          ${(origin || destination) && html`
            <div class="p-4 bg-[var(--bg-page-light)] rounded-lg text-[var(--paragraph-p200-size)]">
              <p><strong>Origen:</strong> ${origin ? origin.value : 'No seleccionado'}</p>
              <p><strong>Destino:</strong> ${destination ? destination.value : 'No seleccionado'}</p>
            </div>
          `}
        </div>
        <div class="mt-[var(--spacing-medium)] p-[var(--spacing-medium)] bg-[var(--bg-page-light)] rounded-[var(--border-radius-medium)]">
          <h3 class="font-bold mb-[var(--spacing-small)]">Características:</h3>
          <ul class="list-disc list-inside space-y-[var(--spacing-x-small)] text-[var(--paragraph-p200-size)]">
            <li>Ambos selectores visibles al mismo tiempo</li>
            <li>Se puede seleccionar en cualquier orden (origen primero o destino primero)</li>
            <li>Integración con BookingBox (isStandalone=false)</li>
            <li>Header personalizable con título del step</li>
            <li>Control de cierre (onClose) desde el padre</li>
            <li>Required por defecto - todas las ciudades son obligatorias</li>
            <li><strong>Desktop:</strong> Escribe directamente en el trigger, popup muestra resultados</li>
            <li><strong>Mobile:</strong> Click abre modal full-screen, búsqueda dentro del modal</li>
          </ul>
        </div>
      </section>

      <!-- Estado Disabled (Solo para referencia) -->
      <section>
        <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-medium)] text-[var(--text-normal-primary)]">
          Estado Disabled (Solo para referencia)
        </h2>
        <div class="max-w-md">
          <${CitySelector}
            label="Ciudad deshabilitada"
            value=${{ id: 'CO-BOG-BOG', iataCityCode: 'BOG', name: 'Bogotá', country: 'Colombia', terminal: 'Aeropuerto Internacional El Dorado', value: 'Bogotá, Aeropuerto Internacional El Dorado (BOG)' }}
            cities=${DEMO_CITIES}
            onChange=${() => {}}
            disabled
            required
          />
        </div>
      </section>
    </div>
  `;
};

export default CitySelectorSample;
