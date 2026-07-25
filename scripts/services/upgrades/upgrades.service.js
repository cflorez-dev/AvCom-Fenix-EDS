import { getApimCredentials, clearApimTokenCache } from '../apim/apim-token.service.js';
import { fetchAEMData } from '../../utils/aem-data.js';

// Cliente del flujo Upgrades (AVAEMF2P20-270). El AuthorizationUpgrades
// (token Cognito) viene del backend de AV_TOKEN_ENDPOINT como servicio
// 'upgrades' — el client_secret de Cognito nunca llega al navegador.

export const DEFAULT_MMB_URL = 'https://gestiona.avianca.com/{lang}/manage/upgrade-business-class';
const DEFAULT_CHANNEL = 'MMB';

let configCache = null;

const findEnvKey = (config, key) => config?.data
  ?.find((item) => item?.Key?.trim?.() === key)?.Text?.trim?.();

export const getUpgradesConfig = async () => {
  if (configCache) return configCache;
  const config = await fetchAEMData('environment');
  configCache = {
    channel: findEnvKey(config, 'AV_UPGRADES_CHANNEL') || DEFAULT_CHANNEL,
    mmbUrl: findEnvKey(config, 'AV_UPGRADES_MMB_URL') || DEFAULT_MMB_URL,
  };
  return configCache;
};

export const resetUpgradesConfigCacheForTests = () => {
  configCache = null;
};

// No lanza por status de negocio: el mapeo a ELIGIBLE/NOT_FOUND/etc. lo hace
// mapValidateResult (upgrades-result.js) con { ok, status, body }.
export const validateUpgrade = async ({ pnr }, isRetry = false) => {
  const [digital, upgrades, { channel }] = await Promise.all([
    getApimCredentials('digital'),
    getApimCredentials('upgrades'),
    getUpgradesConfig(),
  ]);

  const res = await fetch(`${digital.apimBaseUrl}/v1/upgrades/validate`, {
    headers: {
      Authorization: digital.token,
      'Ocp-Apim-Subscription-Key': digital.subscriptionKey,
      AuthorizationUpgrades: upgrades.token,
      channel,
      PNR: String(pnr ?? '').toUpperCase(),
    },
  });

  if (res.status === 401 && !isRetry) {
    clearApimTokenCache('digital');
    clearApimTokenCache('upgrades');
    return validateUpgrade({ pnr }, true);
  }

  let body = null;
  try {
    body = await res.json();
  } catch (_) {
    body = null;
  }
  return { ok: res.ok, status: res.status, body };
};
