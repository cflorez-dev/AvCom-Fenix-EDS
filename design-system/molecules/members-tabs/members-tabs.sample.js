import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { MembersTabs } from './members-tabs.js';
import { getEliteLabelsSync } from '../../../scripts/services/members/members-i18n.js';

const html = htm.bind(h);

/**
 * MembersTabsSample — showcase de la barra de tabs con deep-linking (1271689).
 * Al cambiar de tab, la URL de esta página (`?tab=`) se actualiza vía
 * `history.replaceState` (sin recargar). El callback `onTabChange` refleja la
 * tab activa para verlo en el showcase.
 */
export const MembersTabsSample = () => {
  const labels = getEliteLabelsSync();
  const [active, setActive] = useState('progress');

  const panel = (title, body) => html`
    <div class="rounded-2xl bg-[#f5f5f5] p-6">
      <h3 class="!mt-0 !mb-2 text-lg font-bold">${title}</h3>
      <p class="!m-0 text-sm text-[#5a5a5a]">${body}</p>
    </div>
  `;

  return html`
    <section class="p-10 max-w-[75rem] mx-auto flex flex-col gap-4">
      <h1 class="text-2xl font-bold">MembersTabs (deep-linking ?tab=)</h1>
      <p class="text-sm text-[#5a5a5a]">
        Tab activa: <strong>${active}</strong> · el query param de la URL se
        actualiza sin recargar.
      </p>
      <${MembersTabs}
        labels=${labels}
        onTabChange=${setActive}
        panels=${{
    progress: panel('Panel Progreso', 'Contenido de la tab Progreso (placeholder — 1271699).'),
    benefits: panel('Panel Beneficios', 'Contenido de la tab Beneficios (slots — 1271694 / bloque 9).'),
  }}
      />
    </section>
  `;
};

export default MembersTabsSample;
