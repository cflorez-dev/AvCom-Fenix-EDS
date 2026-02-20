import { readBlockConfig } from '../../scripts/aem.js';

/**
 * Decorate html-embed block to inject raw HTML into the page
 * Injects HTML as-is without sanitization, including scripts and styles
 * @param {Element} block - The html-embed block element
 */
export default function decorate(block) {
  const config = readBlockConfig(block);

  // Get raw HTML content from first cell (before readBlockConfig modifies it)
  const contentDiv = block.querySelector(':scope > div:first-child > div:first-child');

  // AEM rich text editor wraps content in <p> tags and escapes HTML entities
  // We need to extract textContent to decode HTML entities (&lt; -> <, &gt; -> >)
  const htmlContent = contentDiv?.textContent?.trim() || '';

  const display = config.display || 'block';

  // If no content provided, show message
  if (!htmlContent) {
    block.innerHTML = '<p style="color: #999; font-style: italic; padding: 16px; text-align: center;">⚠️ No HTML content provided. Please add content in the "HTML Content" field.</p>';
    return;
  }

  // Clear the block
  block.innerHTML = '';

  // Create wrapper for HTML content
  const wrapper = document.createElement('div');
  wrapper.className = 'html-embed-container';
  wrapper.setAttribute('data-name', 'html-embed');

  const content = document.createElement('div');
  content.className = 'html-embed-content';

  // Inject raw HTML including scripts (textContent already decoded HTML entities)
  content.innerHTML = htmlContent;

  // Re-execute scripts to ensure external scripts load properly
  const scripts = content.querySelectorAll('script');
  scripts.forEach((oldScript) => {
    const newScript = document.createElement('script');

    // Copy all attributes (src, async, defer, type, etc.)
    Array.from(oldScript.attributes).forEach((attr) => {
      newScript.setAttribute(attr.name, attr.value);
    });

    // Copy inline script content if present
    if (oldScript.textContent.trim()) {
      newScript.textContent = oldScript.textContent;
    }

    // Replace to trigger execution
    oldScript.parentNode.replaceChild(newScript, oldScript);
  });

  wrapper.style.display = display;
  wrapper.appendChild(content);
  block.appendChild(wrapper);
}
