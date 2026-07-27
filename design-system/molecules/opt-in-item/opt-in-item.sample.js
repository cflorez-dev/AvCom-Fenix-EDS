import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { OptInItem } from './opt-in-item.js';

const html = htm.bind(h);

/**
 * OptInItemSample — showcase de la fila opt-in (1279363): 3 ítems ON/OFF, uno con
 * link inline teal sanitizado y uno deshabilitado. Estado local para ver el
 * cambio inmediato del switch (sin botón guardar / sin toast).
 */
export const OptInItemSample = () => {
  const [state, setState] = useState({
    a: true, b: false, c: true, d: false,
  });
  const set = (k) => (v) => setState((s) => ({ ...s, [k]: v }));

  return html`
    <section style=${{ padding: '24px', background: '#EEEFF1' }}>
      <h2 style=${{ marginBottom: '16px' }}>OptInItem (molécula — fila opt-in 1279363)</h2>
      <div style=${{
    maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '16px',
  }}>
        <${OptInItem}
          id="promotions" title="Promociones y ofertas"
          copyHtml="Recibe promociones, ofertas y novedades de Avianca por correo electrónico y otros canales."
          checked=${state.a} onChange=${set('a')}
        />
        <${OptInItem}
          id="account" title="Notificaciones de la cuenta"
          copyHtml="Recibe alertas sobre tu cuenta, tus millas y el estado de tus transacciones."
          checked=${state.b} onChange=${set('b')}
        />
        <${OptInItem}
          id="partners" title="Comunicaciones de aliados"
          copyHtml=${'Autorizo el tratamiento de mis datos por aliados comerciales según la <a href="/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Política de Privacidad</a>.'}
          checked=${state.c} onChange=${set('c')}
        />
        <${OptInItem}
          id="disabled" title="Opt-in deshabilitado"
          copyHtml="Fila bloqueada (disabled) — el switch no responde."
          checked=${state.d} onChange=${set('d')} disabled=${true}
        />
      </div>
    </section>
  `;
};

export default OptInItemSample;
