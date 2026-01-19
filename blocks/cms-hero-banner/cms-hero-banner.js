import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import { readBlockConfig, loadCSS } from '../../scripts/aem.js';
import { PromotionalCountdownCard, AbsoluteCountdown } from '../../design-system/molecules/promotional-countdown-card/promotional-countdown-card.js';
import { fetchAEMData } from '../../scripts/utils/aem-data.js';

const html = htm.bind(h);

let i18Cache = null;

// Load component CSS
loadCSS('/design-system/molecules/promotional-countdown-card/promotional-countdown-card.css');

/**
 * Gets current time in Colombia timezone (America/Bogota)
 * @returns {Date} Current date/time in Colombia
 */
function getColombiaTime() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));
}

/**
 * Gets language from 'selected-language' cookie
 * @returns {string} Language code from cookie, default 'es'
 */
function getLanguageFromCookie() {
  try {
    const value = `; ${document.cookie}`;
    const parts = value.split('; selected-language=');
    if (parts.length === 2) {
      const language = parts.pop().split(';').shift();
      return language || 'es';
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error reading selected-language cookie:', error);
  }
  return 'es';
}

/**
 * Gets i18n label from cache
 * @param {string} key - i18n key
 * @returns {string} Translated text or empty string
 */
function getI18nLabel(key) {
  if (!i18Cache) return '';
  const labelData = i18Cache.find((item) => item.Key === key);
  return labelData?.Text || '';
}

export default async function decorate(block) {
  const config = readBlockConfig(block);

  const {
    title = '',
    description = '',
    // Image backgrounds (3 sizes for responsive - JPG, PNG, GIF, WEBP)
    imagedesktop = '', // Desktop (>1248px)
    imagetablet = '', // Tablet (768px-1247px)
    imagemobile = '', // Mobile (<768px)
    // Countdown & price
    showcountdown = false,
    countdowntitle = '',
    showpricetag = false,
    pricelabel = '',
    price = '',
    route = '',
    showbutton = false,
    ctatext = 'Reservar',
    ctaurl = '#',
    startdate = null,
    enddate = null,
  } = config;

  // Load i18n cache
  if (!i18Cache) {
    const language = getLanguageFromCookie();
    const i18Data = await fetchAEMData(`${language}`);
    i18Cache = i18Data?.data || [];
  }

  // Get counter labels from i18n
  const daysLabel = getI18nLabel('cms-hero-banner.counter.labels.days') || 'Días';
  const hoursLabel = getI18nLabel('cms-hero-banner.counter.labels.hours') || 'Horas';
  const minutesLabel = getI18nLabel('cms-hero-banner.counter.labels.minutes') || 'Min';
  const secondsLabel = getI18nLabel('cms-hero-banner.counter.labels.seconds') || 'Seg';

  // Check if should show based on start date
  const now = getColombiaTime();

  if (startdate) {
    const startDate = new Date(startdate);
    if (startDate > now) {
      block.classList.add('hidden');
      return;
    }
  }

  // Clear block and setup with Tailwind classes
  block.innerHTML = '';
  block.className = 'cms-hero-banner h-[457px] min-[1248px]:h-[324px] p-4 min-[1248px]:p-6 rounded-3xl box-border overflow-hidden relative w-full text-[var(--text-normal-lighter)] flex justify-center items-end md:h-[457px]';

  // Set background images for 3 sizes with fallback chain
  const desktopBg = imagedesktop || imagetablet || imagemobile;
  const tabletBg = imagetablet || imagedesktop;
  const mobileBg = imagemobile || imagetablet || imagedesktop;

  block.style.setProperty('--hero-desktop', `url(${desktopBg})`);
  block.style.setProperty('--hero-tablet', `url(${tabletBg})`);
  block.style.setProperty('--hero-mobile', `url(${mobileBg})`);

  // Create container for the Preact component
  const cardContainer = document.createElement('div');
  cardContainer.className = 'w-full max-w-full min-[1248px]:h-full relative z-10';

  // Render PromotionalCountdownCard component
  render(
    html`
      <${PromotionalCountdownCard}
        title=${title || ''}
        subtitle=${description || ''}
        countdownLabel=${countdowntitle || 'La oferta termina en'}
        endDateTime=${enddate || ''}
        showCountdown=${showcountdown === 'true' || showcountdown === true}
        priceLabel=${pricelabel || ''}
        price=${price || ''}
        routeLabel=${route || ''}
        showPrice=${showpricetag === 'true' || showpricetag === true}
        buttonText=${ctatext || 'Reservar'}
        buttonUrl=${ctaurl || '#'}
        showButton=${showbutton === 'true' || showbutton === true}
        daysLabel=${daysLabel}
        hoursLabel=${hoursLabel}
        minutesLabel=${minutesLabel}
        secondsLabel=${secondsLabel}
      />
    `,
    cardContainer,
  );

  block.appendChild(cardContainer);

  // Render absolute countdown for desktop (1248px+)
  if (showcountdown === 'true' || showcountdown === true) {
    const countdownContainer = document.createElement('div');
    countdownContainer.className = 'absolute-countdown-wrapper';
    
    render(
      html`
        <${AbsoluteCountdown}
          countdownLabel=${countdowntitle || 'La oferta termina en'}
          endDateTime=${enddate || ''}
          daysLabel=${daysLabel}
          hoursLabel=${hoursLabel}
          minutesLabel=${minutesLabel}
          secondsLabel=${secondsLabel}
        />
      `,
      countdownContainer,
    );

    block.appendChild(countdownContainer);
  }
}
