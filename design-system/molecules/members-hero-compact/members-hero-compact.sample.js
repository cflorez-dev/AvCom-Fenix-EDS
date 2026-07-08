import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { MembersHeroCompact } from './members-hero-compact.js';
import { Button } from '../../atoms/button/button.js';

const html = htm.bind(h);

const TIERS = ['lifemiles', 'red-plus', 'silver', 'gold', 'diamond', 'magno'];

/**
 * Sample del MembersHeroCompact. Selector de tier + toggle (loguea la expansión).
 * Probar responsive (redimensionar a <768 → toggle baja).
 */
export const MembersHeroCompactSample = () => {
  const [tier, setTier] = useState('silver');
  return html`
    <section style=${{
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px',
  }}>
      <h2>MembersHeroCompact (molécula)</h2>
      <div style=${{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        ${TIERS.map((t) => html`
          <${Button}
            key=${t}
            variant=${tier === t ? 'primary' : 'secondary'}
            size="sm"
            onClick=${() => setTier(t)}
          >${t}</${Button}>
        `)}
      </div>
      <${MembersHeroCompact}
        firstName="Sebastián"
        tier=${tier}
        tierLabel="Silver"
        totalMilesLabel="18.056 millas"
        toggleLabel="Ver detalle"
        viewProfileLabel="Ver perfil"
        viewProfileUrl="#perfil"
        onToggle=${() => {}}
      />
    </section>
  `;
};

export default MembersHeroCompactSample;
