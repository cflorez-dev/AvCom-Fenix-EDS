import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { AviancaCreditsCard } from './avianca-credits-card.js';
import { CarouselNavigationButton } from '../../atoms/carousel-navigation-button/carousel-navigation-button.js';
import { getAccountLabelsSync } from '../../../scripts/services/members/members-i18n.js';

const html = htm.bind(h);

const tpl = (t, p = {}) => String(t || '').replace(/\{(\w+)\}/g, (m, k) => (p[k] != null ? p[k] : m));

const CREDITS = [
  {
    maskedNumber: '••••••••8901', type: 'Reembolsable', state: 'active', currency: 'COP', initialBalance: 500000, balance: 320000, holderName: 'Juan Sebastián Rodríguez', issueDate: '2025-03-14', expiryDate: '2027-03-14',
  },
  {
    maskedNumber: '••••••••4477', type: 'No reembolsable', state: 'no-balance', currency: 'COP', initialBalance: 250000, balance: 0, holderName: 'María Fernanda Villalobos Santamaría de la Espriella', issueDate: '2024-11-02', expiryDate: '2026-11-02',
  },
  {
    maskedNumber: '••••••••1200', type: 'Reembolsable', state: 'cancelled', currency: 'USD', initialBalance: 120, balance: 0, holderName: 'Carlos Andrés Gómez', issueDate: '2023-06-20', expiryDate: '2025-06-20',
  },
];

/**
 * Sample del AviancaCreditsCard (1279362 paso 7): 3 estados (active/no-balance/
 * cancelled), titular largo a 2 líneas, y el paginador multi "N de M" (mismo
 * patrón de CobrandSlider — CarouselNavigationButton) reusado por el módulo AVC.
 */
export const AviancaCreditsCardSample = () => {
  const labels = getAccountLabelsSync();
  const [index, setIndex] = useState(0);
  const total = CREDITS.length;
  const current = Math.max(0, Math.min(index, total - 1));

  return html`
    <section style=${{
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#EEEFF1',
  }}>
      <h2>AviancaCreditsCard (molécula — 1279362)</h2>
      <p style=${{ color: '#666', margin: 0 }}>3 estados + titular largo (2 líneas ≥1024).</p>
      ${CREDITS.map((c) => html`<${AviancaCreditsCard} key=${c.maskedNumber} credit=${c} labels=${labels} movementsUrl="/es/members/avcredits" />`)}

      <p style=${{ color: '#666', margin: 0 }}>Multi con paginación "N de M":</p>
      <${AviancaCreditsCard} credit=${CREDITS[current]} labels=${labels} movementsUrl="/es/members/avcredits" />
      <div style=${{
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px',
  }}>
        <${CarouselNavigationButton} direction="left" absolute=${false} disabled=${current === 0} onClick=${() => setIndex((i) => Math.max(0, i - 1))} />
        <span style=${{ fontSize: '14px' }}>${tpl(labels.avCreditsPagination, { n: current + 1, m: total })}</span>
        <${CarouselNavigationButton} direction="right" absolute=${false} disabled=${current === total - 1} onClick=${() => setIndex((i) => Math.min(total - 1, i + 1))} />
      </div>
    </section>
  `;
};

export default AviancaCreditsCardSample;
