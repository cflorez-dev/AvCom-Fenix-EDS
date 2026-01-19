import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { InformativeCard } from './informative-card.js';

const html = htm.bind(h);

export const InformativeCardSample = () => {
  const sampleImage = `${window.hlx?.codeBasePath || ''}/assets/samples/seat-and-lamp.png`;

  return html`
    <div class="p-10 max-w-screen-xl mx-auto">
      <h1 class="mb-[var(--spacing-x-large)] text-[var(--font-size-x-large)] font-bold">
        Informative Card Samples
      </h1>

      <!-- Horizontal Cards -->
      <div class="mb-12">
        <h2 class="mb-6 text-2xl font-bold text-[var(--text-normal-primary)]">Horizontal Layout</h2>
        
        <div class="flex flex-col gap-6">
          <!-- Horizontal con Button -->
          <div class="w-[400px]">
            <h3 class="mb-3 text-lg font-semibold text-[var(--text-normal-secondary)]">With Button</h3>
            <${InformativeCard}
              variant="horizontal"
              title="Travel Requirements"
              details="Find out about visas, vaccines and other documents."
              image=${sampleImage}
              imageAlt="Avianca VIP Lounge"
              ActionType="button"
              buttonText="See more"
              onClick=${() => console.log('Horizontal Button clicked')}
            />
          </div>

          <!-- Horizontal con Chevron -->
          <div class="w-[400px]">
            <h3 class="mb-3 text-lg font-semibold text-[var(--text-normal-secondary)]">With Chevron</h3>
            <${InformativeCard}
              variant="horizontal"
              title="Special Services"
              details="Learn about the services available for your trip."
              image=${sampleImage}
              imageAlt="Avianca Services"
              ActionType="chevron"
              onClick=${() => console.log('Horizontal Chevron clicked')}
            />
          </div>

          <!-- Horizontal con Both (Dev mode) -->
          <div class="w-[400px]">
            <h3 class="mb-3 text-lg font-semibold text-[var(--text-normal-secondary)]">With Both (Dev)</h3>
            <${InformativeCard}
              variant="horizontal"
              title="Development Mode"
              details="Example with button and chevron together for testing."
              image=${sampleImage}
              imageAlt="Development mode"
              ActionType="both"
              buttonText="Action"
              onClick=${() => console.log('Horizontal Both clicked')}
            />
          </div>
        </div>
      </div>

      <!-- Vertical Cards -->
      <div class="mb-12">
        <h2 class="mb-6 text-2xl font-bold text-[var(--text-normal-primary)]">Vertical Layout</h2>
        
        <div class="flex flex-wrap gap-6">
          <!-- Vertical con Button -->
          <div class="w-[400px]">
            <h3 class="mb-3 text-lg font-semibold text-[var(--text-normal-secondary)]">With Button</h3>
            <${InformativeCard}
              variant="vertical"
              title="VIP Lounges"
              details="Relax before your flight in our exclusive lounges."
              image=${sampleImage}
              imageAlt="Avianca VIP Lounge"
              ActionType="button"
              buttonText="Learn more"
              onClick=${() => console.log('Vertical Button clicked')}
            />
          </div>
        </div>
      </div>
    </div>
  `;
};

export default InformativeCardSample;
