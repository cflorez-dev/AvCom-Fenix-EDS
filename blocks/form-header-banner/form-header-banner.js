// blocks/form-header-banner/form-header-banner.js
import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import { FormHeaderBanner } from '../../design-system/templates/form-header-banner/form-header-banner.js';
import { getStoredCountry, getStoredLanguage } from '../../scripts/services/header/language-country-selector.js';

const html = htm.bind(h);

/**
 * Maps block options from HTML according to the model defined in _component-models.json
 * Expected row order:
 * 1. targetCountries (text: comma-separated country codes)
 * 2. targetLanguages (text: comma-separated language codes)
 * 3. image (picture/img)
 * 4. loading (text: lazy/eager)
 * 5. titleText (text)
 * 6. titleLevel (text: h1-h6)
 * 7. subtitleText (text)
 * 8. subtitleLevel (text: h2-h6, p)
 * 9. formType (text: cabin-upgrade/none)
 * 10. showAlert (text: true/false)
 * 11. alertType (text: info/success/warning/error)
 * 12. alertDismissible (text: true/false)
 * 13. alertContent (richtext HTML)
 *
 * @param {Element} block The form-header-banner block element
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
    formType: 'cabin-upgrade', // default according to model
    showAlert: false, // default according to model
    alertType: 'info', // default according to model
    alertDismissible: true, // default according to model
    alertContent: '',
    'target-countries': '',
    'target-languages': '',
  };

  let currentIndex = 0;

  // Process each row in order
  rows.forEach((row) => {
    const cells = [...row.children];

    cells.forEach((cell) => {
      // Extract text from cell first
      const textContent = cell.textContent?.trim() || '';
      const innerHTML = cell.innerHTML?.trim() || '';

      // 1. target-countries (comma-separated)
      // Empty cells are valid (means "show in all countries")
      if (currentIndex === 0) {
        if (!cell.querySelector('picture') && !cell.querySelector('img')) {
          mappedOptions['target-countries'] = textContent; // Can be empty string
          currentIndex += 1;
          return;
        }
      }

      // 2. target-languages (comma-separated)
      // Empty cells are valid (means "show in all languages")
      if (currentIndex === 1) {
        if (!cell.querySelector('picture') && !cell.querySelector('img')) {
          mappedOptions['target-languages'] = textContent; // Can be empty string
          currentIndex += 1;
          return;
        }
      }

      // 3. Detect image
      const picture = cell.querySelector('picture');
      const img = cell.querySelector('img');
      if ((picture || img) && !mappedOptions.image && currentIndex === 2) {
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

      // If cell has only plain text (not complex HTML)
      if (textContent && innerHTML === `<p>${textContent}</p>`) {
        // 4. loading (lazy/eager)
        if (currentIndex === 3 && (textContent === 'lazy' || textContent === 'eager')) {
          mappedOptions.loading = textContent;
          currentIndex += 1;
          return;
        }

        // 5. titleText
        if (currentIndex === 4) {
          mappedOptions.titleText = textContent;
          currentIndex += 1;
          return;
        }

        // 6. titleLevel (h1-h6)
        if (currentIndex === 5 && /^h[1-6]$/.test(textContent.toLowerCase())) {
          mappedOptions.titleLevel = textContent.toLowerCase();
          currentIndex += 1;
          return;
        }

        // 7. subtitleText
        if (currentIndex === 6) {
          mappedOptions.subtitleText = textContent;
          currentIndex += 1;
          return;
        }

        // 8. subtitleLevel (h2-h6, p)
        if (currentIndex === 7 && (/^h[2-6]$/.test(textContent.toLowerCase()) || textContent.toLowerCase() === 'p')) {
          mappedOptions.subtitleLevel = textContent.toLowerCase();
          currentIndex += 1;
          return;
        }

        // 9. formType (cabin-upgrade/none)
        if (currentIndex === 8 && ['cabin-upgrade'].includes(textContent.toLowerCase())) {
          mappedOptions.formType = textContent.toLowerCase();
          currentIndex += 1;
          return;
        }

        // 10. showAlert (true/false)
        if (currentIndex === 9 && (textContent === 'true' || textContent === 'false')) {
          mappedOptions.showAlert = textContent === 'true';
          currentIndex += 1;
          return;
        }

        // 11. alertType (info/success/warning/error)
        if (currentIndex === 10 && ['info', 'success', 'warning', 'error'].includes(textContent.toLowerCase())) {
          mappedOptions.alertType = textContent.toLowerCase();
          currentIndex += 1;
          return;
        }

        // 12. alertDismissible (true/false)
        if (currentIndex === 11 && (textContent === 'true' || textContent === 'false')) {
          mappedOptions.alertDismissible = textContent === 'true';
          currentIndex += 1;
          return;
        }
      }

      // 13. alertContent (richtext HTML)
      if (currentIndex === 12 && innerHTML && innerHTML.includes('<')) {
        mappedOptions.alertContent = innerHTML;
        currentIndex += 1;
      }
    });
  });

  return mappedOptions;
}

/**
 * Decorates the Form Header Banner block
 * @param {Element} block The form-header-banner block element
 */
export default function decorate(block) {
  // 1. Detect if we are in Universal Editor (Author Mode)
  const isAuthorEnv = window.xwalk?.isAuthorEnv;

  // 2. Map block options from HTML
  const mappedOptions = mapBlockOptions(block);

  // 3. Country/Language filtering (BEFORE rendering)
  const targetCountries = mappedOptions['target-countries']
    ? mappedOptions['target-countries'].split(',').map((country) => country.trim().toLowerCase())
    : [];
  const targetLanguages = mappedOptions['target-languages']
    ? mappedOptions['target-languages'].split(',').map((lang) => lang.trim().toLowerCase())
    : [];

  const currentCountry = getStoredCountry()?.toLowerCase() || '';
  const currentLang = getStoredLanguage()?.toLowerCase() || document.documentElement.lang?.toLowerCase() || 'en';

  // If targetCountries configured and current country doesn't match: hide block
  if (targetCountries.length > 0 && currentCountry && !targetCountries.includes(currentCountry)) {
    block.style.display = 'none';
    return;
  }

  // If targetLanguages configured and current language doesn't match: hide block
  if (targetLanguages.length > 0 && currentLang && !targetLanguages.includes(currentLang)) {
    block.style.display = 'none';
    return;
  }

  // Use mapped values, with fallback to config and then to defaults
  const loadingMode = mappedOptions.loading || 'eager';
  const titleLevel = mappedOptions.titleLevel || 'h1';
  const subtitleLevel = mappedOptions.subtitleLevel || 'p';
  const formType = mappedOptions.formType || 'cabin-upgrade';
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
    formType,
    showAlert,
    alertType,
    alertDismissible,
    alertContent,
  };

  // 5. Hide & Render Sibling Pattern
  if (isAuthorEnv) {
    // In author mode: hide original block and create preview as sibling
    block.style.display = 'none';

    // Create preview container as sibling
    const previewContainer = document.createElement('div');
    previewContainer.className = 'form-header-banner-author-preview';
    block.parentNode.insertBefore(previewContainer, block.nextSibling);

    // Render component in preview container
    render(
      html`
        <${FormHeaderBanner} ...${componentProps} />
      `,
      previewContainer,
    );
    return;
  }

  // Production mode: hide original block and render component as sibling
  block.style.display = 'none';

  // Create container for rendered component
  const componentContainer = document.createElement('div');
  block.parentNode.insertBefore(componentContainer, block.nextSibling);

  // Render component
  render(
    html`
      <${FormHeaderBanner} ...${componentProps} />
    `,
    componentContainer,
  );
}
