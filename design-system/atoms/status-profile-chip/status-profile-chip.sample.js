import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { StatusProfileChip } from './status-profile-chip.js';

const html = htm.bind(h);

/**
 * StatusProfileChipSample — showcase del badge de completitud (1279360, kit DS).
 * Ambas variantes + texto custom por prop `label` (el texto real llega por i18n
 * del consumidor).
 */
export const StatusProfileChipSample = () => html`
  <section class="p-6 flex flex-col gap-6">
    <h2 class="text-2xl font-bold">StatusProfileChip (átomo · badge completitud)</h2>
    <div class="flex flex-col gap-4 items-start">
      <div class="flex items-center gap-3">
        <${StatusProfileChip} variant="incomplete" />
        <span class="text-sm text-[var(--text-normal-secondary)]">incomplete (default label)</span>
      </div>
      <div class="flex items-center gap-3">
        <${StatusProfileChip} variant="incomplete" label="Pendiente por completar" />
        <span class="text-sm text-[var(--text-normal-secondary)]">incomplete (label custom)</span>
      </div>
      <div class="flex items-center gap-3">
        <${StatusProfileChip} variant="complete" label="Perfil completo" />
        <span class="text-sm text-[var(--text-normal-secondary)]">complete (solo check verde)</span>
      </div>
    </div>
  </section>
`;

export default StatusProfileChipSample;
