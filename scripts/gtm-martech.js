// eslint-disable-next-line import/no-relative-packages
import GtmMartech from '../plugins/gtm-martech/src/index.js';
import { GTM_CONTAINER_ID, isTrackingDisabled } from './martech-config.js';

/**
 * Get consent from OneTrust
 * OneTrust stores consent in OptanonConsent cookie and window.OnetrustActiveGroups
 * @returns {Promise<Object>} Consent configuration object
 */
async function checkConsent() {
  // Wait for OneTrust to be ready
  await new Promise((resolve) => {
    if (window.OneTrust) {
      resolve();
    } else {
      window.addEventListener('consent-updated', resolve, { once: true });
      // Timeout fallback - don't block forever if OneTrust fails to load
      setTimeout(resolve, 2000);
    }
  });

  // Map OneTrust groups to Google consent
  // C0001 = Strictly Necessary, C0002 = Performance, C0003 = Functional, C0004 = Targeting
  const groups = window.OnetrustActiveGroups || '';

  return {
    ad_storage: groups.includes('C0004') ? 'granted' : 'denied',
    ad_user_data: groups.includes('C0004') ? 'granted' : 'denied',
    ad_personalization: groups.includes('C0004') ? 'granted' : 'denied',
    analytics_storage: groups.includes('C0002') ? 'granted' : 'denied',
    functionality_storage: groups.includes('C0003') ? 'granted' : 'denied',
    personalization_storage: groups.includes('C0003') ? 'granted' : 'denied',
    security_storage: 'granted',
  };
}

const martech = new GtmMartech({
  analytics: !isTrackingDisabled(),
  dataLayerInstanceName: 'dataLayer',
  tags: [],
  containers: {
    lazy: [GTM_CONTAINER_ID],
    delayed: [],
  },
  consent: !isTrackingDisabled(),
  consentCallback: checkConsent,
});

export default martech;
