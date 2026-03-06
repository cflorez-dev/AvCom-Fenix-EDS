import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { Tooltip } from './tooltip.js';

const html = htm.bind(h);

export const TooltipSample = () => html`
  <div class="p-10">
    <h2 class="text-2xl font-bold mb-6">Tooltip Component</h2>
    <h3 class="text-lg font-bold mb-4">Interactive</h3>
    <div class="flex flex-wrap items-center gap-8 min-h-[180px]">
      <${Tooltip} content="Texto completo de la opción" customClassName="inline-block">
        <span class="inline-block max-w-[180px] truncate text-base text-text-normal-primary">
          Region Central America and the Caribbean (13)
        </span>
      </${Tooltip}>

      <${Tooltip} content="Tooltip en la parte inferior" position="bottom" customClassName="inline-block">
        <button type="button" class="px-4 py-2 rounded-[var(--radius-md)] border border-border-input-default">
          Hover me
        </button>
      </${Tooltip}>
    </div>

    <h3 class="text-lg font-bold mt-10 mb-4">Always Open (Style Preview)</h3>
    <div class="flex flex-wrap items-center gap-8 min-h-[180px]">
      <${Tooltip}
        content="Texto completo de la opción"
        customClassName="inline-block"
        tooltipClassName="!opacity-100 !visible"
      >
        <span class="inline-block max-w-[180px] truncate text-base text-text-normal-primary">
          Region Central America and the Caribbean (13)
        </span>
      </${Tooltip}>

      <${Tooltip}
        content="Tooltip en la parte inferior"
        position="bottom"
        customClassName="inline-block"
        tooltipClassName="!opacity-100 !visible"
      >
        <button type="button" class="px-4 py-2 rounded-[var(--radius-md)] border border-border-input-default">
          Always visible
        </button>
      </${Tooltip}>
    </div>
  </div>
`;

export default TooltipSample;
