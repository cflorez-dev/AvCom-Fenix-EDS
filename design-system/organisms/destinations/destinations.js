import { h } from '@dropins/tools/preact.js';
import { useState, useEffect, useRef } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { resolveLocale } from '../../../scripts/utils/locale.js';
import { fetchAEMData } from '../../../scripts/utils/aem-data.js';
import { BookingBox } from '../booking-box/booking-box.js';
import { fetchCities } from '../../molecules/origin-destination-selector/origin-destination-selector.service.js';
import { sanitizeHTML, sanitizeSpreadProps } from '../../../scripts/utils/sanitize.js';

const html = htm.bind(h);

// Register a global promise so scripts.js knows to wait for Smartvel before hiding the loader.
// This runs when the Destinations module is first imported (i.e. only on destinations detail pages).
window.__smartvelLoadedPromise = new Promise((resolve) => {
  window.__resolveSmartvelLoaded = resolve;
});

// Nullify the resolver before calling it so any concurrent/subsequent call is a no-op.
function resolveSmartvelOnce() {
  const resolve = window.__resolveSmartvelLoaded;
  if (!resolve) return;
  window.__resolveSmartvelLoaded = null;
  resolve();
}

// Safety: resolve after 15s in case Smartvel never populates (error, empty destination, etc.)
setTimeout(() => resolveSmartvelOnce(), 15000);

/**
 * Fetches the dynamic preSlug from the site's language JSON file.
 * @param {string} lang - Language code (e.g. 'es', 'en', 'fr', 'pt')
 * @returns {Promise<string|null>} preSlug or null
 */
async function fetchPreSlugFromLangFile(lang = 'es') {
  try {
    const { origin } = window.location;
    // Supported languages: es, en, fr, pt
    const langPrefix = ['es', 'en', 'fr', 'pt'].includes(lang) ? lang : 'es';
    const langJsonUrl = `${origin}/${langPrefix}.json`;
    const res = await fetch(langJsonUrl);
    if (!res.ok) return null;
    const json = await res.json();
    const preSlugEntry = json.data?.find((item) => item.Key === 'hubDestinations.urlPreSlug');
    return preSlugEntry ? preSlugEntry.Text : null;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Destinations] Error fetching preSlug from lang file:', error);
    return null;
  }
}

/**
 * Extracts the destination slug from the current URL using the preSlug.
 * @param {string} preSlug - URL prefix (e.g. 'destinos/que-hacer-en')
 * @returns {string|null} Clean destination slug or null
 */
function extractSlugFromUrl(preSlug = '') {
  try {
    const path = window.location.pathname;
    const idx = path.indexOf(preSlug);
    if (idx !== -1) {
      let after = path.slice(idx + preSlug.length);
      after = after.replace(/^[-/]+/, '');
      return after || null;
    }
    return null;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Destinations] Error extracting slug from URL:', error);
    return null;
  }
}
/**
 * Fetch content fragments from Adobe I/O Runtime API
 * @param {string} apiUrl - The Adobe I/O Runtime API URL
 * @param {string} action - The action to perform
 * @param {string} site - The site name
 * @param {string} query - The GraphQL query name
 * @param {Object} variables - Query variables
 * @param {boolean} bypassCache - Whether to bypass cache
 * @returns {Promise<Object|null>} The API response data or null
 */
async function fetchContentFragments(apiUrl, action, site, query, variables, bypassCache = true) {
  try {
    const requestBody = {
      action,
      site,
      query,
      variables,
      bypassCache,
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return null;
  }
}

/**
 * Accordion - Simple collapsible accordion component
 */
// eslint-disable-next-line no-unused-vars
const Accordion = ({ title, children, isOpen: defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return html`
    <div class="mb-3 border border-gray-200 rounded-lg bg-white overflow-hidden">
      <button
        class="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
        onClick=${() => setIsOpen(!isOpen)}
      >
        <span class="font-semibold text-gray-900">${title}</span>
        <span class=${`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      ${isOpen && html`
        <div class="p-4 pt-0 border-t border-gray-100">
          ${children}
        </div>
      `}
    </div>
  `;
};

/**
 * InteractiveTabs - Functional tabs with destination content
 */
const InteractiveTabs = ({
  destinationData, language = 'es', i18n = {}, smartvelApiKey = '',
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const tabRefs = useRef([]);

  // Move focus to newly active tab only when navigating via keyboard
  useEffect(() => {
    const focusedEl = document.activeElement;
    const isTabFocused = tabRefs.current.some((ref) => ref === focusedEl);
    if (isTabFocused) tabRefs.current[activeTab]?.focus();
  }, [activeTab]);

  if (!destinationData) {
    return html`
      <div class="p-8 text-center text-gray-500">
        ${i18n['hubDestinations.destination.loading'] || 'Loading...'}
      </div>
    `;
  }

  const destination = destinationData.data?.data?.destinationList?.items?.[0];

  if (!destination) {
    return html`
      <div class="p-8 text-center text-gray-500">
        ${i18n['hubDestinations.destination.noData'] || 'No destination data available'}
      </div>
    `;
  }

  // Helper function to get localized field
  const getLocalizedField = (fieldName) => {
    const localizedKey = `${fieldName}_${language}`;
    return destination[localizedKey] || destination[`${fieldName}_es`] || null;
  };

  // Localized tab labels resolved from i18n spreadsheet
  const tabLabels = {
    discover: i18n['hubDestinations.destination.tab.discover'] || 'Descubre',
    airport: i18n['hubDestinations.destination.tab.airport'] || 'Aeropuerto y Transporte',
    requirements: i18n['hubDestinations.destination.tab.requirements'] || 'Requisitos de entrada',
  };

  const getTabLabel = (key) => tabLabels[key];

  const tabs = [
    {
      label: getTabLabel('discover'),
      content: html`
        <div class="p-4 lg:p-8 !pt-6">
          <div class="flex flex-col lg:flex-row gap-[28px] items-start">
            <!-- Left image: 240px x 240px (desktop), full-width 161px (mobile/tablet) -->
            <div class="w-full lg:w-auto lg:flex-shrink-0">
              ${(() => {
    // eslint-disable-next-line dot-notation
    const heroImageUrl = destination.introImage?.['_publishUrl'];
    return heroImageUrl ? html`
                  <img
                    src=${heroImageUrl}
                    alt=${destination.cityName_en}
                    class="w-full h-[161px] lg:w-[240px] lg:h-[240px] object-cover rounded-lg"
                    loading="lazy"
                    decoding="async"
                    fetchpriority="low"
                  />
                ` : html`
                  <div class="w-full h-[161px] lg:w-[240px] lg:h-[240px] bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                    ${i18n['hubDestinations.destination.noImage'] || 'No image'}
                  </div>
                `;
  })()}
            </div>

            <!-- Right content: title, description, currency and language (100% mobile) -->
            <div class="w-full lg:flex-1 flex flex-col gap-4">
              <div
                class="
                text-[var(--color-text-normal-secondary)] prose max-w-none
                [&_hr]:my-4
                [&_p+ul]:mt-4 [&_p+ul]:pt-4 [&_p+ul]:border-t [&_p+ul]:border-[var(--color-border-stroke-default)]
                [&_.dynamic-information-list]:flex [&_.dynamic-information-list]:flex-wrap [&_.dynamic-information-list]:gap-4
                [&_.dynamic-information_item]:min-w-0
                [&_ul]:flex [&_ul]:flex-row [&_ul]:flex-wrap [&_ul]:gap-4
                [&_li]:flex [&_li]:flex-row lg:[&_li]:flex-col [&_li]:gap-[8px] [&_li]:min-w-0
                [&_li_strong]:leading-[24px] [&_li_p]:leading-[24px] [&_li_strong]:text-[18px] [&_li_strong]:text-[var(--color-text-normal-primary)]
                [&>p]:text-[16px] lg:[&>p]:text-[18px] [&>p]:font-normal [&_li_p]:text-[16px] [&_li_p]:font-normal
                [&_a]:underline [&_a]:decoration-solid [&_a]:[text-decoration-skip-ink:none] [&_a]:text-[var(--color-text-link-informative-default)] [&_a]:transition-colors [&_a]:duration-200 [&_a:hover]:text-[var(--color-text-link-informative-active)] [&_a:active]:text-[var(--color-text-link-informative-active)]"
                dangerouslySetInnerHTML=${{ __html: sanitizeHTML(getLocalizedField('intro')?.html || getLocalizedField('intro')?.plaintext || '') }}
              />
            </div>
          </div>
        </div>
      `,
    },
    {
      label: getTabLabel('airport'),
      content: html`
        <div class="p-4 lg:p-8">
          <div class="flex flex-col lg:flex-row gap-[28px] items-start">
            <!-- Left image: 240px x 240px (desktop), full-width 161px (mobile/tablet) -->
            <div class="w-full lg:w-auto lg:flex-shrink-0">
              ${(() => {
    // eslint-disable-next-line dot-notation
    const airportImageUrl = destination.airportImage?.['_publishUrl'];
    return airportImageUrl ? html`
                  <img
                    src=${airportImageUrl}
                    alt=${getLocalizedField('airportName')}
                    class="w-full h-[161px] lg:w-[240px] lg:h-[240px] object-cover rounded-lg"
                    loading="lazy"
                    decoding="async"
                    fetchpriority="low"
                  />
                ` : html`
                  <div class="w-full h-[161px] lg:w-[240px] lg:h-[240px] bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                    ${i18n['hubDestinations.destination.noImage'] || 'No image'}
                  </div>
                `;
  })()}
            </div>

            <!-- Right content: title and description (100% mobile) -->
            <div class="w-full lg:flex-1 flex flex-col gap-4">
              <div
                class="airport text-[16px] text-[var(--color-text-normal-secondary)] prose max-w-none [&_hr]:my-4 [&_p+ul]:mt-4 [&_p+ul]:pt-4 [&_p+ul]:border-t [&_p+ul]:border-[var(--color-border-stroke-default)] [&_.dynamic-information-list]:flex [&_.dynamic-information-list]:flex-wrap [&_.dynamic-information-list]:gap-4 [&_.dynamic-information_item]:flex-[0_0_100%] [&_.dynamic-information_item]:min-w-0 [&_h3]:text-[var(--color-text-normal-primary)] [&>p]:text-[16px] lg:[&>p]:text-[18px] [&>p]:font-normal [&_li_strong]:text-[16px] [&_li_strong]:text-[var(--color-text-normal-primary)] [&_a]:underline [&_a]:decoration-solid [&_a]:[text-decoration-skip-ink:none] [&_a]:text-[var(--color-text-link-informative-default)] [&_a]:transition-colors [&_a]:duration-200 [&_a:hover]:text-[var(--color-text-link-informative-active)] [&_a:active]:text-[var(--color-text-link-informative-active)]"
                dangerouslySetInnerHTML=${{ __html: sanitizeHTML(getLocalizedField('airportAndTransport')?.html || getLocalizedField('airportAndTransport')?.plaintext || i18n['hubDestinations.destination.noTransport'] || 'No transport information available') }}
              />
            </div>
          </div>
        </div>
      `,
    },
    {
      label: getTabLabel('requirements'),
      content: html`
        <div class="p-6">
          <h3 class="font-bold mb-4">${i18n['hubDestinations.destination.tab.requirements'] || getTabLabel('requirements')}</h3>
          <div id="smartvel-widget-container" class="my-6">
            <smt-gcovwidget
              apikey=${smartvelApiKey}
              lang=${language}
            ></smt-gcovwidget>
          </div>
        </div>
      `,
    },
  ];

  // Load gcovwidget script on each tab 3 activation.
  // NOTE: smt-gcovwidget does not re-initialize via connectedCallback() when
  // the script was already loaded but the element wasn't in the DOM at load
  // time — so we must reload the script each time to guarantee initialization.
  useEffect(() => {
    if (activeTab === 2) {
      const script = document.createElement('script');
      script.src = 'https://cdn.smartvel.com/scripts/gcovwidget/boot.min.js';
      script.async = true;
      document.body.appendChild(script);
      return () => {
        if (script.parentNode) script.parentNode.removeChild(script);
      };
    }
    return undefined;
  }, [activeTab]);

  return html`
    <div class="shadow-[0px_2px_20px_2px_rgba(73,73,73,0.25)] rounded-3xl overflow-hidden">
      <!-- Tabs Navigation -->
      <div class="flex gap-0 bg-white overflow-x-auto" role="tablist" aria-label="Destination information tabs">
        ${tabs.map((tab, index) => {
    const isActive = activeTab === index;
    return html`
      <button
        key=${index}
        id="tab-${index}"
        class="flex flex-col flex-1 basis-[33.333%] min-w-[140px] py-[22px] px-3 lg:py-[28px] lg:px-[var(--x-x-large,32px)] gap-[var(--tiny,4px)] items-center justify-center shrink-0 relative isolate transition-all duration-200 hover:bg-gray-50 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-stroke-focus)]"
        role="tab"
        aria-selected=${isActive}
        aria-controls="tabpanel-${index}"
        aria-label=${tab.label}
        tabIndex=${isActive ? '0' : '-1'}
        ref=${(el) => { tabRefs.current[index] = el; }}
        onClick=${() => setActiveTab(index)}
        onKeyDown=${(e) => {
    if (e.key === 'Enter' || e.key === ' ') { setActiveTab(index); }
    if (e.key === 'ArrowRight') { setActiveTab((index + 1) % tabs.length); }
    if (e.key === 'ArrowLeft') { setActiveTab((index - 1 + tabs.length) % tabs.length); }
  }}
      >
        <div class="flex gap-[4px] items-center justify-center relative w-full z-[4]">
          <span class=${`text-[16px] leading-[20px] lg:text-[18px] lg:leading-[24px] overflow-hidden text-ellipsis ${
    isActive ? 'font-bold text-[var(--text-normal-primary)]' : 'font-normal text-[var(--text-normal-secondary)]'
  }`}>
            ${tab.label}
          </span>
        </div>
        ${isActive && html`
          <div class="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--border-accent-positive,#1ea93c)] z-[2]"></div>
        `}
        <div class="absolute bottom-0 left-0 right-0 h-[1px] bg-[var(--border-stroke-default,#d9d9d9)] z-[1]"></div>
      </button>
    `;
  })}
      </div>

      <!-- Tab Content -->
      <div
        class="bg-gray-50"
        role="tabpanel"
        id="tabpanel-${activeTab}"
        aria-labelledby="tab-${activeTab}"
      >
        ${tabs[activeTab].content}
      </div>
    </div>
  `;
};

/**
 * Destinations - Main organism component
 * @param {Object} props - Component props
 * @param {string} props.apiUrl - API URL for fetching data
 * @param {string} props.customClassName - Additional CSS classes
 */
export const Destinations = ({
  apiUrl = '',
  customClassName = '',
  preSlug = '',
  i18n = {},
  ...rest
}) => {
  const [destinationData, setDestinationData] = useState(null);
  let cachedEnvConfig = null;
  /**
   * Reads { apiUrl, site, smartvelApiKey } from environment.json (AEM Author).
   * Required env keys:
   *   - AV_API_URL_CONTENT_FRAGMENTS: GraphQL endpoint URL
   *   - AV_NAME_SITE: AEM site name
   *   - AV_SMARTVEL_API_KEY: Smartvel widget API key
   * Logs a warning if any key is missing.
   * @returns {Promise<{ apiUrl: string, site: string, smartvelApiKey: string }>}
   */
  async function getEnvConfig() {
    if (cachedEnvConfig) return cachedEnvConfig;
    const config = await fetchAEMData('environment');
    const envRows = Array.isArray(config?.data) ? config.data : [];
    const readEnv = (key) => envRows.find((item) => item.Key === key)?.Text?.trim() || '';

    const envApiUrl = readEnv('AV_API_URL_CONTENT_FRAGMENTS');
    const envSite = readEnv('AV_NAME_SITE');
    const envSmartvelApiKey = readEnv('AV_SMARTVEL_API_KEY');

    if (!envApiUrl) {
      // eslint-disable-next-line no-console
      console.warn('[Destinations] Missing env var AV_API_URL_CONTENT_FRAGMENTS in environment.json');
    }
    if (!envSite) {
      // eslint-disable-next-line no-console
      console.warn('[Destinations] Missing env var AV_NAME_SITE in environment.json');
    }

    cachedEnvConfig = { apiUrl: envApiUrl, site: envSite, smartvelApiKey: envSmartvelApiKey };
    return cachedEnvConfig;
  }
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('es');
  const [slug, setSlug] = useState(null);
  const [smartvelApiKey, setSmartvelApiKey] = useState('');
  // Real airport terminal for the destination's city IATA, resolved from the
  // combinability catalog. The CF only stores the metropolitan city code
  // (e.g. Chicago = "CHI"); the Booking Box must search by physical terminal
  // (e.g. "ORD"), so for multi-airport cities we look it up here. Stays null
  // until resolved — the render falls back to the city code so single-airport
  // cities (city === terminal) and any catalog miss keep today's behaviour.
  const [resolvedTerminal, setResolvedTerminal] = useState(null);

  // Detect language and fetch preSlug from lang file, then extract slug
  useEffect(() => {
    const detectLangAndPreSlug = async () => {
      let lang = 'es';
      try {
        const locale = await resolveLocale();
        lang = locale.language || 'es';
        setLanguage(lang);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('[Destinations] Failed to detect language, using default: es', error);
        setLanguage('es');
      }
      let pre = preSlug;
      if (!pre) {
        pre = i18n['hubDestinations.urlPreSlug'];
      }
      if (!pre) {
        pre = await fetchPreSlugFromLangFile(lang);
      }
      // 2. Extract slug from URL using the preSlug
      const urlSlug = extractSlugFromUrl(pre);
      setSlug(urlSlug);
    };
    detectLangAndPreSlug();
  }, [preSlug, i18n]);

  // Fetch destination data when slug or language changes
  useEffect(() => {
    if (!slug || !language) return;
    const loadDestination = async () => {
      setLoading(true);
      // Determine slug variable name and query name based on language
      let slugVar = 'slug_es';
      let queryName = 'GetDestinationBySlugES';
      if (language === 'en') {
        slugVar = 'slug_en';
        queryName = 'GetDestinationBySlugEN';
      } else if (language === 'fr') {
        slugVar = 'slug_fr';
        queryName = 'GetDestinationBySlugFR';
      } else if (language === 'pt') {
        slugVar = 'slug_pt';
        queryName = 'GetDestinationBySlugPT';
      }
      const variables = {};
      variables[slugVar] = slug;
      const { apiUrl: envApiUrl, site, smartvelApiKey: envSmartvelApiKey } = await getEnvConfig();
      setSmartvelApiKey(envSmartvelApiKey);
      // Allow consumers to override apiUrl via prop; otherwise use the environment value.
      const resolvedApiUrl = apiUrl || envApiUrl;
      const [data, cityCatalog] = await Promise.all([
        fetchContentFragments(
          resolvedApiUrl,
          'getContentFragments',
          site,
          queryName,
          variables,
          true,
        ),
        // Combinability catalog, used only to map the destination's city code
        // to its physical airport terminal for the Booking Box prefill.
        // Best-effort and fetched in parallel so it adds no latency; on failure
        // we fall back to the city code (today's behaviour).
        fetchCities({ originCode: '', destinationCode: '' }).catch(() => []),
      ]);
      setDestinationData(data);

      // Resolve the real airport terminal for the destination's city IATA.
      // The CF only stores the metropolitan city code (e.g. Chicago = "CHI"),
      // but the Booking Box searches by physical terminal (e.g. "ORD"). Match
      // by city code and, for multi-airport metros, take the FIRST matching
      // airport — preserving the existing "use the first airport" behaviour.
      // Resolved BEFORE setLoading(false) so the Booking Box (which only reads
      // its defaultDestination once, on mount) starts with the right terminal.
      const destIata = data?.data?.data?.destinationList?.items?.[0]?.iata;
      const cityCode = destIata ? String(destIata).toUpperCase() : '';
      const terminalMatch = cityCode && Array.isArray(cityCatalog)
        ? cityCatalog.find((c) => String(c.iataCityCode || '').toUpperCase() === cityCode)
        : null;
      setResolvedTerminal(
        terminalMatch?.iataTerminal ? String(terminalMatch.iataTerminal).toUpperCase() : null,
      );

      setLoading(false);
    };
    loadDestination();
  }, [slug, language, apiUrl]);

  // Load Smartvel boot script only after data has loaded so that
  // <smartvelcomponent> is already in the DOM when _init() runs.
  const smartvelScriptLoaded = useRef(false);
  useEffect(() => {
    if (loading || smartvelScriptLoaded.current) return undefined;
    smartvelScriptLoaded.current = true;

    const script = document.createElement('script');
    script.src = 'https://cdn.smartvel.com/scripts/boot.min.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [loading]);

  // If data finished loading but there is no valid destination, unblock the loader immediately
  useEffect(() => {
    if (!loading && !destinationData?.data?.data?.destinationList?.items?.[0]) {
      resolveSmartvelOnce();
    }
  }, [loading, destinationData]);

  // DEBUG: Detect when Smartvel component has finished loading its content
  useEffect(() => {
    const smartvelEl = document.querySelector('smartvelcomponent');
    if (!smartvelEl) return undefined;

    const observer = new MutationObserver((mutations) => {
      const hasContent = smartvelEl.shadowRoot
        ? smartvelEl.shadowRoot.children.length > 0
        : smartvelEl.children.length > 0 || smartvelEl.textContent.trim().length > 0;

      if (hasContent) {
        // Signal the page loader that Smartvel is ready
        resolveSmartvelOnce();
        window.dispatchEvent(new CustomEvent('smartvel:loaded'));

        observer.disconnect();
      }
    });

    observer.observe(smartvelEl, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    return () => observer.disconnect();
  }, [loading]);

  const baseClasses = 'destinations-organism';

  if (loading) {
    return html`
      <div class=${`${baseClasses} ${customClassName}`} data-name="destinations" ...${sanitizeSpreadProps(rest)}>
        <div class="p-6 text-center text-gray-500">
          ${i18n['hubDestinations.destination.loading'] || 'Loading...'}
        </div>
      </div>
    `;
  }

  // Get destination info for hero section
  const destination = destinationData?.data?.data?.destinationList?.items?.[0];
  const getLocalizedField = (fieldName) => {
    if (!destination) return null;
    const localizedKey = `${fieldName}_${language}`;
    return destination[localizedKey] || destination[`${fieldName}_es`] || null;
  };

  const cityName = getLocalizedField('cityName') || 'Destination';
  // eslint-disable-next-line dot-notation
  const bannerImageUrl = destination?.heroImage?.['_publishUrl'];

  return html`
    <div class=${`${baseClasses} ${customClassName}`} data-name="destinations" ...${sanitizeSpreadProps(rest)}>
      <!-- Hero Section -->
      <section 
        class="section cms-rich-text-container hero-destinations-detail mb-6 md:mb-8" 
        data-section-status="loaded" 
        data-section-type="hero-destinations-detail" 
        data-rounded-image="false"
      >
        <div class="cms-rich-text-wrapper">
          <div class="cms-rich-text block cms-rich-text-container" data-block-name="cms-rich-text" data-block-status="loaded">
            <div class="cms-rich-text-content">
              <div>
                <div>
                  <h1 id=${cityName.toLowerCase().replace(/\s+/g, '-')}> 
                    <strong>${cityName}</strong>
                  </h1>
                  <p>${destination?.iata ? `(${destination?.iata})` : ''}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        ${bannerImageUrl ? html`
          <div class="default-content-wrapper">
            <p>
              <picture>
                <source 
                  type="image/webp" 
                  srcset="${bannerImageUrl}?width=2000&format=webply&optimize=medium" 
                  media="(min-width: 600px)"
                />
                <source 
                  type="image/webp" 
                  srcset="${bannerImageUrl}?width=750&format=webply&optimize=medium"
                />
                <source 
                  type="image/png" 
                  srcset="${bannerImageUrl}?width=2000&format=png&optimize=medium" 
                  media="(min-width: 600px)"
                />
                <img 
                  loading="eager" 
                  decoding="sync"
                  fetchpriority="high"
                  alt="${cityName} hero banner" 
                  src="${bannerImageUrl}?width=750&format=png&optimize=medium"
                  width="772" 
                  height="254"
                  class="object-cover rounded-[24px] md:h-[254px]"
                />
              </picture>
            </p>
          </div>
        ` : ''}
      </section>

      <!-- BookingBox Section -->
      <section class="booking-box-section mb-8 md:mb-12">
        <div class="max-w-7xl mx-auto">
          <${BookingBox}
            defaultDestination=${destination?.iata
    ? { iataCityCode: destination.iata, name: getLocalizedField('cityName') || '', iataTerminal: resolvedTerminal || destination.iata }
    : null}
            i18n=${i18n}
          />
        </div>
      </section>

      <${InteractiveTabs} destinationData=${destinationData} language=${language} i18n=${i18n} smartvelApiKey=${smartvelApiKey} />
      
      <!-- Smartvel Component -->
      <div class="smartvel-section">
        <div id="smartvel" class="smt-component"></div>
        <smartvelcomponent
          data-apikey=${smartvelApiKey}
          data-lang=${language}
          data-destination=${destination?.iata || ''}
        ></smartvelcomponent>

      </div>
    </div>
  `;
};

export default Destinations;
