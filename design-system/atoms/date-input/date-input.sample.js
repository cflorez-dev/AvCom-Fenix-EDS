import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { DateInput } from './date-input.js';

const html = htm.bind(h);

/**
 * DateInputSample - Showcase del átomo DateInput
 */
export const DateInputSample = () => {
  const [value] = useState('Lun 15 Ene 2026');

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
        DateInput
      </h1>

      <!-- Standalone -->
      <section style=${{ marginBottom: 'var(--spacing-x-large)' }}>
        <h2 style=${{
    fontSize: 'var(--heading-h500-size)',
    fontWeight: 'var(--heading-h500-weight)',
    marginBottom: 'var(--spacing-medium)',
  }}>Standalone</h2>
        <div style=${{ maxWidth: '320px' }}>
          <${DateInput}
            label="Ida"
            value=${value}
            variant="standalone"
            onClick=${() => console.log('DateInput clicked')}
          />
        </div>
      </section>

      <!-- Grouped -->
      <section style=${{ marginBottom: 'var(--spacing-x-large)' }}>
        <h2 style=${{
    fontSize: 'var(--heading-h500-size)',
    fontWeight: 'var(--heading-h500-weight)',
    marginBottom: 'var(--spacing-medium)',
  }}>Grouped</h2>
        <div style=${{
    maxWidth: '640px',
    outline: '1px solid var(--neutral-400)',
    borderRadius: 'var(--border-radius-large)',
    display: 'flex',
  }}>
          <${DateInput}
            label="Ida"
            value=${value}
            variant="grouped-left"
            containerRelative=${false}
            onClick=${() => console.log('Departure clicked')}
          />
          <${DateInput}
            label="Regreso"
            value="Vie 19 Ene 2026"
            variant="grouped-right"
            containerRelative=${false}
            onClick=${() => console.log('Return clicked')}
          />
        </div>
      </section>

    </div>
  `;
};

export default DateInputSample;
