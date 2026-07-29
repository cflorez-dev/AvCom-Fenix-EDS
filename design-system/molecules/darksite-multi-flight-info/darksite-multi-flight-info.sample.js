import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { DarksiteMultiFlightInfo } from './darksite-multi-flight-info.js';
import { DarksiteContactInfo } from '../darksite-contact-info/darksite-contact-info.js';
import { FooterBottom } from '../../organisms/footer/footer-bottom/footer-bottom.js';

const html = htm.bind(h);

/**
 * Sample de la variante MULTI-vuelo del interstitial darksite (Figma 9611:7745).
 * Se pinta sobre el fondo `#3F4448` del overlay real e incluye:
 *   - `DarksiteMultiFlightInfo` — titular + N filas de vuelos + un solo
 *     CTA "Continuar en avianca.com"
 *   - `DarksiteContactInfo` — mismas líneas de contacto que la variante single
 *   - `FooterBottom` variant `darksite-dark` anclado al pie
 *
 * Toda la data es mock; en producción el gate hidrata desde el CF de state
 * (`flights[]`) y el CF de contenido (`titleMultiple`, `detailCtaLabel`,
 * `secondaryCtaLabel`).
 */
export const DarksiteMultiFlightInfoSample = () => html`
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
      <${DarksiteMultiFlightInfo}
        title="Información sobre vuelos afectados"
        detailCtaLabel="Ver detalle"
        flights=${[
    {
      flightCode: 'AV 1224',
      origin: 'Bogotá',
      destination: 'Miami',
      operator: 'Operado por Avianca',
      detailUrl: '/darksite/es/flight-info?code=AV1224',
    },
    {
      flightCode: 'AV 40',
      origin: 'Miami',
      destination: 'Cartagena',
      operator: 'Operado por Avianca',
      detailUrl: '/darksite/es/flight-info?code=AV40',
    },
    {
      flightCode: 'AV 2034',
      origin: 'Barrancabermeja',
      destination: 'Barranquilla',
      operator: 'Operado por Avianca',
      detailUrl: '/darksite/es/flight-info?code=AV2034',
    },
  ]}
        secondaryCta=${{
    label: 'Continuar en avianca.com',
    href: '#darksite-continue',
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

export default DarksiteMultiFlightInfoSample;
