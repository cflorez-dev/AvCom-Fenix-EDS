import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { MembersDataPair } from './members-data-pair.js';

const html = htm.bind(h);

/**
 * Sample del MembersDataPair. Muestra los pares del grid del Figma en ambos tonos
 * (light sobre gradient oscuro, dark sobre card blanca).
 */
export const MembersDataPairSample = () => html`
  <section style=${{
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px',
  }}>
    <h2>MembersDataPair (átomo)</h2>

    <div style=${{
    background: 'linear-gradient(90deg, #393838 0%, #6c6c6c 100%)',
    padding: '24px',
    borderRadius: '16px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  }}>
      <${MembersDataPair} label="Tienes" value="18.056 millas" />
      <${MembersDataPair} label="Fecha de vencimiento" value="Dic 31, 2026" />
      <${MembersDataPair} label="Estatus Lifemiles" value="Silver" sublabel="Vence: Ene 30, 2026" />
      <${MembersDataPair} label="Número de socio" value="10089768901" />
    </div>

    <div style=${{
    background: '#ffffff',
    border: '1px solid #e5e5e5',
    padding: '24px',
    borderRadius: '16px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  }}>
      <${MembersDataPair} tone="dark" label="Tienes" value="232.757 millas" />
      <${MembersDataPair} tone="dark" label="Estatus Lifemiles" value="Gold" sublabel="Vence: Ene 30, 2026" />
    </div>
  </section>
`;

export default MembersDataPairSample;
