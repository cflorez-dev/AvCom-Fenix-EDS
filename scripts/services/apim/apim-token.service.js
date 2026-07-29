import { fetchAEMData } from '../../utils/aem-data.js';

const STORAGE_DRIVER = 'localStorage';
const STORAGE_PREFIX = 'avianca_apim_token_';
const REFRESH_MARGIN_MS = 2 * 60 * 1000;
const VALID_SERVICES = ['pricing', 'digital'];
const TOKEN_ENDPOINT_KEY = 'AV_TOKEN_ENDPOINT';

const getStorage = () => (STORAGE_DRIVER === 'sessionStorage'
  ? window.sessionStorage
  : window.localStorage);

const pendingFetch = {};

let tokenEndpointCache = null;

const getTokenEndpoint = async () => {
  if (tokenEndpointCache) return tokenEndpointCache;
  const config = await fetchAEMData('environment');
  const rows = Array.isArray(config?.data) ? config.data : [];
  tokenEndpointCache = rows
    .find((r) => r?.Key?.trim?.() === TOKEN_ENDPOINT_KEY)?.Text?.trim?.() ?? '';
  return tokenEndpointCache;
};

const computeExpiresAt = (data) => {
  try {
    const jwt = String(data.token || '').replace(/^Bearer\s+/, '');
    const parts = jwt.split('.');
    if (parts.length === 3) {
      const payloadB64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(payloadB64));
      if (typeof payload.exp === 'number') return payload.exp * 1000;
    }
  } catch (_) {
    // JWT con shape inesperado o atob falla; caemos al fallback
  }
  return Date.now() + Number(data.expiresIn) * 1000;
};

const readCache = (service) => {
  try {
    const raw = getStorage().getItem(`${STORAGE_PREFIX}${service}`);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (!cached?.expiresAt || cached.expiresAt <= Date.now() + REFRESH_MARGIN_MS) {
      return null;
    }
    return cached;
  } catch (_) {
    return null;
  }
};

const writeCache = (service, credentials) => {
  try {
    getStorage().setItem(`${STORAGE_PREFIX}${service}`, JSON.stringify(credentials));
  } catch (_) {
    // Quota exceeded o storage no disponible — degradar sin cache
  }
};

const fetchAndCache = async (service) => {
  const endpoint = await getTokenEndpoint();
  if (!endpoint) {
    throw new Error('[apim-token] AV_TOKEN_ENDPOINT no configurado en environment.json');
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ service }),
  });
  if (!res.ok) {
    throw new Error(`[apim-token] Token request failed: ${res.status}`);
  }

  const data = await res.json();
  const credentials = {
    token: data.token,
    subscriptionKey: data.subscriptionKey,
    apimBaseUrl: data.apimBaseUrl,
    apiVersion: data.apiVersion,
    expiresAt: computeExpiresAt(data),
  };
  writeCache(service, credentials);
  return credentials;
};

export const getApimCredentials = async (service) => {
  if (!VALID_SERVICES.includes(service)) {
    throw new Error(`[apim-token] Invalid service: ${service}. Valid: ${VALID_SERVICES.join(', ')}`);
  }

  const cached = readCache(service);
  if (cached) return cached;

  if (pendingFetch[service]) return pendingFetch[service];

  pendingFetch[service] = fetchAndCache(service);
  try {
    return await pendingFetch[service];
  } finally {
    delete pendingFetch[service];
  }
};

export const clearApimTokenCache = (service) => {
  const storage = getStorage();
  if (service) {
    storage.removeItem(`${STORAGE_PREFIX}${service}`);
    return;
  }
  Object.keys(storage).forEach((key) => {
    if (key.startsWith(STORAGE_PREFIX)) storage.removeItem(key);
  });
};

export const resetTokenEndpointCache = () => {
  tokenEndpointCache = null;
};
