import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { LmPlusSubscriptionCard } from './lm-plus-subscription-card.js';
import { getAccountLabelsSync } from '../../../scripts/services/members/members-i18n.js';

const html = htm.bind(h);

const PAYMENT_MOCK = {
  networkKey: 'mastercard', networkLabel: 'MasterCard', maskedNumber: '•••• 5890', isCobrand: true, mock: true,
};

/**
 * Sample del LmPlusSubscriptionCard (1279362, Entrega 4): activa (nodo
 * `1056:41428`) y suspendida (nodo `1056:42373` — swap de label "Suscripción
 * activa hasta" + CTA "Renovar suscripción"). Los datos que el VM real de
 * `loadClubSubscription` no trae van con valores de muestra acá para exhibir el
 * diseño completo (en prod caen a `–`).
 */
export const LmPlusSubscriptionCardSample = () => {
  const labels = getAccountLabelsSync();
  return html`
    <section style=${{
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', background: '#EEEFF1',
  }}>
      <h2>LmPlusSubscriptionCard (molécula — 1279362)</h2>

      <p style=${{ color: '#666', margin: 0 }}>Activa (1056:41428):</p>
      <${LmPlusSubscriptionCard}
        state="active"
        planName="Plan 1"
        subscriptionDate="Julio 30, 2025"
        subscribedTime="1 año, 5 meses"
        nextChargeDate="Noviembre 16, 2026"
        value="COP 45.000"
        frequency="Mensual"
        paymentMethod=${{ ...PAYMENT_MOCK, cobrandLabel: labels.walletCobrandChip }}
        labels=${labels}
        editPaymentUrl="/es/members/wallet/editar-pago"
        cancelUrl="/es/members/wallet/cancelar"
        upgradeUrl="/es/members/wallet/mejorar"
      />

      <p style=${{ color: '#666', margin: 0 }}>Suspendida (1056:42373 — swap label + CTA):</p>
      <${LmPlusSubscriptionCard}
        state="suspended"
        planName="Plan 1"
        subscriptionDate="Julio 30, 2025"
        subscribedTime="1 año, 5 meses"
        nextChargeDate="Noviembre 16, 2026"
        value="COP 45.000"
        frequency="Mensual"
        paymentMethod=${{ ...PAYMENT_MOCK, cobrandLabel: labels.walletCobrandChip }}
        labels=${labels}
        editPaymentUrl="/es/members/wallet/editar-pago"
        cancelUrl="/es/members/wallet/renovar"
        upgradeUrl="/es/members/wallet/mejorar"
      />
    </section>
  `;
};

export default LmPlusSubscriptionCardSample;
