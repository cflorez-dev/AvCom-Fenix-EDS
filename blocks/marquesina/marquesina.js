import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import { readBlockConfig } from '../../scripts/aem.js';
import { Marquesina } from '../../design-system/organisms/marquesina/marquesina.js';
import { shouldShowByTargetingLegacy } from '../../scripts/utils/target-filter.js';

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

  // Check country/language targeting using legacy-compatible utility
  // Supports old format (targetMarkets, targetLanguages) and new format
  // (target-countries, target-languages)
  if (!shouldShowByTargetingLegacy(config)) {
    return false;
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
 * Parse a targeting field (array or comma-separated string) into a clean list.
 * @param {string|Array<string>} value
 * @returns {Array<string>}
 */
function parseTargetList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  return String(value).split(',').map((v) => v.trim()).filter(Boolean);
}

/**
 * Specificity score for a marquesina's targeting. Higher = more specific.
 * Used to pick a single winner when several marquesinas match the same user:
 * country targeting beats language, which beats page-type, which beats "no
 * targeting" (shown to everyone). Mirrors the field precedence used by
 * shouldShowByTargetingLegacy so the score matches the show/hide decision.
 * @param {Object} config
 * @returns {number}
 */
function targetingSpecificity(config) {
  const countries = parseTargetList(
    config['target-countries'] || config.targetCountries || config.targetMarkets,
  );
  const languages = parseTargetList(config['target-languages'] || config.targetLanguages);
  const pageTypes = parseTargetList(config.targetPageTypes);
  let score = 0;
  if (countries.length) score += 4;
  if (languages.length) score += 2;
  if (pageTypes.length) score += 1;
  return score;
}

// Coalesce the "collapse the empty placeholder" check across the independent
// decorate() calls of every authored marquesina on the page.
let marquesinaFinalizeScheduled = false;

/**
 * Collapse the shared CLS-reservation placeholder ONLY if, after all marquesinas
 * have decorated, none of them rendered (i.e. none matched the current user).
 * A non-matching marquesina must NOT remove the container itself, or it would
 * wipe out a sibling that already matched and rendered into the shared slot.
 */
function scheduleMarquesinaFinalize() {
  if (marquesinaFinalizeScheduled) return;
  marquesinaFinalizeScheduled = true;
  setTimeout(() => {
    marquesinaFinalizeScheduled = false;
    const container = document.querySelector('.marquesina-global-container');
    if (!container) return;
    if (!container.querySelector('[data-name="marquesina"]')) {
      container.remove();
      document.documentElement.style.setProperty('--marquee-height', '0px');
    }
  }, 150);
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
  let linkTarget = 'self';
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

    if (rows[7]?.children[0]?.textContent?.trim()) {
      const targetText = rows[7].children[0].textContent.trim().toLowerCase();
      if (['self', 'blank'].includes(targetText)) {
        linkTarget = targetText;
      }
    }

    // Override linkTarget with block config if present
    const blockConfig = readBlockConfig(block);
    if (blockConfig?.linkTarget) {
      const configTarget = String(blockConfig.linkTarget).trim().toLowerCase();
      if (['self', 'blank'].includes(configTarget)) {
        linkTarget = configTarget;
      }
    }
    // Legacy comma-separated text targeting rows (8, 9, 10) + publish dates (11, 12)
    let targetMarkets = '';
    let targetLanguages = '';
    let targetPageTypes = '';

    if (rows[8]?.children[0]?.textContent?.trim()) {
      targetMarkets = rows[8].children[0].textContent.trim();
    }

    if (rows[9]?.children[0]?.textContent?.trim()) {
      targetLanguages = rows[9].children[0].textContent.trim();
    }

    if (rows[10]?.children[0]?.textContent?.trim()) {
      targetPageTypes = rows[10].children[0].textContent.trim();
    }

    if (rows[11]?.children[0]?.textContent?.trim()) {
      publishStart = rows[11].children[0].textContent.trim();
    }

    if (rows[12]?.children[0]?.textContent?.trim()) {
      publishEnd = rows[12].children[0].textContent.trim();
    }

    // Multiselect targeting fields the Universal Editor actually writes:
    //   row 13 = "Target Countries (POS)", row 14 = "Target Languages".
    // These are the fields authors fill in; the legacy text rows (8-10) above are
    // almost always empty. Previously only row 8 was read, so every marquesina
    // matched every POS and a country-targeted banner showed in the wrong country.
    let targetCountriesMulti = '';
    let targetLanguagesMulti = '';

    if (rows[13]?.children[0]?.textContent?.trim()) {
      targetCountriesMulti = rows[13].children[0].textContent.trim();
    }

    if (rows[14]?.children[0]?.textContent?.trim()) {
      targetLanguagesMulti = rows[14].children[0].textContent.trim();
    }

    // Set targeting values in config (multiselect fields take precedence in
    // shouldShowByTargetingLegacy / targetingSpecificity via the 'target-*' keys)
    config.targetMarkets = targetMarkets;
    config.targetLanguages = targetLanguages;
    config.targetPageTypes = targetPageTypes;
    config['target-countries'] = targetCountriesMulti;
    config['target-languages'] = targetLanguagesMulti;
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
          'marquee speed', 'marqueespeed', 'alert id', 'alertid',
          'linktarget', 'link target'].includes(key);
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
    linkTarget = config.linktarget || config['link target'] || 'self';
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
    // This marquesina is not for the current user. Remove ONLY its own block —
    // never touch the shared .marquesina-global-container here, or we would wipe
    // out a sibling marquesina that already matched and rendered into the shared
    // slot (multiple marquesinas can be authored on the same page). The empty
    // placeholder is collapsed centrally by scheduleMarquesinaFinalize() if, and
    // only if, NO marquesina ends up rendering.
    const sectionContainer = block.closest('.section.marquesina-container');
    if (sectionContainer) {
      sectionContainer.classList.add('!p-0');
    }
    block.remove();
    scheduleMarquesinaFinalize();
    return;
  }

  if (!alertId) {
    alertId = generateAlertId(contentHTML);
  }

  if (isAuthorEnv) {
    // Clear block and render INSIDE (compatible with editor-support.js re-decoration)
    block.textContent = '';

    const previewContainer = document.createElement('div');
    previewContainer.className = 'marquesina-content';
    block.appendChild(previewContainer);

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
          linkTarget=${linkTarget}
          customClassName="marquesina-block"
        />
      `,
      previewContainer,
    );
    return;
  }

  // Production mode: reuse existing placeholder (created by bootstrapMarqueeHeight
  // to prevent CLS) or create a new wrapper if none exists.
  let marquesinaWrapper = document.querySelector('.marquesina-global-container');
  if (!marquesinaWrapper) {
    marquesinaWrapper = document.createElement('div');
    marquesinaWrapper.className = 'marquesina-global-container';
    const header = document.querySelector('header');
    if (header) {
      header.parentElement.insertBefore(marquesinaWrapper, header);
    } else {
      document.body.insertBefore(marquesinaWrapper, document.body.firstChild);
    }
  }

  // Only ONE marquesina can occupy the shared container. When several are
  // authored on the same page and more than one matches the user, the most
  // specific targeting wins (country > language > page-type), with DOM order as
  // the tie-break. This replaces the old "last decorate() wins" behaviour that
  // let an untargeted marquesina overwrite a country-targeted one.
  const mySpecificity = targetingSpecificity(config);
  const hasWinner = marquesinaWrapper.querySelector('[data-name="marquesina"]') !== null;
  const winnerSpecificity = Number(marquesinaWrapper.dataset.marquesinaSpecificity ?? '-1');
  if (hasWinner && winnerSpecificity >= mySpecificity) {
    // A more (or equally) specific marquesina already claimed the slot. Drop this
    // one without touching the shared container.
    const sectionToRemove = block.closest('.section');
    if (sectionToRemove) {
      sectionToRemove.remove();
    } else {
      block.remove();
    }
    return;
  }
  marquesinaWrapper.dataset.marquesinaSpecificity = String(mySpecificity);
  marquesinaWrapper.dataset.marquesinaAlertId = alertId;

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
        linkTarget=${linkTarget}
        customClassName="marquesina-block"
      />
    `,
    marquesinaWrapper,
  );

  // Release placeholder constraints after marquee CSS has settled.
  // The Preact render initially expands to full content height (~104px) before
  // the marquee animation constrains it to ~56px. The overflow:hidden/maxHeight
  // from the placeholder prevents that temporary expansion from causing CLS.
  // Use setTimeout to wait for the marquee CSS to take effect after layout.
  setTimeout(() => {
    marquesinaWrapper.style.minHeight = '';
    marquesinaWrapper.style.overflow = '';
    marquesinaWrapper.style.maxHeight = '';
  }, 200);

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
