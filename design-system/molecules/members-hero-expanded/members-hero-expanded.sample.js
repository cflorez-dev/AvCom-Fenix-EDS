import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { MembersHeroExpanded } from './members-hero-expanded.js';
import { Button } from '../../atoms/button/button.js';

const html = htm.bind(h);

const fmt = (n) => new Intl.NumberFormat('es-CO').format(n);
const TIERS = ['lifemiles', 'red-plus', 'silver', 'gold', 'diamond', 'magno'];

const GRID = {
  milesLabel: 'Tienes',
  milesValue: '18.056 millas',
  expiryLabel: 'Fecha de vencimiento',
  expiryValue: 'Dic 31, 2026',
  statusLabel: 'Estatus Lifemiles',
  statusValue: 'Silver',
  statusExpiryText: 'Vence: Ene 30, 2026',
  membershipLabel: 'Número de socio',
  membershipNumber: '10089768901',
};

const QUICK_ACTIONS = [
  {
    key: 'book-with-miles', label: 'Reserva con millas', icon: 'members/quick-book-miles', url: '#', sortOrder: 1,
  },
  {
    key: 'upgrade-business', label: 'Ascenso a Business', icon: 'members/quick-upgrade-business', url: '#', sortOrder: 2,
  },
  {
    key: 'lounges', label: 'Avianca Lounges', icon: 'members/quick-lounges', url: '#', sortOrder: 3,
  },
  {
    key: 'lifemiles-plus', label: 'Lifemiles Plus', icon: 'members/quick-lifemiles-plus', url: '#', sortOrder: 4,
  },
];

const ELITE = {
  year: 2027,
  tierTarget: 'gold',
  conditions: [
    { key: 'qualifying-miles', value: 11460, goal: 20000 },
    { key: 'avianca-miles', value: 4000, goal: 8000 },
  ],
};

const ELITE_COPIES = {
  tierLabel: 'Gold',
  titleMaintain: 'Tu progreso elite {tier} para {year}',
  titleEnjoy: 'Disfruta tu estatus elite {tier} en {year}',
  conditionLabels: {
    'qualifying-miles': 'Millas totales calificables',
    'avianca-miles': 'Millas requeridas con avianca',
  },
  tooltipContent: 'Completa 20,000 millas calificables totales, de las cuales 8,000 deben ser con avianca.',
  // Sin CTA en la tira del hero (comp 518:27631).
  ctaUrl: null,
};

/**
 * Sample del MembersHeroExpanded. Selector de tier. Redimensionar para ver la
 * tarjeta de membresía aparecer a ≥1024px (hidden lg:block).
 */
export const MembersHeroExpandedSample = () => {
  const [tier, setTier] = useState('silver');
  return html`
    <section style=${{
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px',
  }}>
      <h2>MembersHeroExpanded (molécula compartida)</h2>
      <div style=${{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        ${TIERS.map((t) => html`
          <${Button}
            key=${t}
            variant=${tier === t ? 'primary' : 'secondary'}
            size="sm"
            onClick=${() => setTier(t)}
          >${t}</${Button}>
        `)}
      </div>
      <${MembersHeroExpanded}
        greeting="Hola, Sebastián"
        tier=${tier}
        tierLabel="Silver"
        toggleLabel="Ocultar detalle"
        grid=${GRID}
        quickActions=${QUICK_ACTIONS}
        opensInNewWindowLabel="abre en nueva ventana"
        elite=${ELITE}
        eliteCopies=${ELITE_COPIES}
        memberName="Sebastián Ruiz"
        formatValue=${fmt}
        onToggle=${() => {}}
      />
    </section>
  `;
};

export default MembersHeroExpandedSample;
