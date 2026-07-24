import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { DarksiteInformativeBanner } from './darksite-informative-banner.js';

const html = htm.bind(h);

/**
 * Sample del `DarksiteInformativeBanner` para preview en el
 * design-system-block. Muestra la tarjeta oscura tal como aparece en el home
 * cuando el modo darksite está activo y el usuario ya pulsó "Continuar en
 * avianca.com".
 *
 * La data mock corresponde al ejemplo canónico del CF `getDarksiteBanner`
 * (idioma `es`) — mismo shape que devuelve la persisted query en runtime.
 */
export const DarksiteInformativeBannerSample = () => html`
  <div style=${{
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    padding: '24px 0',
  }}>
    <${DarksiteInformativeBanner}
      title="Ruta Bogotá-Miami"
      description="AV120 operado por avianca"
      ctaLabel="Información del vuelo"
      ctaUrl="/darksite/es/detalle"
      ctaAlt="Ver información del vuelo AV120"
    />
  </div>
`;

export default DarksiteInformativeBannerSample;
