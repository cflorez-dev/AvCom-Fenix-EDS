import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { DateRangePicker } from './date-range-picker.js';
import { TripTypeToggle } from '../../atoms/trip-type-toggle/trip-type-toggle.js';

const html = htm.bind(h);

/**
 * DateRangePickerSample - Showcase del componente DateRangePicker
 * 
 * Muestra todos los modos, estados y casos de uso según diseño de Figma
 */
export const DateRangePickerSample = () => {
  // Estado para ejemplos interactivos
  const [departureDate1, setDepartureDate1] = useState(null);
  const [returnDate1, setReturnDate1] = useState(null);
  const [tripType1, setTripType1] = useState('round-trip');

  const [departureDate2, setDepartureDate2] = useState(null);

  const [departureDate3, setDepartureDate3] = useState(new Date(2026, 0, 15));
  const [returnDate3, setReturnDate3] = useState(new Date(2026, 0, 20));

  // Handlers
  const handleDateChange1 = ({ departure, return: returnD }) => {
    setDepartureDate1(departure);
    setReturnDate1(returnD);
  };

  const handleTripTypeChange1 = (newTripType) => {
    setTripType1(newTripType);
    // Reset return date when switching to one-way
    if (newTripType === 'one-way') {
      setReturnDate1(null);
    }
  };

  const handleDateChange2 = ({ departure }) => {
    setDepartureDate2(departure);
  };

  const handleDateChange3 = ({ departure, return: returnD }) => {
    setDepartureDate3(departure);
    setReturnDate3(returnD);
  };

  return html`
    <div style=${{
    padding: '40px',
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: 'var(--bg-page-lighter)',
  }}>
      
      <!-- Título Principal -->
      <h1 style=${{
    fontSize: 'var(--heading-h600-size)',
    fontWeight: 'var(--heading-h600-weight)',
    marginBottom: 'var(--spacing-x-large)',
    color: 'var(--text-normal-primary)',
  }}>
        DateRangePicker - Design System
      </h1>

      <!-- Sección 1: Con TripTypeToggle Integrado -->
      <section style=${{ marginBottom: 'var(--spacing-x-huge)' }}>
        <h2 style=${{
    fontSize: 'var(--heading-h500-size)',
    fontWeight: 'var(--heading-h500-weight)',
    marginBottom: 'var(--spacing-large)',
    color: 'var(--text-normal-primary)',
  }}>
          Con TripTypeToggle Integrado
        </h2>
        <p style=${{ fontSize: 'var(--font-size-small)', color: 'var(--text-normal-secondary)', marginBottom: 'var(--spacing-medium)' }}>
          El DateRangePicker ajusta automáticamente su ancho y comportamiento según el tipo de viaje.
        </p>
        <div>
          <!-- Trip Type Toggle -->
          <div style=${{ marginBottom: 'var(--spacing-medium)' }}>
            <${TripTypeToggle}
              value=${tripType1}
              onChange=${handleTripTypeChange1}
            />
          </div>

          <!-- DateRangePicker -->
          <div style=${{ maxWidth: tripType1 === 'round-trip' ? '640px' : '320px' }}>
            <${DateRangePicker}
              mode=${tripType1 === 'round-trip' ? 'range' : 'single'}
              departureDate=${departureDate1}
              returnDate=${returnDate1}
              onDateChange=${handleDateChange1}
              origin="BOG"
              destination="MAD"
              tripType=${tripType1 === 'round-trip' ? 'RT' : 'OW'}
              onTripTypeChange=${handleTripTypeChange1}
              currentTripType=${tripType1}
            />
          </div>
          
          <!-- Display selected dates -->
          <div style=${{
    marginTop: 'var(--spacing-medium)',
    padding: 'var(--padding-medium)',
    backgroundColor: 'var(--bg-page-light)',
    borderRadius: 'var(--border-radius-small)',
  }}>
            <strong>Tipo de viaje:</strong> ${tripType1 === 'round-trip' ? 'Ida y regreso' : 'Solo ida'}<br />
            <strong>Fechas seleccionadas:</strong><br />
            Ida: ${departureDate1 ? departureDate1.toLocaleDateString('es-CO') : 'N/A'}<br />
            ${tripType1 === 'round-trip' ? html`Regreso: ${returnDate1 ? returnDate1.toLocaleDateString('es-CO') : 'N/A'}` : ''}
          </div>
        </div>
      </section>

      <!-- Sección 3: Con fechas pre-seleccionadas -->
      <section style=${{ marginBottom: 'var(--spacing-x-huge)' }}>
        <h2 style=${{
    fontSize: 'var(--heading-h500-size)',
    fontWeight: 'var(--heading-h500-weight)',
    marginBottom: 'var(--spacing-large)',
  }}>
          Con Fechas Pre-seleccionadas
        </h2>
        <div style=${{ maxWidth: '600px' }}>
          <${DateRangePicker}
            mode="range"
            departureDate=${departureDate3}
            returnDate=${returnDate3}
            onDateChange=${handleDateChange3}
            origin="BOG"
            destination="MAD"
            tripType="RT"
          />
          
          <!-- Display -->
          <div style=${{
    marginTop: 'var(--spacing-medium)',
    padding: 'var(--padding-medium)',
    backgroundColor: 'var(--bg-page-light)',
    borderRadius: 'var(--border-radius-small)',
  }}>
            <strong>Fechas seleccionadas:</strong><br />
            Ida: ${departureDate3.toLocaleDateString('es-CO')}<br />
            Regreso: ${returnDate3 ? returnDate3.toLocaleDateString('es-CO') : 'N/A'}
          </div>
        </div>
      </section>

      <!-- Sección 5: Features -->
      <section style=${{ marginBottom: 'var(--spacing-x-huge)' }}>
        <h2 style=${{
    fontSize: 'var(--heading-h500-size)',
    fontWeight: 'var(--heading-h500-weight)',
    marginBottom: 'var(--spacing-large)',
  }}>
          Features Destacados
        </h2>
        <ul style=${{
    listStyle: 'disc',
    paddingLeft: '24px',
    lineHeight: '1.8',
  }}>
          <li>✅ Calendario 2 meses consecutivos visibles (desktop)</li>
          <li>✅ Scroll vertical infinito de meses (mobile)</li>
          <li>✅ Pricing integrado con colores (low/medium/high)</li>
          <li>✅ Fechas pasadas deshabilitadas automáticamente</li>
          <li>✅ Máximo 355 días desde hoy (configurable)</li>
          <li>✅ Auto-open return después de seleccionar departure</li>
          <li>✅ Month navigation con prev/next (desktop)</li>
          <li>✅ Cache en sessionStorage (30 min)</li>
          <li>✅ Responsive: Desktop popup / Mobile modal</li>
          <li>✅ Keyboard navigation (arrows, enter, escape)</li>
          <li>✅ Click outside cierra popup (desktop)</li>
          <li>✅ ARIA attributes completos</li>
        </ul>
      </section>

      <!-- Sección 6: Arquitectura Atómica -->
      <section style=${{ marginBottom: 'var(--spacing-x-huge)' }}>
        <h2 style=${{
    fontSize: 'var(--heading-h500-size)',
    fontWeight: 'var(--heading-h500-weight)',
    marginBottom: 'var(--spacing-large)',
  }}>
          Arquitectura Atómica
        </h2>
        <div style=${{
    padding: 'var(--padding-medium)',
    backgroundColor: 'var(--bg-page-light)',
    borderRadius: 'var(--border-radius-small)',
  }}>
          <h3 style=${{ marginBottom: 'var(--spacing-small)' }}>Átomos (5)</h3>
          <ul style=${{ listStyle: 'disc', paddingLeft: '24px', marginBottom: 'var(--spacing-medium)' }}>
            <li><strong>DateInput</strong> - Input read-only con cursor pointer</li>
            <li><strong>DayCell</strong> - Celda de día (12 estados visuales)</li>
            <li><strong>MonthHeader</strong> - Header con mes/año y navegación</li>
            <li><strong>WeekdayHeader</strong> - Días de la semana</li>
            <li><strong>PriceIndicator</strong> - Dot de color para pricing</li>
          </ul>

          <h3 style=${{ marginBottom: 'var(--spacing-small)' }}>Moléculas (4)</h3>
          <ul style=${{ listStyle: 'disc', paddingLeft: '24px' }}>
            <li><strong>MonthGrid</strong> - Grid de días con lógica</li>
            <li><strong>CalendarMonth</strong> - Calendario completo de 1 mes</li>
            <li><strong>DateSelector</strong> - Input + Calendar popup</li>
            <li><strong>DateRangePicker</strong> - Orquestador principal (este componente)</li>
          </ul>
        </div>
      </section>

    </div>
  `;
};

export default DateRangePickerSample;
