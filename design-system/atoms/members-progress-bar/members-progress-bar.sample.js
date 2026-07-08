import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { MembersProgressBar } from './members-progress-bar.js';

const html = htm.bind(h);

const fmt = (n) => new Intl.NumberFormat('es-CO').format(n);

/**
 * Sample del MembersProgressBar. surface="light" (sobre barra blanca del hero) y
 * surface="dark" (sobre gradient). Cubre empty/progress/completed + loading.
 */
export const MembersProgressBarSample = () => html`
  <section style=${{
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px',
  }}>
    <h2>MembersProgressBar (átomo)</h2>

    <p style=${{ color: '#666', margin: 0 }}>surface="light" (barra blanca del hero):</p>
    <div style=${{
    background: '#ffffff',
    border: '1px solid #e5e5e5',
    padding: '24px',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    maxWidth: '520px',
  }}>
      <${MembersProgressBar} label="Millas totales calificables" value=${11460} goal=${20000} variant="navy" formatValue=${fmt} />
      <${MembersProgressBar} label="Millas requeridas con avianca" value=${4000} goal=${8000} variant="magenta" formatValue=${fmt} />
      <${MembersProgressBar} label="Empty (0/meta)" value=${0} goal=${20000} variant="navy" formatValue=${fmt} />
      <${MembersProgressBar} label="Completed (verde + check, valor oculto)" value=${20000} goal=${20000} variant="navy" formatValue=${fmt} />
      <${MembersProgressBar} label="Loading skeleton" loading=${true} />
    </div>

    <p style=${{ color: '#666', margin: 0 }}>surface="dark" (sobre gradient):</p>
    <div style=${{
    background: 'linear-gradient(90deg, #88431c 0%, #ffa625 124.8%)',
    padding: '24px',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    maxWidth: '520px',
  }}>
      <${MembersProgressBar} surface="dark" label="Millas totales calificables" value=${11460} goal=${20000} variant="navy" formatValue=${fmt} />
      <${MembersProgressBar} surface="dark" label="Millas requeridas con avianca" value=${4000} goal=${8000} variant="magenta" formatValue=${fmt} />
    </div>
  </section>
`;

export default MembersProgressBarSample;
