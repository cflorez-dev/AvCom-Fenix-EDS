// eslint-disable-next-line import/no-cycle
import gtmMartech from './gtm-martech.js';
import { isAuthorMode } from './martech-config.js';
import { loadCentribalChat } from './services/centribal/centribal.js';

// GTM Martech delayed phase - loads non-critical containers
if (!isAuthorMode()) {
  gtmMartech.delayed();

  // Centribal chatbot — non-critical martech. Loaded here (delayed phase)
  // instead of head.html to keep its two requests off the critical path.
  // Gated by the AV_CENTRIBAL_CHAT_ENABLED Config Service flag.
  loadCentribalChat();
}
