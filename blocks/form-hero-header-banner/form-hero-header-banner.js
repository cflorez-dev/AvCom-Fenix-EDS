// blocks/form-hero-header-banner/form-hero-header-banner.js
import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import { FormHeroHeaderBanner } from '../../design-system/organisms/banners/form-hero-header-banner/form-hero-header-banner.js';
import { shouldShowByTargeting, hideBlockWithSection } from '../../scripts/utils/target-filter.js';

const html = htm.bind(h);

/**
 * Maps block options from HTML according to the model defined in _component-models.json
 * Expected row order:
 * 1. image (picture/img)
 * 2. loading (text: lazy/eager)
 * 3. titleText (text)
 * 4. titleLevel (text: h1-h6)
 * 5. subtitleText (text)
 * 6. subtitleLevel (text: h2-h6, p)
 * 7. showAlert (text: true/false)
 * 8. alertType (text: info/success/warning/error)
 * 9. alertDismissible (text: true/false)
 * 10. alertContent (richtext HTML)
 *
 * @param {Element} block The form-hero-header-banner block element
 * @returns {Object} Object with options mapped according to the model
 */
function mapBlockOptions(block) {
  const rows = [...block.children];
  const mappedOptions = {
    image: null,
    imageAlt: '',
    loading: 'eager', // default according to model
    titleText: '',
    titleLevel: 'h1', // default according to model
    subtitleText: '',
    subtitleLevel: 'p', // default according to model
    showAlert: false, // default according to model
    alertType: 'info', // default according to model
    alertDismissible: true, // default according to model
    alertContent: '',
    targetCountries: '',
    targetLanguages: '',
    formType: 'none', // default according to model
    openInNewTab: undefined, // undefined → MMBForm falls back to i18n key `mmbForm.openInNewTab`
  };

  let currentIndex = 0;

  // Process each row in order
  rows.forEach((row) => {
    const cells = [...row.children];

    cells.forEach((cell) => {
      // 1. Detect image (first row with picture/img)
      const picture = cell.querySelector('picture');
      const img = cell.querySelector('img');
      if ((picture || img) && !mappedOptions.image) {
        const imageElement = img || picture?.querySelector('img');
        if (imageElement) {
          mappedOptions.image = {
            src: imageElement.src,
            alt: imageElement.alt || '',
          };
          mappedOptions.imageAlt = imageElement.alt || '';
          currentIndex += 1; // Increment index after processing image
          return; // Continue with next row
        }
      }

      // Extract text from cell
      const textContent = cell.textContent?.trim() || '';
      const innerHTML = cell.innerHTML?.trim() || '';

      // If cell has only plain text (not complex HTML)
      if (textContent && innerHTML === `<p>${textContent}</p>`) {
        // 2. loading (lazy/eager)
        if (currentIndex === 1 && (textContent === 'lazy' || textContent === 'eager')) {
          mappedOptions.loading = textContent;
          currentIndex += 1;
          return;
        }

        // 3. titleText
        if (currentIndex === 2) {
          mappedOptions.titleText = textContent;
          currentIndex += 1;
          return;
        }

        // 4. titleLevel (h1-h6)
        if (currentIndex === 3 && /^h[1-6]$/.test(textContent.toLowerCase())) {
          mappedOptions.titleLevel = textContent.toLowerCase();
          currentIndex += 1;
          return;
        }

        // 5. subtitleText
        if (currentIndex === 4) {
          mappedOptions.subtitleText = textContent;
          currentIndex += 1;
          return;
        }

        // 6. subtitleLevel (h2-h6, p)
        if (currentIndex === 5 && (/^h[2-6]$/.test(textContent.toLowerCase()) || textContent.toLowerCase() === 'p')) {
          mappedOptions.subtitleLevel = textContent.toLowerCase();
          currentIndex += 1;
          return;
        }

        // 7. showAlert (true/false)
        if (currentIndex === 6 && (textContent === 'true' || textContent === 'false')) {
          mappedOptions.showAlert = textContent === 'true';
          currentIndex += 1;
          return;
        }

        // 8. alertType (info/success/warning/error)
        if (currentIndex === 7 && ['info', 'success', 'warning', 'error'].includes(textContent.toLowerCase())) {
          mappedOptions.alertType = textContent.toLowerCase();
          currentIndex += 1;
          return;
        }

        // 9. alertDismissible (true/false)
        if (currentIndex === 8 && (textContent === 'true' || textContent === 'false')) {
          mappedOptions.alertDismissible = textContent === 'true';
          currentIndex += 1;
          return;
        }

        // 10. alertContent — keep the <p> wrapper so Alert's typography classes apply
        if (currentIndex === 9) {
          mappedOptions.alertContent = innerHTML;
          currentIndex += 1;
          return;
        }

        // 11. targetCountries (comma-separated country codes)
        if (currentIndex === 10) {
          mappedOptions.targetCountries = textContent;
          currentIndex += 1;
          return;
        }

        // 12. targetLanguages (comma-separated language codes)
        if (currentIndex === 11) {
          mappedOptions.targetLanguages = textContent;
          currentIndex += 1;
          return;
        }

        // 13. formType (none/mmb/ssci)
        if (currentIndex === 12 && ['none', 'mmb', 'ssci'].includes(textContent.toLowerCase())) {
          mappedOptions.formType = textContent.toLowerCase();
          currentIndex += 1;
          return;
        }

        // 14. openInNewTab (true/false)
        if (currentIndex === 13 && (textContent === 'true' || textContent === 'false')) {
          mappedOptions.openInNewTab = textContent === 'true';
          currentIndex += 1;
          return;
        }
      }

      // 10. alertContent (richtext HTML or plain text) - always advance past index 9
      // Must advance even if empty, otherwise targeting values at indices 10-11
      // get misinterpreted as alertContent (their <p>text</p> contains '<').
      if (currentIndex === 9) {
        if (innerHTML && innerHTML.includes('<')) {
          // Rich or plain HTML — capture as-is (e.g. <p>text</p> or <p><strong>text</strong></p>)
          mappedOptions.alertContent = innerHTML;
        } else if (textContent) {
          // Wrap plain text in <p> so Alert's typography classes (text-sm, etc.) apply.
          mappedOptions.alertContent = `<p>${textContent}</p>`;
        }
        currentIndex += 1;
        return;
      }

      // 11. targetCountries — always advance even if empty (empty = show in all)
      if (currentIndex === 10) {
        mappedOptions.targetCountries = textContent; // Can be empty string
        currentIndex += 1;
        return;
      }

      // 12. targetLanguages — always advance even if empty (empty = show in all)
      if (currentIndex === 11) {
        mappedOptions.targetLanguages = textContent;
        currentIndex += 1;
      }
    });
  });

  return mappedOptions;
}

/**
 * Decorates the Form Hero Header Banner block
 * @param {Element} block The form-hero-header-banner block element
 */
export default function decorate(block) {
  // 1. Map block options from HTML
  const mappedOptions = mapBlockOptions(block);

  // Targeting: hide banner if it doesn't match the user's market/language
  if (!shouldShowByTargeting(mappedOptions.targetCountries, mappedOptions.targetLanguages)) {
    hideBlockWithSection(block);
    return;
  }

  // Use mapped values, with fallback to config and then to defaults
  const loadingMode = mappedOptions.loading || 'eager';
  const titleLevel = mappedOptions.titleLevel || 'h1';
  const subtitleLevel = mappedOptions.subtitleLevel || 'p';
  const showAlert = mappedOptions.showAlert !== undefined ? mappedOptions.showAlert : (false);
  const alertType = mappedOptions.alertType || 'info';
  const alertDismissible = mappedOptions.alertDismissible !== undefined
    ? mappedOptions.alertDismissible : (true);

  // Extract image and text data
  const imageData = mappedOptions.image;
  const imageAlt = mappedOptions.imageAlt || '';
  const titleText = mappedOptions.titleText || '';
  const subtitleText = mappedOptions.subtitleText || '';
  const alertContent = mappedOptions.alertContent || '';

  // 4. Prepare props for the component
  const componentProps = {
    imageData,
    imageAlt,
    loadingMode,
    titleText,
    titleLevel,
    subtitleText,
    subtitleLevel,
    showAlert,
    alertType,
    alertDismissible,
    alertContent,
    formType: mappedOptions.formType || 'none',
    openInNewTab: mappedOptions.openInNewTab !== undefined ? mappedOptions.openInNewTab : true,
  };

  // 5. Clear block and render INSIDE (compatible with editor-support.js re-decoration)
  block.textContent = '';

  const container = document.createElement('div');
  container.className = 'form-hero-header-banner-content';
  block.appendChild(container);

  render(
    html`
      <${FormHeroHeaderBanner} ...${componentProps} />
    `,
    container,
  );
}
