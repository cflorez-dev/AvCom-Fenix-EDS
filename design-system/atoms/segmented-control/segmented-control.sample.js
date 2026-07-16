import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { SegmentedControl } from './segmented-control.js';

const html = htm.bind(h);

/**
 * SegmentedControlSample — showcase del control segmentado de Members (1271689).
 * Ejercita los dos usos del lote: la barra de tabs de página (md, Progreso |
 * Beneficios) y el sub-selector del panel de progreso (sm, Detalle | Vista
 * completa). El estado se controla localmente (`useState`) para probar teclado
 * y `aria-selected`.
 */
export const SegmentedControlSample = () => {
  const [tab, setTab] = useState('progress');
  const [subTab, setSubTab] = useState('detail');

  return html`
    <section class="p-10 max-w-[75rem] mx-auto flex flex-col gap-8">
      <h1 class="text-2xl font-bold">SegmentedControl</h1>

      <div class="flex flex-col gap-3">
        <h2 class="text-xl font-bold">Tabs de página (size md)</h2>
        <${SegmentedControl}
          ariaLabel="Progreso y beneficios"
          idBase="ds-segmented-tabs"
          options=${[
    { key: 'progress', label: 'Progreso' },
    { key: 'benefits', label: 'Beneficios' },
  ]}
          value=${tab}
          onChange=${setTab}
        />
        <p class="text-sm text-[#5a5a5a]">Activa: <strong>${tab}</strong></p>
      </div>

      <div class="flex flex-col gap-3">
        <h2 class="text-xl font-bold">Sub-selector del panel (size sm)</h2>
        <${SegmentedControl}
          size="sm"
          ariaLabel="Detalle de progreso o vista completa"
          options=${[
    { key: 'detail', label: 'Detalle de progreso' },
    { key: 'full', label: 'Vista completa' },
  ]}
          value=${subTab}
          onChange=${setSubTab}
        />
        <p class="text-sm text-[#5a5a5a]">Activa: <strong>${subTab}</strong></p>
      </div>
    </section>
  `;
};

export default SegmentedControlSample;
