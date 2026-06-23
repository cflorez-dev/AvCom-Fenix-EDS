import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import { fetchAEMData } from '../../scripts/utils/aem-data.js';
import {
  extractCmsStickyCountdownBannerProps,
  validateCmsStickyCountdownBannerProps,
} from './cms-sticky-countdown-banner-helper.js';
import { StickyCountdownBanner } from '../../design-system/molecules/sticky-countdown-banner/sticky-countdown-banner.js';
import { shouldShowByTargeting, hideBlockWithSection } from '../../scripts/utils/target-filter.js';
import { getStoredLanguage } from '../../scripts/services/header/language-country-selector.js';
import { sanitizeHTMLAsync } from '../../scripts/utils/sanitize.js';

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

  // Check targeting (country/language filtering) - skip in author mode
  if (!isAuthorEnv && !shouldShowByTargeting(props.targetCountries, props.targetLanguages)) {
    hideBlockWithSection(block);
    return;
  }

  const validation = validateCmsStickyCountdownBannerProps(props);

  if (!validation.isValid) {
    // eslint-disable-next-line no-console
    console.error('CMS Sticky Countdown Banner - Validation Errors:', validation.errors);
    block.classList.add('hidden');
    return;
  }

  // Load i18n cache
  if (!i18Cache) {
    const language = getStoredLanguage() || 'es';
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
    container.className = 'fixed bottom-0 left-0 right-0 w-full z-[400] md:bottom-[48px] md:left-1/2 md:right-auto md:-translate-x-1/2 md:max-w-[1140px] md:px-8 xl:px-0';
  }

  // Defensively sanitize author-controlled text before rendering. title/subtitle
  // render as Preact text-children (already auto-escaped); sanitizing here adds
  // defense in depth, consistent with cms-hero-banner.
  const safeTitle = await sanitizeHTMLAsync(props.title || '');
  const safeSubtitle = await sanitizeHTMLAsync(props.subtitle || '');

  // Render Preact component
  render(
    html`
      <${StickyCountdownBanner}
        title=${safeTitle}
        subtitle=${safeSubtitle}
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

  // Clear block and render INSIDE (compatible with editor-support.js re-decoration)
  block.textContent = '';
  block.appendChild(container);
}
