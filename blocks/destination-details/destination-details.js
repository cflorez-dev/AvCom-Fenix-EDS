import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import { readBlockConfig } from '../../scripts/aem.js';
import { Destinations } from '../../design-system/organisms/destinations/destinations.js';

const html = htm.bind(h);

/**
 * Decorate destination-details block to render the Destinations organism component
 * @param {Element} block - The destination-details block element
 */
export default function decorate(block) {
  const config = readBlockConfig(block);

  // Get IATA code from config or content
  const contentDiv = block.querySelector(':scope > div:first-child > div:first-child');
  const contentText = contentDiv?.textContent?.trim() || '';

  // Extract IATA code from content or config
  const iataMatch = contentText.match(/\b([A-Z]{3})\b/);
  const iata = iataMatch?.[1] || config.iata || 'AXM'; // Default to AXM

  const display = config.display || 'block';

  // Clear the block
  block.innerHTML = '';

  // Create wrapper for Preact component
  const wrapper = document.createElement('div');
  wrapper.className = 'destination-details-container';
  wrapper.setAttribute('data-name', 'destination-details');
  wrapper.style.display = display;

  // Render Destinations organism using Preact
  render(html`<${Destinations} iata=${iata} />`, wrapper);

  block.appendChild(wrapper);
}
