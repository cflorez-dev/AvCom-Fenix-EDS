import { h } from '@dropins/tools/preact.js';
import { useState, useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { session as sessionStore } from '../../../scripts/services/members/session.store.js';
import {
  getMembersConfigSync,
  loadMembersConfig,
} from '../../../scripts/services/members/members-config.js';
import {
  getAccountLabelsSync,
  loadAccountLabels,
  getEliteLabelsSync,
  loadEliteLabels,
} from '../../../scripts/services/members/members-i18n.js';
import { getStoredLanguage } from '../../../scripts/services/header/language-country-selector.js';
import { MembersEliteHeader } from '../members-elite-header/members-elite-header.js';
import { MembersWallet } from '../members-wallet/members-wallet.js';
import { MembersAccountData } from '../members-account-data/members-account-data.js';
import { MembersAccountSettings } from '../members-account-settings/members-account-settings.js';
import { MembersAccountTabs } from '../../molecules/members-account-tabs/members-account-tabs.js';
import { MembersAccountSkeleton } from '../../molecules/members-account-skeleton/members-account-skeleton.js';
import {
  TAB_DATA,
  TAB_PAYMENTS,
  TAB_SETTINGS,
} from '../../molecules/members-account-tabs/members-account-tabs.logic.js';

const html = htm.bind(h);

// Compuerta de ALCANCE por entrega (decisión Juan 2026-07-23): el contenido de un
// tab cuyo PBI aún NO fue entregado al cliente se tapa con "Próximamente"; las
// tabs siguen navegables (los ACs del shell 1279360 exigen 3 tabs + deep-link).
// Constante de código A PROPÓSITO (no campo del CF): se flipea por commit al
// entregar cada PBI y en producción nunca se vuelve a apagar — un flag de CF
// quedaría muerto para siempre (los blockXEnabled se limpiaron de la espec).
// Hoy: entregado SOLO 1279360 (shell) + Datos visible como adelanto aprobado.
const PANELS_ENABLED = { data: true, payments: false, settings: false };

const resolveLang = () => String(
  getStoredLanguage()
  || (typeof document !== 'undefined' && document.documentElement.lang)
  || 'es',
).toLowerCase().slice(0, 2);

/**
 * MembersAccount — organism raíz de la página "Gestión de mi cuenta" (1279360,
 * shell). Montado por el bloque puente `blocks/members-account/`.
 *
 * Versión SIMPLIFICADA del patrón `members-elite.js` (sin fetch de wrappers elite:
 * los datos del header vienen del VM de sesión):
 *  - `MembersEliteHeader` reusado (mismo gradiente/cóndor/balance box) + crumb
 *    activo "Gestión de cuenta" (`activeCrumbLabel`) + CTA "Mi Lifemiles ›" gated
 *    (`headerCta`, default OFF).
 *  - `MembersAccountTabs` (Datos | Pagos | Ajustes) con deep-linking `?tab=`.
 *  - 3 panels: `data` = `MembersAccountData` (1279361: banner de completitud +
 *    Mi perfil / Documentos / Acompañantes); `payments` = `MembersWallet`
 *    (1279362); `settings` = contenedor vacío (lo llena 1279363).
 *
 * Estado de carga: sesión no `authenticated` o config no resuelta →
 * `MembersAccountSkeleton`. La cortina `members-gate-pending` + la guardia de ruta
 * cubren el anti-flash de auth y el redirect del deslogueado.
 *
 * Lee el signal `session.store` con el idiom de `members-elite` (el store NO
 * auto-suscribe) + `getMembersConfigSync`/`loadMembersConfig` + los copies de
 * `members-i18n` (getAccountLabelsSync/loadAccountLabels).
 */
export const MembersAccount = () => {
  const [session, setSessionState] = useState(() => sessionStore.value);
  const [cfg, setCfg] = useState(() => getMembersConfigSync());
  // Copies de account (tabs + crumb activo + CTA + loading) y del header (saludo,
  // breadcrumb home/cuenta, balance) — el header reusa las keys elite.
  const [labels, setLabels] = useState(() => getAccountLabelsSync());
  const [headerLabels, setHeaderLabels] = useState(() => getEliteLabelsSync());
  // ¿Resolvió el primer `loadMembersConfig`? Warm load (cache con tierThemes)
  // arranca en `true`; cold load espera el fetch (success O failure).
  const [cfgLoaded, setCfgLoaded] = useState(
    () => Object.keys(getMembersConfigSync().tierThemes || {}).length > 0,
  );

  // El store usa signals-core SIN integración preact → suscripción manual.
  useEffect(() => sessionStore.subscribe(setSessionState), []);

  useEffect(() => {
    let mounted = true;
    loadMembersConfig()
      .then((c) => { if (mounted) setCfg(c); })
      .catch(() => {})
      .finally(() => { if (mounted) setCfgLoaded(true); });
    loadAccountLabels().then((l) => { if (mounted) setLabels(l); }).catch(() => {});
    loadEliteLabels().then((l) => { if (mounted) setHeaderLabels(l); }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const { status } = session;

  // Estado de carga: skeleton mientras no estén listos auth + config + banner.
  // `cfgLoaded` resuelve también en failure (.finally) → nunca cuelga.
  if (status !== 'authenticated' || !cfgLoaded || !session.user) {
    return html`
      <div
        class="members-account"
        data-name="members-account"
        data-state="loading"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <span class="sr-only">${labels.loadingLabel || ''}</span>
        <${MembersAccountSkeleton} />
      </div>
    `;
  }

  const lang = resolveLang();
  const account = cfg.account || {};
  const ctaHref = String(account.headerCtaUrl || '').replace('{lang}', lang);

  // Placeholder "Próximamente" para tabs cuyo PBI aún no se ENTREGA al cliente.
  // La tab sigue navegable (los ACs del shell exigen 3 tabs + deep-link); solo se
  // tapa el contenido.
  const comingSoon = (key, ariaLabel) => html`
    <section class="flex flex-col gap-6" data-panel=${key} aria-label=${ariaLabel}>
      <div
        class="w-full rounded-2xl border border-[var(--border-stroke-default)] bg-[var(--bg-card-lighter)] px-6 py-12 md:py-16 flex flex-col items-center text-center"
        data-name="account-coming-soon"
      >
        <span class="text-lg font-bold text-[var(--text-normal-primary)]">${labels.comingSoon || 'Próximamente'}</span>
      </div>
    </section>
  `;

  // Panel Datos (1279361): el organism MembersAccountData monta el banner de
  // completitud + los 3 paneles (Mi perfil / Documentos / Acompañantes). PII
  // local dentro del organism.
  const dataPanel = PANELS_ENABLED.data ? html`
    <section class="flex flex-col gap-6" data-panel="data" aria-label=${labels.tabData || 'Datos'}>
      <${MembersAccountData} cfg=${cfg} labels=${labels} />
    </section>
  ` : comingSoon('data', labels.tabData || 'Datos');

  // Panel Wallet (1279362): organism MembersWallet — tarjetas (real) + AV Credits
  // (mock) + Lifemiles Plus. Reusa las labels elite (`headerLabels`) para las keys
  // lmPlus* de la card compartida.
  const paymentsPanel = PANELS_ENABLED.payments ? html`
    <section class="flex flex-col gap-6" data-panel="payments" aria-label=${labels.tabPayments || 'Pagos'}>
      <${MembersWallet} cfg=${cfg} labels=${labels} eliteLabels=${headerLabels} />
    </section>
  ` : comingSoon('payments', labels.tabPayments || 'Pagos');

  const settingsPanel = PANELS_ENABLED.settings ? html`
    <section class="flex flex-col gap-6" data-panel="settings" aria-label=${labels.tabSettings || 'Ajustes'}>
      <${MembersAccountSettings} cfg=${cfg} labels=${labels} />
    </section>
  ` : comingSoon('settings', labels.tabSettings || 'Ajustes');

  return html`
    <div
      class="members-account flex flex-col gap-6 lg:gap-8"
      data-name="members-account"
      data-state="ready"
    >
      ${/* Header reusado (1271692) con labels elite de base (saludo/breadcrumb/
          balance) + crumb activo "Gestión de cuenta" + CTA gated. */ ''}
      <${MembersEliteHeader}
        user=${session.user}
        balance=${{
    totalMiles: session.user?.totalMiles ?? null,
    milesExpiryDate: session.user?.milesExpiryDate ?? null,
  }}
        statusExpiry=${session.user?.statusExpiry ?? null}
        tierThemes=${cfg.tiers || {}}
        labels=${headerLabels}
        activeCrumbLabel=${labels.breadcrumbAccountActive || null}
        headerCta=${{
    label: labels.headerCtaLabel || '',
    href: ctaHref,
    enabled: account.headerCtaEnabled === true,
  }}
      />

      ${/* Sheet de contenido gris detrás de tabs + paneles (patrón elite). */ ''}
      <div class="members-elite-sheet">
        <${MembersAccountTabs}
          labels=${labels}
          panels=${{
    [TAB_DATA]: dataPanel,
    [TAB_PAYMENTS]: paymentsPanel,
    [TAB_SETTINGS]: settingsPanel,
  }}
        />
      </div>
    </div>
  `;
};

export default MembersAccount;
