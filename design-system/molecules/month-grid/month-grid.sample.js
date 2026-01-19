import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { MonthGrid } from './month-grid.js';

const html = htm.bind(h);

/**
 * MonthGridSample - Showcase de la molécula MonthGrid
 */
export const MonthGridSample = () => {
  // ========== STATE ==========
  const today = new Date();
  const inFiveDays = new Date(today);
  inFiveDays.setDate(today.getDate() + 5);

  const [departureDate, setDepartureDate] = useState(today);
  const [returnDate, setReturnDate] = useState(inFiveDays);

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
    if (!departureDate) {
      setDepartureDate(date);
    } else if (!returnDate) {
      if (date > departureDate) {
        setReturnDate(date);
      } else {
        setDepartureDate(date);
        setReturnDate(null);
      }
    } else {
      setDepartureDate(date);
      setReturnDate(null);
    }
  };

  const handleReset = () => {
    setDepartureDate(null);
    setReturnDate(null);
  };

  // ========== RENDER ==========
  return html`
    <div style=${{ padding: '40px', maxWidth: '800px', margin: '0 auto', backgroundColor: 'var(--bg-page-lighter)' }}>
      
      <h1 style=${{ fontSize: 'var(--heading-h600-size)', fontWeight: 'var(--heading-h600-weight)', marginBottom: 'var(--spacing-x-large)', color: 'var(--text-normal-primary)' }}>
        MonthGrid
      </h1>

      <!-- Con Rango y Pricing -->
      <section style=${{ marginBottom: 'var(--spacing-x-x-large)' }}>
        <h2 style=${{ fontSize: 'var(--heading-h500-size)', fontWeight: 'var(--heading-h500-weight)', marginBottom: 'var(--spacing-medium)' }}>
          Con Rango Seleccionado y Pricing
        </h2>
        <div style=${{ display: 'flex', gap: 'var(--spacing-medium)', marginBottom: 'var(--spacing-medium)' }}>
          <p style=${{ fontSize: 'var(--font-size-small)', color: 'var(--text-normal-secondary)' }}>
            Ida: ${departureDate ? departureDate.toLocaleDateString('es-CO') : 'No seleccionada'}
          </p>
          <p style=${{ fontSize: 'var(--font-size-small)', color: 'var(--text-normal-secondary)' }}>
            Regreso: ${returnDate ? returnDate.toLocaleDateString('es-CO') : 'No seleccionada'}
          </p>
          <button 
            onClick=${handleReset}
            style=${{ padding: '4px 12px', fontSize: 'var(--font-size-small)', cursor: 'pointer', borderRadius: 'var(--border-radius-large)', border: '1px solid var(--border-stroke-default)', backgroundColor: 'white' }}
          >
            Resetear
          </button>
        </div>
        <div style=${{ maxWidth: '294px'}}>
          <${MonthGrid}
            year=${2026}
            month=${0}
            departureDate=${departureDate}
            returnDate=${returnDate}
            onDayClick=${handleDayClick}
            pricingData=${pricingData}
            minDate=${new Date(2026, 0, 1)}
          />
        </div>
      </section>

      <!-- Sin Selección -->
      <section style=${{ marginBottom: 'var(--spacing-x-x-large)' }}>
        <h2 style=${{ fontSize: 'var(--heading-h500-size)', fontWeight: 'var(--heading-h500-weight)', marginBottom: 'var(--spacing-medium)' }}>
          Sin Selección
        </h2>
        <div style=${{ maxWidth: '294px' }}>
          <${MonthGrid}
            year=${2026}
            month=${1}
            departureDate=${null}
            returnDate=${null}
            onDayClick=${() => {}}
            pricingData=${{}}
            minDate=${new Date(2026, 1, 1)}
          />
        </div>
      </section>

      <!-- Solo Ida -->
      <section style=${{ marginBottom: 'var(--spacing-x-x-large)' }}>
        <h2 style=${{ fontSize: 'var(--heading-h500-size)', fontWeight: 'var(--heading-h500-weight)', marginBottom: 'var(--spacing-medium)' }}>
          Solo Ida (15 de marzo)
        </h2>
        <div style=${{ maxWidth: '294px' }}>
          <${MonthGrid}
            year=${2026}
            month=${2}
            departureDate=${new Date(2026, 2, 15)}
            returnDate=${null}
            onDayClick=${() => {}}
            pricingData=${{}}
            minDate=${new Date(2026, 2, 1)}
          />
        </div>
      </section>

    </div>
  `;
};

export default MonthGridSample;
