import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { MembersHero } from './members-hero.js';
import { setSession } from '../../../scripts/services/members/session.store.js';
import { getMockMemberMetrics } from '../../../scripts/services/members/members-data.mock.js';
import { Button } from '../../atoms/button/button.js';

const html = htm.bind(h);

const baseUser = (tier) => ({
  membershipNumber: '10089768901',
  tier,
  firstName: 'Sebastián',
  lastName: 'Ruiz',
  language: 'es',
});

const withMetrics = (tier, state) => ({ ...baseUser(tier), ...getMockMemberMetrics(state) });

/**
 * Sample del organism MembersHero. Conduce el signal `session.store` (singleton)
 * para ejercitar la máquina de estados: data por tier, empty, loading, error.
 * El toggle persiste en sessionStorage (recargar conserva el estado).
 *
 * Nota: el skeleton de barrido y la animación del toggle sólo corren con el CSS
 * del bloque cargado; en el showcase el layout se ve igual sin animación.
 */
export const MembersHeroSample = () => {
  const [tier, setTier] = useState('silver');

  const setData = (t) => { setTier(t); setSession({ status: 'authenticated', user: withMetrics(t, t) }); };
  const setEmpty = () => setSession({ status: 'authenticated', user: withMetrics(tier, 'empty') });
  const setLoading = () => setSession({ status: 'authenticated', user: null });
  const setError = () => setSession({ status: 'error', user: null });

  return html`
    <section style=${{
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px',
  }}>
      <h2>MembersHero (organism · orquestador)</h2>
      <p style=${{ color: '#666' }}>
        Controlá el estado de sesión. El toggle Ver detalle/Ocultar detalle persiste en sessionStorage.
      </p>
      <div style=${{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        ${['lifemiles', 'silver', 'gold', 'diamond', 'magno'].map((t) => html`
          <${Button} key=${t} variant="secondary" size="sm" onClick=${() => setData(t)}>
            data: ${t}
          </${Button}>
        `)}
        <${Button} variant="secondary" size="sm" onClick=${setEmpty}>empty</${Button}>
        <${Button} variant="secondary" size="sm" onClick=${setLoading}>loading</${Button}>
        <${Button} variant="secondary" size="sm" onClick=${setError}>error</${Button}>
      </div>
      <${MembersHero} />
    </section>
  `;
};

export default MembersHeroSample;
