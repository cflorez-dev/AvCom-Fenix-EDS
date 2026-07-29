import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { SavedCardItem } from './saved-card-item.js';
import { getAccountLabelsSync } from '../../../scripts/services/members/members-i18n.js';

const html = htm.bind(h);

/**
 * Sample del SavedCardItem (1279362 paso 5): las 5 redes (logos en placeholder
 * pending-asset), con/sin moneda, con/sin chip cobrand. Read-only (sin acciones).
 */
export const SavedCardItemSample = () => {
  const labels = getAccountLabelsSync();
  const cards = [
    {
      networkKey: 'visa', networkLabel: 'Visa', maskedNumber: '•••• 8901', currency: 'COP', isCobrand: true,
    },
    {
      networkKey: 'mastercard', networkLabel: 'Mastercard', maskedNumber: '•••• 4477', currency: null, isCobrand: false,
    },
    {
      networkKey: 'amex', networkLabel: 'American Express', maskedNumber: '•••• 1005', currency: 'USD', isCobrand: false,
    },
    {
      networkKey: 'discover', networkLabel: 'Discover', maskedNumber: '•••• 2231', currency: null, isCobrand: false,
    },
    {
      networkKey: 'diners', networkLabel: 'Diners Club', maskedNumber: '•••• 7788', currency: 'COP', isCobrand: true,
    },
  ];
  return html`
    <section style=${{
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#EEEFF1',
  }}>
      <h2>SavedCardItem (molécula — 1279362)</h2>
      <p style=${{ color: '#666', margin: 0 }}>
        5 redes con logo en placeholder (SVGs pending-asset) · moneda condicional · chip cobrand.
      </p>
      <div style=${{
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px',
  }}>
        ${cards.map((card) => html`<${SavedCardItem} key=${card.networkKey} card=${card} labels=${labels} />`)}
      </div>
    </section>
  `;
};

export default SavedCardItemSample;
