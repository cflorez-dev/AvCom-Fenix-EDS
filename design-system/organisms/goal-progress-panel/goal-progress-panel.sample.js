import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { GoalProgressPanel } from './goal-progress-panel.js';
import { buildPanelModel } from '../../../scripts/services/members/goal-progress.logic.js';
import { getEliteLabelsSync } from '../../../scripts/services/members/members-i18n.js';
import { getEliteTierTokens } from '../../helpers/members-tier-theme.js';
import { Icon } from '../../atoms/icon/icon.js';

const html = htm.bind(h);

// --- VM sintético (mismo shape que buildEliteDetailVM) con la tabla del AC.
const GOALS = {
  'red-plus': { total: { COL: 4000, EXCOL: 6000 }, avianca: { COL: 1000, EXCOL: 1000 } },
  silver: { total: { COL: 8000, EXCOL: 12000 }, avianca: { COL: 2000, EXCOL: 3000 } },
  gold: { total: { COL: 20000, EXCOL: 24000 }, avianca: { COL: 8000, EXCOL: 12000 } },
  diamond: { total: { COL: 45000, EXCOL: 45000 }, avianca: { COL: 15000, EXCOL: 22500 } },
  magno: { total: null, avianca: { COL: 110000, EXCOL: 110000 } },
};
const LADDER_KEYS = ['lifemiles', 'red-plus', 'silver', 'gold', 'diamond', 'magno'];

const makeVM = ({
  tierBase = 'lifemiles', cenitLevel = null, totalYear = 0, avYear = 0,
  avLifetime = 0, region = 'COL', magnoTotal = null,
}) => {
  const totalOf = (t) => {
    if (t === 'magno') return magnoTotal;
    return GOALS[t]?.total ? GOALS[t].total[region] : null;
  };
  const ladder = LADDER_KEYS.map((t) => ({
    tier: t,
    total: totalOf(t),
    avianca: GOALS[t]?.avianca ? GOALS[t].avianca[region] : null,
  }));
  const pure = tierBase.replace(/-cenit$/, '');
  const idx = ladder.findIndex((e) => e.tier === pure);
  const m = ladder[idx] || {};
  const maintain = (m.total != null || m.avianca != null)
    ? { total: m.total, avianca: m.avianca } : null;
  const n = ladder[idx + 1] || null;
  const version = avLifetime < 1000000 ? '1m' : '2m';
  return {
    tierBase,
    cenitLevel,
    displayTier: null,
    year: 2026,
    maintainYear: 2027,
    region,
    metrics: { totalYear, avYear, avLifetime },
    goals: {
      maintain,
      next: n ? { tier: n.tier, total: n.total, avianca: n.avianca } : null,
      ladder,
    },
    cenit: {
      visible: avLifetime >= 500000 || pure === 'magno' || (cenitLevel != null && cenitLevel >= 1),
      version,
      goal: version === '1m' ? 1000000 : 2000000,
      current: avLifetime,
      oneGoal: 1000000,
      twoGoal: 2000000,
    },
  };
};

// Las 10 variantes del paso 6 + edges útiles para el pixel-pass.
const VARIANTS = {
  'lifemiles (sin acumulación)': makeVM({ tierBase: 'lifemiles' }),
  'lifemiles (500/500)': makeVM({ tierBase: 'lifemiles', totalYear: 500, avYear: 500 }),
  'red-plus': makeVM({ tierBase: 'red-plus', totalYear: 2000, avYear: 500 }),
  silver: makeVM({ tierBase: 'silver', totalYear: 8000, avYear: 1000 }),
  'gold (fixture 8000/8000)': makeVM({ tierBase: 'gold', totalYear: 8000, avYear: 8000 }),
  '★ Fernando LM (55900/8000, Magno total)': makeVM({
    tierBase: 'gold', totalYear: 55900, avYear: 8000, magnoTotal: 110000,
  }),
  'gold-cenit-1M': makeVM({
    tierBase: 'gold-cenit', cenitLevel: 1, totalYear: 30000, avYear: 10000, avLifetime: 1200000,
  }),
  diamond: makeVM({ tierBase: 'diamond', totalYear: 20000, avYear: 12000 }),
  'diamond-cenit-1M': makeVM({
    tierBase: 'diamond-cenit', cenitLevel: 1, totalYear: 15000, avYear: 15000, avLifetime: 45000,
  }),
  'diamond-cenit-2M': makeVM({
    tierBase: 'diamond-cenit', cenitLevel: 2, totalYear: 50000, avYear: 30000, avLifetime: 2100000,
  }),
  magno: makeVM({ tierBase: 'magno', avYear: 100000, avLifetime: 100000 }),
  'magno-cenit': makeVM({
    tierBase: 'magno', cenitLevel: 1, avYear: 115000, avLifetime: 1130000,
  }),
  'recalibración (lifemiles → silver)': makeVM({ tierBase: 'lifemiles', totalYear: 5000, avYear: 1500 }),
  'diamond doble-meta (totales desaparece)': makeVM({ tierBase: 'diamond', totalYear: 45000, avYear: 15000 }),
  'gold EXCOL (metas región)': makeVM({
    tierBase: 'gold', totalYear: 8000, avYear: 8000, region: 'EXCOL',
  }),
};

/**
 * Sample del GoalProgressPanel (1271699 paso 11) con SELECTOR DE VARIANTE —
 * cada variante replica su exhibit de contexto-figma §B (765-50711/765-51837).
 */
export const GoalProgressPanelSample = () => {
  const [variant, setVariant] = useState('gold (fixture 8000/8000)');
  const labels = getEliteLabelsSync();
  const vm = VARIANTS[variant];
  const model = buildPanelModel(vm, labels);
  const tokens = getEliteTierTokens(vm.tierBase);

  return html`
    <section style=${{
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#EEEFF1',
  }}>
      <h2>GoalProgressPanel (organism — 1271699)</h2>
      <label style=${{
    display: 'flex', gap: '8px', alignItems: 'center', fontSize: '14px',
  }}>
        Variante:
        <select
          value=${variant}
          onChange=${(e) => setVariant(e.target.value)}
          style=${{ padding: '4px 8px', fontSize: '14px' }}
        >
          ${Object.keys(VARIANTS).map((k) => html`<option key=${k} value=${k}>${k}</option>`)}
        </select>
      </label>

      <${GoalProgressPanel}
        panelModel=${model}
        labels=${labels}
        year=${vm.year}
        tierColor=${tokens.overlay}
        fabBorderColor=${tokens.gradientStrongFrom}
        rowIcons=${{
    total: html`<${Icon} icon="members/lm" customSize=${13} />`,
    avianca: html`<${Icon} icon="action/plane" customSize=${16} />`,
  }}
        fabIcons=${{
    total: html`<${Icon} icon="members/lm" customSize=${24} />`,
    avianca: html`<${Icon} icon="action/plane" customSize=${24} />`,
  }}
      />
    </section>
  `;
};

export default GoalProgressPanelSample;
