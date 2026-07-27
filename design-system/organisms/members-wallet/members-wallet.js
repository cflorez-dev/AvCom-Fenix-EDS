import { h } from '@dropins/tools/preact.js';
import { useState, useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Accordion } from '../../molecules/accordion/accordion.js';
import { Button } from '../../atoms/button/button.js';
import { SavedCardItem } from '../../molecules/saved-card-item/saved-card-item.js';
import { CobrandEmptyState } from '../../molecules/cobrand-empty-state/cobrand-empty-state.js';
import { AviancaCreditsCard } from '../../molecules/avianca-credits-card/avianca-credits-card.js';
import { CarouselNavigationButton } from '../../atoms/carousel-navigation-button/carousel-navigation-button.js';
import { LmPlusSubscriptionCard } from '../../molecules/lm-plus-subscription-card/lm-plus-subscription-card.js';
import { LmPlusBanner } from '../../molecules/lm-plus-banner/lm-plus-banner.js';
import { loadWalletCards } from '../../../scripts/services/members/wallet-cards.logic.js';
import { loadAviancaCredits } from '../../../scripts/services/members/avianca-credits.service.js';
import { loadClubSubscription } from '../../../scripts/services/members/club-subscription.service.js';

const html = htm.bind(h);

const LM_PLUS_PAYMENT_FIXTURE = '/tests/fixtures/members/account/lm-plus-payment-method.json';

const tpl = (template, params = {}) => String(template || '').replace(
  /\{(\w+)\}/g,
  (m, k) => (params[k] !== undefined && params[k] !== null ? String(params[k]) : m),
);

const resolveCodeBasePath = () => (typeof window !== 'undefined' && window.hlx?.codeBasePath) || '';

/** Fetch fail-soft de la fixture del método de pago LM+ (mock D22). */
async function loadLmPlusPaymentMock() {
  try {
    if (typeof fetch !== 'function') return null;
    // Concatenación directa — buildAssetPath colapsa el // del protocolo (404 en qa).
    const url = `${resolveCodeBasePath()}${LM_PLUS_PAYMENT_FIXTURE}`;
    const res = await fetch(url);
    if (!(res instanceof Response) || !res.ok) return null;
    return await res.json();
  } catch (e) { return null; }
}

const EditIcon = () => html`
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" class="w-4 h-4 shrink-0">
    <path d="M12.9 3.9 16 7 6.8 16.2l-3.1.3.3-3.1L12.9 3.9Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
  </svg>
`;

const CardIcon = () => html`
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" class="w-4 h-4 shrink-0">
    <rect x="2.5" y="4.5" width="15" height="11" rx="1.8" stroke="currentColor" stroke-width="1.5" />
    <path d="M2.5 8h15" stroke="currentColor" stroke-width="1.5" />
  </svg>
`;

/**
 * CTA de redirect (pill). `variant="secondary"` (átomo Button). Sin URL autorada
 * (CF vacío hoy) → `disabled` (no href muerto — D21/decisión sección 5).
 */
const RedirectCta = ({ icon, label, url }) => html`
  <${Button}
    variant="secondary"
    size="sm"
    href=${url || undefined}
    disabled=${!url}
    customClassName="whitespace-nowrap"
  >
    ${icon} ${label}
  </${Button}>
`;

/**
 * Módulo ① Métodos de pago (1279362, §C). Read-only (POST-PCI): lista de tarjetas
 * en grid 1/2/3 cols + 2 CTAs de redirect al pie. Empty (0 tarjetas) →
 * CobrandEmptyState con los 2 shortcuts. `unavailable`/flag off → el organism no
 * lo monta (no se afirma "sin tarjetas" sin dato).
 */
const PaymentMethodsModule = ({
  cardsVM, labels, wallet, codeBasePath,
}) => {
  const cards = Array.isArray(cardsVM?.cards) ? cardsVM.cards : [];
  const manageUrl = wallet.manageCardsUrl || '';
  const requestUrl = wallet.requestCardUrl || '';

  const footCtas = html`
    <div class="flex flex-col gap-3 md:flex-row md:gap-4" data-name="wallet-payment-ctas">
      <${RedirectCta} icon=${html`<${EditIcon} />`} label=${labels.walletManageCta || ''} url=${manageUrl} />
      <${RedirectCta} icon=${html`<${CardIcon} />`} label=${labels.walletRequestCta || ''} url=${requestUrl} />
    </div>
  `;

  return html`
    <${Accordion}
      title=${html`
        <span class="text-lg font-semibold leading-normal text-[var(--text-normal-primary)]">
          ${labels.walletPaymentsTitle || ''}
        </span>
      `}
      titleLevel="h2"
      defaultOpen=${true}
      chevronColor="var(--icon-normal-primary)"
      data-name="wallet-module-payments"
    >
      ${cards.length > 0 ? html`
        <div class="flex flex-col gap-4 w-full rounded-2xl bg-[var(--bg-cards-accent)] p-4 md:p-6" data-name="wallet-saved-cards">
          <span class="text-base font-bold leading-normal text-[var(--text-normal-primary)]">
            ${labels.walletSavedCardsTitle || ''}
          </span>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${cards.map((card, i) => html`
              <${SavedCardItem} key=${`${card.networkKey}-${i}`} card=${card} labels=${labels} codeBasePath=${codeBasePath} />
            `)}
          </div>
          ${footCtas}
        </div>
      ` : html`
        <${CobrandEmptyState}
          labels=${{
    cobrandEmptyTitle: labels.walletEmptyTitle || '',
    cobrandEmptyBody: labels.walletEmptyBody || '',
    cobrandAdd: labels.walletManageCta || '',
    cobrandRequest: labels.walletRequestCta || '',
  }}
          actions=${{
    addLabel: labels.walletManageCta || '',
    requestLabel: labels.walletRequestCta || '',
    addUrl: manageUrl,
    requestUrl,
  }}
        />
      `}
    </${Accordion}>
  `;
};

/**
 * Módulo ② AV Credits (1279362, §C). SIN vista empty (solo se muestra con
 * credits). Multi (>1) → paginación "N de M" (mismo patrón CobrandSlider:
 * CarouselNavigationButton). Gated `aviancaCreditsEnabled` + `state==='ready'`.
 */
const AvCreditsModule = ({ creditsVM, labels, wallet }) => {
  const credits = Array.isArray(creditsVM?.credits) ? creditsVM.credits : [];
  const [index, setIndex] = useState(0);
  if (!credits.length) return null;
  const total = credits.length;
  const current = Math.max(0, Math.min(index, total - 1));
  const movementsUrl = wallet.avCreditsMovementsUrl || '';

  return html`
    <section class="flex flex-col gap-4" data-name="wallet-module-avcredits" aria-label=${labels.avCreditsTitle || ''}>
      <h2 class="!m-0 text-lg font-semibold leading-normal text-[var(--text-normal-primary)]">
        ${labels.avCreditsTitle || ''}
      </h2>
      <${AviancaCreditsCard} credit=${credits[current]} labels=${labels} movementsUrl=${movementsUrl} />
      ${total > 1 && html`
        <div class="flex items-center justify-center gap-4" data-name="wallet-avcredits-pagination">
          <${CarouselNavigationButton}
            direction="left"
            absolute=${false}
            disabled=${current === 0}
            onClick=${() => setIndex((i) => Math.max(0, i - 1))}
          />
          <span class="text-[14px] font-normal leading-[19px] text-[var(--text-normal-primary)] tabular-nums" aria-live="polite">
            ${tpl(labels.avCreditsPagination, { n: current + 1, m: total })}
          </span>
          <${CarouselNavigationButton}
            direction="right"
            absolute=${false}
            disabled=${current === total - 1}
            onClick=${() => setIndex((i) => Math.min(total - 1, i + 1))}
          />
        </div>
      `}
    </section>
  `;
};

/**
 * Módulo ③ Lifemiles Plus (1279362, §C, Entrega 4). Monta la molécula NUEVA
 * `LmPlusSubscriptionCard` (gestión de la suscripción: datos + resumen de pago +
 * CTAs) — NO el `LmPlusPlanCard` de elite (beneficios + upsell), que es otra card.
 * Swap de suspendido (label "Suscripción activa hasta" + CTA "Renovar suscripción")
 * lo resuelve la card por `state`. `none` → `LmPlusBanner` (reuso); `unavailable`
 * → oculto. `paymentMethod` inyectado (fixture mock, marcado `mock:true`).
 *
 * Datos: del VM real de `loadClubSubscription` (state/plan.name; el resto llega
 * solo si el VM lo proyecta — samples/qa — si no la card pinta `–`).
 */
const LmPlusModule = ({
  lmPlusVM, eliteLabels, accountLabels, wallet, paymentMethod, codeBasePath,
}) => {
  const state = lmPlusVM?.state || 'unavailable';
  if (state === 'unavailable') return null;

  if (state === 'none') {
    return html`
      <section class="flex flex-col gap-4" data-name="wallet-module-lmplus">
        <${LmPlusBanner} labels=${eliteLabels} ctaUrl="" />
      </section>
    `;
  }

  // Real-first (D22): si el VM real proyecta el método de pago se usa tal cual;
  // solo si falta se cae a la fixture mock. El kill-switch `walletMockFallback`
  // (aguas arriba) ya deja `paymentMethod` null cuando el mock está apagado.
  const realPm = lmPlusVM?.paymentMethod || null;
  let pm = null;
  if (realPm) {
    pm = { ...realPm, cobrandLabel: realPm.cobrandLabel || accountLabels.walletCobrandChip || '' };
  } else if (paymentMethod) {
    pm = { ...paymentMethod, cobrandLabel: accountLabels.walletCobrandChip || '', mock: true };
  }
  // En suspended, la "Próxima fecha de cobro" pasa a "Suscripción activa hasta"
  // (la card hace el swap del label) y toma `suspendedUntil` del VM.
  const nextCharge = state === 'suspended'
    ? (lmPlusVM.suspendedUntil || lmPlusVM.nextChargeDate || '')
    : (lmPlusVM.nextChargeDate || '');

  return html`
    <section class="flex flex-col gap-4" data-name="wallet-module-lmplus" aria-label=${accountLabels.walletLmPlusSectionTitle || ''}>
      <h2 class="!m-0 text-lg font-semibold leading-normal text-[var(--text-normal-primary)]">
        ${accountLabels.walletLmPlusSectionTitle || ''}
      </h2>
      <${LmPlusSubscriptionCard}
        state=${state}
        planName=${lmPlusVM.plan?.name || ''}
        subscriptionDate=${lmPlusVM.subscriptionDate || ''}
        subscribedTime=${lmPlusVM.subscribedTime || ''}
        nextChargeDate=${nextCharge}
        value=${lmPlusVM.value || ''}
        frequency=${lmPlusVM.frequency || ''}
        paymentMethod=${pm}
        labels=${accountLabels}
        editPaymentUrl=${wallet.lmPlusEditPaymentUrl || ''}
        cancelUrl=${wallet.lmPlusCancelUrl || ''}
        upgradeUrl=${wallet.lmPlusUpgradeUrl || ''}
        codeBasePath=${codeBasePath}
      />
    </section>
  `;
};

const WalletSkeleton = () => html`
  <div class="flex flex-col gap-6" data-name="wallet-skeleton" aria-hidden="true">
    <div class="h-40 w-full rounded-2xl bg-[var(--bg-page-light)] animate-pulse"></div>
    <div class="h-56 w-full rounded-2xl bg-[var(--bg-page-light)] animate-pulse"></div>
  </div>
`;

/**
 * MembersWallet — organism del tab Wallet (1279362). Orquesta 3 módulos
 * INDEPENDIENTES (sticky §C) con carga en paralelo (`Promise.allSettled`, patrón
 * fail-soft de members-elite): ① Métodos de pago (real) · ② AV Credits (mock) ·
 * ③ Lifemiles Plus (real + método de pago mock). Cada módulo se gatea por su flag
 * `cfg.account.wallet.*Enabled` y por el estado de su VM (unavailable → oculto).
 *
 * ## Props
 * - `cfg`: config de Members (usa `cfg.account.wallet`).
 * - `labels`: copies de account (getAccountLabelsSync/loadAccountLabels).
 * - `eliteLabels`: copies elite (para las keys `lmPlus*` que reusa la card).
 * - `overrides`: `{cardsVM, creditsVM, lmPlusVM, paymentMethod}` — inyecta VMs sin
 *   fetch (samples/tests).
 * - `codeBasePath`: base para SVGs de red (default window.hlx.codeBasePath).
 */
export const MembersWallet = ({
  cfg = {},
  labels = {},
  eliteLabels = {},
  overrides = null,
  codeBasePath = resolveCodeBasePath(),
  ...rest
}) => {
  const wallet = cfg?.account?.wallet || {};
  const [data, setData] = useState(() => (overrides
    ? { loading: false, ...overrides }
    : { loading: true }));

  useEffect(() => {
    if (overrides) return undefined;
    let mounted = true;
    const mockOn = wallet.mockFallback !== false;
    const tasks = [
      wallet.paymentMethodsEnabled !== false ? loadWalletCards() : Promise.resolve(null),
      wallet.aviancaCreditsEnabled !== false
        ? loadAviancaCredits({ mockFallback: mockOn }) : Promise.resolve(null),
      wallet.lmPlusEnabled !== false ? loadClubSubscription() : Promise.resolve(null),
      wallet.lmPlusEnabled !== false && mockOn ? loadLmPlusPaymentMock() : Promise.resolve(null),
    ];
    Promise.allSettled(tasks).then(([cards, credits, lmPlus, payment]) => {
      if (!mounted) return;
      const val = (s) => (s && s.status === 'fulfilled' ? s.value : null);
      setData({
        loading: false,
        cardsVM: val(cards),
        creditsVM: val(credits),
        lmPlusVM: val(lmPlus),
        paymentMethod: val(payment),
      });
    });
    return () => { mounted = false; };
  }, [cfg, overrides]);

  if (data.loading) {
    return html`
      <div class="members-wallet" data-name="members-wallet" data-state="loading" role="status" aria-busy="true">
        <${WalletSkeleton} />
      </div>
    `;
  }

  const showPayments = wallet.paymentMethodsEnabled !== false
    && data.cardsVM && data.cardsVM.state === 'ready';
  const showCredits = wallet.aviancaCreditsEnabled !== false
    && data.creditsVM && data.creditsVM.state === 'ready';
  const showLmPlus = wallet.lmPlusEnabled !== false
    && data.lmPlusVM && data.lmPlusVM.state !== 'unavailable';

  return html`
    <div
      class="members-wallet flex flex-col gap-8"
      data-name="members-wallet"
      data-state="ready"
      ...${rest}
    >
      ${showPayments && html`
        <${PaymentMethodsModule} cardsVM=${data.cardsVM} labels=${labels} wallet=${wallet} codeBasePath=${codeBasePath} />
      `}
      ${showCredits && html`
        <${AvCreditsModule} creditsVM=${data.creditsVM} labels=${labels} wallet=${wallet} />
      `}
      ${showLmPlus && html`
        <${LmPlusModule}
          lmPlusVM=${data.lmPlusVM}
          eliteLabels=${eliteLabels}
          accountLabels=${labels}
          wallet=${wallet}
          paymentMethod=${data.paymentMethod}
          codeBasePath=${codeBasePath}
        />
      `}
    </div>
  `;
};

export default MembersWallet;
