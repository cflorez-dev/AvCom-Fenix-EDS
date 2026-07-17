import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { isSafeUrl } from '../../../../scripts/utils/sanitize.js';

const html = htm.bind(h);

/**
 * FooterBottom - Componente que renderiza el footer bottom con redes sociales,
 * app stores y copyright
 *
 * ## Props
 * - `theme`: `"light" | "dark" | "white"` – Tema del footer (por defecto: `"light"`).
 *   `"white"` es igual a `"light"` pero con fondo `--color-background-brand-primary-lighter` (#FFFFFF)
 * - `showAppStoreButtons`: `boolean` – Mostrar botones de app stores
 *   (por defecto: `false`)
 * - `appStoreUrl`: `string` – URL del App Store (por defecto: `''`)
 * - `appStoreImage`: `string` – URL de la imagen del App Store según el tema
 * - `googlePlayUrl`: `string` – URL de Google Play (por defecto: `''`)
 * - `googlePlayImage`: `string` – URL de la imagen de Google Play según el tema
 * - `socialLinks`: `Array<{url: string, name: string, title: string,
 *   iconDark: string, iconLight: string, isExternal: boolean}>` –
 *   Array de links de redes sociales
 * - `copyrightText`: `string` – Texto de copyright (por defecto: `''`)
 * - `customClassName`: `string` – Clases CSS adicionales
 * - `...rest`: Otras propiedades válidas
 *
 * ## Comportamiento Responsive
 * - Desktop (> 761px): Layout horizontal con copyright izquierda,
 *   social icons centro, app stores derecha
 * - Mobile (<= 761px): Layout vertical apilado y centrado
 */
export const FooterBottom = ({
  theme = 'light',
  showAppStoreButtons = false,
  appStoreUrl = '',
  appStoreImage = '',
  googlePlayUrl = '',
  googlePlayImage = '',
  socialLinks = [],
  copyrightText = '',
  customClassName = '',
  i18n = {},
  ...rest
}) => {
  // Filtrar social links que tienen URL válida
  const validSocialLinks = socialLinks.filter((social) => social.url && social.url.trim() !== '');

  // Obtener texto de copyright con año actual
  const getCopyrightText = () => {
    if (copyrightText) {
      const currentYear = new Date().getFullYear();
      return copyrightText.replace(/{year}/g, currentYear.toString());
    }
    const currentYear = new Date().getFullYear();
    const defaultText = i18n['footer.bottom.copyrights'] || 'Copyright © Avianca [XXXX]';
    const finallText = defaultText.replace('[XXXX]', currentYear.toString());
    return finallText;
  };

  // Obtener la imagen correcta según el tema para una red social
  const getSocialIconUrl = (social) => {
    if (theme === 'dark' && social.iconDark) {
      return social.iconDark;
    }
    if ((theme === 'light' || theme === 'white') && social.iconLight) {
      return social.iconLight;
    }
    // Fallback: usar la que esté disponible
    return social.iconDark || social.iconLight || '';
  };

  // Renderizar icono de red social usando la URL de los datos
  const renderSocialIcon = (social) => {
    const iconUrl = getSocialIconUrl(social);

    if (!iconUrl) return null;

    return html`
      <img 
        src=${iconUrl}
        alt="" 
        class="footer-bottom-social-icon w-[20px] h-[20px] object-contain"
        aria-hidden="true"
      />
    `;
  };

  // Renderizar link de red social
  const renderSocialLink = (social) => {
    const iconUrl = getSocialIconUrl(social);

    if (!iconUrl || !social.url) return null;

    // Determinar si debe abrirse en nueva pestaña
    const target = social.isExternal ? '_blank' : undefined;
    const rel = social.isExternal ? 'noopener noreferrer' : undefined;

    return html`
      <a
        href=${isSafeUrl(social.url) ? social.url : '#'}
        target=${target}
        rel=${rel}
        class="footer-bottom-social-link flex items-center justify-center !w-[24px] !h-[24px] transition-all hover:opacity-80"
        aria-label=${social.title || social.name}
      >
        ${renderSocialIcon(social)}
      </a>
    `;
  };

  // Renderizar botón de App Store usando la imagen de los datos
  const renderAppStoreButton = () => {
    if (!appStoreUrl || !showAppStoreButtons || !appStoreImage) return null;

    return html`
      <a
        href=${isSafeUrl(appStoreUrl) ? appStoreUrl : '#'}
        target="_blank"
        rel="noopener noreferrer"
        class="footer-bottom-app-store-button flex items-center transition-all hover:opacity-90"
        aria-label="Download on the App Store"
      >
        <img 
          src=${appStoreImage}
          alt="App Store"
          class="w-auto h-[32px] object-contain rounded-[6px]"
        />
      </a>
    `;
  };

  // Renderizar botón de Google Play usando la imagen de los datos
  const renderGooglePlayButton = () => {
    if (!googlePlayUrl || !showAppStoreButtons || !googlePlayImage) return null;

    return html`
      <a
        href=${isSafeUrl(googlePlayUrl) ? googlePlayUrl : '#'}
        target="_blank"
        rel="noopener noreferrer"
        class="footer-bottom-app-store-button flex items-center transition-all hover:opacity-90"
        aria-label="GET IT ON Google Play"
      >
        <img 
          src=${googlePlayImage}
          alt="Google Play"
          class="w-[96px] h-[28px] object-contain rounded-[6px]"
        />
      </a>
    `;
  };

  // Clases base del contenedor
  const bgClass = theme === 'dark'
    ? 'bg-[var(--brand-primary)]'
    : theme === 'white'
      ? 'bg-[var(--color-background-brand-primary-lighter)]'
      : 'bg-[var(--bg-page-light)]';
  const containerClasses = `footer-bottom-container flex flex-col items-center justify-center w-full py-[16px] px-4 md:px-6 lg:px-8 ${bgClass} ${customClassName} ${theme === 'white' ? 'h-[54px]' : ''}`;

  // Color del copyright según el tema
  // Light / White: --brand-primary, Dark: --logo-avianca-light
  const copyrightColor = theme === 'dark' ? 'var(--logo-avianca-light)' : 'var(--brand-primary)';
  const copyrightClass = theme === 'dark'
    ? '!text-sm !text-[var(--logo-avianca-light)] !m-0'
    : '!text-sm !text-[var(--brand-primary)] !m-0';

  // Si no hay contenido, no renderizar
  // Nota: Siempre mostramos el copyright (con texto por defecto si no viene uno)


  return html`
    <div
      class=${containerClasses}
      ...${rest}
    >
      <!-- Mobile View: Layout vertical apilado (<= 761px) -->
      <div class="self-stretch flex flex-col items-center gap-[12px] min-[761px]:hidden">
        <!-- Social Media Icons -->
        ${validSocialLinks.length > 0 && html`
          <div class="self-stretch py-[12px] flex items-center justify-center gap-[16px]">
            ${validSocialLinks.map((social) => renderSocialLink(social))}
          </div>
        `}

        <!-- App Store Buttons -->
        ${showAppStoreButtons && (appStoreUrl || googlePlayUrl) && html`
          <div class="flex items-center justify-center py-[8px] gap-[12px] flex-wrap">
            ${renderAppStoreButton()}
            ${renderGooglePlayButton()}
          </div>
        `}

        <!-- Copyright -->
        <p class=${`text-center ${copyrightClass}`} style=${`color: ${copyrightColor};`}>
          ${getCopyrightText()}
        </p>
      </div>

      <!-- Desktop View: Layout horizontal (> 761px) -->
      <div class="hidden min-[761px]:flex items-center justify-between gap-[16px] max-[760px]:hidden w-fit h-[32px]">
        <!-- Copyright (Left) -->
        <div class="flex items-center gap-[16px]">
          <p class=${copyrightClass} style=${`color: ${copyrightColor};`}>
            ${getCopyrightText()}
          </p>
          ${validSocialLinks.length > 0 && html`
            <div class="w-px min-h-6 h-6 bg-[var(--border-brand-primary-active)]"></div>
          `}
        </div>

        <!-- Social Media Icons (Center) -->
        ${validSocialLinks.length > 0 && html`
          <div class="flex items-center gap-[16px] justify-center">
            ${validSocialLinks.map((social) => renderSocialLink(social))}
          </div>
          ${showAppStoreButtons && (appStoreUrl || googlePlayUrl) && html`
            <div class="w-px min-h-6 h-6 bg-[var(--border-brand-primary-active)]"></div>
          `}
        `}

        <!-- App Store Buttons (Right) -->
        ${showAppStoreButtons && (appStoreUrl || googlePlayUrl) && html`
          <div class="flex items-center gap-[16px]">
            ${renderAppStoreButton()}
            ${renderGooglePlayButton()}
          </div>
        `}
      </div>

    </div>
  `;
};

export default FooterBottom;
