import processRichTextContent from './cms-rich-text-helper.js';
import { getLinkButtonStyles } from '../../design-system/atoms/link-button/link-button.js';
import loadSVGIcon from '../../scripts/utils/svg.helper.js';
import { shouldShowByTargeting, hideBlockWithSection } from '../../scripts/utils/target-filter.js';
import { applyRteLabFilter, isRteLabEnabled } from '../../scripts/utils/rte-lab.js';

/**
 * Processes <a> tags in a container to apply LinkButton styles
 * Always uses 'informative' color variant
 *
 * @param {Element} container - The container element containing <a> tags to process
 * @returns {void}
 */
function processLinkElements(container) {
  if (!container) return;

  // Get LinkButton styles for informative variant
  const linkButtonClasses = getLinkButtonStyles({
    variant: 'link',
    size: 'default',
    colorVariant: 'informative',
    iconOnly: false,
    disabled: false,
    customClassName: '',
  });

  // Replace border-border-stroke-focus with border-text-normal-primary
  const processedLinkButtonClasses = linkButtonClasses;

  // Find all <a> tags in the container
  const linkElements = container.querySelectorAll('a');

  if (linkElements.length === 0) {
    return;
  }

  linkElements.forEach((linkElement) => {
    // Process <u> tags inside this specific <a>
    const uElements = linkElement.querySelectorAll('u');
    uElements.forEach((uElement) => {
      const uClassesToAdd = [
        'group-hover/link:font-[700]',
        'group-active/link:font-[700]',
        'group-focus-visible/link:font-[700]',
      ];
      const existingUClasses = (uElement.className || '').split(/\s+/).filter(Boolean);
      const mergedUClasses = [...new Set([...existingUClasses, ...uClassesToAdd])]
        .filter(Boolean)
        .join(' ');
      uElement.setAttribute('class', mergedUClasses);
    });

    // Merge LinkButton classes with existing classes
    const existingClasses = (linkElement.className || '').split(/\s+/).filter(Boolean);
    const linkButtonClassesArray = processedLinkButtonClasses.split(/\s+/);
    const mergedClasses = [...new Set([...existingClasses, ...linkButtonClassesArray, 'p-[2px]', 'group/link'])]
      .filter(Boolean)
      .join(' ');

    linkElement.setAttribute('class', mergedClasses);
  });
}

function isInternalLink(url) {
  if (!url) return false;

  if (url.startsWith('/') || url.startsWith('#') || url.startsWith('?')) {
    return true;
  }

  if (url.startsWith('//')) {
    return false;
  }

  try {
    const linkUrl = new URL(url, window.location.origin);
    return linkUrl.origin === window.location.origin;
  } catch (error) {
    return false;
  }
}

async function processExternalLinkIcons(container) {
  if (!container) return;

  const basePath = window.hlx?.codeBasePath || '';
  const iconPath = `${basePath}/icons/open_in_new.svg`;
  const iconSVG = await loadSVGIcon(iconPath);
  iconSVG.setAttribute('width', '16');
  iconSVG.setAttribute('height', '16');

  container.querySelectorAll('a').forEach((linkElement) => {
    const href = linkElement.getAttribute('href') || '';
    const isExternal = !isInternalLink(href);

    if (!isExternal) return;

    linkElement.setAttribute('target', '_blank');
    linkElement.setAttribute('rel', 'noopener noreferrer');

    if (!linkElement.querySelector('.cms-rich-text-external-icon')) {
      const iconWrapper = document.createElement('span');
      iconWrapper.className = 'cms-rich-text-external-icon inline-flex w-4 h-4';
      iconWrapper.innerHTML = iconSVG.outerHTML;
      linkElement.appendChild(iconWrapper);
    }
  });
}

/**
 * Adds list styles to <ul> and <ol> elements to show bullets/numbers
 * Only adds styles if the element doesn't already have 'list-style-none'
 *
 * @param {Element} container - The container element containing lists
 * @returns {void}
 */
function processListElements(container) {
  if (!container) return;

  container.querySelectorAll('ul').forEach((ulElement) => {
    const existingClasses = (ulElement.className || '').split(/\s+/).filter(Boolean);

    // Only add list-disc and pl-5 if list-style-none is NOT present
    if (!existingClasses.includes('list-none')) {
      const mergedClasses = [...new Set([...existingClasses, 'list-disc', 'pl-5'])]
        .filter(Boolean)
        .join(' ');
      ulElement.setAttribute('class', mergedClasses);
    }
  });

  container.querySelectorAll('ol').forEach((olElement) => {
    const existingClasses = (olElement.className || '').split(/\s+/).filter(Boolean);

    // Only add list-decimal and pl-5 if list-style-none is NOT present
    if (!existingClasses.includes('list-none')) {
      const mergedClasses = [...new Set([...existingClasses, 'list-decimal', 'pl-5'])]
        .filter(Boolean)
        .join(' ');
      olElement.setAttribute('class', mergedClasses);
    }
  });
}

/**
 * Decorates the CMS Rich Text block
 * @param {Element} block The cms-rich-text block element
 */
export default function decorate(block) {
  // 1. Detect if we are in Universal Editor (Author Mode)
  const isAuthorEnv = window.xwalk?.isAuthorEnv;

  if (isAuthorEnv) {
    const rteLabActive = isRteLabEnabled('cms-rich-text');
    if (rteLabActive) {
      applyRteLabFilter(block, {
        componentName: 'cms-rich-text',
        filterId: 'rte-lab-richtext',
      });
    }

    // In author mode: preserve editable content
    block.classList.add('cms-rich-text-author-mode');

    // Add visual indicator for the author
    const authorIndicator = document.createElement('div');
    authorIndicator.className = 'cms-rich-text-author-indicator bg-gray-100 p-2 border border-dashed border-blue-600 mb-2 text-xs text-gray-600';
    authorIndicator.textContent = rteLabActive
      ? 'CMS Rich Text (Author Mode - RTE Lab active, edit below)'
      : 'CMS Rich Text (Author Mode - Edit below)';
    block.insertBefore(authorIndicator, block.firstChild);

    // Exit WITHOUT transforming the block - keep it editable
    return;
  }

  // 2. Check targeting (country/language filtering)
  // Model field order: 0=text, 1=target-countries, 2=target-languages
  const rows = [...block.children];
  const targetCountries = rows[1]?.children[0]?.textContent?.trim() || '';
  const targetLanguages = rows[2]?.children[0]?.textContent?.trim() || '';

  if (!shouldShowByTargeting(targetCountries, targetLanguages)) {
    hideBlockWithSection(block);
    return;
  }

  // Remove targeting rows from DOM (they shouldn't be rendered)
  if (rows[2]) rows[2].remove();
  if (rows[1]) rows[1].remove();

  // 3. Process and transform content (map code tags to HTML)
  processRichTextContent(block);

  // 4. Production Mode: transform the block directly
  // Add container class to the block itself
  block.classList.add('cms-rich-text-container');

  // Create content wrapper for rich text content
  const content = document.createElement('div');
  content.className = 'cms-rich-text-content';

  // Move all existing children to the content wrapper
  [...block.children].forEach((child) => {
    content.appendChild(child);
  });

  // Append content wrapper to the block
  block.appendChild(content);

  // 5. Process <a> tags and list styles AFTER everything is in place
  // Apply LinkButton styles (informative variant) and list bullets/numbers
  processLinkElements(content);
  processListElements(content);
  processExternalLinkIcons(content);
}
