import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { MembersQuickActionsProfile } from './members-quick-actions-profile.js';

const html = htm.bind(h);

// Fixture: 4 quick actions del Dashboard. Íconos/URLs son placeholders — el
// dato real viene del CF "Quick Actions Profile". Mantener `key` único y
// `sortOrder` para que el filtro/orden del molecule sea visible en el sample.
const FOUR = [
  {
    key: 'profile-bookings', label: 'Mis reservas', icon: 'members/quick-book-miles', url: '#', sortOrder: 1,
  },
  {
    key: 'profile-miles', label: 'Mis millas', icon: 'members/quick-upgrade-business', url: '#', sortOrder: 2,
  },
  {
    key: 'profile-cards', label: 'Mis tarjetas', icon: 'members/quick-lounges', url: '#', sortOrder: 3,
  },
  {
    key: 'profile-benefits',
    label: 'Beneficios',
    icon: 'members/quick-lifemiles-plus',
    url: 'https://www.lifemiles.com',
    newTab: true,
    sortOrder: 4,
  },
];

// Caso "una desactivada" → redistribuye a 3 (mismo contrato que el hero).
const THREE = FOUR.map((a) => (a.key === 'profile-cards' ? { ...a, visible: false } : a));

/**
 * Sample del MembersQuickActionsProfile. Renderiza el caso completo (4) y el
 * caso con una acción oculta (3) sobre un fondo claro/neutral — pensado para
 * la superficie Dashboard (NO sobre gradient como el hero).
 */
export const MembersQuickActionsProfileSample = () => html`
  <section style=${{
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px',
  }}>
    <h2>MembersQuickActionsProfile (molécula — Dashboard)</h2>
    <div style=${{
    background: '#f4f4f4',
    padding: '24px',
    borderRadius: '16px',
    maxWidth: '520px',
  }}>
      <${MembersQuickActionsProfile} actions=${FOUR} opensInNewWindowLabel="abre en nueva ventana" />
    </div>
    <p style=${{ color: '#666' }}>Una desactivada (3, redistribuye):</p>
    <div style=${{
    background: '#f4f4f4',
    padding: '24px',
    borderRadius: '16px',
    maxWidth: '520px',
  }}>
      <${MembersQuickActionsProfile} actions=${THREE} opensInNewWindowLabel="abre en nueva ventana" />
    </div>
    <p style=${{ color: '#666' }}>Tier Lifemiles (chip magenta — Figma 518:23646):</p>
    <div style=${{
    background: '#f4f4f4',
    padding: '24px',
    borderRadius: '16px',
    maxWidth: '520px',
  }}>
      <${MembersQuickActionsProfile} actions=${FOUR} opensInNewWindowLabel="abre en nueva ventana" tier="lifemiles" />
    </div>
  </section>
`;

export default MembersQuickActionsProfileSample;
