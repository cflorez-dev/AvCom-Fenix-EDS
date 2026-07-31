import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { AcceleratorTooltip } from './accelerator-tooltip.js';
import { FloatingActionButton } from '../../atoms/floating-action-button/floating-action-button.js';
import { getEliteTierTokens } from '../../helpers/members-tier-theme.js';

const html = htm.bind(h);

const TIERS = ['lifemiles', 'red-plus', 'silver', 'gold', 'diamond', 'magno'];

const COPY = {
  multiply: {
    title: 'Acelera tu progreso',
    body: 'Compra o multiplica tus millas para llegar más rápido a la meta.',
    ctaLabel: 'Comprar millas',
  },
  avianca: {
    title: 'Acelera tu progreso',
    body: 'Cada vuelo te acerca más a tu siguiente estatus élite.',
    ctaLabel: 'Reservar un vuelo',
  },
};

/**
 * Sample del AcceleratorTooltip (1271694 paso 4): borde por tier, las 2
 * variantes de copy (multiply/avianca), anclaje con clamp (0% / 50% / 100%) y
 * cierres por ×, Esc y click fuera.
 */
export const AcceleratorTooltipSample = () => {
  const [tier, setTier] = useState('gold');
  const [copy, setCopy] = useState('multiply');
  const [pct, setPct] = useState(50);
  const [open, setOpen] = useState(false);
  const tokens = getEliteTierTokens(tier);

  return html`
    <section style=${{
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#EEEFF1',
  }}>
      <h2>AcceleratorTooltip (molécula — 1271694)</h2>
      <div style=${{
    display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', fontSize: '14px',
  }}>
        <label>tier:${' '}
          <select value=${tier} onChange=${(e) => setTier(e.target.value)}>
            ${TIERS.map((t) => html`<option key=${t} value=${t}>${t}</option>`)}
          </select>
        </label>
        <label>copy:${' '}
          <select value=${copy} onChange=${(e) => setCopy(e.target.value)}>
            <option value="multiply">multiply (Comprar millas)</option>
            <option value="avianca">avianca (Reservar un vuelo)</option>
          </select>
        </label>
        <label>anclaje %:${' '}
          <select value=${pct} onChange=${(e) => setPct(Number(e.target.value))}>
            <option value="0">0 (extremo izq → clamp)</option>
            <option value="50">50</option>
            <option value="100">100 (extremo der → clamp)</option>
          </select>
        </label>
      </div>

      <div style=${{
    background: '#ffffff', borderRadius: '16px', padding: '140px 24px 24px',
  }}>
        <div style=${{
    position: 'relative', height: '16px', background: '#EEEFF1', borderRadius: '999px',
  }}>
          <${AcceleratorTooltip}
            open=${open}
            anchorPct=${pct}
            borderColor=${tokens.gradientStrongFrom}
            title=${COPY[copy].title}
            body=${COPY[copy].body}
            ctaLabel=${COPY[copy].ctaLabel}
            ctaUrl=""
            onClose=${() => setOpen(false)}
          />
          <span style=${{
    position: 'absolute', top: '50%', left: `${pct}%`, transform: 'translate(-50%, -50%)',
  }}>
            <${FloatingActionButton}
              ariaLabel="Abrir acelerador de progreso"
              expanded=${open}
              onClick=${() => setOpen((v) => !v)}
            />
          </span>
        </div>
      </div>
      <p style=${{ color: '#666', margin: 0, fontSize: '13px' }}>
        Cierres: × · Esc · click fuera. Con anclaje 0/100 el panel queda
        clampeado dentro del contenedor de la barra.
      </p>
    </section>
  `;
};

export default AcceleratorTooltipSample;
