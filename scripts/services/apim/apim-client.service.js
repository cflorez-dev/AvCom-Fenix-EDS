import { getApimCredentials, clearApimTokenCache } from './apim-token.service.js';

const apimFetch = async (service, path, options = {}, isRetry = false) => {
  const creds = await getApimCredentials(service);
  const {
    method = 'POST',
    body,
    queryParams,
    headers: extraHeaders = {},
  } = options;

  let url = `${creds.apimBaseUrl}${path}`;
  if (queryParams) {
    url += `?${new URLSearchParams(queryParams).toString()}`;
  }

  const fetchOptions = {
    method,
    headers: {
      Authorization: creds.token,
      'Ocp-Apim-Subscription-Key': creds.subscriptionKey,
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
  };
  if (body !== undefined && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body);
  }

  const res = await fetch(url, fetchOptions);

  if (res.status === 401 && !isRetry) {
    clearApimTokenCache(service);
    return apimFetch(service, path, options, true);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`[apim-client] ${res.status} ${res.statusText}: ${text}`);
  }
  return res.json();
};

const buildPricingPath = (creds, endpoint) => {
  const version = creds.apiVersion || 'v1';
  return `/${version}/rt/${endpoint}`;
};

export const consultaCombinabilidad = ({
  idioma = 'es',
  codigoIataOrigen = '',
  codigoIataDestino = '',
} = {}) => apimFetch('digital', '/consultacombinabilidad', {
  method: 'POST',
  body: { idioma, codigoIataOrigen, codigoIataDestino },
});

export const parametroCabinas = ({
  idioma = 'es',
} = {}) => apimFetch('digital', `/v1/parametroCabinas/${idioma}`, {
  method: 'GET',
});

export const getCheapestPrices = async ({
  tripType,
  originCityCode,
  destinationCityCode,
  pos,
  month,
  year,
} = {}) => {
  const creds = await getApimCredentials('pricing');
  return apimFetch('pricing', buildPricingPath(creds, 'cheapestPrices'), {
    method: 'GET',
    queryParams: {
      tripType,
      OriginCityCode: originCityCode,
      DestinationCityCode: destinationCityCode,
      POS: pos,
      month,
      year,
    },
  });
};

export const getCheapestPricesOutbound = async ({
  tripType,
  originCityCode,
  destinationCityCode,
  pos,
  month,
  year,
  outboundDate,
} = {}) => {
  const creds = await getApimCredentials('pricing');
  // APIM solo expone /rt/cheapestPrices; OutboundDate determina ida vs vuelta.
  return apimFetch('pricing', buildPricingPath(creds, 'cheapestPrices'), {
    method: 'GET',
    queryParams: {
      tripType,
      OriginCityCode: originCityCode,
      DestinationCityCode: destinationCityCode,
      POS: pos,
      month,
      year,
      OutboundDate: outboundDate,
    },
  });
};
