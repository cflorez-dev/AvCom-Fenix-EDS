import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { MembersMembershipCard } from './members-membership-card.js';

const html = htm.bind(h);

const TIERS = ['lifemiles', 'red-plus', 'silver', 'gold', 'diamond', 'magno'];

/**
 * Sample del MembersMembershipCard. Una tarjeta por tier (ojo Gold con
 * gradientToStop 124.8%). Ancho fijo ~360px (como en desktop ≥1024).
 */
export const MembersMembershipCardSample = () => html`
  <section style=${{
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px',
  }}>
    <h2>MembersMembershipCard (molécula · solo desktop ≥1024)</h2>
    <div style=${{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      ${TIERS.map((t) => html`
        <div key=${t} style=${{ width: '320px' }}>
          <${MembersMembershipCard} tier=${t} memberName="Sebastián Ruiz" />
        </div>
      `)}
    </div>
  </section>
`;

export default MembersMembershipCardSample;
