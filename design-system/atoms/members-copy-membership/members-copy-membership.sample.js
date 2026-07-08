import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { MembersCopyMembership } from './members-copy-membership.js';

const html = htm.bind(h);

/**
 * Sample del MembersCopyMembership. Se monta sobre un fondo oscuro (replica el
 * gradient del hero / drawer) porque el átomo está diseñado para fondos oscuros
 * (texto blanco + halo multiply). Probar: copiar al portapapeles, feedback
 * "Copiado", foco por teclado (Tab → Enter).
 */
export const MembersCopyMembershipSample = () => html`
  <section style=${{
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px',
  }}>
    <h2>MembersCopyMembership (átomo)</h2>
    <p style=${{ color: '#666' }}>Sobre fondo oscuro (gradient del hero). Tab + Enter para copiar.</p>
    <div style=${{
    background: 'linear-gradient(90deg, #b50080 0%, #e9010d 100%)',
    padding: '24px',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  }}>
      <${MembersCopyMembership} membershipNumber="10089768901" />
      <${MembersCopyMembership} label="Lifemiles" membershipNumber="10226536986" />
      <${MembersCopyMembership}
        membershipNumber="13515182590"
        copyAriaLabel="Copiar número de socio"
        copiedLabel="¡Copiado!"
      />
    </div>
    <p style=${{ color: '#666' }}>Sin número (guard) → no renderiza:</p>
    <${MembersCopyMembership} membershipNumber=${null} />
  </section>
`;

export default MembersCopyMembershipSample;
