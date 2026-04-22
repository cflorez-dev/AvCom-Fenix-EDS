import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { ArrowRightIcon } from './arrow-right-icon.js';

const html = htm.bind(h);

/**
 * Samples para ArrowRightIcon
 */
export const arrowRightIconSamples = () => html`
  <div class="flex flex-col gap-[var(--spacing-x-large)] p-[var(--spacing-large)]">
    <div>
      <h3 class="text-[var(--font-size-large)] font-bold mb-[var(--spacing-medium)]">
        ArrowRightIcon - Sizes
      </h3>
      <div class="flex items-center gap-[var(--spacing-large)]">
        <div class="flex items-center gap-[var(--spacing-x-small)]">
          <${ArrowRightIcon} size=${16} />
          <span>16px</span>
        </div>
        <div class="flex items-center gap-[var(--spacing-x-small)]">
          <${ArrowRightIcon} size=${20} />
          <span>20px (default)</span>
        </div>
        <div class="flex items-center gap-[var(--spacing-x-small)]">
          <${ArrowRightIcon} size=${24} />
          <span>24px</span>
        </div>
        <div class="flex items-center gap-[var(--spacing-x-small)]">
          <${ArrowRightIcon} size=${32} />
          <span>32px</span>
        </div>
      </div>
    </div>

    <div>
      <h3 class="text-[var(--font-size-large)] font-bold mb-[var(--spacing-medium)]">
        ArrowRightIcon - Colors
      </h3>
      <div class="flex items-center gap-[var(--spacing-large)]">
        <div class="flex items-center gap-[var(--spacing-x-small)]">
          <${ArrowRightIcon} size=${20} color="currentColor" />
          <span>currentColor (hereda)</span>
        </div>
        <div class="flex items-center gap-[var(--spacing-x-small)]">
          <${ArrowRightIcon} size=${20} color="var(--link-button-default)" />
          <span>Link color</span>
        </div>
        <div class="flex items-center gap-[var(--spacing-x-small)]">
          <${ArrowRightIcon} size=${20} color="var(--brand-secondary)" />
          <span>Brand red</span>
        </div>
        <div class="flex items-center gap-[var(--spacing-x-small)]">
          <${ArrowRightIcon} size=${20} color="var(--brand-primary)" />
          <span>Brand black</span>
        </div>
      </div>
    </div>

    <div>
      <h3 class="text-[var(--font-size-large)] font-bold mb-[var(--spacing-medium)]">
        ArrowRightIcon - Con LinkButton (Uso real)
      </h3>
      <div class="flex flex-col gap-[var(--spacing-medium)]">
        <a 
          href="#" 
          class="inline-flex items-center gap-[var(--gap-8)] no-underline"
          style=${{
            color: 'var(--link-button-default)',
            textDecoration: 'underline',
            fontSize: 'var(--font-size-large)',
            fontFamily: 'var(--font-family-primary)',
          }}
        >
          Descubrir más ofertas
          <${ArrowRightIcon} size=${20} />
        </a>
        
        <a 
          href="#" 
          class="inline-flex items-center gap-[var(--gap-8)] no-underline"
          style=${{
            color: 'var(--link-button-hover)',
            textDecoration: 'underline',
            fontSize: 'var(--font-size-large)',
            fontFamily: 'var(--font-family-primary)',
          }}
        >
          Ver todas las ofertas (hover)
          <${ArrowRightIcon} size=${20} />
        </a>
      </div>
    </div>

    <div>
      <h3 class="text-[var(--font-size-large)] font-bold mb-[var(--spacing-medium)]">
        ArrowRightIcon - Background oscuro
      </h3>
      <div 
        class="flex items-center gap-[var(--spacing-large)] p-[var(--spacing-large)]"
        style=${{ backgroundColor: 'var(--brand-primary)' }}
      >
        <a 
          href="#" 
          class="inline-flex items-center gap-[var(--gap-8)] no-underline"
          style=${{
            color: '#ffffff',
            textDecoration: 'underline',
            fontSize: 'var(--font-size-large)',
          }}
        >
          Enlace blanco
          <${ArrowRightIcon} size=${20} color="#ffffff" />
        </a>
      </div>
    </div>
  </div>
`;
