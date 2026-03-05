import { h } from '@dropins/tools/preact.js';
import {
  useEffect,
  useMemo,
  useState,
} from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { HeadingDestinations } from '../../organisms/heading-destinations/heading-destinations.js';
import { CarouselDestinations } from '../../organisms/carousel-destinations/carousel-destinations.js';
import { NoDestinationsFound } from './no-destinations-found.js';

const html = htm.bind(h);

const ALL_AREAS_VALUE = '';

const normalizeText = (value = '') => String(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim();

const replaceTemplateTokens = (template = '', replacements = {}) => {
  let text = String(template || '');

  Object.entries(replacements).forEach(([key, value]) => {
    const serializedValue = String(value ?? '');
    const tokens = [
      `{${key}}`,
      `[${key}]`,
      `{${key.toUpperCase()}}`,
      `[${key.toUpperCase()}]`,
    ];

    if (key === 'count') tokens.push('[XX]');
    if (key === 'origin') tokens.push('[YYYY]');
    if (key === 'country') tokens.push('[Z]');
    if (key === 'query') tokens.push('[QUERY]');

    tokens.forEach((token) => {
      text = text.split(token).join(serializedValue);
    });
  });

  return text;
};

const toOriginCode = (origin, index) => (
  origin.code
  || origin.value
  || origin.id
  || origin.iata
  || `origin-${index}`
);

const toOriginLabel = (origin, fallbackCode) => (
  origin.name
  || origin.label
  || origin.city
  || origin.originName
  || fallbackCode
);

const toRegionName = (region, fallback = '') => (
  region.name
  || region.countryName
  || region.country
  || region.label
  || fallback
);

const toRegionCode = (region, index) => (
  region.id
  || region.code
  || region.countryCode
  || `region-${index}`
);

const toRegionZoneValue = (region, fallbackCode) => (
  region.zoneValue
  || region.zone
  || region.geographicArea
  || region.geographicAreaCode
  || fallbackCode
);

const toRegionZoneLabel = (region, fallbackName) => (
  region.zoneLabel
  || region.zoneName
  || region.geographicAreaName
  || region.geographicAreaLabel
  || fallbackName
);

const toDestinationName = (destination, index) => (
  destination.destinationName
  || destination.cityName
  || destination.name
  || destination.label
  || destination.city
  || destination.iata
  || `destination-${index}`
);

const getOriginRegions = (origin) => {
  if (Array.isArray(origin.regions)) return origin.regions;
  if (Array.isArray(origin.countries)) return origin.countries;
  return [];
};

const getRegionDestinations = (region) => {
  if (Array.isArray(region.destinations)) return region.destinations;
  if (Array.isArray(region.cities)) return region.cities;
  return [];
};

const normalizeCountryDestinations = (countriesDestination = []) => countriesDestination
  .map((country, idx) => ({
    id: country.countryCode || `country-${idx}`,
    name: country.countryName || '',
    countryCode: country.countryCode || '',
    destinations: (country.destinations || [])
      .map((dest, dIdx) => ({
        id: dest.iataCityCode || `${country.countryCode}-${dIdx}`,
        destinationName: dest.destinationName || dest.Name || '',
        countryName: dest.countryName || country.countryName || '',
        imageUrl: dest.imageUrl || dest.image || '',
        imageAlt: dest.imageAlt || dest.destinationName || '',
        href: dest.href || dest.url || '',
        iataCityCode: dest.iataCityCode || dest.iata || '',
        complementaryText: dest.complementaryText || '',
        onClick: dest.onClick,
      }))
      .filter((d) => d.destinationName && d.imageUrl),
  }))
  .filter((c) => c.destinations.length > 0);

const toNormalizedOrigins = (origins = []) => origins
  .map((origin, originIndex) => {
    const code = toOriginCode(origin, originIndex);
    const label = toOriginLabel(origin, code);
    const posibleDestinations = origin.posibleDestinations;
    const rawRegions = getOriginRegions(origin);

    const regions = rawRegions
      .map((region, regionIndex) => {
        const name = toRegionName(region);
        const regionCode = toRegionCode(region, regionIndex);
        const zoneValue = toRegionZoneValue(region, regionCode);
        const zoneLabel = toRegionZoneLabel(region, name);
        const rawDestinations = getRegionDestinations(region);

        const destinations = rawDestinations
          .map((destination, destinationIndex) => {
            const destinationName = toDestinationName(destination, destinationIndex);
            const countryName = destination.countryName || destination.country || name;

            return {
              id: destination.id || destination.code || `${regionCode}-${destinationIndex}`,
              destinationName,
              countryName,
              imageUrl: destination.imageUrl || destination.image || '',
              imageAlt: destination.imageAlt || destination.alt || destinationName,
              href: destination.href || destination.url || '',
              iataCityCode: destination.iataCityCode || destination.iata || '',
              complementaryText: destination.complementaryText || '',
              onClick: destination.onClick,
            };
          })
          .filter((destination) => destination.destinationName && destination.imageUrl);

        return {
          id: regionCode,
          name,
          zoneValue,
          zoneLabel,
          destinations,
          order: region.order ?? regionIndex,
        };
      })
      .filter((region) => region.destinations.length > 0);

    const countriesDestination = normalizeCountryDestinations(origin.countriesDestination);
    const filtersByRegions = origin.filtersByRegions || [];

    return {
      code,
      label,
      posibleDestinations,
      regions,
      countriesDestination,
      filtersByRegions,
    };
  })
  .filter((origin) => origin.countriesDestination.length > 0 || origin.regions.length > 0);

const getInitialOriginCode = (origins, defaultOriginCode) => {
  if (!origins.length) return '';
  if (!defaultOriginCode) return origins[0].code;

  const normalizedDefault = String(defaultOriginCode).toUpperCase();
  const found = origins.find((origin) => String(origin.code).toUpperCase() === normalizedDefault);
  return found ? found.code : origins[0].code;
};

const sortByLabel = (a, b, locale) => a.localeCompare(b, locale, { sensitivity: 'base' });

const getUniqueVisibleDestinationCount = (regions = []) => {
  const uniqueIataCodes = new Set();
  const fallbackDestinations = new Set();

  regions.forEach((region) => {
    region.destinations.forEach((destination) => {
      const normalizedIata = String(destination.iataCityCode || '').trim().toUpperCase();

      if (normalizedIata) {
        uniqueIataCodes.add(normalizedIata);
        return;
      }

      const fallbackKey = String(
        destination.id
        || destination.destinationName
        || '',
      ).trim().toLowerCase();

      if (fallbackKey) {
        fallbackDestinations.add(fallbackKey);
      }
    });
  });

  return uniqueIataCodes.size + fallbackDestinations.size;
};

/**
 * HubDestinations - Destination hub controller with origin selector, search and region filters.
 *
 * ## Props
 * - `origins`: `Array<Object>` – Origins with nested regions and destinations.
 * - `defaultOriginCode`: `string` – Initial origin code.
 * - `i18n`: `Object` – Dictionary with UI labels from i18n service.
 * - `locale`: `string` – Locale for alphabetical sort (default: `es`).
 * - `onOriginChange`: `(origin: Object) => void` – Callback for origin changes.
 * - `onSearchChange`: `(searchTerm: string) => void` – Callback for search changes.
 * - `onGeographicAreaChange`: `(area: string) => void` – Callback for area filter changes.
 * - `customClassName`: `string` – Additional classes.
 */
export const HubDestinations = ({
  origins = [],
  defaultOriginCode = '',
  i18n = {},
  locale = 'es',
  onOriginChange,
  onSearchChange,
  onGeographicAreaChange,
  customClassName = '',
  ...rest
}) => {
  const normalizedOrigins = useMemo(() => toNormalizedOrigins(origins), [origins]);

  const [selectedOriginCode, setSelectedOriginCode] = useState(
    getInitialOriginCode(normalizedOrigins, defaultOriginCode),
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState(ALL_AREAS_VALUE);

  useEffect(() => {
    const nextOriginCode = getInitialOriginCode(normalizedOrigins, defaultOriginCode);
    const currentStillExists = normalizedOrigins
      .some((origin) => origin.code === selectedOriginCode);

    if (!currentStillExists && nextOriginCode) {
      setSelectedOriginCode(nextOriginCode);
    }
  }, [normalizedOrigins, defaultOriginCode, selectedOriginCode]);
  const selectedOrigin = useMemo(
    () => normalizedOrigins.find((origin) => origin.code === selectedOriginCode) || null,
    [normalizedOrigins, selectedOriginCode],
  );

  const originOptions = useMemo(
    () => normalizedOrigins.map((origin) => origin.label),
    [normalizedOrigins],
  );

  const allAreasLabel = i18n['hubDestinations.filters.allGeographicAreas'] || 'Todas las zonas geográficas';

  const geographicAreaOptions = useMemo(() => {
    const filters = selectedOrigin?.filtersByRegions || [];
    return filters.map((filter) => ({
      value: filter.Regions,
      label: `${filter.Regions} (${filter.destinationsCount})`,
    })).sort((a, b) => sortByLabel(a.label, b.label, locale));
  }, [selectedOrigin, locale]);

  useEffect(() => {
    if (!selectedArea) return;

    const selectedAreaExists = geographicAreaOptions
      .some((option) => option.value === selectedArea);

    if (!selectedAreaExists) {
      setSelectedArea(ALL_AREAS_VALUE);
    }
  }, [geographicAreaOptions, selectedArea]);

  const normalizedSearchTerm = normalizeText(searchTerm);
  const hasActiveSearch = normalizedSearchTerm.length > 0;

  const visibleCountries = useMemo(() => {
    if (!selectedOrigin) return [];

    let countries = selectedOrigin.countriesDestination || [];

    // Filtrar por región seleccionada
    if (selectedArea !== ALL_AREAS_VALUE) {
      const regionFilter = (selectedOrigin.filtersByRegions || [])
        .find((f) => f.Regions === selectedArea);
      if (regionFilter) {
        countries = countries.filter((c) => regionFilter.CountryCode.includes(c.countryCode));
      }
    }

    // Filtrar por búsqueda y ordenar destinos
    const processed = countries
      .map((country) => ({
        ...country,
        destinations: country.destinations
          .filter((dest) => {
            if (!hasActiveSearch) return true;
            const searchable = normalizeText(`${dest.destinationName} ${dest.countryName}`);
            return searchable.includes(normalizedSearchTerm);
          })
          .sort((a, b) => sortByLabel(a.destinationName, b.destinationName, locale)),
      }))
      .filter((c) => c.destinations.length > 0);

    if (hasActiveSearch) {
      const sorted = processed.sort((a, b) => {
        if (a.destinations.length !== b.destinations.length) {
          return b.destinations.length - a.destinations.length;
        }
        return sortByLabel(a.name, b.name, locale);
      });
      return sorted;
    }

    return processed;
  }, [
    selectedOrigin,
    selectedArea,
    hasActiveSearch,
    normalizedSearchTerm,
    locale,
  ]);

  const totalDestinationsFromOrigin = useMemo(() => {
    if (!selectedOrigin) return 0;

    const visibleUniqueCount = getUniqueVisibleDestinationCount(visibleCountries);
    const rawPossibleDestinations = Number(selectedOrigin.posibleDestinations);
    const hasPossibleDestinations = Number.isFinite(rawPossibleDestinations) && rawPossibleDestinations >= 0;

    if (!hasActiveSearch && selectedArea === ALL_AREAS_VALUE && hasPossibleDestinations) {
      return rawPossibleDestinations;
    }

    return visibleUniqueCount;
  }, [selectedOrigin, visibleCountries, hasActiveSearch, selectedArea]);

  const headingTemplate = i18n['hubDestinations.heading.template'] || 'Te llevamos a [XX] destinos desde [YYYY]';
  const headingLabel = replaceTemplateTokens(headingTemplate, {
    count: totalDestinationsFromOrigin,
    origin: '',
  }).replace(/\s+/g, ' ').trim();

  const countSingularTemplate = i18n['hubDestinations.count.singular'] || '[XX] ciudad';
  const countPluralTemplate = i18n['hubDestinations.count.plural'] || '[XX] ciudades';
  const regionTitleTemplate = i18n['hubDestinations.region.title'] || 'Destinos en [Z]';

  const getRegionCountLabel = (count) => replaceTemplateTokens(
    count === 1 ? countSingularTemplate : countPluralTemplate,
    { count },
  );

  const getRegionTitle = (countryName) => replaceTemplateTokens(regionTitleTemplate, {
    country: countryName,
  });

  const emptyStateTitle = i18n['hubDestinations.emptyState.title'] || 'No encontramos resultados';
  const emptyStateDescription = replaceTemplateTokens(
    i18n['hubDestinations.emptyState.description'] || 'No encontramos coincidencias para "[QUERY]".',
    { query: searchTerm },
  );

  const handleOriginChange = (label) => {
    const nextOrigin = normalizedOrigins.find((origin) => origin.label === label);
    if (!nextOrigin) return;

    setSelectedOriginCode(nextOrigin.code);
    setSelectedArea(ALL_AREAS_VALUE);

    if (onOriginChange) {
      onOriginChange(nextOrigin);
    }
  };

  const handleSearchChange = (nextSearch) => {
    setSearchTerm(nextSearch);
    if (nextSearch) setSelectedArea(ALL_AREAS_VALUE);

    if (onSearchChange) {
      onSearchChange(nextSearch);
    }
  };

  const handleAreaChange = (nextArea) => {
    const isToggleOff = nextArea === selectedArea;
    const resolvedArea = isToggleOff ? ALL_AREAS_VALUE : nextArea;

    setSelectedArea(resolvedArea);
    if (!isToggleOff && nextArea) setSearchTerm('');

    if (onGeographicAreaChange) {
      onGeographicAreaChange(resolvedArea);
    }
  };

  const searchPlaceholder = i18n['hubDestinations.search.placeholder'] || 'Busca ciudades, países y otros destinos';

  if (!selectedOrigin) {
    return html`
      <div
        data-name="hubDestinations"
        class="w-full ${customClassName}"
        ...${rest}
      >
        <p class="text-sm text-text-normal-secondary m-0">
          ${i18n['hubDestinations.emptyData'] || 'No hay datos de destinos disponibles.'}
        </p>
      </div>
    `;
  }

  return html`
    <section
      data-name="hubDestinations"
      class="w-full flex flex-col gap-10 overflow-x-hidden ${customClassName}"
      ...${rest}
    >
      <${HeadingDestinations}
        headingText=${headingLabel}
        selectedOriginLabel=${selectedOrigin.label}
        originOptions=${originOptions}
        onOriginChange=${handleOriginChange}
        searchTerm=${searchTerm}
        searchPlaceholder=${searchPlaceholder}
        onSearchChange=${handleSearchChange}
        geographicAreaOptions=${geographicAreaOptions}
        selectedGeographicArea=${selectedArea}
        onGeographicAreaChange=${handleAreaChange}
        geographicAreaPlaceholder=${allAreasLabel}
      />

      ${visibleCountries.length > 0 ? html`
        <div class="w-full flex flex-col gap-10">
          ${visibleCountries.map((country, index) => html`
            <${CarouselDestinations}
              key=${`${country.id}-${index}`}
              title=${getRegionTitle(country.name)}
              totalCount=${getRegionCountLabel(country.destinations.length)}
              destinations=${country.destinations}
              loop=${false}
              itemsPerView=${5}
            />
          `)}
        </div>
      ` : html`
        <${NoDestinationsFound}
          title=${emptyStateTitle}
          description=${emptyStateDescription}
        />
      `}
    </section>
  `;
};

export default HubDestinations;
