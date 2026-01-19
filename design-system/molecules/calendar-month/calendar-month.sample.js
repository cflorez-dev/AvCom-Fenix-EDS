import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { CalendarMonth } from './calendar-month.js';

const html = htm.bind(h);

/**
 * CalendarMonthSample - Showcase de la molécula CalendarMonth
 */
export const CalendarMonthSample = () => {
  // ========== STATE ==========
  const today = new Date();
  const inFiveDays = new Date(today);
  inFiveDays.setDate(today.getDate() + 5);

  const [selectedDeparture, setSelectedDeparture] = useState(today);
  const [selectedReturn, setSelectedReturn] = useState(inFiveDays);

  // ========== PRICING DATA ==========
  const pricingData = {
    '2026-01-01': { price: 250000, category: 'medium' },
    '2026-01-02': { price: 280000, category: 'medium' },
    '2026-01-03': { price: 320000, category: 'high' },
    '2026-01-04': { price: 350000, category: 'high' },
    '2026-01-05': { price: 330000, category: 'high' },
    '2026-01-06': { price: 180000, category: 'low' },
    '2026-01-17': { price: 260000, category: 'medium' },
    '2026-01-18': { price: 240000, category: 'medium' },
    '2026-01-19': { price: 310000, category: 'high' },
    '2026-01-20': { price: 330000, category: 'high' },
    '2026-01-21': { price: 340000, category: 'high' },
    '2026-01-22': { price: 320000, category: 'high' },
    '2026-01-23': { price: 190000, category: 'low' },
    '2026-01-24': { price: 310000, category: 'high' },
    '2026-01-25': { price: 350000, category: 'high' },
    '2026-01-26': { price: 170000, category: 'low' },
    '2026-01-27': { price: 250000, category: 'medium' },
    '2026-01-28': { price: 180000, category: 'low' },
    '2026-01-29': { price: 320000, category: 'high' },
    '2026-01-30': { price: 340000, category: 'high' },
    '2026-01-31': { price: 260000, category: 'medium' },
  };

  // ========== HANDLERS ==========
  const handleDayClick = (date) => {
    // eslint-disable-next-line no-console
    console.log('Day clicked:', date);
  };

  // ========== RENDER ==========
  return html`
    <div style=${{
    padding: '40px',
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: 'var(--bg-page-lighter)',
  }}>
      
      <h1 style=${{
    fontSize: 'var(--heading-h600-size)',
    fontWeight: 'var(--heading-h600-weight)',
    marginBottom: 'var(--spacing-x-large)',
    color: 'var(--text-normal-primary)',
  }}>
        CalendarMonth
      </h1>

      <!-- Español - Con Rango Seleccionado -->
      <section style=${{ marginBottom: 'var(--spacing-x-x-large)' }}>
        <h2 style=${{
    fontSize: 'var(--heading-h500-size)',
    fontWeight: 'var(--heading-h500-weight)',
    marginBottom: 'var(--spacing-medium)',
  }}>Español (es-CO) - Con Rango y Pricing</h2>
        <div style=${{
    maxWidth: '294px',
    backgroundColor: 'var(--bg-card-lighter)',
    borderRadius: 'var(--border-radius-large)',
    boxShadow: 'var(--shadow-small)',
  }}>
          <${CalendarMonth}
            locale="es-CO"
            year=${2026}
            month=${0}
            departureDate=${selectedDeparture}
            returnDate=${selectedReturn}
            onDayClick=${handleDayClick}
            pricingData=${pricingData}
            minDate=${new Date(2026, 0, 1)}
          />
        </div>
      </section>

      <!-- Inglés - Sin Selección -->
      <section style=${{ marginBottom: 'var(--spacing-x-x-large)' }}>
        <h2 style=${{
    fontSize: 'var(--heading-h500-size)',
    fontWeight: 'var(--heading-h500-weight)',
    marginBottom: 'var(--spacing-medium)',
  }}>Inglés (en-US) - Sin Selección</h2>
        <div style=${{
    maxWidth: '294px',
    backgroundColor: 'var(--bg-card-lighter)',
    borderRadius: 'var(--border-radius-large)',
    boxShadow: 'var(--shadow-small)',
  }}>
          <${CalendarMonth}
            locale="en-US"
            year=${2026}
            month=${1}
            departureDate=${null}
            returnDate=${null}
            onDayClick=${handleDayClick}
            pricingData=${{}}
            minDate=${new Date(2026, 1, 1)}
          />
        </div>
      </section>

      <!-- Portugués - Solo Departure -->
      <section style=${{ marginBottom: 'var(--spacing-x-x-large)' }}>
        <h2 style=${{
    fontSize: 'var(--heading-h500-size)',
    fontWeight: 'var(--heading-h500-weight)',
    marginBottom: 'var(--spacing-medium)',
  }}>Portugués (pt-BR) - Solo Ida</h2>
        <div style=${{
    maxWidth: '294px',
    backgroundColor: 'var(--bg-card-lighter)',
    borderRadius: 'var(--border-radius-large)',
    boxShadow: 'var(--shadow-small)',
  }}>
          <${CalendarMonth}
            locale="pt-BR"
            year=${2026}
            month=${2}
            departureDate=${new Date(2026, 2, 15)}
            returnDate=${null}
            onDayClick=${handleDayClick}
            pricingData=${{}}
            minDate=${new Date(2026, 2, 1)}
          />
        </div>
      </section>

      <!-- Francés -->
      <section style=${{ marginBottom: 'var(--spacing-x-x-large)' }}>
        <h2 style=${{
    fontSize: 'var(--heading-h500-size)',
    fontWeight: 'var(--heading-h500-weight)',
    marginBottom: 'var(--spacing-medium)',
  }}>Francés (fr-FR)</h2>
        <div style=${{
    maxWidth: '294px',
    backgroundColor: 'var(--bg-card-lighter)',
    borderRadius: 'var(--border-radius-large)',
    boxShadow: 'var(--shadow-small)',
  }}>
          <${CalendarMonth}
            locale="fr-FR"
            year=${2026}
            month=${3}
            departureDate=${null}
            returnDate=${null}
            onDayClick=${handleDayClick}
            pricingData=${{}}
            minDate=${new Date(2026, 3, 1)}
          />
        </div>
      </section>

    </div>
  `;
};

export default CalendarMonthSample;
