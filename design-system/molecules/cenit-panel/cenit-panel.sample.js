import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { CenitPanel } from './cenit-panel.js';
import { Icon } from '../../atoms/icon/icon.js';

const html = htm.bind(h);

const LABELS = { remainingLabel: 'Faltan: {n} millas para {tier}' };

const base = {
  visible: true,
  title: 'Progreso Cenit',
  barTitle: 'Millas totales con Avianca',
  fillStyleKey: 'cenit',
};
const INICIO = {
  pos: 0, label: 'Inicio', labelAlign: 'left', marker: 'flag',
};
const BODY_1M = 'Completa {goal} millas volando con avianca, para ganar de manera vitalicia todos los beneficios del estatus {tier}.';
const BODY_2M = BODY_1M;

// Modelos con el shape de buildPanelModel().cenit (goal-progress.logic.js).
const CASES = [
  {
    name: '1M vacío (0 millas)',
    cenit: {
      ...base,
      version: '1m',
      done: false,
      body: BODY_1M,
      bodyParams: { goal: '1,000,000', tier: 'Gold' },
      counterValue: 0,
      counterGoal: 1000000,
      remaining: 1000000,
      remainingTier: 'Gold',
      fillPct: 0,
      milestones: [
        INICIO,
        {
          pos: 1, label: 'Gold', sublabel: '1M', state: 'default', labelAlign: 'right',
        },
      ],
    },
  },
  {
    name: '1M en progreso (600,000)',
    cenit: {
      ...base,
      version: '1m',
      done: false,
      body: BODY_1M,
      bodyParams: { goal: '1,000,000', tier: 'Gold' },
      counterValue: 600000,
      counterGoal: 1000000,
      remaining: 400000,
      remainingTier: 'Gold',
      fillPct: 60,
      milestones: [
        INICIO,
        {
          pos: 1, label: 'Gold', sublabel: '1M', state: 'default', labelAlign: 'right',
        },
      ],
    },
  },
  {
    name: '2M en progreso (1,500,000 — arranca en la mitad)',
    cenit: {
      ...base,
      version: '2m',
      done: false,
      body: BODY_2M,
      bodyParams: { goal: '2,000,000', tier: 'Diamond' },
      counterValue: 1500000,
      counterGoal: 2000000,
      remaining: 500000,
      remainingTier: 'Diamond',
      fillPct: 75,
      milestones: [
        INICIO,
        {
          pos: 0.5, label: 'Diamond', sublabel: '1M', state: 'cenit', labelAlign: 'center',
        },
        {
          pos: 1, label: 'Diamond', sublabel: '2M', state: 'default', labelAlign: 'right',
        },
      ],
    },
  },
  {
    name: '2M COMPLETADO (contador → texto, sin hook FAB)',
    cenit: {
      ...base,
      version: '2m',
      done: true,
      body: BODY_2M,
      bodyParams: { goal: '2,000,000', tier: 'Diamond' },
      counterValue: 2100000,
      counterGoal: 2000000,
      remaining: 0,
      remainingTier: 'Diamond',
      doneText: '¡Disfruta de Diamond de por vida!',
      fillPct: 100,
      milestones: [
        INICIO,
        {
          pos: 0.5, label: 'Diamond', sublabel: '1M', state: 'cenit', labelAlign: 'center',
        },
        {
          pos: 1, label: 'Diamond', sublabel: '2M', state: 'cenit', labelAlign: 'right',
        },
      ],
    },
  },
];

/**
 * Sample del CenitPanel (1271699 paso 12): oculto · 1M vacío · 1M en progreso
 * · 2M en progreso · 2M completado. Colapsado por defecto — expandir a mano.
 */
export const CenitPanelSample = () => html`
  <section style=${{
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', background: '#EEEFF1',
  }}>
    <h2>CenitPanel (molécula — 1271699)</h2>

    <p style=${{ color: '#666', margin: 0 }}>visible=false → no renderiza:</p>
    <div style=${{ border: '1px dashed #ccc', padding: '8px', borderRadius: '8px' }}>
      <${CenitPanel} cenit=${{ visible: false }} labels=${LABELS} />
      <span style=${{ color: '#999', fontSize: '12px' }}>(vacío a propósito)</span>
    </div>

    ${CASES.map((c) => html`
      <div key=${c.name} style=${{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <p style=${{ color: '#666', margin: 0 }}>${c.name}:</p>
        <${CenitPanel} cenit=${c.cenit} labels=${LABELS} fabIcon=${html`<${Icon} icon="action/plane" customSize=${24} />`} />
      </div>
    `)}
  </section>
`;

export default CenitPanelSample;
