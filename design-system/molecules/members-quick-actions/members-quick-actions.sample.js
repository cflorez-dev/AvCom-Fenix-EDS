import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { MembersQuickActions } from './members-quick-actions.js';

const html = htm.bind(h);

const FOUR = [
  {
    key: 'book-with-miles', label: 'Reserva con millas', icon: 'members/quick-book-miles', url: '#', sortOrder: 1,
  },
  {
    key: 'upgrade-business', label: 'Ascenso a Business', icon: 'members/quick-upgrade-business', url: '#', sortOrder: 2,
  },
  {
    key: 'lounges', label: 'Avianca Lounges', icon: 'members/quick-lounges', url: '#', sortOrder: 3,
  },
  {
    key: 'lifemiles-plus', label: 'Lifemiles Plus', icon: 'members/quick-lifemiles-plus', url: 'https://www.lifemiles.com', newTab: true, sortOrder: 4,
  },
];

// Caso "una desactivada" → redistribuye a 3.
const THREE = FOUR.map((a) => (a.key === 'lounges' ? { ...a, visible: false } : a));

/**
 * Sample del MembersQuickActions. Fila de 4 y caso de 3 (redistribuye). Íconos =
 * placeholders (gap #3). Sobre gradient oscuro.
 */
export const MembersQuickActionsSample = () => html`
  <section style=${{
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px',
  }}>
    <h2>MembersQuickActions (molécula)</h2>
    <div style=${{
    background: 'linear-gradient(90deg, #b50080 0%, #e9010d 100%)',
    padding: '24px',
    borderRadius: '16px',
    maxWidth: '520px',
  }}>
      <${MembersQuickActions} actions=${FOUR} opensInNewWindowLabel="abre en nueva ventana" />
    </div>
    <p style=${{ color: '#666' }}>Una desactivada (3, redistribuye):</p>
    <div style=${{
    background: 'linear-gradient(90deg, #703b16 0%, #ffa625 124.8%)',
    padding: '24px',
    borderRadius: '16px',
    maxWidth: '520px',
  }}>
      <${MembersQuickActions} actions=${THREE} opensInNewWindowLabel="abre en nueva ventana" />
    </div>
    <p style=${{ color: '#666' }}>Tier Lifemiles (chip magenta — Figma 518:23646):</p>
    <div style=${{
    background: 'linear-gradient(90deg, #b50080 0%, #e9010d 100%)',
    padding: '24px',
    borderRadius: '16px',
    maxWidth: '520px',
  }}>
      <${MembersQuickActions} actions=${FOUR} opensInNewWindowLabel="abre en nueva ventana" tier="lifemiles" />
    </div>
  </section>
`;

export default MembersQuickActionsSample;
