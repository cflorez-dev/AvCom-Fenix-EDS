import { readBlockConfig } from '../../scripts/aem.js';
import { shouldShowByTargeting, hideBlockWithSection } from '../../scripts/utils/target-filter.js';
import { resolveLocale } from '../../scripts/utils/locale.js';
import { getSmartvelApiKey } from '../../scripts/utils/smartvel.js';

const SMARTVEL_CDN = 'https://cdn.smartvel.com';
const GCOV_BOOT_SRC = `${SMARTVEL_CDN}/scripts/gcovwidget/boot.min.js`;

/**
 * Warm up DNS + TLS for the Smartvel CDN. Idempotent.
 */
function preconnectSmartvel() {
  if (document.querySelector(`link[rel="preconnect"][href="${SMARTVEL_CDN}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = SMARTVEL_CDN;
  document.head.appendChild(link);
}

/**
 * Load the gcovwidget boot script. A fresh <script> is appended on every call
 * because <smt-gcovwidget> does NOT re-initialize via connectedCallback() when
 * the script was already loaded but the element was not yet in the DOM at that
 * time. Reloading the script after each widget insertion forces re-initialization,
 * matching the same pattern used in destinations.js (lines 289-304).
 */
function loadGcovBootScript() {
  const script = document.createElement('script');
  script.src = GCOV_BOOT_SRC;
  script.async = true;
  document.body.appendChild(script);
}

/**
 * Decorate the travel-documents block: render the Smartvel "travel documents"
 * widget (smt-gcovwidget), gated by POS targeting and localized by current language.
 * @param {Element} block - The travel-documents block element.
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);
  const targetCountries = config['target-countries'] || '';
  const targetLanguages = config['target-languages'] || '';

  if (!shouldShowByTargeting(targetCountries, targetLanguages)) {
    hideBlockWithSection(block);
    return;
  }

  preconnectSmartvel();

  const [locale, apiKey] = await Promise.all([resolveLocale(), getSmartvelApiKey()]);
  const language = locale?.language || 'es';
  if (!apiKey) {
    // eslint-disable-next-line no-console
    console.warn('[travel-documents] Missing AV_SMARTVEL_API_KEY in environment.json');
    hideBlockWithSection(block);
    return;
  }

  block.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'travel-documents-container';
  wrapper.setAttribute('data-name', 'travel-documents');

  const widget = document.createElement('smt-gcovwidget');
  widget.setAttribute('apikey', apiKey);
  widget.setAttribute('lang', language);
  wrapper.appendChild(widget);

  block.appendChild(wrapper);

  loadGcovBootScript();
}
