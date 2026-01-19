import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import { readBlockConfig } from '../../scripts/aem.js';
import { Marquesina } from '../../design-system/organisms/marquesina/marquesina.js';

const html = htm.bind(h);

/**
 * Gets current time in Colombia timezone (UTC-5)
 * @returns {Date} - Current date in Colombia timezone
 */
function getNowInColombia() {
  const now = new Date();
  // Convert to Colombia time string and parse back
  const colombiaTimeString = now.toLocaleString('en-US', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  return new Date(colombiaTimeString);
}

/**
 * Parses a date string treating it as Colombia timezone
 * Input time is interpreted as Colombia local time (GMT-5)
 * @param {string} dateString - Date string to parse
 * @returns {Date} - Parsed date
 */
function parseDateInColombia(dateString) {
  // If date already has timezone info, use it as-is
  if (dateString.includes('Z') || dateString.includes('+') || dateString.includes('GMT')) {
    return new Date(dateString);
  }

  // Treat as Colombia local time by appending offset
  // Example: '2026-01-07T15:20:00' → interpreted as 3:20 PM Colombia (GMT-5)
  const normalized = dateString.trim();
  return new Date(`${normalized}-05:00`);
}

/**
 * Evaluates targeting rules for the marquesina
 * @param {Object} config - Block configuration
 * @returns {boolean} - Whether the marquesina should be shown
 */
function shouldShowMarquesina(config) {
  // Check date range targeting with Colombia timezone
  if (config.publishStart || config.publishEnd) {
    const nowColombia = getNowInColombia();

    if (config.publishStart) {
      const startDate = parseDateInColombia(config.publishStart);
      if (nowColombia < startDate) {
        return false;
      }
    }

    if (config.publishEnd) {
      const endDate = parseDateInColombia(config.publishEnd);
      if (nowColombia > endDate) {
        return false;
      }
    }
  }

  // Check market targeting (e.g., "CO,PA,EC")
  if (config.targetMarkets) {
    const currentMarket = window.aviancaMarket || 'CO'; // Default to Colombia
    const targetMarkets = config.targetMarkets.split(',').map((m) => m.trim());
    if (!targetMarkets.includes(currentMarket)) {
      return false;
    }
  }

  // Check language targeting (e.g., "es,en")
  if (config.targetLanguages) {
    const currentLang = document.documentElement.lang || 'es';
    const targetLanguages = config.targetLanguages.split(',').map((l) => l.trim());
    if (!targetLanguages.includes(currentLang)) return false;
  }

  // Check page type targeting (e.g., "home,destinations,booking")
  if (config.targetPageTypes) {
    const currentPageType = document.body.dataset.pageType || 'general';
    const targetPageTypes = config.targetPageTypes.split(',').map((p) => p.trim());
    if (!targetPageTypes.includes(currentPageType)) return false;
  }

  return true;
}

/**
 * Waits for the marquesina-container to be available in the DOM
 * @param {number} maxAttempts - Maximum number of attempts
 * @param {number} intervalMs - Interval between attempts in milliseconds
 * @returns {Promise<Element|null>} - The container element or null if not found
 */
// eslint-disable-next-line no-unused-vars
function waitForMarquesinaContainer(maxAttempts = 20, intervalMs = 100) {
  return new Promise((resolve) => {
    let attempts = 0;

    const checkContainer = () => {
      const container = document.querySelector('.marquesina-container');

      if (container) {
        resolve(container);
        return;
      }

      attempts += 1;
      if (attempts >= maxAttempts) {
        resolve(null);
        return;
      }

      setTimeout(checkContainer, intervalMs);
    };

    checkContainer();
  });
}

/**
 * Generates a unique alert ID based on content
 * @param {string} content - The alert content
 * @returns {string} - Unique ID
 */
function generateAlertId(content) {
  // Simple hash function for content
  let hash = 0;
  for (let i = 0; i < content.length; i += 1) {
    const char = content.charCodeAt(i);
    hash = (hash * 31 + char) % 2147483647;
  }
  return `marquesina-${Math.abs(hash)}`;
}

/**
 * Normalizes icon value to match model options
 * Maps legacy values to new format and validates against model options
 * @param {string} iconValue - Raw icon value from config
 * @returns {string} - Normalized icon value
 */
function normalizeIcon(iconValue) {
  if (!iconValue || iconValue.trim() === '') {
    return 'auto';
  }

  const trimmedValue = iconValue.trim();
  const lowerValue = trimmedValue.toLowerCase();

  // Valid icon values from model:
  // auto, alert/Error, alert/info, alert/check_circle, action/alarm, none
  const validIcons = [
    'auto',
    'alert/Error',
    'alert/info',
    'alert/check_circle',
    'action/alarm',
    'none',
  ];

  // Check if it's already a valid icon (case-insensitive)
  const matchedValidIcon = validIcons.find(
    (validIcon) => validIcon.toLowerCase() === lowerValue,
  );
  if (matchedValidIcon) {
    return matchedValidIcon;
  }

  // Map legacy values to new format for backward compatibility
  const iconMap = {
    info: 'alert/info',
    warning: 'alert/info',
    success: 'alert/check_circle',
    promo: 'action/alarm',
    promotional: 'action/alarm',
    clock: 'action/alarm',
    plane: 'action/alarm',
    error: 'alert/Error',
    checkcircle: 'alert/check_circle',
    check_circle: 'alert/check_circle',
    alarm: 'action/alarm',
  };

  if (iconMap[lowerValue]) {
    return iconMap[lowerValue];
  }

  // If it looks like a valid icon path (contains '/'), return as-is
  if (trimmedValue.includes('/')) {
    return trimmedValue;
  }

  // Default to 'auto' if unrecognized
  return 'auto';
}

/**
 * Decorates the Marquesina block
 * @param {Element} block The marquesina block element
 */
export default function decorate(block) {
  const isAuthorEnv = window.location.hostname.includes('author-')
    && window.location.pathname.startsWith('/content/');

  const config = readBlockConfig(block);

  const rows = [...block.children];

  let contentHTML = '';
  let variant = 'informative';
  let icon = 'auto';
  let dismissStrategy = 'session';
  let isSticky = true;
  let marqueeMode = 'auto';
  let alertId = '';
  let publishStart = '';
  let publishEnd = '';

  if (Object.keys(config).length === 0 && rows.length > 0) {
    if (rows[0]?.children[0]) {
      contentHTML = rows[0].children[0].innerHTML;
    }

    if (rows[1]?.children[0]?.textContent?.trim()) {
      const variantText = rows[1].children[0].textContent.trim().toLowerCase();
      if (['informative', 'caution', 'promotional'].includes(variantText)) {
        variant = variantText;
      }
    }

    if (rows[2]?.children[0]?.textContent?.trim()) {
      const iconText = rows[2].children[0].textContent.trim();
      icon = normalizeIcon(iconText);
    }

    if (rows[3]?.children[0]?.textContent?.trim()) {
      const strategyText = rows[3].children[0].textContent.trim().toLowerCase();
      if (['session', 'permanent', 'none'].includes(strategyText)) {
        dismissStrategy = strategyText;
      }
    }

    if (rows[4]?.children[0]?.textContent?.trim()) {
      alertId = rows[4].children[0].textContent.trim();
    }

    if (rows[5]?.children[0]?.textContent?.trim()) {
      isSticky = rows[5].children[0].textContent.trim().toLowerCase() !== 'false';
    }

    if (rows[6]?.children[0]?.textContent?.trim()) {
      const modeText = rows[6].children[0].textContent.trim().toLowerCase();
      if (['auto', 'always', 'never'].includes(modeText)) {
        marqueeMode = modeText;
      }
    }

    // Read targeting rows (7, 8, 9)
    let targetMarkets = '';
    let targetLanguages = '';
    let targetPageTypes = '';

    if (rows[7]?.children[0]?.textContent?.trim()) {
      targetMarkets = rows[7].children[0].textContent.trim();
    }

    if (rows[8]?.children[0]?.textContent?.trim()) {
      targetLanguages = rows[8].children[0].textContent.trim();
    }

    if (rows[9]?.children[0]?.textContent?.trim()) {
      targetPageTypes = rows[9].children[0].textContent.trim();
    }

    if (rows[10]?.children[0]?.textContent?.trim()) {
      publishStart = rows[10].children[0].textContent.trim();
    }

    if (rows[11]?.children[0]?.textContent?.trim()) {
      publishEnd = rows[11].children[0].textContent.trim();
    }

    // Set targeting values in config
    config.targetMarkets = targetMarkets;
    config.targetLanguages = targetLanguages;
    config.targetPageTypes = targetPageTypes;
  } else {
    const contentRow = rows.find((row) => {
      const key = row.children[0]?.textContent?.trim().toLowerCase();
      return key === 'content' || key === 'alert content' || key === 'alertcontent' || key === '';
    });

    if (contentRow && contentRow.children[1]) {
      contentHTML = contentRow.children[1].innerHTML;
    } else {
      const firstContentRow = rows.find((row) => {
        const key = row.children[0]?.textContent?.trim().toLowerCase();
        return !['variant', 'icon', 'dismissible', 'dismissstrategy', 'issticky',
          'marqueemode', 'marqueespeed', 'targetmarkets', 'targetlanguages',
          'targetpagetypes', 'publishstart', 'publishend', 'alert type', 'alerttype',
          'show dismiss button', 'showdismissbutton', 'dismiss strategy',
          'sticky position', 'stickyposition', 'marquee mode', 'marqueemode',
          'marquee speed', 'marqueespeed', 'alert id', 'alertid'].includes(key);
      });

      if (firstContentRow && firstContentRow.children[1]) {
        contentHTML = firstContentRow.children[1].innerHTML;
      }
    }

    variant = config.variant || config['alert type'] || config.alerttype || 'informative';
    icon = normalizeIcon(config.icon);
    dismissStrategy = config.dismissstrategy || config['dismiss strategy'] || 'session';
    isSticky = (config.issticky || config['sticky position'] || config.stickyposition) !== 'false';
    marqueeMode = config.marqueemode || config['marquee mode'] || 'auto';
    alertId = config.alertid || config['alert id'] || '';
    publishStart = config.publishstart || config['publish start date'] || config.publishstartdate || '';
    publishEnd = config.publishend || config['publish end date'] || config.publishenddate || '';
  }

  config.publishStart = publishStart;
  config.publishEnd = publishEnd;
  config.targetMarkets = config.targetMarkets || config.targetmarkets || config['target markets'] || '';
  config.targetLanguages = config.targetLanguages || config.targetlanguages || config['target languages'] || '';
  config.targetPageTypes = config.targetPageTypes || config.targetpagetypes || config['target page types'] || '';

  if (!shouldShowMarquesina(config)) {
    block.remove();
    return;
  }

  if (!alertId) {
    alertId = generateAlertId(contentHTML);
  }

  if (isAuthorEnv) {
    block.style.display = 'none';

    const previewContainer = document.createElement('div');
    previewContainer.className = 'marquesina-author-preview';
    block.parentNode.insertBefore(previewContainer, block.nextSibling);

    render(
      html`
        <${Marquesina}
          variant=${variant}
          contentHTML=${contentHTML}
          icon=${icon}
          dismissible=${true}
          dismissStrategy=${dismissStrategy}
          alertId=${alertId}
          isSticky=${false}
          marqueeMode=${marqueeMode}
          customClassName="marquesina-block"
        />
      `,
      previewContainer,
    );
    return;
  }

  // Production mode: create wrapper and inject before header
  const marquesinaWrapper = document.createElement('div');
  marquesinaWrapper.className = 'marquesina-global-container';

  render(
    html`
      <${Marquesina}
        variant=${variant}
        contentHTML=${contentHTML}
        icon=${icon}
        dismissible=${true}
        dismissStrategy=${dismissStrategy}
        alertId=${alertId}
        isSticky=${isSticky}
        marqueeMode=${marqueeMode}
        customClassName="marquesina-block"
      />
    `,
    marquesinaWrapper,
  );

  // Try to inject before header, otherwise inject at top of body
  const header = document.querySelector('header');
  if (header) {
    header.parentElement.insertBefore(marquesinaWrapper, header);
  } else {
    document.body.insertBefore(marquesinaWrapper, document.body.firstChild);
  }

  const getMarqueeMinHeight = () => {
    const rootStyles = getComputedStyle(document.documentElement);
    const minHeightValue = rootStyles.getPropertyValue('--marquee-min-height').trim();
    const parsed = Number.parseFloat(minHeightValue);
    return Number.isNaN(parsed) ? 55 : parsed;
  };

  const updateHeaderTop = () => {
    const marquesinaContainer = document.querySelector('.marquesina-global-container');
    const headerElement = document.querySelector('header.header-wrapper');

    if (!headerElement) {
      return;
    }

    if (!marquesinaContainer) {
      document.documentElement.style.setProperty('--marquee-height', '0px');
      return;
    }

    const marquesinaHeight = marquesinaContainer.offsetHeight;
    const minHeight = getMarqueeMinHeight();
    const appliedHeight = Math.max(marquesinaHeight, minHeight);

    if (marquesinaHeight > 0) {
      document.documentElement.style.setProperty('--marquee-height', `${appliedHeight}px`);
    } else {
      document.documentElement.style.setProperty('--marquee-height', '0px');
    }
  };

  const handleHeaderReady = () => {
    updateHeaderTop();
  };

  const handleHeaderResize = () => {
    updateHeaderTop();
  };

  window.addEventListener('header-template-ready', handleHeaderReady);
  window.addEventListener('header-resize', handleHeaderResize);

  requestAnimationFrame(() => {
    updateHeaderTop();
  });

  let resizeObserver = null;
  if (window.ResizeObserver && marquesinaWrapper) {
    resizeObserver = new ResizeObserver(() => {
      const headerElement = document.querySelector('header.header-wrapper');
      if (headerElement) {
        updateHeaderTop();
      }
    });
    resizeObserver.observe(marquesinaWrapper);
  }

  window.addEventListener('resize', () => {
    const headerElement = document.querySelector('header.header-wrapper');
    if (headerElement) {
      updateHeaderTop();
    }
  });

  // Remove the block and its parent section container
  const sectionParent = block.closest('.section');
  if (sectionParent) {
    sectionParent.remove();
  } else {
    block.remove();
  }
}
