// eslint-disable-next-line import/no-cycle
import gtmMartech from './gtm-martech.js';
import { isAuthorMode } from './martech-config.js';
import { loadCSS, loadScript } from './aem.js';

// GTM Martech delayed phase - loads non-critical containers
if (!isAuthorMode()) {
  gtmMartech.delayed();

  // Centribal chat widget (Zendesk) - load CSS first, then script
  loadCSS('https://avianca-help.centribal.com/api/v1/recaptcha-css/')
    .then(() => loadScript('https://avianca-help.centribal.com/api/v1/recaptcha-jsx/'))
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Failed to load Centribal chat widget', err);
    });
}
