import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import { fetchAEMData } from '../../scripts/utils/aem-data.js';
import {
  extractCmsStickyCountdownBannerProps,
  validateCmsStickyCountdownBannerProps,
} from './cms-sticky-countdown-banner-helper.js';
import { StickyCountdownBanner } from '../../design-system/molecules/sticky-countdown-banner/sticky-countdown-banner.js';

const html = htm.bind(h);

let i18Cache = null;

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
  const isAuthorEnv = window.xwalk?.isAuthorEnv;
  const props = extractCmsStickyCountdownBannerProps(block);
  const validation = validateCmsStickyCountdownBannerProps(props);

  if (!validation.isValid) {
    // eslint-disable-next-line no-console
    console.error('CMS Sticky Countdown Banner - Validation Errors:', validation.errors);
    block.classList.add('hidden');
    return;
  }

  // Load i18n cache
  if (!i18Cache) {
    const language = getLanguageFromCookie();
    const i18Data = await fetchAEMData(`${language}`);
    i18Cache = i18Data?.data || [];
  }

  // Get counter labels from i18n
  const daysLabel = getI18nLabel('cms-sticky-countdown-banner.counter.labels.days') || 'Días';
  const hoursLabel = getI18nLabel('cms-sticky-countdown-banner.counter.labels.hours') || 'Horas';
  const minutesLabel = getI18nLabel('cms-sticky-countdown-banner.counter.labels.minutes') || 'Min';
  const secondsLabel = getI18nLabel('cms-sticky-countdown-banner.counter.labels.seconds') || 'Seg';

  const now = getColombiaTime();

  if (props.startDateTime) {
    const startDate = new Date(props.startDateTime);
    if (startDate > now) {
      block.classList.add('hidden');
      return;
    }
  }

  const endDate = new Date(props.endDateTime);
  if (endDate <= now) {
    block.classList.add('hidden');
    return;
  }

  const isDismissible = props.dismissible === 'true' || props.dismissible === true;
  const container = document.createElement('div');

  const handleDismiss = () => {
    localStorage.setItem('cms-sticky-countdown-dismissed', 'true');
    document.body.style.paddingTop = '0';
    if (container) {
      container.remove();
    }
  };

  // In author mode, render as normal block (no fixed positioning)
  if (isAuthorEnv) {
    container.className = 'w-full';
  } else {
    container.className = 'fixed bottom-0 left-0 right-0 w-full z-[600] md:bottom-[48px] md:left-1/2 md:right-auto md:-translate-x-1/2 md:max-w-[1140px]';
  }

  // Render Preact component
  render(
    html`
      <${StickyCountdownBanner}
        title=${props.title || ''}
        subtitle=${props.subtitle || ''}
        endDateTime=${props.endDateTime}
        dismissible=${isDismissible}
        backgroundColor=${props.backgroundColor || '#000000'}
        textColor=${props.textColor || '#FFFFFF'}
        counterTextColor=${props.counterTextColor || '#FFFFFF'}
        counterBackgroundColor=${props.counterBackgroundColor || '#1B1B1B'}
        buttonColor=${props.buttonColor || '#FFFFFF'}
        ariaRole=${props.ariaRole || 'banner'}
        daysLabel=${daysLabel}
        hoursLabel=${hoursLabel}
        minutesLabel=${minutesLabel}
        secondsLabel=${secondsLabel}
        onDismiss=${handleDismiss}
      />
    `,
    container,
  );

  block.classList.add('hidden');
  block.parentNode.insertBefore(container, block.nextSibling);
}
