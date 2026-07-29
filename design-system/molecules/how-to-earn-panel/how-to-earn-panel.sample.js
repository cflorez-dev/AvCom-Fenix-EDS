import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { HowToEarnPanel } from './how-to-earn-panel.js';
import { Icon } from '../../atoms/icon/icon.js';
import { getEliteLabelsSync } from '../../../scripts/services/members/members-i18n.js';

const html = htm.bind(h);

// Íconos de sección (mock 765:75842): avión / lm / regalo. En el organism se
// resuelven CF-first vía `barIcon` (key o URL DAM); acá se pasan directos.
const SECTION_ICONS = {
  s1: html`<${Icon} icon="action/plane" customSize=${14} />`,
  s2: html`<${Icon} icon="members/lm" customSize=${14} />`,
  s3: html`<${Icon} icon="members/gift" customSize=${14} />`,
};

/**
 * Sample del HowToEarnPanel (1271699 paso 14): colapsado + expandido (3
 * columnas ≥768 / apiladas ≤767 — redimensionar viewport) + variante de tier
 * alto (> gold-cenit → solo sección 1, regla AC A5).
 */
export const HowToEarnPanelSample = () => {
  const labels = getEliteLabelsSync();
  return html`
    <section style=${{
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', background: '#EEEFF1',
  }}>
      <h2>HowToEarnPanel (molécula — 1271699)</h2>

      <p style=${{ color: '#666', margin: 0 }}>Colapsado por defecto (tier gold — 3 secciones al expandir):</p>
      <${HowToEarnPanel} tier="gold" labels=${labels} icons=${SECTION_ICONS} />

      <p style=${{ color: '#666', margin: 0 }}>Expandido (tier gold-cenit — última que ve secciones 2-3):</p>
      <${HowToEarnPanel} tier="gold-cenit" labels=${labels} icons=${SECTION_ICONS} defaultOpen=${true} />

      <p style=${{ color: '#666', margin: 0 }}>Tier alto (diamond > gold-cenit): SOLO sección 1:</p>
      <${HowToEarnPanel} tier="diamond" labels=${labels} icons=${SECTION_ICONS} defaultOpen=${true} />
    </section>
  `;
};

export default HowToEarnPanelSample;
