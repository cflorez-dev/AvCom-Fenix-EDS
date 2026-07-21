import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { BenefitsSection } from './benefits-section.js';
import { getEliteLabelsSync } from '../../../scripts/services/members/members-i18n.js';

const html = htm.bind(h);

const CARD = {
  name: 'Avianca Lifemiles Visa',
  bank: 'Bancolombia',
  imageUrl: '',
  chip: null,
  benefits: [
    { text: 'Tiquetes en canales de Avianca', value: '2 millas por cada USD' },
    { text: 'Millas extra en vuelos con Avianca', value: '+10% millas' },
  ],
  seeMoreUrl: '/es/tarjetas/beneficios',
  milesPeriod: null,
  generic: false,
};

const COBRAND_STATES = {
  'sin cobrand (empty — cuentas UAT reales)': { empty: true, cards: [], actions: null },
  'con cobrand (2 tarjetas)': {
    empty: false,
    cards: [CARD, { ...CARD, name: 'Avianca Lifemiles Mastercard', bank: 'Banco de Bogotá' }],
    actions: null,
  },
};

const LMPLUS_STATES = {
  'sin plan (none → banner)': { state: 'none', plan: null, upsell: null },
  'activa (contrato real Plan Lite)': { state: 'active', plan: { name: 'Plan Lite', monthlyMiles: null, planId: '33' }, upsell: null },
  'suspendida (gateada)': { state: 'suspended', plan: { name: 'Plan 1', monthlyMiles: 6000, planId: '29' }, upsell: null },
  'unavailable (wrapper caído → LM+ OCULTO)': { state: 'unavailable', plan: null, upsell: null },
};

/**
 * Sample del BenefitsSection (1271694 paso 12): los estados compuestos
 * con/sin cobrand × activa/sin/suspendida/unavailable. `unavailable` NO
 * muestra ni banner (no afirmar "sin plan" sin dato).
 */
export const BenefitsSectionSample = () => {
  const labels = getEliteLabelsSync();
  const [cobrandKey, setCobrandKey] = useState('sin cobrand (empty — cuentas UAT reales)');
  const [lmKey, setLmKey] = useState('sin plan (none → banner)');

  return html`
    <section style=${{
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#EEEFF1',
  }}>
      <h2>BenefitsSection (organism — 1271694)</h2>
      <div style=${{
    display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '14px',
  }}>
        <label>cobrand:${' '}
          <select value=${cobrandKey} onChange=${(e) => setCobrandKey(e.target.value)}>
            ${Object.keys(COBRAND_STATES).map((k) => html`<option key=${k} value=${k}>${k}</option>`)}
          </select>
        </label>
        <label>LM+:${' '}
          <select value=${lmKey} onChange=${(e) => setLmKey(e.target.value)}>
            ${Object.keys(LMPLUS_STATES).map((k) => html`<option key=${k} value=${k}>${k}</option>`)}
          </select>
        </label>
      </div>

      <${BenefitsSection}
        cobrandVM=${COBRAND_STATES[cobrandKey]}
        lmPlusVM=${LMPLUS_STATES[lmKey]}
        labels=${labels}
        flags=${{ cobrandEnabled: true, lmPlusEnabled: true }}
        milesLabel="Total acumulado en 2026"
        lmPlusUrls=${{ manage: '/es/members/lifemiles-plus', subscribe: '/es/members/lifemiles-plus/suscribirse' }}
        suspendedUntil="Jun 12, 2026"
      />
    </section>
  `;
};

export default BenefitsSectionSample;
