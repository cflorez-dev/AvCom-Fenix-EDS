import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { SummaryText } from '../../atoms/summary-text/summary-text.js';
import { Chip } from '../../atoms/chip/chip.js';
import { buildIconPath } from '../../../scripts/utils/hlx.helper.js';

const html = htm.bind(h);

/**
 * NetworkLogo — logo de la red de la tarjeta con fallback placeholder.
 *
 * Los 5 SVGs de red (`icons/members/cards/<key>.svg`) son **pending-asset**
 * (Juan los exporta de Figma `1291:48163`). Mientras no existan, el `onError`
 * del `<img>` cae a un placeholder pill gris con el nombre de la red (10px) —
 * así en qa no se ven imágenes rotas. NO es una desviación de diseño.
 */
const NetworkLogo = ({ networkKey = '', networkLabel = '', codeBasePath = '' }) => {
  const [errored, setErrored] = useState(false);
  if (errored || !networkKey) {
    return html`
      <span
        class="inline-flex items-center justify-center h-7 min-w-[44px] px-2 rounded-md
          bg-[var(--bg-cards-accent)] border border-[var(--border-stroke-default)]
          text-[10px] font-bold uppercase leading-none text-[var(--text-normal-secondary)]"
        data-name="saved-card-network-placeholder"
        aria-label=${networkLabel}
      >${networkLabel}</span>
    `;
  }
  return html`
    <img
      src=${buildIconPath(`members/cards/${networkKey}.svg`, codeBasePath)}
      alt=${networkLabel}
      class="h-7 w-auto max-w-[44px] object-contain"
      data-name="saved-card-network-logo"
      onError=${() => setErrored(true)}
    />
  `;
};

/**
 * SavedCardItem — fila READ-ONLY de una tarjeta guardada (1279362, §C).
 *
 * POST-PCI (R5/D28): SIN acciones por fila (sin lápiz/papelera, sin
 * "predeterminada"). Solo: logo de red (placeholder si falta el SVG) + "Número
 * de tarjeta" (`•••• XXXX`) + "Moneda de la tarjeta" (SOLO si el VM trae
 * `currency` — render condicional, respuesta P3) + chip cobrand condicional.
 *
 * ## Props
 * - `card`: `{networkKey, networkLabel, maskedNumber, currency|null, isCobrand}`
 *   (VM de `wallet-cards.logic.toWalletCardsVM`).
 * - `labels`: i18n de account (`walletCardNumberLabel`, `walletCardCurrencyLabel`,
 *   `walletCobrandChip`).
 * - `codeBasePath`: base para resolver el SVG de red (window.hlx.codeBasePath).
 * - `customClassName`: string.
 */
export const SavedCardItem = ({
  card = {},
  labels = {},
  codeBasePath = '',
  customClassName = '',
  ...rest
}) => {
  const {
    networkKey = '', networkLabel = '', maskedNumber = '', currency = null, isCobrand = false,
  } = card;
  return html`
    <div
      class=${`flex flex-col gap-3 rounded-lg border border-[var(--border-stroke-default)]
        bg-[var(--bg-card-lighter)] p-4 ${customClassName}`}
      data-name="saved-card-item"
      ...${rest}
    >
      <div class="flex items-center justify-between gap-2">
        <${NetworkLogo} networkKey=${networkKey} networkLabel=${networkLabel} codeBasePath=${codeBasePath} />
        ${isCobrand && html`
          <${Chip} variant="lifemiles">${labels.walletCobrandChip || ''}</${Chip}>
        `}
      </div>
      <${SummaryText} label=${labels.walletCardNumberLabel || ''} value=${maskedNumber} />
      ${currency && html`
        <${SummaryText} label=${labels.walletCardCurrencyLabel || ''} value=${currency} />
      `}
    </div>
  `;
};

export default SavedCardItem;
