import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { StickyCountdownBanner } from './sticky-countdown-banner.js';

const html = htm.bind(h);

/**
 * Sample implementations of StickyCountdownBanner component
 */

// Sample 1: Dark banner with countdown
export const StickyCountdownBannerDark = () => html`
  <div class="w-96">
    <${StickyCountdownBanner}
      title="¡Oferta especial!"
      subtitle="Aprovecha estas ofertas antes de que termine el tiempo"
      endDateTime="2026-12-31T23:59:59"
      dismissible=${true}
      backgroundColor="#000000"
      textColor="#FFFFFF"
      counterTextColor="#FFFFFF"
      buttonColor="#FFFFFF"
      ariaRole="banner"
    />
  </div>
`;

// Sample 2: Light banner with countdown
export const StickyCountdownBannerLight = () => html`
  <div class="w-96">
    <${StickyCountdownBanner}
      title="Promoción limitada"
      subtitle="¡Últimas horas para volar con descuento!"
      endDateTime="2026-06-30T18:00:00"
      dismissible=${true}
      backgroundColor="#F5F5F5"
      textColor="#1B1B1B"
      counterTextColor="#1B1B1B"
      buttonColor="#1B1B1B"
      ariaRole="banner"
    />
  </div>
`;

// Sample 3: Custom colors banner
export const StickyCountdownBannerCustom = () => html`
  <div class="w-96">
    <${StickyCountdownBanner}
      title="Vuelos a Miami"
      subtitle="Reserva ahora y ahorra hasta 50%"
      endDateTime="2026-03-15T12:00:00"
      dismissible=${true}
      backgroundColor="#380980"
      textColor="#FFFFFF"
      counterTextColor="#A2F0FF"
      buttonColor="#FFFFFF"
      ariaRole="banner"
    />
  </div>
`;

// Sample 4: Non-dismissible banner
export const StickyCountdownBannerNonDismissible = () => html`
  <div class="w-96">
    <${StickyCountdownBanner}
      title="¡No te pierdas esta oportunidad!"
      subtitle="Ofertas exclusivas por tiempo limitado"
      endDateTime="2026-02-28T23:59:59"
      dismissible=${false}
      backgroundColor="#DC1010"
      textColor="#FFFFFF"
      counterTextColor="#FFFFFF"
      buttonColor="#FFFFFF"
      ariaRole="status"
    />
  </div>
`;

// Sample 5: Only title, no subtitle
export const StickyCountdownBannerTitleOnly = () => html`
  <div class="w-96">
    <${StickyCountdownBanner}
      title="¡Descuentos increíbles!"
      endDateTime="2026-04-20T20:00:00"
      dismissible=${true}
      backgroundColor="#1B1B1B"
      textColor="#FFFFFF"
      counterTextColor="#A2F0FF"
      buttonColor="#FFFFFF"
      ariaRole="banner"
    />
  </div>
`;

export default {
  StickyCountdownBannerDark,
  StickyCountdownBannerLight,
  StickyCountdownBannerCustom,
  StickyCountdownBannerNonDismissible,
  StickyCountdownBannerTitleOnly,
};
