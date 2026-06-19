import { h } from '@dropins/tools/preact.js';
import htm from 'htm';

const html = htm.bind(h);

/**
 * ContactPromoBlock - Pre-footer promotional block with two sections:
 *  - Left: Contact list + social media icons
 *  - Right: App promo (mockup image + title + bullets + store badges)
 *
 * Layout breakpoints (per Figma node 9189-39784):
 *  - <= 512px: full vertical stack
 *  - 513-767px: contact vertical, app section horizontal
 *  - >= 768px (md): 2 columns side-by-side with vertical 1px divider
 *  - >= 1024px (lg): looser padding, badges 40px
 */
export const ContactPromoBlock = ({
  leftTitle = '',
  rightTitle = '',
  rightDescription = '',
  rightImage = '',
  rightImageAlt = '',
  appStoreImage = '',
  appStoreAlt = '',
  appStoreUrl = '',
  appStoreRel = '',
  googlePlayImage = '',
  googlePlayAlt = '',
  googlePlayUrl = '',
  googlePlayRel = '',
  items = [],
  socials = [],
}) => {
  const hasAppStore = !!appStoreImage;
  const hasGooglePlay = !!googlePlayImage;

  const tokenColor = 'text-[var(--text-normal-primary,#1b1b1b)]';
  const dividerColor = 'bg-[var(--border-stroke-default,#d9d9d9)]';
  // Store badges: 120x40 (App Store) / 135x40 (Google Play), 16px gap (Figma
  // HOME-26052026). On MOBILE the badge image rendered at its natural size
  // (≈96x32) instead of filling the 40px box, so the two badges showed ~47px of
  // visual space between them instead of 16px (reported for mobile only). Fix
  // scoped to mobile: the image fills the 40px box at the base breakpoint;
  // tablet (md:35px) and desktop (lg:40px) keep their existing sizing untouched.
  const badgeBoxAppStore = 'cpb-badge inline-flex w-[120px] h-10 items-center justify-center md:w-[101px] md:h-[35px] lg:w-[120px] lg:h-10 active:opacity-70 transition-opacity duration-150 rounded focus:outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-border-stroke-focus)]';
  const badgeBoxGooglePlay = 'cpb-badge inline-flex w-[135px] h-10 items-center justify-center md:w-[120px] md:h-[35px] lg:w-[135px] lg:h-10 active:opacity-70 transition-opacity duration-150 rounded focus:outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-border-stroke-focus)]';
  const badgeImg = 'block h-10 w-auto max-w-full object-contain md:h-[35px] md:max-w-none lg:h-10';
  const dashedBorder = 'background-image: url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27100%25%27 height=%271%27 fill=%27none%27%3E%3Cpath d=%27M0 0.5H10000%27 stroke=%27%23D9D9D9%27 stroke-dasharray=%272 2%27/%3E%3C/svg%3E"); background-repeat: repeat-x; background-position: bottom; background-size: auto 1px;';

  return html`
    <div class="contact-promo-block w-full" data-name="contactPromoBlock">
      <div class="flex flex-col gap-8 w-full min-[513px]:gap-9 md:flex-row md:items-stretch md:gap-6 lg:gap-8">

        <section
          class="flex flex-col gap-6 flex-1 min-h-[204px] md:flex-1 md:min-w-0 rounded-none"
          aria-labelledby="cpb-contact-title"
        >
          <div
            id="cpb-contact-title"
            class=${`cpb-contact-title m-0 ${tokenColor}`}
            dangerouslySetInnerHTML=${{ __html: leftTitle }}
          ></div>

          <div class="flex flex-col flex-1 justify-between min-h-0">

          ${items.length > 0 && html`
            <ul class="list-none !m-0 !p-0 flex flex-col" role="list">
              ${items.map((item, idx) => html`
                <li key=${idx} class="li-item" style=${dashedBorder}>
                  <a
                    class=${`group flex items-start justify-between gap-4 w-[calc(100%+2rem)] py-3 -mx-4 px-4 rounded no-underline text-[var(--color-text-normal-primary,#1b1b1b)] hover:bg-[var(--color-background-brand-secondary-hover,#e9e9e9)] active:bg-[var(--color-background-brand-primary-active,#6c6c6c)] active:text-[var(--color-text-normal-lighter,#fff)] transition-colors duration-150 ease-in-out focus:outline-none focus-visible:[box-shadow:inset_0_0_0_2px_var(--color-border-stroke-focus)]`}
                    href=${item.url || '#'}
                  >
                    <span class="text-base font-normal leading-[21px]">${item.label}</span>
                    ${item.icon && html`
                      <span class="inline-flex w-6 h-6 shrink-0 items-start justify-start">
                        <img
                          class="block w-5 h-5 object-contain group-active:brightness-0 group-active:invert transition-[filter] duration-150"
                          src=${item.icon}
                          alt=${item.iconAlt || ''}
                          loading="lazy"
                          width="20"
                          height="20"
                        />
                      </span>
                    `}
                  </a>
                </li>
              `)}
            </ul>
          `}

          ${socials.length > 0 && html`
            <ul
              class="list-none !m-0 mt-auto py-3 flex flex-wrap gap-x-4 gap-y-2 items-center justify-center min-[513px]:py-0 md:justify-start"
              role="list"
              aria-label="Redes sociales"
            >
              ${socials.map((social, idx) => html`
                <li key=${idx} class="h-6 flex items-center">
                  <a
                    class=${`inline-flex w-6 h-6 items-center justify-center ${tokenColor} focus:outline-none focus-visible:[box-shadow:inset_0_0_0_2px_var(--color-border-stroke-focus)]`}
                    href=${social.url || '#'}
                    target="_blank"
                    rel=${social.rel || 'noopener noreferrer'}
                    aria-label=${social.ariaLabel || social.imageAlt || 'Red social'}
                  >
                    <img
                      class="block w-6 h-6 object-contain"
                      src=${social.image}
                      alt=${social.imageAlt || ''}
                      loading="lazy"
                      width="24"
                      height="24"
                    />
                  </a>
                </li>
              `)}
            </ul>
          `}
          </div>
        </section>

        <div
          class=${`h-px w-full ${dividerColor} md:w-px md:h-auto md:self-stretch`}
          aria-hidden="true"
        ></div>

        <section
          class="flex flex-col items-center gap-4 rounded-2xl min-[513px]:flex-row min-[513px]:items-end min-[513px]:justify-center md:flex-row md:items-center md:gap-8 md:flex-[2_1_0] md:min-w-0"
          aria-labelledby="cpb-app-title"
        >
          ${rightImage && html`
            <div class="cpb-app-image w-[135px] h-[164px] shrink-0 overflow-hidden min-[513px]:w-[140px] min-[513px]:h-[175px] md:w-[168px] md:h-[204px]">
              <img
                class="block w-full h-full object-cover object-top"
                src=${rightImage}
                alt=${rightImageAlt || ''}
                loading="lazy"
              />
            </div>
          `}

          <div class="flex flex-col gap-8 items-center w-full min-[513px]:flex-1 min-[513px]:max-w-[350px] min-[513px]:items-start min-[513px]:justify-between min-[513px]:min-h-[175px] min-[513px]:gap-4 md:max-w-none md:min-h-[204px] md:gap-6">
            <div class="flex flex-col gap-2 items-center w-full min-[513px]:items-start md:gap-2">
              ${rightTitle && html`
                <div
                  id="cpb-app-title"
                  class="cpb-app-title text-center min-[513px]:text-left"
                  dangerouslySetInnerHTML=${{ __html: rightTitle }}
                ></div>
              `}

              ${rightDescription && html`
                <div
                  class="cpb-app-desc self-stretch"
                  dangerouslySetInnerHTML=${{ __html: rightDescription }}
                ></div>
              `}
            </div>

            ${(hasAppStore || hasGooglePlay) && html`
              <div class="flex gap-4 items-center justify-center flex-wrap min-[513px]:justify-start min-[513px]:mt-0 md:mt-0">
                ${hasAppStore && (appStoreUrl ? html`
                  <a
                    class=${badgeBoxAppStore}
                    href=${appStoreUrl}
                    target="_blank"
                    rel=${appStoreRel || 'noopener noreferrer'}
                    aria-label=${appStoreAlt || 'App Store'}
                  >
                    <img class=${badgeImg} src=${appStoreImage} alt=${appStoreAlt || ''} loading="lazy" />
                  </a>
                ` : html`
                  <span class=${badgeBoxAppStore}>
                    <img class=${badgeImg} src=${appStoreImage} alt=${appStoreAlt || ''} loading="lazy" />
                  </span>
                `)}
                ${hasGooglePlay && (googlePlayUrl ? html`
                  <a
                    class=${badgeBoxGooglePlay}
                    href=${googlePlayUrl}
                    target="_blank"
                    rel=${googlePlayRel || 'noopener noreferrer'}
                    aria-label=${googlePlayAlt || 'Google Play'}
                  >
                    <img class=${badgeImg} src=${googlePlayImage} alt=${googlePlayAlt || ''} loading="lazy" />
                  </a>
                ` : html`
                  <span class=${badgeBoxGooglePlay}>
                    <img class=${badgeImg} src=${googlePlayImage} alt=${googlePlayAlt || ''} loading="lazy" />
                  </span>
                `)}
              </div>
            `}
          </div>
        </section>

      </div>
    </div>
  `;
};

export default ContactPromoBlock;
