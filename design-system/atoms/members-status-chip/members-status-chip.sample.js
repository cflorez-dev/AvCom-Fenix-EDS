import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { MembersStatusChip } from './members-status-chip.js';

const html = htm.bind(h);

/**
 * Sample del MembersStatusChip. Estados complete (verde) / incomplete (naranja) y el
 * anclaje absoluto top-right que aplica la card (demo sobre una "card" blanca).
 */
export const MembersStatusChipSample = () => html`
  <section style=${{
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px',
  }}>
    <h2>MembersStatusChip (átomo)</h2>

    <div style=${{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <${MembersStatusChip} status="complete" label="Perfil completo" />
      <${MembersStatusChip} status="incomplete" label="Perfil incompleto" />
      <span style=${{ color: '#666' }}>status=null → no renderiza →</span>
      <${MembersStatusChip} status=${null} label="oculto" />
    </div>

    <p style=${{ color: '#666', margin: 0 }}>Anclado top-right por la card (BR=0 pega al borde):</p>
    <div style=${{
    position: 'relative',
    width: '320px',
    height: '120px',
    border: '1px solid #d9d9d9',
    borderRadius: '16px',
    overflow: 'hidden',
    background: '#fff',
  }}>
      <div style=${{ position: 'absolute', top: '2px', right: '0' }}>
        <${MembersStatusChip} status="complete" label="Perfil completo" />
      </div>
    </div>
  </section>
`;

export default MembersStatusChipSample;
