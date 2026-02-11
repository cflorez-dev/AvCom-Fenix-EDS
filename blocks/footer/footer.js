import { getMetadata } from '../../scripts/aem.js';
import { getLocalizedPaths } from '../../scripts/utils/locale.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // Load footer as fragment with localized paths and fallback
  const footerMeta = getMetadata('footer');
  const customPath = footerMeta ? new URL(footerMeta, window.location).pathname : null;
  const footerPaths = await getLocalizedPaths('footer', customPath);
  
  // Attempt to load in priority order
  let fragment = null;
  for (const footerPath of footerPaths) {
    // Pass 'footer' as resourceType for path caching
    // eslint-disable-next-line no-await-in-loop
    fragment = await loadFragment(footerPath, 'footer');
    if (fragment) {
      // eslint-disable-next-line no-console
      console.log(`✅ Footer loaded from: ${footerPath}`);
      break;
    }
  }
  
  if (!fragment) {
    // eslint-disable-next-line no-console
    console.error('❌ No footer fragment found in any path:', footerPaths);
    return;
  }

  const footerContainer = document.createElement('div');
  footerContainer.className = 'footer-container flex flex-col';
  footerContainer.innerHTML = `
      <div class="footer-columns-wrapper flex justify-center"></div>
      <div class="footer-partner-logos-wrapper flex justify-center"></div>
      <div class="footer-bottom-wrapper"></div>
  `;

  block.style.display = 'none';

  if (block.parentNode) {
    block.parentNode.insertBefore(footerContainer, block.nextSibling);
  } else {
    block.after(footerContainer);
  }
}
