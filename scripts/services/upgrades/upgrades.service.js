import { getApimCredentials, clearApimTokenCache } from '../apim/apim-token.service.js';
import { fetchAEMData } from '../../utils/aem-data.js';

// Cliente del flujo Upgrades (AVAEMF2P20-270). El AuthorizationUpgrades
// (token Cognito) viene del backend de AV_TOKEN_ENDPOINT como servicio
// 'upgrades' — el client_secret de Cognito nunca llega al navegador.

export const DEFAULT_MMB_URL = 'https://gestiona.avianca.com/{lang}/manage/upgrade-business-class';
const DEFAULT_CHANNEL = 'MMB';

/**
 * Idiomas del producto que el sitio de MMB no tiene publicados, y a cuál se
 * redirige en su lugar (VSTS 1301186). Hoy solo el francés: `/fr/` no existe en
 * gestiona.avianca.com, así que un usuario con la cookie en `fr` aterrizaba en
 * una URL inexistente.
 *
 * Es el default de código; el negocio lo sobreescribe sin deploy con la key
 * AV_UPGRADES_MMB_LANG_MAP (ver parseLangMap), por si mañana habilitan el sitio
 * en francés o cambian el destino.
 */
export const DEFAULT_MMB_LANG_MAP = { fr: 'en' };

let configCache = null;

const findEnvKey = (config, key) => config?.data
  ?.find((item) => item?.Key?.trim?.() === key)?.Text?.trim?.();

/**
 * Parsea el valor autorado de AV_UPGRADES_MMB_LANG_MAP: pares `origen:destino`
 * separados por coma o punto y coma, p. ej. `fr:en` o `fr:en,it:en`. Se normaliza
 * a minúsculas y se ignoran los espacios.
 *
 * Las entradas malformadas (sin `:`, con lado vacío o con `:` de más) se
 * descartan una por una, sin tumbar a las válidas: es una hoja que edita un
 * autor, no un archivo de configuración, así que un typo en un renglón no debe
 * dejar sin mapeo a los demás.
 *
 * @param {string} [text] - Valor crudo de la hoja
 * @returns {Object<string, string>} Mapa origen → destino ({} si no hay pares válidos)
 */
export const parseLangMap = (text) => String(text ?? '')
  .split(/[,;]/)
  .map((pair) => pair.split(':').map((part) => part.trim().toLowerCase()))
  .filter((parts) => parts.length === 2 && parts[0] && parts[1])
  .reduce((map, [from, to]) => ({ ...map, [from]: to }), {});

/**
 * Prefijo de las keys que le dan a un idioma su propia URL de MMB, p. ej.
 * `AV_UPGRADES_MMB_URL_FR`. Es para el caso en que el destino de ese idioma no se
 * pueda armar desde la URL compartida cambiando el segmento de idioma: otro host
 * u otra ruta. El guion bajo final es lo que evita que la propia
 * `AV_UPGRADES_MMB_URL` se lea como override.
 */
const MMB_URL_OVERRIDE_PREFIX = 'AV_UPGRADES_MMB_URL_';

/**
 * Recoge todas las keys `AV_UPGRADES_MMB_URL_<IDIOMA>` de la hoja y las indexa por
 * idioma en minúsculas. Se hace por prefijo, y no key por key, para que agregar un
 * idioma sea autorar una fila y no un deploy.
 *
 * @param {Object} config - Respuesta de fetchAEMData('environment')
 * @returns {Object<string, string>} idioma → URL ({} si no hay ninguna)
 */
export const collectMmbUrlOverrides = (config) => (config?.data || [])
  .reduce((acc, item) => {
    const key = item?.Key?.trim?.() || '';
    const url = item?.Text?.trim?.() || '';
    if (!url || !key.toUpperCase().startsWith(MMB_URL_OVERRIDE_PREFIX)) return acc;
    const lang = key.slice(MMB_URL_OVERRIDE_PREFIX.length).toLowerCase();
    return lang ? { ...acc, [lang]: url } : acc;
  }, {});

export const getUpgradesConfig = async () => {
  if (configCache) return configCache;
  const config = await fetchAEMData('environment');
  const langMap = parseLangMap(findEnvKey(config, 'AV_UPGRADES_MMB_LANG_MAP'));
  configCache = {
    channel: findEnvKey(config, 'AV_UPGRADES_CHANNEL') || DEFAULT_CHANNEL,
    mmbUrl: findEnvKey(config, 'AV_UPGRADES_MMB_URL') || DEFAULT_MMB_URL,
    // La key autorada REEMPLAZA el default, no se mezcla con él: lo que está en
    // la hoja es lo que aplica. Así el negocio también puede apagar el mapeo
    // (autorando `fr:fr`) sin tener que tocar código.
    langMap: Object.keys(langMap).length ? langMap : DEFAULT_MMB_LANG_MAP,
    urlByLang: collectMmbUrlOverrides(config),
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
