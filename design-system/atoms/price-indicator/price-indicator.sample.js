import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { PriceIndicator } from './price-indicator.js';

const html = htm.bind(h);

/**
 * PriceIndicatorSample - Showcase of PriceIndicator molecule
 */
export const PriceIndicatorSample = () => {
  return html`
    <div style=${{ padding: '40px', maxWidth: '800px', margin: '0 auto', backgroundColor: 'var(--bg-page-lighter)' }}>
      
      <h1 style=${{ fontSize: 'var(--heading-h600-size)', fontWeight: 'var(--heading-h600-weight)', marginBottom: 'var(--spacing-x-large)', color: 'var(--text-normal-primary)' }}>
        PriceIndicator
      </h1>

      <!-- Default (with text and legend) -->
      <section style=${{ marginBottom: 'var(--spacing-x-x-large)' }}>
        <h2 style=${{ fontSize: 'var(--heading-h500-size)', fontWeight: 'var(--heading-h500-weight)', marginBottom: 'var(--spacing-medium)', color: 'var(--text-normal-primary)' }}>
          Default (With Text and Legend)
        </h2>
        <div style=${{ padding: 'var(--spacing-medium)', backgroundColor: 'var(--bg-page-light)', borderRadius: 'var(--border-radius-small)' }}>
          <${PriceIndicator} text="Find the best price" />
        </div>
      </section>

      <!-- Spanish -->
      <section style=${{ marginBottom: 'var(--spacing-x-x-large)' }}>
        <h2 style=${{ fontSize: 'var(--heading-h500-size)', fontWeight: 'var(--heading-h500-weight)', marginBottom: 'var(--spacing-medium)', color: 'var(--text-normal-primary)' }}>
          Spanish Text
        </h2>
        <div style=${{ padding: 'var(--spacing-medium)', backgroundColor: 'var(--bg-page-light)', borderRadius: 'var(--border-radius-small)' }}>
          <${PriceIndicator} text="Encuentra el mejor precio" />
        </div>
      </section>

      <!-- Legend Only -->
      <section style=${{ marginBottom: 'var(--spacing-x-x-large)' }}>
        <h2 style=${{ fontSize: 'var(--heading-h500-size)', fontWeight: 'var(--heading-h500-weight)', marginBottom: 'var(--spacing-medium)', color: 'var(--text-normal-primary)' }}>
          Legend Only (No Text)
        </h2>
        <div style=${{ padding: 'var(--spacing-medium)', backgroundColor: 'var(--bg-page-light)', borderRadius: 'var(--border-radius-small)' }}>
          <${PriceIndicator} text="" />
        </div>
      </section>

      <!-- Without Legend -->
      <section style=${{ marginBottom: 'var(--spacing-x-x-large)' }}>
        <h2 style=${{ fontSize: 'var(--heading-h500-size)', fontWeight: 'var(--heading-h500-weight)', marginBottom: 'var(--spacing-medium)', color: 'var(--text-normal-primary)' }}>
          Text Only (No Legend)
        </h2>
        <div style=${{ padding: 'var(--spacing-medium)', backgroundColor: 'var(--bg-page-light)', borderRadius: 'var(--border-radius-small)' }}>
          <${PriceIndicator} text="Find the best price" showLegend=${false} />
        </div>
      </section>

    </div>
  `;
};

export default PriceIndicatorSample;
