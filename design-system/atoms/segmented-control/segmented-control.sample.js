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
  const [lgTab, setLgTab] = useState('a');
  const [overflowTab, setOverflowTab] = useState('opt1');

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

      <div class="flex flex-col gap-3">
        <h2 class="text-xl font-bold">Variante Large (size lg · 1279360)</h2>
        <${SegmentedControl}
          size="lg"
          ariaLabel="Variante large"
          options=${[
    { key: 'a', label: 'Datos' },
    { key: 'b', label: 'Pagos' },
    { key: 'c', label: 'Ajustes' },
  ]}
          value=${lgTab}
          onChange=${setLgTab}
        />
        <p class="text-sm text-[#5a5a5a]">Activa: <strong>${lgTab}</strong></p>
      </div>

      <div class="flex flex-col gap-3">
        <h2 class="text-xl font-bold">Overflow scrollable + fluidMinW (viewport angosto · 1279360)</h2>
        <p class="text-sm text-[#5a5a5a]">
          5 opciones largas en un contenedor de 320px: scroll horizontal con
          auto-scroll a la opción activa (probar tabs largos como "Configuraciones").
        </p>
        <div class="w-[320px] border border-dashed border-[#b6b6b6] p-2 rounded-2xl">
          <${SegmentedControl}
            scrollable=${true}
            fluidMinW=${true}
            ariaLabel="Overflow scrollable"
            options=${[
    { key: 'opt1', label: 'Información' },
    { key: 'opt2', label: 'Documentos' },
    { key: 'opt3', label: 'Acompañantes' },
    { key: 'opt4', label: 'Preferencias' },
    { key: 'opt5', label: 'Configuraciones' },
  ]}
            value=${overflowTab}
            onChange=${setOverflowTab}
          />
        </div>
        <p class="text-sm text-[#5a5a5a]">Activa: <strong>${overflowTab}</strong></p>
      </div>
    </section>
  `;
};

export default SegmentedControlSample;
