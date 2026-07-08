import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { MembersDataGrid } from './members-data-grid.js';
import { MembersQuickActions } from '../members-quick-actions/members-quick-actions.js';

const html = htm.bind(h);

const QUICK_ACTIONS = [
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
    key: 'lifemiles-plus', label: 'Lifemiles Plus', icon: 'members/quick-lifemiles-plus', url: '#', sortOrder: 4,
  },
];

/**
 * Sample del MembersDataGrid. Layout del comp: columna izq (balance + quick-actions)
 * | divisor | columna der (estatus + nº socio). Redimensionar para ver 1 col (≤767)
 * → 2 col (≥768).
 */
export const MembersDataGridSample = () => html`
  <section style=${{
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px',
  }}>
    <h2>MembersDataGrid (molécula · layout comp)</h2>
    <div style=${{
    background: 'linear-gradient(90deg, #393838 0%, #6c6c6c 100%)',
    padding: '32px',
    borderRadius: '16px',
  }}>
      <${MembersDataGrid}
        milesLabel="Tienes"
        milesValue="18.056 millas"
        expiryLabel="Fecha de vencimiento"
        expiryValue="Dic 31, 2026"
        statusLabel="Estatus Lifemiles"
        statusValue="Silver"
        statusExpiryText="Vence: Ene 30, 2026"
        membershipLabel="Número de socio"
        membershipNumber="10089768901"
        quickActions=${html`
          <${MembersQuickActions} actions=${QUICK_ACTIONS} opensInNewWindowLabel="abre en nueva ventana" />
        `}
      />
    </div>
  </section>
`;

export default MembersDataGridSample;
