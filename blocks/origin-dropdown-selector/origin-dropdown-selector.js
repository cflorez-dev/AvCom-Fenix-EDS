import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import { HeadingDropdownSelector } from '../../design-system/molecules/heading-dropdown-selector/heading-dropdown-selector.js';
import { dispatchCityFromOriginDropdownEvent } from '../../scripts/utils/event-constants.js';
import { fetchAEMData } from '../../scripts/utils/aem-data.js';
import { getMainCityForCurrentPos } from '../../scripts/services/header/language-country-selector.js';

const html = htm.bind(h);

let iataCache = null;

/**
 * Gets the country from 'selected-country' cookie
 * @returns {string} Country code ('co', 'ec', etc.), defaults to 'co'
 */
function getCountryFromCookie() {
  try {
    const value = `; ${document.cookie}`;
    const parts = value.split('; selected-country=');
    if (parts.length === 2) {
      const country = parts.pop().split(';').shift();
      return country || 'co';
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error reading selected-country cookie:', error);
  }
  return 'co'; // Default country
}

/**
 * Gets the city name from IATA code
 * @param {string} iataCode - IATA code (e.g., 'MDE', 'CLO')
 * @returns {string} City name or code if not found
 */
function getCityNameFromIata(iataCode) {
  if (!iataCode || !iataCache) return iataCode;

  const cityData = iataCache.find(
    (item) => item.codigo_iata?.toUpperCase() === iataCode.toUpperCase(),
  );

  return cityData?.ciudad || iataCode;
}

/**
 * Loads cities from briefofertas by PosCode
 * @param {string} posCode - Country code (e.g., 'co')
 * @returns {Promise<Array>} Array of cities with {label, value}
 */
async function loadCitiesFromBriefofertas(posCode) {
  try {
    // Load iataCache if it doesn't exist
    if (!iataCache) {
      const iataData = await fetchAEMData('iata');
      iataCache = iataData?.data || [];
    }

    const data = await fetchAEMData('briefofertas');

    if (!data?.data) {
      // eslint-disable-next-line no-console
      console.warn('No data found in briefofertas');
      return [];
    }

    // Filter offers by PosCode
    const ofertas = data.data.filter(
      (oferta) => oferta.PosCode?.toLowerCase() === posCode.toLowerCase(),
    );

    // Extract unique cities from Origin field
    const citiesMap = new Map();
    ofertas.forEach((oferta) => {
      if (oferta.Origin) {
        const iataCode = oferta.Origin.trim().toUpperCase();
        if (!citiesMap.has(iataCode)) {
          // Use getCityNameFromIata to get city name
          const cityName = getCityNameFromIata(iataCode);
          citiesMap.set(iataCode, {
            label: cityName,
            value: iataCode,
          });
        }
      }
    });

    const cities = Array.from(citiesMap.values());

    return cities;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error loading cities from briefofertas:', error);
    return [];
  }
}

export default function decorate(block) {
  // Async function to initialize author preview
  async function initializeAuthorPreview(posCode, label, authoredDefault = '') {
    const cities = await loadCitiesFromBriefofertas(posCode);
    if (cities.length === 0) {
      // eslint-disable-next-line no-console
      console.warn('[origin-dropdown-selector] No cities available for author preview');
      return;
    }

    // Hide original children to preserve data-aue-* for editor (Pattern B)
    Array.from(block.children).forEach((child) => {
      child.style.display = 'none';
    });

    // Priority: authored default (if valid) > POS main city > first city in list
    let mainCityCode = await getMainCityForCurrentPos();
    if (authoredDefault) {
      const authoredMatch = cities.find(
        (city) => city.value.toLowerCase() === authoredDefault.toLowerCase(),
      );
      if (authoredMatch) mainCityCode = authoredDefault;
    }

    let defaultCity = cities[0]; // Fallback to first city
    const foundCity = cities.find(
      (city) => city.value.toLowerCase() === mainCityCode.toLowerCase(),
    );

    if (foundCity) {
      defaultCity = foundCity;
    } else {
      // If not found in list, create object with city name
      const cityName = getCityNameFromIata(mainCityCode);
      defaultCity = {
        label: cityName,
        value: mainCityCode,
      };
    }
    const dropdownOptions = cities.map((city) => city.label);

    // Render INSIDE the block (compatible with editor-support.js re-decoration)
    const previewContainer = document.createElement('div');
    previewContainer.className = 'origin-dropdown-selector-author-preview';
    block.appendChild(previewContainer);

    render(
      html`
        <${HeadingDropdownSelector}
          label=${label}
          value=${defaultCity.label}
          options=${dropdownOptions}
          onChange=${() => {}}
          customClassName="origin-dropdown-selector"
        />
      `,
      previewContainer,
    );
  }

  // Async function to initialize dropdown
  async function initializeDropdown(posCode, label, authoredDefault = '') {
    // Load cities from briefofertas
    const dynamicCities = await loadCitiesFromBriefofertas(posCode);
    // If there are more than 3 offers, use dynamic cities
    // Otherwise, use cities configured in AEM
    const finalCities = dynamicCities;

    if (!finalCities.length) {
      // eslint-disable-next-line no-console
      console.warn('[origin-dropdown-selector] No cities available for dropdown');
      block.classList.add('hidden');
      return;
    }

    // Priority: authored default (if valid) > POS main city > first city in list
    let mainCityCode = await getMainCityForCurrentPos();
    if (authoredDefault) {
      const authoredMatch = finalCities.find(
        (city) => city.value.toLowerCase() === authoredDefault.toLowerCase(),
      );
      if (authoredMatch) mainCityCode = authoredDefault;
    }

    let defaultCity = finalCities[0]; // Fallback to first city
    const foundCity = finalCities.find(
      (city) => city.value.toLowerCase() === mainCityCode.toLowerCase(),
    );

    if (foundCity) {
      defaultCity = foundCity;
    } else {
      // If not found in list, create object with city name
      const cityName = getCityNameFromIata(mainCityCode);
      defaultCity = {
        label: cityName,
        value: mainCityCode,
      };
      // Add city to final list if it doesn't exist
      if (!finalCities.find((c) => c.value.toLowerCase() === mainCityCode.toLowerCase())) {
        finalCities.unshift(defaultCity);
      }
    }

    const dropdownOptions = finalCities.map((city) => city.label);

    // Detect if parent section has center-content class
    const section = block.closest('.section');
    const shouldCenter = section?.classList.contains('center-content');

    const container = document.createElement('div');
    container.className = 'origin-dropdown-selector-container';
    // Apply centered class if section has center-content
    if (shouldCenter) {
      container.classList.add('centered');
    }

    // Configure data before rendering
    let currentCity = defaultCity;
    container.dataset.currentValue = currentCity.value;
    container.dataset.currentLabel = currentCity.label;
    container.dataset.cities = JSON.stringify(finalCities);
    container.dataset.options = JSON.stringify(dropdownOptions);

    // Temporary element for initial Preact render
    const renderTarget = document.createElement('div');

    const handleChange = (selectedLabel) => {
      const selectedCity = finalCities.find((city) => city.label === selectedLabel);
      if (selectedCity) {
        currentCity = selectedCity;
        container.dataset.currentValue = currentCity.value;
        container.dataset.currentLabel = currentCity.label;

        // Dispatch event with new centralized system
        dispatchCityFromOriginDropdownEvent({
          originIataCode: currentCity.value,
          originName: currentCity.label,
        }, container);

        // Re-render component to update visual state
        render(
          html`
            <${HeadingDropdownSelector}
              label=${label}
              value=${currentCity.label}
              options=${dropdownOptions}
              onChange=${handleChange}
              customClassName="origin-dropdown-selector"
            />
          `,
          renderTarget,
        );
      }
    };

    render(
      html`
        <${HeadingDropdownSelector}
          label=${label}
          value=${currentCity.label}
          options=${dropdownOptions}
          onChange=${handleChange}
          customClassName="origin-dropdown-selector"
        />
      `,
      renderTarget,
    );

    container.appendChild(renderTarget.firstChild);
    block.innerHTML = '';
    block.appendChild(container);

    // Show block with smooth transition after rendering
    block.classList.remove('opacity-0');
    block.classList.add('opacity-100');

    // Dispatch initial event on mount
    dispatchCityFromOriginDropdownEvent({
      originIataCode: currentCity.value,
      originName: currentCity.label,
    }, container);
  }

  // Multiple checks for Universal Editor author environment
  const isAuthorEnv = window.xwalk?.isAuthorEnv
    || document.documentElement.hasAttribute('data-aue-resource')
    || window.location.href.includes('author-p')
    || window.location.href.includes('universal-editor');

  // Extract label and defaultValue from block divs
  const divs = Array.from(block.querySelectorAll(':scope > div'));
  let label = '';
  let authoredDefaultCity = '';

  if (divs.length > 0) {
    // First div: label
    const labelDiv = divs[0].querySelector('p');
    label = labelDiv ? (labelDiv.textContent || labelDiv.innerText).trim() : '';
  }
  if (divs.length > 1) {
    // Second div: defaultValue (IATA code, e.g. CLO, MDE, BOG)
    const defaultDiv = divs[1].querySelector('p');
    authoredDefaultCity = defaultDiv ? (defaultDiv.textContent || defaultDiv.innerText).trim().toUpperCase() : '';
  }

  // In author mode, hide DOM and show only preview
  if (isAuthorEnv) {
    // Load cities dynamically even in author mode
    const posCode = getCountryFromCookie();
    initializeAuthorPreview(posCode, label, authoredDefaultCity);
    return;
  }

  // In publish mode, load cities dynamically from briefofertas
  const posCode = getCountryFromCookie();

  // Hide block while loading to prevent layout shift
  block.classList.add('opacity-0', 'min-h-[32.8px]', 'transition-opacity', 'duration-200', 'ease-in-out');

  // Call async function
  initializeDropdown(posCode, label, authoredDefaultCity);
}
