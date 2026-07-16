import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { DarksiteContactInfo } from './darksite-contact-info.js';

const html = htm.bind(h);

/**
 * Sample de la sección "Líneas de contacto" del interstitial darksite,
 * pintada sobre el fondo `#3F4448` del overlay real.
 */
export const DarksiteContactInfoSample = () => html`
  <div style=${{
    background: 'var(--color-darksite-bg)',
    padding: '48px 24px',
    margin: '32px 0',
    borderRadius: '16px',
  }}>
    <${DarksiteContactInfo}
      contacts=${[
    {
      title: 'Contact center',
      subtitle: 'Llamadas desde Bogotá o celulares en Colombia',
      phones: ['+57 601 794 8488', '+57 601 307 3940'],
    },
    {
      title: 'Resto del país',
      subtitle: 'Línea gratuita nacional desde números fijos',
      phones: '+57 01 800 018 9810',
    },
    {
      title: 'Línea para agencias de viaje',
      subtitle: 'Línea gratuita nacional desde números fijos',
      phones: '+57 01 800 0183 098',
    },
  ]}
    />
  </div>
`;

export default DarksiteContactInfoSample;
