import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { CobrandEmptyState } from './cobrand-empty-state.js';
import { getEliteLabelsSync } from '../../../scripts/services/members/members-i18n.js';

const html = htm.bind(h);

/**
 * Sample del CobrandEmptyState (1271694 paso 10): default (2 acciones, con
 * estados hover/active/focus interactivos) + acciones ocultas por POS.
 * Redimensionar viewport: horizontal desktop / vertical centrado mobile.
 */
export const CobrandEmptyStateSample = () => {
  const labels = getEliteLabelsSync();
  return html`
    <section style=${{
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', background: '#EEEFF1',
  }}>
      <h2>CobrandEmptyState (molécula — 1271694)</h2>

      <p style=${{ color: '#666', margin: 0 }}>Default (caso real de TODAS las cuentas UAT — sin cobrand):</p>
      <${CobrandEmptyState} labels=${labels} />

      <p style=${{ color: '#666', margin: 0 }}>Acción "solicitar" oculta por POS (columna accion_solicitar=false):</p>
      <${CobrandEmptyState}
        labels=${labels}
        actions=${{
    add: true, request: false, addLabel: '', addUrl: '/es/tarjetas/agregar',
  }}
      />
    </section>
  `;
};

export default CobrandEmptyStateSample;
