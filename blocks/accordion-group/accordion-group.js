/**
 * Accordion Group Block
 *
 * A controller block that applies accordion behavior to subsequent Section elements
 * marked with matching accordionGroupId. Sections become accordion items, using their
 * existing content (including Columns blocks) for layout.
 *
 * Architecture:
 * - This block acts as a group controller (config holder)
 * - Sibling Sections with data-accordion-group="[groupId]" become accordion items
 * - Layout is handled by Section + Columns (existing patterns)
 * - Behavior (expand/collapse, exclusive mode) is applied at runtime
 *
 * @module accordion-group
 */

import { readBlockConfig } from '../../scripts/aem.js';
import { getStoredCountry, getStoredLanguage } from '../../scripts/services/header/language-country-selector.js';

/**
 * Default configuration for accordion group
 */
const DEFAULT_CONFIG = {
  groupId: '',
  // 'exclusive' | 'multiple'
  // Note: many design systems default accordions to 'exclusive' (one item open at a time).
  // For Avianca, UX and existing production behavior require allowing multiple sections
  // to be open simultaneously, so we intentionally default to 'multiple' here.
  // Consumers can override this via block config if a different behavior is needed.
  openMode: 'multiple',
  defaultOpen: 'none', // 'none' | 'first' | 'all'
  enableFeatureFlag: false,
  targetCountries: '',
  targetLanguages: '',
  visibilityStartDate: '',
  visibilityEndDate: '',
};

/**
 * Check if feature flag conditions are met
 * @param {Object} config - Group configuration
 * @returns {boolean} - Whether accordion should be visible
 */
function checkFeatureFlag(config) {
  if (!config.enableFeatureFlag) return true;

  const now = new Date();

  // Date range check
  if (config.visibilityStartDate) {
    const startDate = new Date(config.visibilityStartDate);
    if (now < startDate) return false;
  }

  if (config.visibilityEndDate) {
    const endDate = new Date(config.visibilityEndDate);
    if (now > endDate) return false;
  }

  // Country/language targeting would need integration with locale service
  // For now, we'll check against document lang attribute
  if (config.targetLanguages) {
    const targetLangs = config.targetLanguages.split(',').map((l) => l.trim().toLowerCase());
    const docLang = document.documentElement.lang?.toLowerCase() || 'es';
    if (!targetLangs.includes(docLang)) return false;
  }

  return true;
}

/**
 * Check POS (Point of Sale) visibility based on country/language from cookies
 * Empty fields = show to all. Configured fields = hide if no match.
 * @param {Object} config - Group configuration
 * @returns {boolean} - Whether accordion should be visible based on POS
 */
function checkPOSVisibility(config) {
  // Get stored country and language from cookies
  const storedCountry = getStoredCountry();
  const storedLanguage = getStoredLanguage();

  // Check country targeting (empty = show to all)
  if (config.targetCountries) {
    const targetCountries = config.targetCountries
      .split(',')
      .map((c) => c.trim().toLowerCase())
      .filter((c) => c.length > 0);

    if (targetCountries.length > 0) {
      const currentCountry = (storedCountry || '').toLowerCase();
      if (!targetCountries.includes(currentCountry)) {
        return false;
      }
    }
  }

  // Check language targeting (empty = show to all)
  if (config.targetLanguages) {
    const targetLanguages = config.targetLanguages
      .split(',')
      .map((l) => l.trim().toLowerCase())
      .filter((l) => l.length > 0);

    if (targetLanguages.length > 0) {
      const currentLanguage = (storedLanguage || '').toLowerCase();
      if (!targetLanguages.includes(currentLanguage)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Generate unique ID for accessibility
 * @param {string} prefix - ID prefix
 * @param {number} index - Item index
 * @returns {string} - Unique ID
 */
function generateId(prefix, index) {
  return `${prefix}-${index}-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Create accordion header element
 * @param {Object} options - Header options
 * @returns {HTMLElement} - Header button element
 */
function createAccordionHeader({
  label,
  headingLevel,
  isOpen,
  panelId,
  headerId,
}) {
  // Create semantic heading element (h2, h3, h4, etc.)
  const header = document.createElement(`h${headingLevel}`);
  header.className = 'accordion-group-header flex items-center !m-0';

  const button = document.createElement('button');
  button.className = 'accordion-group-trigger flex items-center justify-between gap-3 w-full bg-transparent border-none rounded-[var(--border-radius-medium,12px)] cursor-pointer text-left';
  button.setAttribute('type', 'button');
  button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  button.setAttribute('aria-controls', panelId);
  button.id = headerId;

  const labelSpan = document.createElement('span');
  const labelSpanClasses = [
    'accordion-group-label',
    'flex-[1_0_0]',
    'text-[color:var(--text-normal-primary,#1B1B1B)]',
    'font-[family-name:var(--family-red-hat-display,"Red_Hat_Display")]',
    'text-[18px]',
    'font-bold',
    '!leading-[24px]',
    'tracking-[var(--letter-spacing-normal,0)]',
  ];
  labelSpan.className = labelSpanClasses.join(' ');
  labelSpan.textContent = label;

  // Chevron icon: 16x16px SVG with 8x4.94px path centered inside
  const iconSpan = document.createElement('span');
  iconSpan.className = 'accordion-group-icon flex items-center justify-center text-[var(--text-normal-primary,#1b1b1b)] shrink-0 w-4 h-4';
  iconSpan.setAttribute('aria-hidden', 'true');
  iconSpan.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none"><g transform="translate(4, 5.5)"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.06 0L4 3.05333L0.94 0L0 0.94L4 4.94L8 0.94L7.06 0Z" fill="#1B1B1B"/></g></svg>';

  button.appendChild(labelSpan);
  button.appendChild(iconSpan);
  header.appendChild(button);

  return header;
}

/**
 * Transform a section into an accordion item
 * @param {HTMLElement} section - Section element
 * @param {number} index - Item index
 * @param {Object} config - Group configuration
 * @param {Set} openItems - Set of open item indices
 */
function transformSectionToAccordionItem(section, index, config, openItems) {
  const label = section.dataset.accordionLabel || `Item ${index + 1}`;
  const headingLevel = section.dataset.accordionHeadingLevel || '3';
  const defaultOpen = section.dataset.accordionDefaultOpen === 'true';

  // Determine initial open state
  let isOpen = false;
  if (config.defaultOpen === 'all') {
    isOpen = true;
  } else if (config.defaultOpen === 'first' && index === 0) {
    isOpen = true;
  } else if (defaultOpen) {
    isOpen = true;
  }

  // In exclusive mode, only allow one open initially
  if (config.openMode === 'exclusive' && isOpen && openItems.size > 0) {
    isOpen = false;
  }

  if (isOpen) {
    openItems.add(index);
  }

  // Generate unique IDs
  const headerId = generateId('accordion-header', index);
  const panelId = generateId('accordion-panel', index);

  // Create header
  const header = createAccordionHeader({
    label,
    headingLevel,
    isOpen,
    panelId,
    headerId,
  });

  // Wrap existing content in panel
  const panel = document.createElement('div');
  panel.className = 'accordion-group-panel';
  panel.id = panelId;
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-labelledby', headerId);

  const itemInner = document.createElement('div');
  itemInner.className = 'accordion-group-item-inner flex flex-col overflow-hidden bg-[var(--color-background-brand-primary-lighter,#fff)] rounded-[var(--border-radius-medium,12px)] border border-[#e5e5e5] shadow-[0_1px_2px_0_rgb(0_0_0_/_2%)] w-full max-w-[var(--accordion-max-width,1248px)] transition-[border-color,box-shadow] duration-[var(--transition-fast,150ms)] ease-[var(--ease-in-out,ease-in-out)]';

  if (!isOpen) {
    panel.setAttribute('hidden', '');
    panel.style.maxHeight = '0';
  } else {
    panel.style.maxHeight = 'none';
  }

  // Move section children to panel
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'accordion-group-content text-[var(--text-normal-primary,#1b1b1b)] leading-auto';

  while (section.firstChild) {
    contentWrapper.appendChild(section.firstChild);
  }
  panel.appendChild(contentWrapper);

  // Add to section
  itemInner.appendChild(header);
  itemInner.appendChild(panel);
  section.appendChild(itemInner);
  section.classList.add('accordion-group-item');
  section.dataset.accordionIndex = index;

  if (isOpen) {
    section.classList.add('accordion-group-item--open');
  }
}

/**
 * Toggle accordion item state
 * @param {HTMLElement} section - Section element
 * @param {boolean} open - Whether to open or close
 */
function toggleAccordionItem(section, open) {
  const trigger = section.querySelector('.accordion-group-trigger');
  const panel = section.querySelector('.accordion-group-panel');
  const content = panel.querySelector('.accordion-group-content');

  if (open) {
    section.classList.add('accordion-group-item--open');
    trigger.setAttribute('aria-expanded', 'true');
    panel.removeAttribute('hidden');

    // Animate open
    const contentHeight = content.scrollHeight;
    panel.style.maxHeight = '0';

    requestAnimationFrame(() => {
      panel.style.maxHeight = `${contentHeight}px`;

      // After animation, set to auto for dynamic content
      panel.addEventListener('transitionend', function handler() {
        if (section.classList.contains('accordion-group-item--open')) {
          panel.style.maxHeight = 'none';
        }
        panel.removeEventListener('transitionend', handler);
      });
    });
  } else {
    // Get current height before closing
    const currentHeight = panel.scrollHeight;
    panel.style.maxHeight = `${currentHeight}px`;

    // Force reflow to ensure CSS transition executes when collapsing
    // eslint-disable-next-line no-unused-expressions
    panel.offsetHeight;

    section.classList.remove('accordion-group-item--open');
    trigger.setAttribute('aria-expanded', 'false');
    panel.style.maxHeight = '0';

    panel.addEventListener('transitionend', function handler() {
      if (!section.classList.contains('accordion-group-item--open')) {
        panel.setAttribute('hidden', '');
      }
      panel.removeEventListener('transitionend', handler);
    });
  }
}

/**
 * Handle accordion item click
 * @param {Event} event - Click event
 * @param {HTMLElement[]} items - All accordion items
 * @param {Object} config - Group configuration
 */
function handleAccordionClick(event, items, config) {
  const trigger = event.target.closest('.accordion-group-trigger');
  if (!trigger) return;

  const section = trigger.closest('.accordion-group-item');
  const isCurrentlyOpen = section.classList.contains('accordion-group-item--open');

  if (config.openMode === 'exclusive') {
    // Close all other items
    items.forEach((item) => {
      if (item !== section && item.classList.contains('accordion-group-item--open')) {
        toggleAccordionItem(item, false);
      }
    });
  }

  // Toggle current item
  toggleAccordionItem(section, !isCurrentlyOpen);
}

/**
 * Handle keyboard navigation
 * @param {KeyboardEvent} event - Keyboard event
 * @param {HTMLElement[]} items - All accordion items
 */
function handleKeyboardNavigation(event, items) {
  const trigger = event.target.closest('.accordion-group-trigger');
  if (!trigger) return;

  const triggers = items.map((item) => item.querySelector('.accordion-group-trigger'));
  const currentIndex = triggers.indexOf(trigger);

  let nextIndex;

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      nextIndex = (currentIndex + 1) % triggers.length;
      triggers[nextIndex]?.focus();
      break;
    case 'ArrowUp':
      event.preventDefault();
      nextIndex = (currentIndex - 1 + triggers.length) % triggers.length;
      triggers[nextIndex]?.focus();
      break;
    case 'Home':
      event.preventDefault();
      triggers[0]?.focus();
      break;
    case 'End':
      event.preventDefault();
      triggers[triggers.length - 1]?.focus();
      break;
    default:
      break;
  }
}

/**
 * Parse configuration from block
 * @param {HTMLElement} block - Block element
 * @returns {Object} - Configuration object
 */
function parseConfig(block) {
  const config = { ...DEFAULT_CONFIG };

  // Try readBlockConfig first (for key-value structure)
  const blockConfig = readBlockConfig(block);

  // Map block config to our config structure (key-value approach)
  if (blockConfig['group-id']) config.groupId = blockConfig['group-id'];
  if (blockConfig['open-mode']) config.openMode = blockConfig['open-mode'];
  if (blockConfig['default-open']) config.defaultOpen = blockConfig['default-open'];
  if (blockConfig['enable-feature-flag']) config.enableFeatureFlag = blockConfig['enable-feature-flag'] === 'true';
  if (blockConfig['target-countries']) config.targetCountries = blockConfig['target-countries'];
  if (blockConfig['target-languages']) config.targetLanguages = blockConfig['target-languages'];
  if (blockConfig['visibility-start-date']) config.visibilityStartDate = blockConfig['visibility-start-date'];
  if (blockConfig['visibility-end-date']) config.visibilityEndDate = blockConfig['visibility-end-date'];

  // Fallback: Read by position if readBlockConfig didn't find values
  // AEM Universal Editor generates single-column rows (value only, no key)
  // Order: group-id, open-mode, default-open, enable-feature-flag,
  //        target-countries, target-languages, visibility-start-date, visibility-end-date
  if (!config.groupId || config.groupId.startsWith('accordion-group-')) {
    const rows = [...block.querySelectorAll(':scope > div')];
    const getValue = (index) => {
      const row = rows[index];
      if (!row) return '';
      const cell = row.querySelector(':scope > div');
      return cell ? cell.textContent.trim() : '';
    };

    const groupId = getValue(0);
    const openMode = getValue(1);
    const defaultOpen = getValue(2);
    const enableFeatureFlag = getValue(3);
    const targetCountries = getValue(4);
    const targetLanguages = getValue(5);
    const visibilityStartDate = getValue(6);
    const visibilityEndDate = getValue(7);

    if (groupId) config.groupId = groupId;
    if (openMode) config.openMode = openMode;
    if (defaultOpen) config.defaultOpen = defaultOpen;
    if (enableFeatureFlag) config.enableFeatureFlag = enableFeatureFlag === 'true';
    if (targetCountries) config.targetCountries = targetCountries;
    if (targetLanguages) config.targetLanguages = targetLanguages;
    if (visibilityStartDate) config.visibilityStartDate = visibilityStartDate;
    if (visibilityEndDate) config.visibilityEndDate = visibilityEndDate;
  }

  // Generate groupId if still not provided
  if (!config.groupId) {
    config.groupId = `accordion-group-${Math.random().toString(36).substring(2, 8)}`;
  }

  return config;
}

/**
 * Main decorator function
 * @param {HTMLElement} block - The accordion-group block element
 */
export default function decorate(block) {
  // Check for author environment
  const isAuthorEnv = window.xwalk?.isAuthorEnv;

  // Parse configuration
  const config = parseConfig(block);

  // Store groupId on block for reference
  block.dataset.accordionGroupId = config.groupId;

  // Check POS visibility (country/language from cookies)
  // Empty fields = show to all. Configured = hide if no match.
  if (!checkPOSVisibility(config)) {
    block.style.display = 'none';
    // Also hide associated sections
    const main = block.closest('main');
    const allSections = main ? Array.from(main.querySelectorAll('.section')) : [];
    const associatedSections = allSections.filter(
      (section) => section.dataset.accordionGroup === config.groupId,
    );
    associatedSections.forEach((section) => {
      section.style.display = 'none';
    });
    return;
  }

  // Check feature flags
  if (!checkFeatureFlag(config)) {
    block.style.display = 'none';
    // Also hide associated sections
    const main = block.closest('main');
    const allSections = main ? Array.from(main.querySelectorAll('.section')) : [];
    const associatedSections = allSections.filter(
      (section) => section.dataset.accordionGroup === config.groupId,
    );
    associatedSections.forEach((section) => {
      section.style.display = 'none';
    });
    return;
  }

  // In author mode, show configuration preview
  if (isAuthorEnv) {
    block.classList.add('accordion-group--author-mode');
    const preview = document.createElement('div');
    preview.className = 'accordion-group-author-preview';
    preview.innerHTML = `
      <div class="accordion-group-author-badge">Accordion Group Controller</div>
      <div class="accordion-group-author-config">
        <strong>Group ID:</strong> ${config.groupId}<br>
        <strong>Mode:</strong> ${config.openMode}<br>
        <strong>Default Open:</strong> ${config.defaultOpen}
      </div>
      <div class="accordion-group-author-hint">
        Add Sections below with style "accordion-item" and matching Accordion Group ID
      </div>
    `;
    block.innerHTML = '';
    block.appendChild(preview);
    return;
  }

  // Find all sections belonging to this accordion group
  // Look for sections with matching accordion-group metadata (converted to dataset.accordionGroup)
  const main = block.closest('main');
  const allSections = main ? Array.from(main.querySelectorAll('.section')) : [];

  const accordionItems = allSections.filter(
    (section) => section.dataset.accordionGroup === config.groupId,
  );

  if (accordionItems.length === 0) {
    // No items found, hide the controller block
    block.style.display = 'none';
    return;
  }

  // Track open items for exclusive mode
  const openItems = new Set();

  // Transform each section into an accordion item
  accordionItems.forEach((section, index) => {
    transformSectionToAccordionItem(section, index, config, openItems);
  });

  // Add event listeners
  accordionItems.forEach((section) => {
    section.addEventListener('click', (event) => {
      handleAccordionClick(event, accordionItems, config);
    });

    section.addEventListener('keydown', (event) => {
      handleKeyboardNavigation(event, accordionItems);
    });
  });

  // Create live region for accessibility announcements
  const liveRegion = document.createElement('div');
  liveRegion.setAttribute('role', 'status');
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.className = 'sr-only accordion-group-live-region';
  block.appendChild(liveRegion);

  // Hide the controller block in published mode (it's just config)
  block.classList.add('accordion-group--initialized');
  block.style.display = 'none';

  // Remove spacing from controller section container
  const controllerSection = block.closest('.section');
  if (controllerSection) {
    controllerSection.classList.add('!p-0', '!m-0', '!h-0', '!overflow-hidden');
  }
}
