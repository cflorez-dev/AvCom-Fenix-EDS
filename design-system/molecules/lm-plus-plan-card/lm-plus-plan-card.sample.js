import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { LmPlusPlanCard } from './lm-plus-plan-card.js';
import { getEliteLabelsSync } from '../../../scripts/services/members/members-i18n.js';

const html = htm.bind(h);

/**
 * Sample del LmPlusPlanCard (1271694 paso 11): activa (contrato REAL gold:
 * "Plan Lite" con planId sin match → millas/mes OCULTA y sin upsell) · activa
 * con match (millas/mes + upsell) · SUSPENDIDA (gateada — UI construida).
 * Redimensionar viewport para los 3 layouts.
 */
export const LmPlusPlanCardSample = () => {
  const labels = getEliteLabelsSync();
  return html`
    <section style=${{
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', background: '#EEEFF1',
  }}>
      <h2>LmPlusPlanCard (molécula — 1271694)</h2>

      <p style=${{ color: '#666', margin: 0 }}>
        Activa — contrato REAL (Plan Lite, planId sin match en plans[] → sin
        millas/mes ni upsell, §7.3):
      </p>
      <${LmPlusPlanCard}
        state="active"
        plan=${{ name: 'Plan Lite', monthlyMiles: null, planId: '33' }}
        upsell=${null}
        labels=${labels}
        manageUrl="/es/members/lifemiles-plus"
      />

      <p style=${{ color: '#666', margin: 0 }}>Activa con match de catálogo (millas/mes + franja upsell):</p>
      <${LmPlusPlanCard}
        state="active"
        plan=${{ name: 'Plan 2', monthlyMiles: 1250, planId: '38' }}
        upsell=${{ name: 'Plan 3', priceDelta: 70000 }}
        labels=${labels}
        manageUrl="/es/members/lifemiles-plus"
        upgradeUrl="/es/members/lifemiles-plus/mejorar"
      />

      <p style=${{ color: '#666', margin: 0 }}>SUSPENDIDA (variante gateada — solo con indicador explícito del wrapper):</p>
      <${LmPlusPlanCard}
        state="suspended"
        plan=${{ name: 'Plan 1', monthlyMiles: 6000, planId: '29' }}
        upsell=${null}
        labels=${labels}
        suspendedUntil="Jun 12, 2026"
        activateUrl="/es/members/lifemiles-plus/activar"
      />
    </section>
  `;
};

export default LmPlusPlanCardSample;
