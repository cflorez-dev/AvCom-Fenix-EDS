import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { FloatingActionButton } from './floating-action-button.js';

const html = htm.bind(h);

/**
 * Sample del FloatingActionButton (1271694 paso 3): estados Default/Hover/
 * Pressed/Focus (interactivos — hover/click/Tab) + variantes de ícono (rayo
 * default para total/cenit, avión del catálogo para avianca) + toggle
 * aria-expanded con teclado (Enter/Space).
 */
export const FloatingActionButtonSample = () => {
  const [expanded, setExpanded] = useState(false);
  return html`
    <section style=${{
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#EEEFF1',
  }}>
      <h2>FloatingActionButton (átomo — 1271694)</h2>
      <p style=${{ color: '#666', margin: 0 }}>
        Hover/click/Tab para ver bordes magenta y anillo de focus. El primero
        togglea aria-expanded (Enter/Space): <strong>${String(expanded)}</strong>
      </p>
      <div style=${{
    display: 'flex', gap: '24px', alignItems: 'center', padding: '16px',
  }}>
        <${FloatingActionButton}
          ariaLabel="Abrir acelerador de progreso"
          expanded=${expanded}
          onClick=${() => setExpanded((v) => !v)}
        />
        <${FloatingActionButton} icon="action/plane" ariaLabel="Reservar un vuelo" />
        <${FloatingActionButton} icon="action/plane" ariaLabel="Cenit" />
      </div>
    </section>
  `;
};

export default FloatingActionButtonSample;
