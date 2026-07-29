import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { SummaryText } from './summary-text.js';

const html = htm.bind(h);

/**
 * SummaryTextSample — showcase del átomo SummaryText (1279360, kit DS). Cubre:
 * valor normal, valor vacío (muestra `–`) y disabled. Es el par label/valor de
 * las grillas de lectura de la página Gestión de cuenta.
 */
export const SummaryTextSample = () => html`
  <section class="p-6 flex flex-col gap-6">
    <h2 class="text-2xl font-bold">SummaryText (átomo · par label/valor de lectura)</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[720px]">
      <${SummaryText} label="Nombre(s)" value="Sebastián" />
      <${SummaryText} label="Correo electrónico" value="" />
      <${SummaryText} label="Teléfono" value=${null} />
      <${SummaryText} label="Documento" value="AV12345" disabled=${true} />
    </div>
    <p class="text-sm text-[var(--text-normal-secondary)]">
      El 2.º y 3.º muestran el placeholder <code>–</code> (valor vacío/null). El 4.º está disabled.
    </p>
  </section>
`;

export default SummaryTextSample;
