import { h } from '@dropins/tools/preact.js';
import { useState, useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { resolveLocale } from '../../../scripts/utils/locale.js';

const html = htm.bind(h);

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
const InteractiveTabs = ({ destinationData, language = 'es' }) => {
  const [activeTab, setActiveTab] = useState(0);

  if (!destinationData) {
    return html`
      <div class="p-8 text-center text-gray-500">
        Loading destination data...
      </div>
    `;
  }

  const destination = destinationData.data?.data?.destinationList?.items?.[0];

  if (!destination) {
    return html`
      <div class="p-8 text-center text-gray-500">
        No destination data available
      </div>
    `;
  }

  // Helper function to get localized field
  const getLocalizedField = (fieldName) => {
    const localizedKey = `${fieldName}_${language}`;
    return destination[localizedKey] || destination[`${fieldName}_es`] || null;
  };

  // Localized tab labels
  const tabLabels = {
    discover: {
      es: 'Descubre',
      en: 'Discover',
      pt: 'Descubra',
    },
    airport: {
      es: 'Aeropuerto y Transporte',
      en: 'Airport and Transport',
      pt: 'Aeroporto e Transporte',
    },
    requirements: {
      es: 'Requisitos de entrada',
      en: 'Entry Requirements',
      pt: 'Requisitos de entrada',
    },
  };

  const getTabLabel = (key) => tabLabels[key][language] || tabLabels[key].es;

  const tabs = [
    {
      label: getTabLabel('discover'),
      content: html`
        <div class="p-4 md:p-8">
          <div class="flex flex-col md:flex-row gap-[28px] items-start">
            <!-- Imagen izquierda: 240px x 240px (desktop), 100% (mobile) -->
            <div class="w-full md:w-auto md:flex-shrink-0">
              ${(() => {
    // eslint-disable-next-line dot-notation
    const heroImageUrl = destination.heroImage?.['_publishUrl'];
    return heroImageUrl ? html`
                  <img
                    src=${heroImageUrl}
                    alt=${destination.cityName_en}
                    class="w-full md:w-[240px] h-[240px] object-cover rounded-lg"
                  />
                ` : html`
                  <div class="w-full md:w-[240px] h-[240px] bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                    No image
                  </div>
                `;
  })()}
            </div>
            
            <!-- Contenido derecha: Título, descripción, moneda e idioma (100% mobile) -->
            <div class="w-full md:flex-1 flex flex-col gap-4">
              <h3 class="text-2xl font-bold text-[var(--text-normal-primary)]">
                ${getLocalizedField('cityName') || 'City'}
              </h3>
              
              <div 
                class="text-[16px] text-[var(--color-text-normal-primary)] prose max-w-none [&_hr]:my-4 [&_.dynamic-information-list]:flex [&_.dynamic-information-list]:flex-wrap [&_.dynamic-information-list]:gap-4 [&_.dynamic-information_item]:flex-[0_0_100%] md:[&_.dynamic-information_item]:flex-[0_0_calc(25%-12px)] [&_.dynamic-information_item]:min-w-0 [&_p]:text-[16px] [&_li_strong]:text-[16px] md:[&_li_strong]:text-[18px]"
                dangerouslySetInnerHTML=${{ __html: getLocalizedField('intro')?.html || getLocalizedField('intro')?.plaintext || '' }}
              />
            </div>
          </div>
        </div>
      `,
    },
    {
      label: getTabLabel('airport'),
      content: html`
        <div class="p-4 md:p-8">
          <div class="flex flex-col md:flex-row gap-[28px] items-start">
            <!-- Imagen izquierda: 240px x 240px (desktop), 100% (mobile) -->
            <div class="w-full md:w-auto md:flex-shrink-0">
              ${(() => {
    // eslint-disable-next-line dot-notation
    const airportImageUrl = destination.airportImage?.['_publishUrl'];
    return airportImageUrl ? html`
                  <img
                    src=${airportImageUrl}
                    alt=${getLocalizedField('airportName')}
                    class="w-full md:w-[240px] h-[240px] object-cover rounded-lg"
                  />
                ` : html`
                  <div class="w-full md:w-[240px] h-[240px] bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                    No image
                  </div>
                `;
  })()}
            </div>
            
            <!-- Contenido derecha: Título y descripción (100% mobile) -->
            <div class="w-full md:flex-1 flex flex-col gap-4">
              <h3 class="text-2xl font-bold text-[var(--text-normal-primary)]">
                ${getLocalizedField('airportName') || 'Airport'}
              </h3>
              
              <div 
                class="airport text-[16px] text-[var(--color-text-normal-primary)] prose max-w-none [&_hr]:my-4 [&_.dynamic-information-list]:flex [&_.dynamic-information-list]:flex-wrap [&_.dynamic-information-list]:gap-4 [&_.dynamic-information_item]:flex-[0_0_100%] md:[&_.dynamic-information_item]:flex-[0_0_calc(25%-12px)] [&_.dynamic-information_item]:min-w-0 [&_p]:text-[16px] [&_li_strong]:text-[16px] md:[&_li_strong]:text-[18px]"
                dangerouslySetInnerHTML=${{ __html: getLocalizedField('airportAndTransport')?.html || getLocalizedField('airportAndTransport')?.plaintext || 'No transport information available' }}
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
          <h3 class="text-2xl font-bold mb-4">${getTabLabel('requirements')}</h3>
          <div id="smartvel-widget-container" class="my-6">
            <smt-gcovwidget 
              apikey="b149658a-d07a-45ba-a2df-815bfbdb7631" 
              lang=${language}
            ></smt-gcovwidget>
          </div>
        </div>
      `,
    },
  ];

  // Load Smartvel widget script when tab 3 is active
  useEffect(() => {
    if (activeTab === 2) {
      const script = document.createElement('script');
      script.src = 'https://cdn.smartvel.com/scripts/gcovwidget/boot.min.js';
      script.async = true;
      document.body.appendChild(script);

      return () => {
        // Cleanup script on unmount
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    }
    return undefined;
  }, [activeTab]);

  return html`
    <div class="shadow-[0px_0px_6px_0px_rgba(90,90,90,0.20)] rounded-lg overflow-hidden">
      <!-- Tabs Navigation -->
      <div class="flex gap-0 bg-white overflow-x-auto px-4 md:px-8">
        ${tabs.map((tab, index) => {
    const isActive = activeTab === index;
    return html`
      <button
        key=${index}
        class="flex flex-col w-auto md:flex-1 md:basis-[33.333%] py-[28px] px-[var(--x-x-large,32px)] gap-[var(--tiny,4px)] items-center justify-center shrink-0 relative isolate transition-all duration-200 hover:bg-gray-50 md:min-w-0"
        role="tab"
        aria-selected=${isActive}
        onClick=${() => setActiveTab(index)}
      >
        <div class="flex gap-[4px] items-center justify-center relative w-full z-[4]">
          <span class=${`text-[16px] leading-[20px] md:text-[18px] md:leading-[24px] overflow-hidden text-ellipsis ${
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
      <div class="bg-gray-50">
        ${tabs[activeTab].content}
      </div>
    </div>
  `;
};

/**
 * Destinations - Main organism component
 * @param {Object} props - Component props
 * @param {string} props.iata - IATA code for the destination
 * @param {string} props.apiUrl - API URL for fetching data
 * @param {string} props.customClassName - Additional CSS classes
 */
export const Destinations = ({
  iata = 'AXM',
  apiUrl = 'https://73963-aemintegrations-development.adobeioruntime.net/api/v1/web/avianca-appbuilder/avianca',
  customClassName = '',
  ...rest
}) => {
  const [destinationData, setDestinationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('es');

  // Detect current language on mount
  useEffect(() => {
    const detectLanguage = async () => {
      try {
        const locale = await resolveLocale();
        setLanguage(locale.language || 'es');
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('[Destinations] Failed to detect language, using default: es', error);
        setLanguage('es');
      }
    };
    
    detectLanguage();
  }, []);

  useEffect(() => {
    const loadDestination = async () => {
      setLoading(true);
      const data = await fetchContentFragments(
        apiUrl,
        'getContentFragments',
        'Avianca-home-site',
        'destinationByIata',
        { iata },
        true,
      );
      setDestinationData(data);
      setLoading(false);
    };

    loadDestination();
  }, [iata, apiUrl]);

  // Load Smartvel boot script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.smartvel.com/scripts/boot.min.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const baseClasses = 'destinations-organism';

  if (loading) {
    return html`
      <div class=${`${baseClasses} ${customClassName}`} data-name="destinations" ...${rest}>
        <div class="p-6 text-center text-gray-500">
          Loading destination information...
        </div>
      </div>
    `;
  }

  return html`
    <div class=${`${baseClasses} ${customClassName}`} data-name="destinations" ...${rest}>
      <${InteractiveTabs} destinationData=${destinationData} language=${language} />
      
      <!-- Smartvel Component -->
      <div class="smartvel-section">
        <div id="smartvel" class="smt-component"></div>
        <smartvelcomponent
          data-apikey="b149658a-d07a-45ba-a2df-815bfbdb7631"
          data-lang=${language}
          data-destination=${iata}
        ></smartvelcomponent>
        <script src="https://cdn.smartvel.com/scripts/boot.min.js"></script>
      </div>
    </div>
  `;
};

export default Destinations;
