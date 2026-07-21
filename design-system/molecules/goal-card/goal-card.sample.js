import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { GoalCard } from './goal-card.js';

const html = htm.bind(h);

const BODY = 'Completa {total} millas calificables totales, de las cuales {avianca} millas deben ser con Avianca.';

const TITLE = 'Meta para llegar a estatus {tier}';

const CASES = [
  {
    tier: 'red-plus', tierName: 'Red Plus', total: '4,000', avianca: '1,000',
  },
  {
    tier: 'silver', tierName: 'Silver', total: '8,000', avianca: '2,000',
  },
  {
    tier: 'gold', tierName: 'Gold', total: '20,000', avianca: '8,000',
  },
  {
    tier: 'diamond', tierName: 'Diamond', total: '45,000', avianca: '15,000',
  },
  {
    tier: 'magno', tierName: 'Magno', total: null, avianca: '110,000',
  },
];

/**
 * Sample del GoalCard (1271699 paso 9): un banner por tier meta (bandera con
 * el color GoalHeader del tier), números en bold, y el caso `visible: false`.
 */
export const GoalCardSample = () => html`
  <section style=${{
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px',
  }}>
    <h2>GoalCard (molécula — 1271699)</h2>

    <div style=${{
    background: '#ffffff',
    border: '1px solid #e5e5e5',
    padding: '24px',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    maxWidth: '640px',
  }}>
      ${CASES.map((c) => html`
        <${GoalCard}
          key=${c.tier}
          tier=${c.tier}
          title=${TITLE}
          titleParams=${{ tier: c.tierName }}
          body=${BODY}
          bodyParams=${{ total: c.total, avianca: c.avianca }}
        />
      `)}
    </div>

    <p style=${{ color: '#666', margin: 0 }}>
      visible=false (Magno* / Diamond con meta Magno lograda) → no renderiza:
    </p>
    <div style=${{
    background: '#ffffff', border: '1px dashed #ccc', padding: '16px', borderRadius: '16px', maxWidth: '640px',
  }}>
      <${GoalCard} visible=${false} tier="magno" title="No debería verse" titleParams=${{}} body=${BODY} />
      <span style=${{ color: '#999', fontSize: '12px' }}>(vacío a propósito)</span>
    </div>
  </section>
`;

export default GoalCardSample;
