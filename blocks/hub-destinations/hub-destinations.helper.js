import {
  fetchDestinationsByOrigin,
  fetchRegions,
  fetchDestinationsByRegions,
  fetchAllDestinationsGraphQL,
  getCitiesByPos
} from '../../scripts/services/hub-destination/hub-destination.service.js';
import { getMainCityForCurrentPos } from '../../scripts/services/header/language-country-selector.js';

/**
 * Hub Destinations Helper
 *
 * Responsable de mapear y transformar datos de destinos desde el servicio
 * a la estructura esperada por el componente HubDestinations.
 */

const DEFAULT_COUNTRY = 'co';
const DEFAULT_LANGUAGE = 'es';
const DEFAULT_DESTINATION_IMAGE = '/assets/samples/Oferta-San-Andres.png';
const DESTINATION_IATA_COOKIE = 'destination-detail-iata';
const DESTINATION_IATA_COOKIE_DAYS = 30;

let iataCache = null;

function safeLocale(locale) {
  if (!locale || typeof locale !== 'string') return DEFAULT_LANGUAGE;
  return locale.toLowerCase().trim();
}

function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function toSlug(value = '') {
  return String(value)
    .toLowerCase()
    .trim()
    // Caracteres específicos de francés
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/ç/g, 'c')
    // Caracteres específicos de portugués
    .replace(/ã/g, 'a')
    .replace(/õ/g, 'o')
    .replace(/ñ/g, 'n')
    // Normalizar y remover acentos
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Remover caracteres especiales (mantener letras, números, espacios y guiones)
    .replace(/[^a-z0-9\s-]/g, '')
    // Reemplazar espacios múltiples por uno solo
    .replace(/\s+/g, '-')
    // Reemplazar guiones múltiples por uno solo
    .replace(/-+/g, '-')
    // Remover guiones al inicio y final
    .replace(/^-+|-+$/g, '');
}

function getCityNameFromIata(iataCode) {
  if (!iataCode || !iataCache) return iataCode;

  const cityData = iataCache.find(
    (item) => item.codigo_iata?.toUpperCase() === iataCode.toUpperCase(),
  );

  return cityData?.ciudad || iataCode;
}

function getLanguageFromCookie() {
  try {
    const cookies = document.cookie.split(';');
    const languageCookie = cookies.find((cookie) => cookie.trim().startsWith('selected-language='));
    if (languageCookie) {
      return safeLocale(decodeURIComponent(languageCookie.split('=')[1]));
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[hub-destinations.helper] Error reading language cookie:', error);
  }
  return DEFAULT_LANGUAGE;
}

function getCountryFromCookie() {
  try {
    const cookies = document.cookie.split(';');
    const countryCookie = cookies.find((cookie) => cookie.trim().startsWith('selected-country='));
    if (countryCookie) {
      return countryCookie.split('=')[1].trim().toLowerCase();
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[hub-destinations.helper] Error reading country cookie:', error);
  }
  return DEFAULT_COUNTRY;
}

function setCookie(name, value, days, path = '/') {
  if (!name) return;
  const encodedValue = encodeURIComponent(value || '');
  let cookie = `${name}=${encodedValue}`;

  if (typeof days === 'number') {
    const expiresDate = new Date();
    expiresDate.setTime(expiresDate.getTime() + (days * 24 * 60 * 60 * 1000));
    cookie += `; expires=${expiresDate.toUTCString()}`;
  }

  cookie += `; path=${path}`;
  document.cookie = cookie;
}

function getMappedDestination(destinations, language, zoneLabel, i18n, allCitiesData) {
  const seenNames = new Set();
  const destinationsMapped = destinations.reduce((acc, dest) => {
    const preSlug = i18n['hubDestinations.urlPreSlug'] ?? 'destinos/que-hacer-en';
    const cityData = allCitiesData.find((city) => city.iata === dest.IataCityCode);
    const destinationName = cityData && cityData[`cityName_${language}`] ? cityData[`cityName_${language}`] : dest.Name;
    const nameKey = normalizeText(destinationName || '');

    if (!nameKey || seenNames.has(nameKey)) return acc;
    seenNames.add(nameKey);

    const imageUrl = cityData?.cardImage?._publishUrl || DEFAULT_DESTINATION_IMAGE;
    const iataCityCode = dest.IataCityCode?.trim().toUpperCase() || '';

    acc.push({
      destinationName: destinationName || '',
      countryName: zoneLabel,
      imageUrl,
      iataCityCode,
      href: `/${language}/${preSlug}-${toSlug(destinationName || '')}`,
      onClick: () => {
        setCookie(DESTINATION_IATA_COOKIE, iataCityCode, DESTINATION_IATA_COOKIE_DAYS);
        window.location.href = `/${language}/${preSlug}-${toSlug(destinationName || '')}`;
      },
    });
    return acc;
  }, []);
  return destinationsMapped;
}

function mergeCitiesByLabel(citiesData) {
  const seen = new Map();
  for (const city of citiesData) {
    const key = normalizeText(city.label);
    if (!seen.has(key)) {
      seen.set(key, {
        ...city,
        allCodes: [city.value],
        allCityCodes: city.cityCode ? [city.cityCode] : [],
      });
    } else {
      const existing = seen.get(key);
      existing.allCodes.push(city.value);
      if (city.cityCode && !existing.allCityCodes.includes(city.cityCode)) {
        existing.allCityCodes.push(city.cityCode);
      }
    }
  }
  return Array.from(seen.values());
}

function resolveDefaultOriginCode(mergedCities, mainCityCode) {
  if (!mainCityCode) return null;
  const byAirport = mergedCities.find((city) => city.allCodes.includes(mainCityCode.toUpperCase()));
  if (byAirport) return byAirport.value;
  const byCity = mergedCities.find((city) => city.allCityCodes.includes(mainCityCode.toUpperCase()));
  if (byCity) return byCity.value;
  return null;
}

function getRegionsForCity(city, language, originData, destinationsByRegionsData, regionsData, i18n, allCitiesData) {
  const posibleDestinations = originData.filter((origin) => city.allCodes.includes(origin.Origin));
  const destinationCodes = new Set(
    posibleDestinations
      .map((item) => item.Destination?.trim().toUpperCase())
      .filter(Boolean),
  );
  // Fallback: si destinationbyregions no trae IataCityCode, mapeamos por nombre de ciudad
  const destinationNames = new Set(
    Array.from(destinationCodes)
      .map((code) => normalizeText(getCityNameFromIata(code)))
      .filter(Boolean),
  );
  const seenRawRegions = new Set();
  const rawRegions = destinationsByRegionsData.filter((item) => {
    const matches = destinationCodes.has(item.IataCityCode?.trim().toUpperCase())
      || destinationNames.has(normalizeText(item.Name));
    if (!matches) return false;
    const dedupeKey = `${item.IataCityCode?.trim().toUpperCase()}-${item.Regions}`;
    if (seenRawRegions.has(dedupeKey)) return false;
    seenRawRegions.add(dedupeKey);
    return true;
  });

  const mappedRegions = regionsData.map((regionItem) => {
    const destinationsByregion = rawRegions.filter((dest) => dest.Regions === regionItem.Region);
    const dynamicLabel = regionItem[`Region_${language.toUpperCase()}`];
    const zoneLabel = dynamicLabel?.trim()
      || regionItem.Region_ES?.trim()
      || regionItem.Region?.trim()
      || 'Otros destinos';
    const destinations = getMappedDestination(destinationsByregion, language, zoneLabel, i18n, allCitiesData);
    return {
      id: regionItem.Region || zoneLabel,
      name: zoneLabel,
      zoneValue: regionItem.Region,
      zoneLabel,
      destinations,
    };
  }).filter((region) => region.destinations.length > 0);
  return mappedRegions;
}

export const mapHubDestinationsData = async (i18n) => {
  try {
    const country = getCountryFromCookie();
    const language = getLanguageFromCookie();

    const destinationData = [];

    const [
      originData,
      regionsData,
      destinationsByRegionsData,
      mainCityCode,
      allCitiesData,
      citiesByPosData
    ] = await Promise.all([
      fetchDestinationsByOrigin(),
      fetchRegions(),
      fetchDestinationsByRegions(),
      getMainCityForCurrentPos(),
      fetchAllDestinationsGraphQL(),
      getCitiesByPos(country)
    ]);
    if (!citiesByPosData || citiesByPosData.length === 0) return { origins: [], defaultOriginCode: '' };
    if (!originData || originData.length === 0) return { origins: [], defaultOriginCode: '' };
    if (!regionsData || regionsData.length === 0) return { origins: [], defaultOriginCode: '' };
    if (!destinationsByRegionsData || destinationsByRegionsData.length === 0) return { origins: [], defaultOriginCode: '' };
    const citiesData = citiesByPosData.map((city) => ({
      label: city[`ciudad_${language}`] || city.ciudad,
      value: city.codigo_iata,
      cityCode: city.codigo_iata_ciudad || null,
    }));

    const mergedCities = mergeCitiesByLabel(citiesData);

    mergedCities.forEach((city) => {
      const mappedRegions = getRegionsForCity(
        city,
        language,
        originData,
        destinationsByRegionsData,
        regionsData,
        i18n,
        allCitiesData
      );

      destinationData.push({
        code: city.value,
        label: city.label,
        posibleDestinations: new Set(
          originData
            .filter((origin) => city.allCodes.includes(origin.Origin))
            .map((origin) => origin.Destination?.trim().toUpperCase())
            .filter(Boolean),
        ).size,
        regions: mappedRegions,
      });
    });


    const defaultOriginCode = resolveDefaultOriginCode(mergedCities, mainCityCode) || destinationData[0]?.code || '';
    const sortedOrigins = defaultOriginCode
      ? [
        ...destinationData.filter((d) => d.code === defaultOriginCode),
        ...destinationData.filter((d) => d.code !== defaultOriginCode),
      ]
      : destinationData;

    return {
      origins: sortedOrigins,
      defaultOriginCode,
      mainCityCode,
    };
  } catch (error) {
    console.error('[hub-destinations.helper] Error:', error);
    return { origins: [], defaultOriginCode: '' };
  }
};


export default mapHubDestinationsData;
