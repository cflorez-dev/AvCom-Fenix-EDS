import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { DarksiteFlightInfo } from './darksite-flight-info.js';
import { DarksiteContactInfo } from '../darksite-contact-info/darksite-contact-info.js';
import { FooterBottom } from '../../organisms/footer/footer-bottom/footer-bottom.js';

const html = htm.bind(h);

/**
 * Sample del contenido del interstitial darksite. Se pinta sobre el fondo
 * `#3F4448` del overlay real e incluye:
 *   - `DarksiteFlightInfo` (Figma 9611:8004) — titular + ruta + CTAs
 *   - `DarksiteContactInfo` (Figma 9611:8017) — líneas de contacto usando
 *     `TipsCards theme='dark'`
 *   - `FooterBottom` variant `darksite-dark` anclado al pie
 *
 * TODA la data es mock — a futuro llegará desde un Content Fragment que el
 * líder tiene por armar (mismo shape que `contacts` prop del molecule).
 */
export const DarksiteFlightInfoSample = () => html`
  <div style=${{
    display: 'flex',
    flexDirection: 'column',
    minHeight: '780px',
    background: 'var(--color-darksite-bg)',
    padding: '48px 24px 0',
    margin: '32px 0',
    borderRadius: '16px',
    overflow: 'hidden',
  }}>
    <div style=${{
    flex: '1 0 auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '48px',
  }}>
      <${DarksiteFlightInfo}
        title="Vuelo AV062 afectado"
        origin="Bogotá"
        destination="Miami"
        operator="Operado por Avianca"
        secondaryCta=${{
    label: 'Continuar en avianca.com',
    href: '#darksite-continue',
  }}
        primaryCta=${{
    label: 'Ver información del vuelo',
    href: '/darksite/es/flight-info',
  }}
      />
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
    <${FooterBottom} variant="darksite-dark" />
  </div>
`;

export default DarksiteFlightInfoSample;
