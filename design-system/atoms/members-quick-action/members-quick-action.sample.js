import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { MembersQuickAction } from './members-quick-action.js';

const html = htm.bind(h);

/**
 * Sample del MembersQuickAction. Los 4 defaults de desktop del Figma (íconos =
 * placeholders, gap #3). Sobre gradient oscuro. Tab para ver foco; uno con newTab.
 */
export const MembersQuickActionSample = () => html`
  <section style=${{
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px',
  }}>
    <h2>MembersQuickAction (átomo)</h2>
    <div style=${{
    background: 'linear-gradient(90deg, #b50080 0%, #e9010d 100%)',
    padding: '24px',
    borderRadius: '16px',
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap',
  }}>
      <${MembersQuickAction} icon="members/quick-book-miles" label="Reserva con millas" url="#" />
      <${MembersQuickAction} icon="members/quick-upgrade-business" label="Ascenso a Business" url="#" />
      <${MembersQuickAction} icon="members/quick-lounges" label="Avianca Lounges" url="#" />
      <${MembersQuickAction}
        icon="members/quick-lifemiles-plus"
        label="Lifemiles Plus"
        url="https://www.lifemiles.com"
        newTab=${true}
        ariaLabel="Lifemiles Plus, abre en nueva ventana"
      />
    </div>
  </section>
`;

export default MembersQuickActionSample;
