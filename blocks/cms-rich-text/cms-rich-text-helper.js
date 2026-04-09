import { getLinkButtonStyles } from '../../design-system/atoms/link-button/link-button.js';
import { sanitizeHTML } from '../../scripts/utils/sanitize.js';

// DOMPurify config that preserves inline styles from encoded CMS Rich Text.
//
// SECURITY NOTE — ACCEPTED RISK (iframe in rich text):
// The Fluid scanner flags this block as "371. DOM-Based XSS" (sprint 2, M3)
// because ADD_TAGS includes 'iframe', which allows content authors to embed
// arbitrary <iframe> tags directly via the rich text editor. In production,
// this is the mechanism by which the slider-impacto-social.html embed lands
// inside a rich text block on /es/sobre-nosotros/sostenibilidad/impacto-social.
//
// Decision: iframes are ALLOWED HERE intentionally, per the client's request,
// to preserve editorial content that depends on them (slider de gestión social,
// possible future embeds). Removing this capability would break published
// pages without replacement blocks.
//
// Risk mitigation (what is and isn't protected):
//   ✅ DOMPurify still strips <script>, event handlers (onload, onerror, etc.),
//      javascript: URIs inside attributes, and other XSS vectors.
//   ✅ The server's CSP (`script-src 'nonce-X' 'strict-dynamic'`) blocks any
//      <script> inside iframed documents that don't carry the nonce.
//   ⚠️  The iframe src itself is NOT validated against a domain whitelist.
//      A malicious author could, in theory, embed an <iframe src="https://attacker.com/phishing">.
//
// Recommended follow-up (not in this sprint):
//   - Create a dedicated AEM EDS block (blocks/cms-embed/) that accepts only
//     iframes from a hardcoded domain whitelist.
//   - Migrate existing rich-text iframes to that block.
//   - Once the migration is complete, remove 'iframe' from this ADD_TAGS.
const ENCODED_SANITIZE_CONFIG = {
  USE_PROFILES: { html: true },
  ADD_TAGS: ['iframe'],
  ADD_ATTR: ['style', 'target', 'rel', 'src', 'title', 'loading', 'frameborder', 'allow', 'allowfullscreen', 'scrolling'],
};

/**
 * Processes <a> tags in a DOM element to apply LinkButton styles
 * Always uses 'informative' color variant
 *
 * @param {Element} container - The DOM element containing <a> tags to process
 * @returns {void}
 */
function processLinkElements(container) {
  if (!container) return;

  // Get LinkButton styles for informative variant (same as process-content-html.js)
  const linkButtonClasses = getLinkButtonStyles({
    variant: 'link',
    size: 'default',
    colorVariant: 'informative',
    iconOnly: false,
    disabled: false,
    customClassName: '',
  });

  // Replace border-border-stroke-focus with border-text-normal-primary
  const processedLinkButtonClasses = linkButtonClasses.replace(
    'focus-visible:after:border-border-stroke-focus',
    'focus-visible:after:border-text-normal-primary',
  ).replace('text-link-informative-active', 'text-link-informative-default')
    .replace('text-link-promotional-active', 'text-link-promotional-default')
    .replace('text-link-caution-active', 'text-link-caution-default');

  // Find all <a> tags in the container
  const linkElements = container.querySelectorAll('a');

  if (linkElements.length === 0) {
    // No links found, nothing to process
    return;
  }

  linkElements.forEach((linkElement) => {
    // Process <u> tags inside this specific <a> to add group-hover/link,
    // group-active/link, and group-focus-visible/link:font-[700]
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

    // Use setAttribute to ensure the class is set
    linkElement.setAttribute('class', mergedClasses);
  });
}

/**
 * Processes and transforms CMS Rich Text content
 * Converts HTML entities within <code> tags to actual HTML elements
 *
 * @param {Element} block - The CMS Rich Text block element
 * @returns {void}
 */
export default function processRichTextContent(blockRaw) {
  if (!blockRaw) return;

  const preElements = blockRaw.querySelectorAll('pre');

  preElements.forEach((preElement) => {
    // md2jcr may strip the <code> wrapper — fall back to <pre> textContent
    const codeElement = preElement.querySelector('code');
    let htmlContent = codeElement
      ? (codeElement.textContent || codeElement.innerText)
      : (preElement.textContent || preElement.innerText);

    if (!htmlContent.trim()) {
      // If empty, remove the entire pre element
      preElement.remove();
      return;
    }

    // Fix double-escaped quotes (""color"" -> "color") but preserve
    // valid empty HTML attributes like alt="" by only replacing ""
    // when followed by a word character (letter, digit, underscore).
    htmlContent = htmlContent.replace(/""(?=\w)/g, '"');

    // Create a temporary container to parse the HTML
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = sanitizeHTML(htmlContent, ENCODED_SANITIZE_CONFIG);

    // Process <a> tags to apply LinkButton styles (informative variant)
    // Process BEFORE moving elements - classes will be preserved when moving
    processLinkElements(tempContainer);

    // Get the parent of the pre element
    const parent = preElement.parentElement;
    if (!parent) return;

    // Create a fragment with all parsed children
    // Classes assigned above will be preserved when moving elements
    const fragment = document.createDocumentFragment();
    [...tempContainer.children].forEach((child) => {
      fragment.appendChild(child);
    });

    // If there are no children but there's text content, create a text node
    if (
      tempContainer.children.length === 0
      && tempContainer.textContent.trim()
    ) {
      const textNode = document.createTextNode(tempContainer.textContent);
      fragment.appendChild(textNode);
    }

    // Replace the pre element with the parsed HTML content
    parent.insertBefore(fragment, preElement);
    preElement.remove();
  });

  // Also handle standalone <code> elements (not inside <pre>)
  const standaloneCodeElements = blockRaw.querySelectorAll('code');
  standaloneCodeElements.forEach((codeElement) => {
    // Skip if already processed (inside a pre that was removed)
    if (!codeElement.parentElement) return;

    let htmlContent = codeElement.textContent || codeElement.innerText;

    if (!htmlContent.trim()) {
      codeElement.remove();
      return;
    }

    // Fix double-escaped quotes (""color"" -> "color") but preserve
    // valid empty HTML attributes like alt="" by only replacing ""
    // when followed by a word character (letter, digit, underscore).
    htmlContent = htmlContent.replace(/""(?=\w)/g, '"');

    // Create a temporary container to parse the HTML
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = sanitizeHTML(htmlContent, ENCODED_SANITIZE_CONFIG);

    // Process <a> tags to apply LinkButton styles (informative variant)
    // Process BEFORE moving elements - classes will be preserved when moving
    processLinkElements(tempContainer);

    const parent = codeElement.parentElement;
    if (!parent) return;

    const fragment = document.createDocumentFragment();
    [...tempContainer.children].forEach((child) => {
      fragment.appendChild(child);
    });

    if (
      tempContainer.children.length === 0
      && tempContainer.textContent.trim()
    ) {
      const textNode = document.createTextNode(tempContainer.textContent);
      fragment.appendChild(textNode);
    }

    parent.insertBefore(fragment, codeElement);
    codeElement.remove();
  });
}
