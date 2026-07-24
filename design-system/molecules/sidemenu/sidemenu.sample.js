import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Sidemenu, SidemenuItem } from './sidemenu.js';
import { Button } from '../../atoms/button/button.js';

const html = htm.bind(h);

/**
 * SidemenuSample - Demo del Sidemenu Members.
 *
 * Muestra:
 *  1. Apertura del drawer derecho (slide-in 300ms desde la derecha)
 *  2. Lista de items Members (Reservar / Mi estatus / etc) con divider
 *  3. Item "Cerrar sesión" al pie con icon-before
 *  4. Item externo con icono open-in-new
 *  5. Overlay #1B1B1B 70% + backdrop-blur 4px
 *  6. Comportamiento responsive: full-screen <768px, drawer ≥768px
 */
export const SidemenuSample = () => {
  const [isOpen, setOpen] = useState(false);

  return html`
    <section style=${{
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px',
  }}>
      <h2>Sidemenu (Members profileMenu)</h2>
      <p>
        Drawer lateral derecho con overlay y blur. Click "Abrir Sidemenu".
      </p>
      <${Button} variant="secondary" size="sm" onClick=${() => setOpen(true)}>
        Abrir Sidemenu
      </${Button}>

      <${Sidemenu}
        isOpen=${isOpen}
        onClose=${() => setOpen(false)}
        ariaLabel="Menú de miembro"
        header=${html`
          <div
            style=${{
    background: 'linear-gradient(90deg, #b50080 0%, #e9010d 100%)',
    padding: '50px 16px 24px 16px',
    color: '#ffffff',
  }}
          >
            <h3 style=${{ margin: 0, fontSize: '24px', fontWeight: 700 }}>Sebastián</h3>
            <p style=${{ margin: '8px 0 0 0', fontSize: '16px', fontWeight: 700 }}>
              Lifemiles · 10226536986
            </p>
          </div>
        `}
        footer=${html`
          <${SidemenuItem}
            label="Cerrar sesión"
            iconBefore="action/exit-to-app"
            onClick=${() => setOpen(false)}
            showDivider=${false}
          />
        `}
      >
        <${SidemenuItem}
          label="Reservar vuelo con millas"
          iconAfter="navigation/chevron-right"
          onClick=${() => setOpen(false)}
        />
        <${SidemenuItem}
          label="Mi estatus elite"
          iconAfter="navigation/chevron-right"
          onClick=${() => setOpen(false)}
        />
        <${SidemenuItem}
          label="Mis tarjetas"
          iconAfter="navigation/chevron-right"
          onClick=${() => setOpen(false)}
        />
        <${SidemenuItem}
          label="Mis viajes"
          iconAfter="navigation/chevron-right"
          onClick=${() => setOpen(false)}
        />
        <${SidemenuItem}
          label="Gestionar mis millas"
          iconAfter="navigation/chevron-right"
          onClick=${() => setOpen(false)}
        />
        <${SidemenuItem}
          label="Historial de transacciones"
          iconAfter="navigation/open-in-new"
          href="https://lifemiles.com"
          external=${true}
          showDivider=${false}
        />
      </${Sidemenu}>
    </section>
  `;
};

export default SidemenuSample;
