import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { ProgressItem } from './progress-item.js';

const html = htm.bind(h);

const STATES = ['default', 'success', 'current', 'cenit'];
const ALIGNS = ['left', 'center', 'right'];

/**
 * Sample del ProgressItem (1271699 paso 7): 4 estados × 3 alineaciones +
 * variante de marcador círculo (vista completa) con color de tier.
 */
export const ProgressItemSample = () => html`
  <section style=${{
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px',
  }}>
    <h2>ProgressItem (átomo — 1271699)</h2>

    <p style=${{ color: '#666', margin: 0 }}>Estados × alineaciones (label arriba + check-circle + línea al track):</p>
    <div style=${{
    background: '#ffffff',
    border: '1px solid #e5e5e5',
    padding: '24px',
    borderRadius: '16px',
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(140px, 1fr))',
    gap: '24px',
    maxWidth: '640px',
  }}>
      ${STATES.map((state) => ALIGNS.map((align) => html`
        <${ProgressItem}
          key=${`${state}-${align}`}
          state=${state}
          align=${align}
          label=${state === 'current' ? 'Gold' : 'Mantener Gold en 2027'}
          sublabel="20,000"
          stateColor="#A55B1F"
        />
      `))}
    </div>

    <p style=${{ color: '#666', margin: 0 }}>Marcador bandera ("Inicio") + current relleno color tier (vista completa):</p>
    <div style=${{
    background: '#ffffff',
    border: '1px solid #e5e5e5',
    padding: '24px',
    borderRadius: '16px',
    display: 'flex',
    gap: '32px',
    maxWidth: '640px',
  }}>
      <${ProgressItem} marker="flag" state="default" align="left" label="Inicio" />
      <${ProgressItem} state="default" align="center" label="Silver" sublabel="8,000" />
      <${ProgressItem} state="current" align="center" label="Gold" sublabel="20,000" stateColor="#A55B1F" />
      <${ProgressItem} state="cenit" align="center" label="Gold" sublabel="1M" />
      <${ProgressItem} state="success" align="center" label="Cumplido" sublabel="4,000" />
    </div>
  </section>
`;

export default ProgressItemSample;
