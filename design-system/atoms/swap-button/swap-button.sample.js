import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { SwapButton } from './swap-button.js';

const html = htm.bind(h);

/**
 * SwapButtonSample - Showcase de SwapButton
 */
export const SwapButtonSample = () => {
  const [swapCount, setSwapCount] = useState(0);
  const [origin, setOrigin] = useState('Bogotá (BOG)');
  const [destination, setDestination] = useState('Miami (MIA)');

  const handleSwap = () => {
    setSwapCount(swapCount + 1);
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  return html`
    <div class="flex flex-col gap-[var(--spacing-x-x-large)] p-[var(--spacing-x-large)]">
      <!-- Header -->
      <div>
        <h1 class="text-[var(--heading-h600-size)] font-[var(--heading-h600-weight)] text-[var(--text-normal-primary)] mb-[var(--spacing-small)]">
          SwapButton Component
        </h1>
        <p class="text-[var(--paragraph-p300-size)] text-[var(--text-normal-secondary)]">
          Botón circular para intercambiar valores entre origen y destino. Auto-detecta viewport: Mobile (44x44px, flechas verticales) / Desktop (22x22px, flechas horizontales)
        </p>
      </div>

      <!-- Interactive Demo -->
      <section>
        <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-medium)] text-[var(--text-normal-primary)]">
          Demo Interactivo
        </h2>
        <div class="flex items-center gap-[var(--spacing-medium)]">
          <div class="flex flex-col gap-2">
            <label class="text-[var(--paragraph-p200-size)] font-[var(--paragraph-p200-weight)]">Origen</label>
            <input
              type="text"
              value=${origin}
              disabled
              class="px-4 py-2 border border-[var(--border-stroke-default)] rounded-lg bg-[var(--bg-page-lighter)]"
            />
          </div>
          
          <${SwapButton} onClick=${handleSwap} customClassName="self-center mt-6" />
          
          <div class="flex flex-col gap-2">
            <label class="text-[var(--paragraph-p200-size)] font-[var(--paragraph-p200-weight)]">Destino</label>
            <input
              type="text"
              value=${destination}
              disabled
              class="px-4 py-2 border border-[var(--border-stroke-default)] rounded-lg bg-[var(--bg-page-lighter)]"
            />
          </div>
        </div>
        <p class="mt-4 text-[var(--paragraph-p200-size)] text-[var(--text-normal-secondary)]">
          Swaps realizados: ${swapCount}
        </p>
        <div class="mt-4 p-4 bg-[var(--bg-page-light)] rounded-lg">
          <h3 class="font-bold mb-2">Características:</h3>
          <ul class="list-disc list-inside space-y-1 text-[var(--paragraph-p200-size)]">
            <li>Auto-detección de viewport (menor a 768px = mobile, mayor o igual a 768px = desktop)</li>
            <li>Mobile: 44x44px, flechas verticales (↕)</li>
            <li>Desktop: 22x22px, flechas horizontales (↔)</li>
            <li>Animación 180° acumulativa (200ms, ease-in-out)</li>
            <li>Funciona siempre (incluso con campos vacíos)</li>
          </ul>
        </div>
      </section>
    </div>
  `;
};

export default SwapButtonSample;
