import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { MembersWallet } from './members-wallet.js';
import {
  getAccountLabelsSync,
  getEliteLabelsSync,
} from '../../../scripts/services/members/members-i18n.js';

const html = htm.bind(h);

const CARDS = [
  {
    networkKey: 'visa', networkLabel: 'Visa', maskedNumber: '•••• 8901', currency: 'COP', isCobrand: true,
  },
  {
    networkKey: 'mastercard', networkLabel: 'Mastercard', maskedNumber: '•••• 4477', currency: null, isCobrand: false,
  },
  {
    networkKey: 'amex', networkLabel: 'American Express', maskedNumber: '•••• 1005', currency: 'USD', isCobrand: false,
  },
];

const CREDITS = [
  {
    maskedNumber: '••••••••8901', type: 'Reembolsable', state: 'active', currency: 'COP', initialBalance: 500000, balance: 320000, holderName: 'Juan Sebastián Rodríguez', issueDate: '2025-03-14', expiryDate: '2027-03-14',
  },
  {
    maskedNumber: '••••••••4477', type: 'No reembolsable', state: 'no-balance', currency: 'COP', initialBalance: 250000, balance: 0, holderName: 'María Fernanda Villalobos Santamaría de la Espriella', issueDate: '2024-11-02', expiryDate: '2026-11-02',
  },
  {
    maskedNumber: '••••••••1200', type: 'Reembolsable', state: 'cancelled', currency: 'USD', initialBalance: 120, balance: 0, holderName: 'Carlos Andrés Gómez', issueDate: '2023-06-20', expiryDate: '2025-06-20',
  },
];

const PAYMENT_MOCK = {
  networkKey: 'mastercard', networkLabel: 'MasterCard', maskedNumber: '•••• 5890', isCobrand: true, mock: true,
};

// Datos display de la suscripción LM+ (el VM real solo trae state/plan.name; el
// resto se muestra en qa vía estos campos de muestra, si no la card pinta '–').
const LM_PLUS_DISPLAY = {
  subscriptionDate: 'Julio 30, 2025',
  subscribedTime: '1 año, 5 meses',
  nextChargeDate: 'Noviembre 16, 2026',
  value: 'COP 45.000',
  frequency: 'Mensual',
};

/**
 * Sample del MembersWallet (1279362 paso 8): usa `overrides` para inyectar VMs
 * sin red. Casos: full (3 módulos) · empty tarjetas + banner LM+ · LM+ suspendido
 * (swap de CTA) · AVC multi con paginación.
 */
export const MembersWalletSample = () => {
  const labels = getAccountLabelsSync();
  const eliteLabels = getEliteLabelsSync();
  const wrap = (title, overrides) => html`
    <div style=${{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <p style=${{ color: '#666', margin: 0, fontWeight: 600 }}>${title}</p>
      <${MembersWallet} labels=${labels} eliteLabels=${eliteLabels} overrides=${overrides} />
    </div>
  `;

  return html`
    <section style=${{
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px', background: '#EEEFF1',
  }}>
      <h2>MembersWallet (organism — 1279362)</h2>

      ${wrap('Full — 3 módulos (tarjetas + AV Credits multi + LM+ activo con método de pago mock)', {
    cardsVM: { state: 'ready', cards: CARDS },
    creditsVM: { state: 'ready', credits: CREDITS, mock: true },
    lmPlusVM: {
      state: 'active', plan: { name: 'Plan 1', monthlyMiles: 1250, planId: '38' }, upsell: { name: 'Plan 3', priceDelta: 70000 }, ...LM_PLUS_DISPLAY,
    },
    paymentMethod: PAYMENT_MOCK,
  })}

      ${wrap('Empty tarjetas + banner LM+ (sin suscripción)', {
    cardsVM: { state: 'ready', cards: [] },
    creditsVM: null,
    lmPlusVM: { state: 'none', plan: null, upsell: null },
    paymentMethod: null,
  })}

      ${wrap('LM+ suspendido (swap: "Suscripción activa hasta" + "Renovar suscripción")', {
    cardsVM: { state: 'unavailable', cards: [] },
    creditsVM: null,
    lmPlusVM: {
      state: 'suspended', plan: { name: 'Plan 1', monthlyMiles: 6000, planId: '29' }, upsell: null, suspendedUntil: 'Noviembre 16, 2026', ...LM_PLUS_DISPLAY, nextChargeDate: '',
    },
    paymentMethod: PAYMENT_MOCK,
  })}
    </section>
  `;
};

export default MembersWalletSample;
