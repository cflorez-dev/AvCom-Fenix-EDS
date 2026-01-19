import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { DateSelector } from './date-selector.js';
import { TripTypeToggle } from '../../atoms/trip-type-toggle/trip-type-toggle.js';

const html = htm.bind(h);

/**
 * DateSelectorSample - Showcase de la molécula DateSelector
 */
export const DateSelectorSample = () => {
  // ========== STATE - Single Mode ==========
  const [singleDate, setSingleDate] = useState(null);

  // ========== STATE - Departure/Return Mode ==========
  const today = new Date();
  const inFiveDays = new Date(today);
  inFiveDays.setDate(today.getDate() + 5);

  const [departureDate, setDepartureDate] = useState(today);
  const [returnDate, setReturnDate] = useState(inFiveDays);

  // ========== STATE - Grouped Mode ==========
  const [groupedDeparture, setGroupedDeparture] = useState(null);
  const [groupedReturn, setGroupedReturn] = useState(null);
  const [openSelector, setOpenSelector] = useState(null); // 'departure' | 'return' | null
  const [tripType, setTripType] = useState('round-trip'); // 'round-trip' | 'one-way'

  // ========== HANDLERS - Grouped Mode ==========
  const handleDepartureChange = (date) => {
    setGroupedDeparture(date);
    // Reset return date when departure changes
    setGroupedReturn(null);
    // Auto-open return selector after selecting departure
    setOpenSelector('return');
  };

  const handleReturnChange = (date) => {
    setGroupedReturn(date);
    setOpenSelector(null); // Close after selecting return
  };

  const handleDepartureOpenChange = (isOpen) => {
    if (isOpen) {
      setOpenSelector('departure');
    } else if (openSelector === 'departure') {
      setOpenSelector(null);
    }
  };

  const handleReturnOpenChange = (isOpen) => {
    if (isOpen) {
      setOpenSelector('return');
    } else if (openSelector === 'return') {
      setOpenSelector(null);
    }
  };

  const handleTripTypeChange = (newTripType) => {
    setTripType(newTripType);
    // Reset return date when switching to one-way
    if (newTripType === 'one-way') {
      setGroupedReturn(null);
    }
    // Only change step if popup is already open
    if (openSelector !== null) {
      setOpenSelector('departure');
    }
  };

  // ========== RENDER ==========
  return html`
    <div style=${{ maxWidth: '1200px', margin: '0 auto', backgroundColor: 'var(--bg-page-lighter)' }}>
      
      <h1 style=${{ fontSize: 'var(--heading-h600-size)', fontWeight: 'var(--heading-h600-weight)', marginBottom: 'var(--spacing-x-large)', color: 'var(--text-normal-primary)' }}>
        DateSelector
      </h1>

      <!-- Single Mode -->
      <section style=${{ marginBottom: 'var(--spacing-x-x-large)' }}>
        <h2 style=${{ fontSize: 'var(--heading-h500-size)', fontWeight: 'var(--heading-h500-weight)', marginBottom: 'var(--spacing-medium)', color: 'var(--text-normal-primary)' }}>
          Single Mode (Selector Independiente)
        </h2>
        <p style=${{ fontSize: 'var(--font-size-small)', color: 'var(--text-normal-secondary)', marginBottom: 'var(--spacing-medium)' }}>
          Selector de fecha único sin relación con otros selectores.
        </p>
        <div style=${{ maxWidth: '320px' }}>
          <${DateSelector}
            label="Salida"
            value=${singleDate}
            onChange=${setSingleDate}
            mode="single"
            origin="BOG"
            destination="MAD"
            calendarTitle="¿Cuándo quieres volar?"
            stepTitle="¿Cuándo quieres volar?"
          />
        </div>
        <p style=${{ fontSize: 'var(--font-size-small)', color: 'var(--text-normal-secondary)', marginTop: 'var(--spacing-small)' }}>
          Seleccionado: ${singleDate ? singleDate.toLocaleDateString('es-CO') : 'Ninguno'}
        </p>
      </section>

      <!-- Grouped Variant -->
      <section style=${{ marginBottom: 'var(--spacing-x-x-large)' }}>
        <h2 style=${{ fontSize: 'var(--heading-h500-size)', fontWeight: 'var(--heading-h500-weight)', marginBottom: 'var(--spacing-medium)', color: 'var(--text-normal-primary)' }}>
          Grouped Variant (Ida + Regreso Juntos)
        </h2>
        <p style=${{ fontSize: 'var(--font-size-small)', color: 'var(--text-normal-secondary)', marginBottom: 'var(--spacing-medium)' }}>
          Dos selectores agrupados visualmente con bordes conectados.
        </p>
        
        <!-- Trip Type Toggle -->
        <div style=${{ marginBottom: 'var(--spacing-medium)' }}>
          <${TripTypeToggle}
            value=${tripType}
            onChange=${handleTripTypeChange}
          />
        </div>
        
        <div style=${{ maxWidth: tripType === 'round-trip' ? '640px' : '320px', display: 'flex', gap: '0' }} class="flex items-center outline outline-1 outline-neutral-400 rounded-lg bg-background-input-default">
          <${DateSelector}
            label=${tripType === 'round-trip' ? 'Ida' : 'Fecha'}
            value=${groupedDeparture}
            onChange=${handleDepartureChange}
            mode=${tripType === 'round-trip' ? 'departure' : 'single'}
            returnDate=${tripType === 'round-trip' ? groupedReturn : null}
            variant=${tripType === 'round-trip' ? 'grouped-left' : 'standalone'}
            origin="BOG"
            destination="CTG"
            tripType=${tripType === 'round-trip' ? 'RT' : 'OW'}
            calendarTitle="¿Cuándo quieres volar?"
            stepTitle="¿Cuándo quieres volar?"
            customClassName="flex-1"
            isOpen=${openSelector === 'departure'}
            onOpenChange=${handleDepartureOpenChange}
            onBack=${() => setOpenSelector(null)}
            onClose=${() => setOpenSelector(null)}
            onTripTypeChange=${handleTripTypeChange}
            currentTripType=${tripType}
          />
          
          ${tripType === 'round-trip' && html`
            <!-- Separador -->
            <div class="h-[34px] w-[1px] my-2 bg-[var(--color-border-input-default)] flex-shrink-0" aria-hidden="true"></div>
            
            <${DateSelector}
              label="Regreso"
              value=${groupedReturn}
              onChange=${handleReturnChange}
              mode="return"
              departureDate=${groupedDeparture}
              variant="grouped-right"
              origin="BOG"
              destination="CTG"
              tripType="RT"
              calendarTitle="¿Cuándo quieres volar?"
              stepTitle="¿Cuándo quieres volar?"
              customClassName="flex-1"
              isOpen=${openSelector === 'return'}
              onOpenChange=${handleReturnOpenChange}
              onBack=${() => setOpenSelector(null)}
              onClose=${() => setOpenSelector(null)}
              onTripTypeChange=${handleTripTypeChange}
              currentTripType=${tripType}
            />
          `}
        </div>
        <p style=${{ fontSize: 'var(--font-size-small)', color: 'var(--text-normal-secondary)', marginTop: 'var(--spacing-small)' }}>
          Ida: ${groupedDeparture ? groupedDeparture.toLocaleDateString('es-CO') : 'Ninguno'} | 
          Regreso: ${groupedReturn ? groupedReturn.toLocaleDateString('es-CO') : 'Ninguno'}
        </p>
      </section>
    </div>
  `;
};

export default DateSelectorSample;
