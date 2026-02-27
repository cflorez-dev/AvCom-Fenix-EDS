// eslint-disable-next-line import/no-cycle
import gtmMartech from './gtm-martech.js';
import { isAuthorMode } from './martech-config.js';

// GTM Martech delayed phase - loads non-critical containers
if (!isAuthorMode()) {
  gtmMartech.delayed();
}
