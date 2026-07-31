import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { GoalProgressRow } from './goal-progress-row.js';

const html = htm.bind(h);

const LABELS = { remainingLabel: 'Faltan: {n} millas para {tier}' };

// Modelo mock de Gold (mismo shape que buildPanelModel().rows[] — contadores
// del fixture real 8000/8000 + hitos mantener/meta).
const GOLD_TOTAL_ROW = {
  kind: 'total',
  mode: 'detail',
  title: 'Millas totales calificables',
  hint: 'Incluye tus millas con Avianca',
  counterValue: 8000,
  counterGoal: 45000,
  remaining: 37000,
  remainingTier: 'Diamond',
  fillPct: 20,
  fillStyleKey: 'total',
  milestones: [
    {
      pos: 0, label: 'Inicio', labelAlign: 'left', marker: 'flag',
    },
    {
      pos: 0.5, label: 'Mantener Gold en 2027', sublabel: '20,000', state: 'default', labelAlign: 'center',
    },
    {
      pos: 1, label: 'Diamond', sublabel: '45,000', state: 'default', labelAlign: 'right',
    },
  ],
};

const GOLD_AVIANCA_ROW = {
  kind: 'avianca',
  mode: 'detail',
  title: 'Millas requeridas con Avianca',
  hint: '',
  counterValue: 8000,
  counterGoal: 15000,
  remaining: 7000,
  remainingTier: 'Diamond',
  fillPct: 50,
  fillStyleKey: 'avianca',
  milestones: [
    {
      pos: 0, label: 'Inicio', labelAlign: 'left', marker: 'flag',
    },
    {
      pos: 0.5, label: 'Mantener Gold en 2027', sublabel: '8,000', state: 'success', labelAlign: 'center',
    },
    {
      pos: 1, label: 'Diamond', sublabel: '15,000', state: 'default', labelAlign: 'right',
    },
  ],
};

const GOLD_FULL_ROW = {
  ...GOLD_TOTAL_ROW,
  mode: 'full',
  fillPct: (2 / 3) * 100,
  milestones: [
    { pos: 0, label: 'LifeMiles', labelAlign: 'left' },
    {
      pos: 1 / 3, label: 'Silver', sublabel: '8,000', labelAlign: 'center',
    },
    {
      pos: 2 / 3, label: 'Gold', sublabel: '20,000', state: 'current', labelAlign: 'center',
    },
    {
      pos: 1, label: 'Diamond', sublabel: '45,000', labelAlign: 'right',
    },
  ],
};

/**
 * Sample del GoalProgressRow (1271699 paso 10) con el modelo mock de Gold.
 * Redimensionar el viewport para validar los 3 layouts: columna ≤767 ·
 * 0.75fr/1fr 768-1023 · 0.5fr/1fr ≥1024 (D2 provisional, mocks = canónico).
 */
export const GoalProgressRowSample = () => html`
  <section style=${{
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px',
  }}>
    <h2>GoalProgressRow (molécula — 1271699)</h2>
    <p style=${{ color: '#666', margin: 0 }}>
      Modelo Gold (contadores + hitos mantener/meta). Redimensionar el viewport
      para ver el grid 0.5fr (desktop) / 0.75fr (tablet) / columna (mobile):
    </p>
    <div style=${{
    background: '#ffffff',
    border: '1px solid #e5e5e5',
    padding: '24px',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  }}>
      <${GoalProgressRow} row=${GOLD_TOTAL_ROW} labels=${LABELS} tierColor="#A55B1F" />
      <${GoalProgressRow} row=${GOLD_AVIANCA_ROW} labels=${LABELS} tierColor="#A55B1F" />
    </div>

    <p style=${{ color: '#666', margin: 0 }}>Vista completa (hitos = círculos por tier, fill por posición):</p>
    <div style=${{
    background: '#ffffff', border: '1px solid #e5e5e5', padding: '24px', borderRadius: '16px',
  }}>
      <${GoalProgressRow} row=${GOLD_FULL_ROW} labels=${LABELS} tierColor="#A55B1F" />
    </div>
  </section>
`;

export default GoalProgressRowSample;
