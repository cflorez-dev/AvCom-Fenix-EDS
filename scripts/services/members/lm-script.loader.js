import { loadScript } from '../../aem.js';
import { fetchAEMData } from '../../utils/aem-data.js';
import { loadMembersConfig } from './members-config.js';
import { isMembersEnabled } from './members-flag.js';

// URL base del script de login de Lifemiles. PROD por default; se puede override
// desde `environment.json` con la key `AV_LM_SCRIPT_URL` (mismo patrón que
// `AV_MEMBERS_CF_URL` en members-cf.service.js), sin hardcodear el host ni tocar
// código. Sirve para apuntar a la URL de PRUEBAS de LM
// (`https://log-in-nprod.lifemiles.net/qa/lm-login.umd.js`) que ya trae los
// wrappers de v1.1.0 (`lmLastThreeTransactions`/`lmTransactionByMonth`) aún no
// deployados en prod. NO incluye el `?env=` (se arma abajo por entorno).
const PROD_LM_SCRIPT_URL = 'https://log-in.lifemiles.com/lm-login.umd.js';

/**
 * Resuelve la URL base del script LM desde environment.json (key `AV_LM_SCRIPT_URL`),
 * con fallback a la constante de prod. Fail-soft: cualquier error → prod.
 * @returns {Promise<string>}
 */
const resolveLmScriptUrl = async () => {
  try {
    const envData = await fetchAEMData('environment');
    const rows = Array.isArray(envData?.data) ? envData.data : [];
    return rows.find((r) => r.Key === 'AV_LM_SCRIPT_URL')?.Text?.trim() || PROD_LM_SCRIPT_URL;
  } catch (e) {
    return PROD_LM_SCRIPT_URL;
  }
};

let loaded;

/**
 * Inyecta el script de login de Lifemiles por entorno. Dedupe por src (loadScript).
 * La URL base sale de `AV_LM_SCRIPT_URL` (environment.json) o cae a prod; el `?env`
 * (uat/prd) sigue saliendo de `AV_MEMBERS_ENV` vía loadMembersConfig.
 * @returns {Promise} resuelve cuando el <script> cargó.
 */
export async function loadLmScript() {
  if (loaded) return loaded;
  // Kill-switch maestro: cubre también el camino ON-DEMAND (login.service.js llama a
  // loadLmScript al click en "Sign in"), que el gate de scripts.js no ve. Con Members
  // OFF nunca se inyecta el script de Lifemiles.
  if (!(await isMembersEnabled())) return undefined;
  const [{ env }, base] = await Promise.all([loadMembersConfig(), resolveLmScriptUrl()]);
  loaded = loadScript(`${base}?env=${env}`);
  return loaded;
}

/**
 * Resuelve cuando el script LM expone `window[name]` como función — EVENT-DRIVEN, SIN timer.
 * El script asigna sus funciones (lmFetchWrapper, lmCompleteLogin, etc.) async, después del
 * env-config, y no emite ningún evento. En vez de hacer polling con timeout (que en redes
 * lentas podría expirar antes de tener la función), usamos un setter trap: reaccionamos a la
 * asignación que hace el script, no importa cuánto tarde. Sin timeout → no falla por red lenta.
 * @param {string} name - 'lmFetchWrapper' | 'lmCompleteLogin' | ...
 * @returns {Promise<Function>}
 */
export function whenLmReady(name) {
  return new Promise((resolve) => {
    if (typeof window[name] === 'function') { resolve(window[name]); return; }
    let stored;
    Object.defineProperty(window, name, {
      configurable: true,
      get() { return stored; },
      set(fn) {
        stored = fn;
        // restaurar a propiedad de datos normal para no interferir con el resto del script
        Object.defineProperty(window, name, { configurable: true, writable: true, value: fn });
        resolve(fn);
      },
    });
  });
}
