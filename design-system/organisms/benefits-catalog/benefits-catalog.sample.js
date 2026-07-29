import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { BenefitsCatalog } from './benefits-catalog.js';
import { toBenefitsCatalogVM } from '../../../scripts/services/members/benefits-catalog.service.js';
import { DEFAULT_BENEFITS_CATALOG } from '../../../scripts/services/members/members-config.js';
import { getEliteLabelsSync } from '../../../scripts/services/members/members-i18n.js';

const html = htm.bind(h);

// Raw INLINE con el shape EXACTO del wrapper `lmBenefits` (doc pág. 22), espejo
// del fixture tests/fixtures/members/elite/lm-benefits.json. El sample corre el
// pipeline REAL (toBenefitsCatalogVM + DEFAULT_BENEFITS_CATALOG): la estructura
// sale de la config y los amounts de los `count` con `lmGroup` se pisan con LM
// (merge // TODO(LM)). Fixture-first, hasta que LM arregle UAT.
const LM_BENEFITS_RAW = {
  member: { memshpnum: '47464574706', tier: 'Gold' },
  summarization: [
    {
      type: 'EP',
      amount: 1049,
      totalAccrual: 1049,
      detail: [
        { grpId: 'PNTGRP59', grpNam: 'Elite Benefits Sala VIP', amount: 1000, totalAccrual: 1000 },
        { grpId: 'PNTGRP60', grpNam: 'Elite Benefits Upgrade', amount: 2, totalAccrual: 2 },
        { grpId: 'PNTGRP61', grpNam: 'EB upgrade WL America', amount: 10, totalAccrual: 12 },
        { grpId: 'PNTGRP62', grpNam: 'EB Upgrade WL Domestico', amount: 12, totalAccrual: 12 },
        { grpId: 'PNTGRP69', grpNam: 'Salas VIP Gol', amount: 8, totalAccrual: 8 },
        { grpId: 'PNTGRP71', grpNam: 'Acomp Elite Benefits Sala VIP', amount: 12, totalAccrual: 12 },
        { grpId: 'PNTGRP73', grpNam: 'Elite Benefits Sala VIP Espana', amount: 3, totalAccrual: 8 },
      ],
    },
  ],
};

// Config con links del módulo poblados (para ver el "Conoce todos"/"T&C").
const CFG = {
  benefitsCatalog: {
    ...DEFAULT_BENEFITS_CATALOG,
    seeAllUrl: '#see-all',
    termsUrl: '#terms',
  },
};

const CATALOG_VM = toBenefitsCatalogVM(LM_BENEFITS_RAW, CFG);

const STATES = {
  'catálogo con datos (fixture — 5 categorías)': CATALOG_VM,
  'unavailable (endpoint roto UAT → NO renderiza nada)': { state: 'unavailable', categories: [] },
};

// Tiers para ver el color del título + valores Active (theming, no hex quemado).
const TIERS = ['Lifemiles', 'Gold', 'Silver', 'Red Plus', 'Diamond', 'Magno'];

/**
 * Sample del BenefitsCatalog (1271693, rework plan A). Pipeline real: raw
 * `lmBenefits` → toBenefitsCatalogVM → grid de cards (3-col desktop / accordion
 * mobile, la 1ª abierta) + links debajo. Selector de tier para ver el color y de
 * estado para ver el fail-soft (`unavailable` no renderiza nada).
 */
export const BenefitsCatalogSample = () => {
  const labels = getEliteLabelsSync();
  const [key, setKey] = useState(Object.keys(STATES)[0]);
  const [tier, setTier] = useState(TIERS[0]);
  return html`
    <section style=${{
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#EEEFF1',
  }}>
      <h2>BenefitsCatalog (organism — 1271693, rework plan A, slot ①)</h2>
      <div style=${{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <label style=${{ fontSize: '14px' }}>estado:${' '}
          <select value=${key} onChange=${(e) => setKey(e.target.value)}>
            ${Object.keys(STATES).map((k) => html`<option key=${k} value=${k}>${k}</option>`)}
          </select>
        </label>
        <label style=${{ fontSize: '14px' }}>tier (color):${' '}
          <select value=${tier} onChange=${(e) => setTier(e.target.value)}>
            ${TIERS.map((t) => html`<option key=${t} value=${t}>${t}</option>`)}
          </select>
        </label>
      </div>
      <p style=${{ color: '#666', margin: 0, fontSize: '13px' }}>
        Desktop = grid 3-col estático · Mobile (≤767) = accordions (1ª abierta). Redimensiona la ventana.
      </p>

      <${BenefitsCatalog} catalogVM=${STATES[key]} labels=${labels} tier=${tier} />
    </section>
  `;
};

export default BenefitsCatalogSample;
