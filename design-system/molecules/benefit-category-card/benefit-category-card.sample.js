import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { BenefitCategoryCard } from './benefit-category-card.js';
import { getEliteTierTokens } from '../../helpers/members-tier-theme.js';
import { getEliteLabelsSync } from '../../../scripts/services/members/members-i18n.js';

const html = htm.bind(h);

// Categorías de ejemplo que ejercen los 4 tipos de valor del board BenefitsCards:
// count ("N veces"), unlimited ("Ilimitado"), na ("No aplica"), discount ("X%
// descuento") + el caso "recuadro de 4 ítems" y el caso "texto a dos líneas".
const CAT_LOUNGES = {
  key: 'lounges',
  title: 'Salas VIP',
  eyebrow: 'Entrada a',
  icon: 'members/quick-lounges',
  ctaLabel: 'Conoce más',
  ctaUrl: '#',
  subBenefits: [
    { label: 'Salas VIP Avianca', value: { kind: 'unlimited' } },
    { label: 'Acompañante en salas VIP Avianca', value: { kind: 'count', amount: 12 } },
    { label: 'Salas VIP Star Alliance', value: { kind: 'count', amount: 8 } },
    { label: 'Salas VIP el Espíritu del Viajero', value: { kind: 'count', amount: 3 } },
  ],
};

const CAT_BAGGAGE = {
  key: 'baggage',
  title: 'Equipaje adicional',
  eyebrow: 'Tienes derecho a',
  icon: 'services/airplane-ticket',
  ctaLabel: 'Postularme',
  ctaUrl: '',
  subBenefits: [
    { label: 'Equipaje de bodega adicional para tus viajes internacionales de largo trayecto', value: { kind: 'count', amount: 1 } },
    { label: 'Descuento en compra de equipaje', value: { kind: 'discount', percent: 10 } },
    { label: 'Tarifa preferente por exceso de equipaje', value: { kind: 'na' } },
  ],
};

/**
 * Sample del BenefitCategoryCard (1271693, rework plan A). Muestra los 4 tipos de
 * valor (count/unlimited/na/discount), el color por tier (Lifemiles vs Gold), el
 * modo estático (desktop) y el modo accordion (mobile).
 */
export const BenefitCategoryCardSample = () => {
  const labels = getEliteLabelsSync();
  const lm = getEliteTierTokens('lifemiles').overlay;
  const gold = getEliteTierTokens('gold').overlay;
  return html`
    <section style=${{
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#EEEFF1',
  }}>
      <h2>BenefitCategoryCard (molécula — 1271693, rework plan A)</h2>

      <p style=${{ color: '#666', margin: 0 }}>Estática (desktop) — 4 ítems, unlimited + count, color Lifemiles:</p>
      <div style=${{ maxWidth: '360px' }}>
        <${BenefitCategoryCard} category=${CAT_LOUNGES} labels=${labels} tierColor=${lm} />
      </div>

      <p style=${{ color: '#666', margin: 0 }}>Estática (desktop) — discount + na + texto 2 líneas, color Gold:</p>
      <div style=${{ maxWidth: '360px' }}>
        <${BenefitCategoryCard} category=${CAT_BAGGAGE} labels=${labels} tierColor=${gold} />
      </div>

      <p style=${{ color: '#666', margin: 0 }}>Accordion (mobile) — 1ª abierta, ícono a la izquierda, color Lifemiles:</p>
      <div style=${{ maxWidth: '360px' }}>
        <${BenefitCategoryCard} category=${CAT_LOUNGES} labels=${labels} tierColor=${lm} collapsible=${true} defaultOpen=${true} />
        <${BenefitCategoryCard} category=${CAT_BAGGAGE} labels=${labels} tierColor=${lm} collapsible=${true} defaultOpen=${false} />
      </div>
    </section>
  `;
};

export default BenefitCategoryCardSample;
