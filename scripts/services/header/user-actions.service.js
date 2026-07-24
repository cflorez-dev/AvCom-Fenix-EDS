import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import { shouldShowByTargeting } from '../../utils/target-filter.js';
import { Actions } from '../../../design-system/organisms/header/actions/actions.js';
import { getSession } from '../members/session.store.js';
import { getStoredLanguage } from './language-country-selector.js';
import { fetchAEMData } from '../../utils/aem-data.js';
import { isMembersEnabled } from '../members/members-flag.js';

/**
 * Orquestador del bloque `header-user-actions` (cart + botón de usuario/Members).
 *
 * PROBLEMA que resuelve: en el nav puede haber VARIAS instancias del bloque (una por POS/idioma).
 * Antes cada una se auto-renderizaba en el contenedor compartido `.user-actions` → colisión + race
 * ("el último que renderiza pisa"), y un bloque sin targeting tapaba a uno con POS.
 *
 * Ahora: cada bloque se REGISTRA acá (no se renderiza solo). El servicio, una vez, elige UN ganador
 * y renderiza solo ese:
 *   1. filtra los que matchean el POS/idioma actual (shouldShowByTargeting)
 *   2. gana el de MAYOR especificidad de targeting (país=4 > idioma=2 > sin targeting=0),
 *      con el orden de registro (DOM) como desempate
 *   3. renderiza ese único en `.user-actions`
 */

const html = htm.bind(h);
const SIGN_IN_LABEL_KEY = 'members.login.signIn';

const candidates = [];
let scheduled = false;

/** Especificidad de targeting: país pesa más que idioma; sin targeting = 0 (general). */
export const specificity = (c) => (c?.targetCountries ? 4 : 0) + (c?.targetLanguages ? 2 : 0);

/**
 * Elige el ganador entre los candidatos: el de mayor especificidad ENTRE los que matchean.
 * Empate → el primero registrado (orden DOM). Devuelve null si ninguno matchea.
 */
export function pickWinner(list) {
  const matching = list.filter((c) => shouldShowByTargeting(c.targetCountries, c.targetLanguages));
  if (!matching.length) return null;
  return matching.reduce((best, c) => (specificity(c) > specificity(best) ? c : best));
}

/** Label del botón sign-in desde i18n (fallback de seguridad cuando el bloque no trae label). */
async function resolveSignInLabel() {
  const language = getStoredLanguage() || document.documentElement.lang || 'pt';
  try {
    const i18 = await fetchAEMData(`${language}`);
    return i18?.data?.find((item) => item.Key === SIGN_IN_LABEL_KEY)?.Text || '';
  } catch (e) {
    return '';
  }
}

async function renderWinner(winner, container) {
  // Kill-switch maestro Members: con la feature OFF no pasamos `session` (el organism
  // <Actions> no monta <UserSession> → NO se dispara el fetch del CF de members ni el
  // botón de login) y ocultamos el user button. Solo queda el cart (driveado por config
  // del bloque). Es el comportamiento pre-members del header.
  const enabled = await isMembersEnabled();
  // Label: el del BLOQUE primero (configurable por idioma+POS), i18n como red de seguridad.
  const signInLabel = enabled ? await resolveSignInLabel() : '';
  const userData = enabled
    ? { ...winner.user, label: winner.user.label || signInLabel || '' }
    : { ...winner.user, show: false };
  const handleCartClick = (e) => {
    e.preventDefault();
    container.dispatchEvent(new CustomEvent('cart-click', { detail: { ...winner.cart }, bubbles: true }));
  };
  render(
    html`
      <${Actions}
        cart=${winner.cart}
        user=${userData}
        session=${enabled ? getSession() : undefined}
        onCartClick=${handleCartClick}
        customClassName="header-user-actions"
      />
    `,
    container,
  );
}

/** Resuelve el ganador y lo renderiza. Reintenta si `.user-actions` aún no existe (timing). */
function resolve(attempt = 0) {
  const container = document.querySelector('.user-actions');
  if (!container) {
    if (attempt < 20) requestAnimationFrame(() => resolve(attempt + 1));
    return;
  }
  const winner = pickWinner(candidates);
  if (winner) renderWinner(winner, container);
}

/**
 * Registra una instancia del bloque header-user-actions. El bloque parsea su config + targeting
 * y llama acá; el servicio elige UN ganador (debounced en un RAF) y renderiza solo ese.
 * @param {{cart:object, user:object, targetCountries:string, targetLanguages:string}} data
 */
export function registerUserActions(data) {
  candidates.push(data);
  if (!scheduled) {
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      resolve();
    });
  }
}
