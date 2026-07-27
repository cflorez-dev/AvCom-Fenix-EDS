import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { MembersAccountTabs } from './members-account-tabs.js';
import { getAccountLabelsSync } from '../../../scripts/services/members/members-i18n.js';
import {
  TAB_DATA,
  TAB_PAYMENTS,
  TAB_SETTINGS,
} from './members-account-tabs.logic.js';

const html = htm.bind(h);

const dummyPanel = (title) => html`
  <div class="rounded-2xl border border-[#e9e9e9] p-6 text-center text-[var(--text-normal-secondary)]">
    Contenido de <strong>${title}</strong> (lo llenan 1279361/62/63)
  </div>
`;

/**
 * MembersAccountTabsSample — showcase de las tabs de Gestión de cuenta (1279360).
 * Deep-link operativo: probar `?tab=pagos`/`payments`/`paiements`/`pagamentos`
 * en la URL del showcase → arranca en Pagos; `replaceState` no ensucia el
 * historial al cambiar de tab.
 */
export const MembersAccountTabsSample = () => {
  const labels = getAccountLabelsSync();
  return html`
    <section class="p-6 flex flex-col gap-4">
      <h2 class="text-2xl font-bold">MembersAccountTabs (molécula · deep-link ?tab=)</h2>
      <p class="text-sm text-[var(--text-normal-secondary)]">
        3 tabs con SegmentedControl md + fluidMinW + scrollable. Deep-link
        cross-idioma: <code>?tab=pagos|payments|paiements|pagamentos</code>.
      </p>
      <${MembersAccountTabs}
        labels=${labels}
        panels=${{
    [TAB_DATA]: dummyPanel('Datos'),
    [TAB_PAYMENTS]: dummyPanel('Pagos'),
    [TAB_SETTINGS]: dummyPanel('Ajustes'),
  }}
      />
    </section>
  `;
};

export default MembersAccountTabsSample;
