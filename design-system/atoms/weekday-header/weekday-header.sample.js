import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { WeekdayHeader } from './weekday-header.js';

const html = htm.bind(h);

/**
 * WeekdayHeaderSample - Showcase del átomo WeekdayHeader
 */
export const WeekdayHeaderSample = () => {
  return html`
    <div style=${{
    padding: '40px',
    maxWidth: '800px',
    margin: '0 auto',
    backgroundColor: 'var(--bg-page-lighter)',
  }}>
      
      <h1 style=${{
    fontSize: 'var(--heading-h600-size)',
    fontWeight: 'var(--heading-h600-weight)',
    marginBottom: 'var(--spacing-x-large)',
    color: 'var(--text-normal-primary)',
  }}>
        WeekdayHeader
      </h1>

      <!-- Español (Colombia) -->
      <section style=${{ marginBottom: 'var(--spacing-x-large)' }}>
        <h2 style=${{
    fontSize: 'var(--heading-h500-size)',
    fontWeight: 'var(--heading-h500-weight)',
    marginBottom: 'var(--spacing-medium)',
  }}>Español (es-CO)</h2>
        <${WeekdayHeader} locale="es-CO" />
      </section>

      <!-- Inglés (Estados Unidos) -->
      <section style=${{ marginBottom: 'var(--spacing-x-large)' }}>
        <h2 style=${{
    fontSize: 'var(--heading-h500-size)',
    fontWeight: 'var(--heading-h500-weight)',
    marginBottom: 'var(--spacing-medium)',
  }}>Inglés (en-US)</h2>
        <${WeekdayHeader} locale="en-US" />
      </section>

      <!-- Portugués (Brasil) -->
      <section style=${{ marginBottom: 'var(--spacing-x-large)' }}>
        <h2 style=${{
    fontSize: 'var(--heading-h500-size)',
    fontWeight: 'var(--heading-h500-weight)',
    marginBottom: 'var(--spacing-medium)',
  }}>Portugués (pt-BR)</h2>
        <${WeekdayHeader} locale="pt-BR" />
      </section>

      <!-- Francés (Francia) -->
      <section style=${{ marginBottom: 'var(--spacing-x-large)' }}>
        <h2 style=${{
    fontSize: 'var(--heading-h500-size)',
    fontWeight: 'var(--heading-h500-weight)',
    marginBottom: 'var(--spacing-medium)',
  }}>Francés (fr-FR)</h2>
        <${WeekdayHeader} locale="fr-FR" />
      </section>

      <!-- Alemán (Alemania) -->
      <section style=${{ marginBottom: 'var(--spacing-x-large)' }}>
        <h2 style=${{
    fontSize: 'var(--heading-h500-size)',
    fontWeight: 'var(--heading-h500-weight)',
    marginBottom: 'var(--spacing-medium)',
  }}>Alemán (de-DE)</h2>
        <${WeekdayHeader} locale="de-DE" />
      </section>

    </div>
  `;
};

export default WeekdayHeaderSample;
