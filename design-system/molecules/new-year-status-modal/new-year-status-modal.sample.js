import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { NewYearStatusModal } from './new-year-status-modal.js';
import { getEliteLabelsSync } from '../../../scripts/services/members/members-i18n.js';

const html = htm.bind(h);

const LABELS = getEliteLabelsSync();

/**
 * Sample del NewYearStatusModal (1271694, A3). En producción está GATED
 * (`cfg.newYearModal.enabled=false`) + trigger "primer login del año"; acá se
 * abre a mano para revisar el diseño. Un botón por tier de ejemplo.
 */
export const NewYearStatusModalSample = () => {
  const [openTier, setOpenTier] = useState('');
  const tiers = ['Silver', 'Gold', 'Diamond', 'Diamond Cenit One Million', 'Magno'];
  return html`
    <section style=${{
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#EEEFF1',
  }}>
      <h2>NewYearStatusModal (molécula — 1271694, gated A3)</h2>
      <p style=${{ color: '#666', margin: 0 }}>
        Gated en producción (flag CF <code>newYearModal.enabled</code>). Abrir por tier:
      </p>
      <div style=${{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        ${tiers.map((t) => html`
          <button
            key=${t}
            type="button"
            onClick=${() => setOpenTier(t)}
            style=${{
    padding: '8px 16px', borderRadius: '999px', border: '1px solid #1b1b1b', background: '#fff', cursor: 'pointer',
  }}
          >${t}</button>
        `)}
      </div>
      <${NewYearStatusModal}
        open=${!!openTier}
        onClose=${() => setOpenTier('')}
        tier=${openTier}
        year=${2026}
        labels=${LABELS}
        profileUrl="/es/members/profile"
        tertiaryUrl="/es/lifemiles/elite"
      />
    </section>
  `;
};

export default NewYearStatusModalSample;
