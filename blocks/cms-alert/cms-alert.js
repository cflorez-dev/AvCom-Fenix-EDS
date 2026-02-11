import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import { readBlockConfig } from '../../scripts/aem.js';
import { Alert } from '../../design-system/molecules/alert/alert.js';
import { shouldShowByTargeting, hideBlockWithSection } from '../../scripts/utils/target-filter.js';

const html = htm.bind(h);

/**
 * Maps the HTML structure to alert data object
 *
 * Expected HTML structure:
 * <div class="cms-alert block">
 *   <div><div><p>variant</p></div></div>  // Variant
 *   <div><div>...content HTML...</div></div>  // Content
 *   <div><div><p>true/false</p></div></div>  // Dismissible
 * </div>
 *
 * @param {Element} block The cms-alert block element
 * @returns {Object} Mapped alert data with {variant, innercontent, showDismissbutton}
 */
function mapAlertData(block) {
  const rows = [...block.children];

  // Default values
  let variant = 'informative';
  let innercontent = '';
  let showDismissbutton = true;

  // Row 0: Variant
  if (rows[0]) {
    const variantCell = rows[0].querySelector('p') || rows[0].querySelector('div');
    if (variantCell) {
      const variantValue = variantCell.textContent.trim().toLowerCase();
      if (variantValue) {
        variant = variantValue;
      }
    }
  }

  // Row 1: Content (innerHTML)
  if (rows[1]) {
    // Get ALL innerHTML from the content cell without any processing
    // AEM structure: <div(row)><div(cell)>...content...</div></div>
    const contentCell = rows[1].children[0];
    if (contentCell) {
      // Simply get the innerHTML - preserve everything as-is
      innercontent = contentCell.innerHTML;
    }
  }

  // Row 2: Dismissible (showDismissbutton)
  if (rows[2]) {
    const dismissibleCell = rows[2].querySelector('p') || rows[2].querySelector('div');
    if (dismissibleCell) {
      const dismissibleValue = dismissibleCell.textContent.trim().toLowerCase();
      showDismissbutton = dismissibleValue === 'true' || dismissibleValue === '1' || dismissibleValue === 'yes';
    }
  }

  return {
    variant,
    innercontent,
    showDismissbutton,
  };
}

/**
 * Decorates the CMS Alert block
 * Renders alerts with configurable variant, content, and dismissibility
 * Always full-width with rounded borders
 *
 * Table structure in AEM:
 * | Variant | Content | Dismissible |
 * |---------|---------|-------------|
 * | success | <p><strong>Title</strong> Body text...</p> | true |
 *
 * @param {Element} block The cms-alert block element
 */
export default function decorate(block) {
  // 1. Detect Author Mode (Universal Editor compatibility)
  const isAuthorEnv = window.xwalk?.isAuthorEnv;

  if (isAuthorEnv) {
    // Preserve editable content in author mode
    block.classList.add('cms-alert-author-mode');

    // Add visual indicator for authors
    const authorIndicator = document.createElement('div');
    authorIndicator.textContent = '🔔 CMS Alert (Author Mode - Edit below)';
    authorIndicator.className = 'bg-gray-100 p-2 border border-dashed border-blue-600 mb-2 text-xs text-gray-600';
    block.insertBefore(authorIndicator, block.firstChild);

    // Exit without transforming - keep editable
    return;
  }

  // 2. Production Mode: Read block configuration
  const config = readBlockConfig(block);

  // Check targeting (country/language filtering)
  if (!shouldShowByTargeting(config['target-countries'], config['target-languages'])) {
    hideBlockWithSection(block);
    return;
  }

  // 3. Map HTML structure to alert data object
  const mappedData = mapAlertData(block);

  // Use mapped data, fallback to config if needed
  const variant = mappedData.variant || config.variant || 'informative';
  const innercontent = mappedData.innercontent || '';
  const showDismissbutton = mappedData.showDismissbutton !== undefined
    ? mappedData.showDismissbutton
    : (config.dismissible === 'true' || config.dismissible === true);
  const container = document.createElement('div');
  container.className = 'cms-alert-container';

  const alerts = [];

  if (innercontent) {
    alerts.push({
      variant,
      contentHTML: innercontent,
      dismissible: showDismissbutton,
    });
  }

  // 6. Render Alert components with Preact
  alerts.forEach((alertData) => {
    const alertElement = document.createElement('div');
    alertElement.className = 'cms-alert-item';

    render(
      html`
        <${Alert}
          variant=${alertData.variant}
          contentHTML=${alertData.contentHTML}
          dismissible=${alertData.dismissible}
          fullWidth=${false}
          isRounded=${true}
          showIcon=${true}
          marqueeMode=${false}
        />
      `,
      alertElement,
    );

    container.appendChild(alertElement);
  });

  // 7. Add metadata as data attributes
  container.dataset.variant = variant;
  container.dataset.dismissible = showDismissbutton;

  // 8. Hide & Render Sibling Pattern (Universal Editor compatibility)
  // Hide original block (DO NOT remove - preserve for Universal Editor)
  block.classList.add('hidden');

  // Insert transformed content as sibling element
  block.parentNode.insertBefore(container, block.nextSibling);
}
