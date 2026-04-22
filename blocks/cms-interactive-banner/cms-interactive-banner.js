import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import InteractiveBanner from '../../design-system/organisms/banners/interactive-banner/interactive-banner.js';
import extractPanelData from './cms-interactive-banner-helper.js';
import { shouldShowByTargeting, hideBlockWithSection } from '../../scripts/utils/target-filter.js';

const html = htm.bind(h);

/**
 * Reads parent configuration from first two rows (target-countries, target-languages)
 * @param {Element} block The cms-interactive-banner block element
 * @returns {Object} Configuration object with targetCountries and targetLanguages arrays
 */
function readParentConfig(block) {
  const rows = [...block.children];
  const getValue = (rowIndex) => {
    const row = rows[rowIndex];
    if (!row) return '';
    const cell = row.querySelector('div > div, div > p');
    return cell?.textContent?.trim() || '';
  };

  const targetCountriesRaw = getValue(0);
  const targetLanguagesRaw = getValue(1);

  return {
    targetCountries: targetCountriesRaw,
    targetLanguages: targetLanguagesRaw,
  };
}

/**
 * Decorates the CMS Interactive Banner block
 * Extracts panel data from AEM table structure:
 * - Row 0: target-countries (comma-separated, e.g., "co,mx,ar")
 * - Row 1: target-languages (comma-separated, e.g., "es,en,pt")
 * - Row 2+: First panel (left) with 9-11 cells
 * - Row 3+: Second panel (right) with 9-11 cells
 * @param {Element} block The cms-interactive-banner block element
 */
export default function decorate(block) {
  const isAuthorEnv = window.xwalk?.isAuthorEnv;

  if (isAuthorEnv) {
    block.classList.add('cms-interactive-banner-author-mode');

    const authorIndicator = document.createElement('div');
    authorIndicator.className = 'cms-interactive-banner-author-indicator';
    authorIndicator.textContent = '🎨 Interactive Banner (Author Mode - Add items below)';
    authorIndicator.style.cssText = 'background: #f0f0f0; padding: 8px; border: 1px dashed #0066cc; margin-bottom: 8px; font-size: 12px; color: #666;';
    block.insertBefore(authorIndicator, block.firstChild);

    return;
  }

  // Read parent configuration (first 2 rows)
  const config = readParentConfig(block);

  // Country/Language filtering
  if (!shouldShowByTargeting(config.targetCountries, config.targetLanguages)) {
    hideBlockWithSection(block);
    return;
  }

  // Get all sections (skip first 2 rows which are parent config)
  const sections = [...block.children].slice(2);

  if (sections.length === 0) {
    return;
  }

  // Extract data from first two sections (left and right panels)
  const leftPanelData = sections[0] ? extractPanelData(sections[0]) : null;
  const rightPanelData = sections[1] ? extractPanelData(sections[1]) : null;

  // Filter panels by targeting (child-level filtering)
  const leftPanel = (leftPanelData && shouldShowByTargeting(
    leftPanelData['target-countries'],
    leftPanelData['target-languages'],
  )) ? leftPanelData : null;

  const rightPanel = (rightPanelData && shouldShowByTargeting(
    rightPanelData['target-countries'],
    rightPanelData['target-languages'],
  )) ? rightPanelData : null;

  // If both panels are filtered out, hide the entire block
  if (!leftPanel && !rightPanel) {
    hideBlockWithSection(block);
    return;
  }

  // Hide original children to preserve data-aue-* for editor (Pattern B)
  Array.from(block.children).forEach((child) => {
    child.style.display = 'none';
  });

  // Render INSIDE the block (compatible with editor-support.js re-decoration)
  const container = document.createElement('div');
  container.className = 'cms-interactive-banner-content';
  render(
    html`
      <${InteractiveBanner}
        leftPanel=${leftPanel}
        rightPanel=${rightPanel}
      />
    `,
    container,
  );
  block.appendChild(container);
}
