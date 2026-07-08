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

    <h3 class="text-lg font-bold mt-10 mb-2">Variant: hint (Figma 12:18324)</h3>
    <p class="text-sm text-text-normal-secondary mb-4">
      Pensado para identificar la acción de un botón icon-only en headers /
      barras de acciones. El wrapper aplica <code>cursor-pointer</code>
      automáticamente.
    </p>
    <div class="flex flex-wrap items-center gap-8 min-h-[180px]">
      <${Tooltip} content="Carrito de compra" variant="hint" position="bottom">
        <button
          type="button"
          aria-label="Carrito de compra"
          class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border-stroke-default bg-transparent hover:bg-[var(--color-background-brand-secondary-hover)] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2 2h2l1.5 9h7.5l1.5-6H5" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
            <circle cx="6.5" cy="13.5" r="1" fill="currentColor"/>
            <circle cx="12.5" cy="13.5" r="1" fill="currentColor"/>
          </svg>
        </button>
      </${Tooltip}>

      <${Tooltip} content="Mi perfil" variant="hint" position="bottom">
        <button
          type="button"
          aria-label="Mi perfil"
          class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border-stroke-default bg-transparent hover:bg-[var(--color-background-brand-secondary-hover)] transition-colors"
        >
          <span class="text-[14px] font-bold uppercase">SR</span>
        </button>
      </${Tooltip}>

      <${Tooltip}
        content="Always visible (preview)"
        variant="hint"
        position="bottom"
        tooltipClassName="!opacity-100 !visible"
      >
        <button
          type="button"
          aria-label="Preview"
          class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border-stroke-default"
        >
          ★
        </button>
      </${Tooltip}>
    </div>
  </div>
`;

export default TooltipSample;
