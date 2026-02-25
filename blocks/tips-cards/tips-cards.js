import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import { extractTipsCardsProps, extractTipsCards } from './tips-cards-helper.js';
import TipsCards from '../../design-system/organisms/tips-cards/tips-cards.js';
import { shouldShowByTargeting, hideBlockWithSection } from '../../scripts/utils/target-filter.js';

const html = htm.bind(h);

/**
 * Decorates the Tips Cards block
 * This is a container block that holds tips-card-item child elements.
 * @param {Element} block The tips-cards block element
 */
export default function decorate(block) {
  // Extract configuration and cards using helper
  const config = extractTipsCardsProps(block);

  // Parent-level targeting: hide entire block if targeting doesn't match
  if (!shouldShowByTargeting(config.targetCountries, config.targetLanguages)) {
    hideBlockWithSection(block);
    return;
  }

  const cards = extractTipsCards(block);
  const loadingMode = config.loading || 'lazy';

  // Create container
  const container = document.createElement('div');

  render(
    html`
      <${TipsCards}
        cards=${cards}
        loading=${loadingMode}
        size="large"
      />
    `,
    container,
  );

  // Hide & Render Sibling Pattern (keeps original DOM intact for AEM editor)
  block.style.display = 'none';
  block.parentNode.insertBefore(container, block.nextSibling);
}
