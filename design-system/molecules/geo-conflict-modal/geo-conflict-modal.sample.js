import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { GeoConflictModal } from './geo-conflict-modal.js';
import { Button } from '../../atoms/button/button.js';

const html = htm.bind(h);

export const GeoConflictModalSample = () => {
  const [isOpen, setOpen] = useState(false);

  return html`
    <div class="flex flex-col gap-4 p-8">
      <h3 class="!m-0">GeoConflictModal — sample</h3>
      <${Button} onClick=${() => setOpen(true)}>Open conflict modal</${Button}>

      <${GeoConflictModal}
        isOpen=${isOpen}
        title="Estás en el sitio de Colombia"
        description="Cambia a Estados Unidos para ver precios en tu moneda local y ofertas disponibles"
        primaryButtonLabel="Ir a Estados Unidos"
        secondaryButtonLabel="Continuar en Colombia"
        onPrimary=${() => {
    // eslint-disable-next-line no-console
    console.log('Primary clicked: switch POS');
    setOpen(false);
  }}
        onSecondary=${() => {
    // eslint-disable-next-line no-console
    console.log('Secondary clicked: keep cookie POS');
    setOpen(false);
  }}
      />
    </div>
  `;
};

export default GeoConflictModalSample;
