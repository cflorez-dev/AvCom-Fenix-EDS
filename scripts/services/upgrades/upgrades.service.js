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

// El endpoint devuelve 503/500 de forma intermitente (típicamente en la primera
// llamada de una ráfaga). Sin retry eso pinta el pop-up de error técnico sobre una
// reserva válida, así que se reintenta una vez con un backoff corto.
export const RETRY_5XX_DELAY_MS = 400;
const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

/**
 * Límite de tiempo POR INTENTO. Sin él, un backend que no responde deja el
 * FullPageLoader a pantalla completa indefinidamente: no tiene botón de cierre, ni
 * Escape, ni clic fuera, así que la única salida del usuario era recargar la página.
 *
 * Al vencer se lanza, y la excepción cae en el `try/catch` de handleSubmit, que ya
 * pinta el modal de error técnico y apaga el loader (CA-05).
 *
 * Es por intento y NO consume reintento: reintentar un cuelgue duplicaría la espera,
 * que es justo lo que se quiere acotar. Peor caso visible = un 5xx rápido + backoff +
 * un intento colgado = VALIDATE_TIMEOUT_MS + RETRY_5XX_DELAY_MS.
 */
export const VALIDATE_TIMEOUT_MS = 12000;

/**
 * Corre `run(signal)` con fecha límite. Aborta la petición en curso para no dejar el
 * socket colgado, y además compite contra un temporizador: el `signal` por sí solo no
 * cubre los cuelgues ANTERIORES al fetch (servicio de token, config de environment),
 * donde no habría nada que abortar.
 *
 * @param {(signal: AbortSignal) => Promise<any>} run
 * @param {number} ms
 * @returns {Promise<any>}
 */
const withTimeout = (run, ms) => {
  const controller = new AbortController();
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error(`[upgrades] /validate excedió el tiempo límite de ${ms}ms`));
    }, ms);
  });
  const attempt = run(controller.signal);
  // El aborto hace que `attempt` rechace después de que la fecha límite ya ganó la
  // carrera; sin este catch quedaría como unhandled rejection.
  attempt.catch(() => {});
  return Promise.race([attempt, deadline]).finally(() => clearTimeout(timer));
};

// No lanza por status de negocio: el mapeo a ELIGIBLE/NOT_FOUND/etc. lo hace
// mapValidateResult (upgrades-result.js) con { ok, status, body }.
// `retries` lleva los dos reintentos por separado: el de auth (401, que además
// invalida los tokens) y el de servidor (5xx, donde el token sigue siendo bueno).
export const validateUpgrade = async ({ pnr }, retries = { auth: 0, server: 0 }) => {
  const res = await withTimeout(async (signal) => {
    const [digital, upgrades, { channel }] = await Promise.all([
      getApimCredentials('digital'),
      getApimCredentials('upgrades'),
      getUpgradesConfig(),
    ]);

    return fetch(`${digital.apimBaseUrl}/v1/upgrades/validate`, {
      headers: {
        Authorization: digital.token,
        'Ocp-Apim-Subscription-Key': digital.subscriptionKey,
        AuthorizationUpgrades: upgrades.token,
        channel,
        PNR: String(pnr ?? '').toUpperCase(),
      },
      signal,
    });
  }, VALIDATE_TIMEOUT_MS);

  if (res.status === 401 && retries.auth < 1) {
    clearApimTokenCache('digital');
    clearApimTokenCache('upgrades');
    return validateUpgrade({ pnr }, { ...retries, auth: retries.auth + 1 });
  }

  if (res.status >= 500 && retries.server < 1) {
    await sleep(RETRY_5XX_DELAY_MS);
    return validateUpgrade({ pnr }, { ...retries, server: retries.server + 1 });
  }

  let body = null;
  try {
    body = await res.json();
  } catch (_) {
    body = null;
  }
  return { ok: res.ok, status: res.status, body };
};
