import { readBlockConfig } from '../../scripts/aem.js';
import { registerUserActions } from '../../scripts/services/header/user-actions.service.js';

// Códigos válidos para detectar el targeting (ver readTargeting).
const VALID_COUNTRIES = ['co', 'ar', 'mx', 'pe', 'ec', 'sv', 'cr', 'br', 'bo', 'cl', 'ca', 'gt', 'hn', 'ni', 'pa', 'py', 'do', 'eu', 'gb', 'uy', 'ot', 'us'];
const VALID_LANGUAGES = ['es', 'en', 'pt', 'fr'];

const isCountryCode = (v) => !!v
  && (VALID_COUNTRIES.includes(v) || v.split(',').every((c) => VALID_COUNTRIES.includes(c.trim())));
const isLanguageCode = (v) => !!v
  && (VALID_LANGUAGES.includes(v) || v.split(',').every((l) => VALID_LANGUAGES.includes(l.trim())));

/**
 * Maps block HTML data to a structured object (cart + user config, posicional).
 * Estructura: 6 filas → cart-label, cart-icon, show-cart, user-label, user-icon, show-user.
 * (Si el targeting está en las 2 PRIMERAS filas, se saltean.)
 */
function mapBlockData(block) {
  const divs = Array.from(block.querySelectorAll(':scope > div'));
  let startIndex = 0;

  // Si las 2 primeras filas son targeting (códigos de país/idioma), las salteamos.
  if (divs.length >= 2) {
    const firstRowValue = divs[0]?.children[0]?.textContent?.trim().toLowerCase();
    if (firstRowValue && divs[0].children.length <= 2 && isCountryCode(firstRowValue)) {
      startIndex = 2;
    }
  }

  const extractValue = (div) => {
    const innerDiv = div?.querySelector(':scope > div');
    if (innerDiv) {
      const paragraph = innerDiv.querySelector('p');
      return paragraph ? paragraph.textContent.trim() : innerDiv.textContent.trim();
    }
    return '';
  };

  const parseBoolean = (value) => {
    if (!value || value === '') return true; // Default a true si no hay valor
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    return Boolean(value);
  };

  return {
    cart: {
      label: extractValue(divs[startIndex + 0]) || '',
      icon: extractValue(divs[startIndex + 1]) || '',
      show: parseBoolean(extractValue(divs[startIndex + 2])),
    },
    user: {
      label: extractValue(divs[startIndex + 3]) || '',
      icon: extractValue(divs[startIndex + 4]) || '',
      show: parseBoolean(extractValue(divs[startIndex + 5])),
    },
  };
}

export { mapBlockData };

/**
 * Lee el targeting del bloque. El modelo de UE pone `target-countries`/`target-languages` como
 * los ÚLTIMOS campos → se renderizan como filas sueltas al FINAL del bloque (`<div>br</div>`),
 * no en las primeras ni como config nombrada. Por eso ESCANEAMOS todas las filas buscando un
 * código de país/idioma válido (los labels/iconos/booleans nunca matchean un código).
 * @returns {{targetCountries:string, targetLanguages:string}}
 */
function readTargeting(block) {
  const config = readBlockConfig(block);
  let targetCountries = config['target-countries'] || '';
  let targetLanguages = config['target-languages'] || '';
  if (!targetCountries || !targetLanguages) {
    [...block.querySelectorAll(':scope > div')].forEach((row) => {
      const inner = row.querySelector(':scope > div');
      const val = (inner?.textContent || '').trim().toLowerCase();
      if (!val) return;
      if (!targetCountries && isCountryCode(val)) targetCountries = val;
      else if (!targetLanguages && isLanguageCode(val)) targetLanguages = val;
    });
  }
  return { targetCountries, targetLanguages };
}

/**
 * Decorates the Header User Actions block.
 *
 * NO renderiza nada por sí mismo: parsea su config + targeting y se REGISTRA en
 * `user-actions.service.js`, que elige UN ganador entre todas las instancias (por targeting +
 * especificidad) y renderiza solo ese en `.user-actions`. Así se evita la colisión/race que había
 * cuando cada instancia se auto-renderizaba en el contenedor compartido.
 *
 * @param {Element} block The header user actions block element
 */
export default function decorate(block) {
  // Modo autor (Universal Editor): preservar el contenido editable, no transformar.
  if (window.xwalk?.isAuthorEnv) {
    block.classList.add('header-user-actions-author-mode');
    const authorIndicator = document.createElement('div');
    authorIndicator.className = 'header-user-actions-author-indicator';
    authorIndicator.textContent = '🛒 Header User Actions (Author Mode - Edit configuration)';
    authorIndicator.style.cssText = 'background: #f0f0f0; padding: 8px; border: 1px dashed #0066cc; margin-bottom: 8px; font-size: 12px; color: #666;';
    block.insertBefore(authorIndicator, block.firstChild);
    return;
  }

  const { targetCountries, targetLanguages } = readTargeting(block);
  const mapped = mapBlockData(block);
  const config = readBlockConfig(block);

  const cart = {
    label: mapped.cart.label || config['cart-button-label'] || '',
    icon: mapped.cart.icon || config['cart-button-icon'] || '',
    show: mapped.cart.show,
  };
  // Label del usuario: el del bloque (configurable por idioma+POS). El servicio le pone el
  // fallback i18n si viene vacío.
  const user = {
    label: mapped.user.label || config['user-button-label'] || '',
    icon: mapped.user.icon || config['user-button-icon'] || '',
    show: mapped.user.show,
  };

  registerUserActions({
    cart, user, targetCountries, targetLanguages,
  });
  // El bloque fuente no se muestra; el servicio renderiza en `.user-actions`.
  block.style.display = 'none';
}
