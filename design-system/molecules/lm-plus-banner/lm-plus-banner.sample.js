import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { LmPlusBanner } from './lm-plus-banner.js';
import { getEliteLabelsSync } from '../../../scripts/services/members/members-i18n.js';

const html = htm.bind(h);

/**
 * Sample del LmPlusBanner (1271694 paso 11): banner "Suscríbete a Lifemiles
 * Plus" (estado `none` del VM — caso real de 4/5 cuentas UAT). Sin título de
 * sección (§D: reemplaza a la sección entera).
 */
export const LmPlusBannerSample = () => {
  const labels = getEliteLabelsSync();
  return html`
    <section style=${{
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', background: '#EEEFF1',
  }}>
      <h2>LmPlusBanner (molécula — 1271694)</h2>
      <${LmPlusBanner} labels=${labels} ctaUrl="/es/members/lifemiles-plus/suscribirse" />
    </section>
  `;
};

export default LmPlusBannerSample;
