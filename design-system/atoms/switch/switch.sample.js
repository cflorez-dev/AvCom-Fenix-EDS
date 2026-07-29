import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Switch } from './switch.js';

const html = htm.bind(h);

/**
 * SwitchSample — showcase del átomo Switch (1279360, kit DS). Ejercita ON/OFF
 * (estado controlado), disabled y el patrón "fila con label externo" (como los
 * opt-ins de 1279363). El estado OFF es derivado (PENDIENTE-DISEÑO D16): se marca
 * en la nota para el reviewer/diseño.
 */
export const SwitchSample = () => {
  const [on, setOn] = useState(true);
  const [off, setOff] = useState(false);

  return html`
    <section class="p-6 flex flex-col gap-6">
      <h2 class="text-2xl font-bold">Switch (átomo · role=switch)</h2>
      <p class="text-sm text-[var(--text-normal-secondary)]">
        ON = track verde (<code>--icon-accent-positive</code>). OFF = track gris
        (<code>--border-stroke-default</code>) — estado derivado, PENDIENTE-DISEÑO (D16).
      </p>

      <div class="flex flex-col gap-4 max-w-[420px]">
        <div class="flex items-center justify-between">
          <span class="text-base">ON (controlado)</span>
          <${Switch} checked=${on} onChange=${setOn} ariaLabel="Ejemplo ON" />
        </div>
        <div class="flex items-center justify-between">
          <span class="text-base">OFF (controlado)</span>
          <${Switch} checked=${off} onChange=${setOff} ariaLabel="Ejemplo OFF" />
        </div>
        <div class="flex items-center justify-between">
          <span class="text-base text-[var(--text-normal-light)]">Disabled ON</span>
          <${Switch} checked=${true} disabled=${true} ariaLabel="Ejemplo disabled" />
        </div>
        <div class="flex items-center justify-between">
          <span class="text-base text-[var(--text-normal-light)]">Disabled OFF</span>
          <${Switch} checked=${false} disabled=${true} ariaLabel="Ejemplo disabled off" />
        </div>
      </div>
    </section>
  `;
};

export default SwitchSample;
