import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { CobrandSlider } from '../../molecules/cobrand-card/cobrand-slider.js';
import { CobrandEmptyState } from '../../molecules/cobrand-empty-state/cobrand-empty-state.js';
import { LmPlusPlanCard } from '../../molecules/lm-plus-plan-card/lm-plus-plan-card.js';
import { LmPlusBanner } from '../../molecules/lm-plus-banner/lm-plus-banner.js';
import { SecondaryBanner } from '../banners/secondary-banner/secondary-banner.js';
import { SecondaryBannerLeft } from '../banners/secondary-banner/secondary-banner-variant.js';

const html = htm.bind(h);

/**
 * Estado 'none' de LM+ (sin plan): banner "Suscríbete a Lifemiles Plus". Si el CF
 * trae `lmPlusBanner` (con `title`) y no está apagado (`enabled !== false`), se
 * renderiza el SecondaryBanner del diseño (imagen + gradiente + cóndor); si no, cae
 * al LmPlusBanner simple (fallback). Para el gradiente morado con contenido BLANCO
 * van `mode='light'` + `ctaStyle='light'` (⚠️ el naming de las variables está invertido:
 * `--color-text-banner-dark`=#FFF, `-light`=#1B1B1B; y `ctaStyle:'light'`=botón blanco).
 * `imagePosition='left'` usa la variante con imagen a la izquierda.
 */
const renderLmPlusNone = (lmPlusBanner, labels, lmPlusUrls) => {
  const b = lmPlusBanner;
  if (b && b.enabled !== false && b.title) {
    const Banner = b.imagePosition === 'left' ? SecondaryBannerLeft : SecondaryBanner;
    return html`<${Banner}
      title=${b.title}
      firstLabel=${b.subtitle || ''}
      imageDesktop=${b.imageDesktop || ''}
      imageMobile=${b.imageMobile || ''}
      imageAlt=${b.imageAlt || ''}
      ctaText=${b.ctaText || ''}
      ctaUrl=${b.ctaUrl || ''}
      mode="light"
      ctaStyle="light"
      backgroundColor=${b.backgroundColor || ''}
      gradientColorStart=${b.gradientColorStart || ''}
      gradientColorEnd=${b.gradientColorEnd || ''}
      condorStrokeColor=${b.condorStrokeColor || ''}
      showCondor=${b.showCondor !== false}
      customClassName="!mx-0 !max-w-none"
    />`;
  }
  return html`<${LmPlusBanner} labels=${labels} ctaUrl=${lmPlusUrls.subscribe || ''} />`;
};

/**
 * BenefitsSection — orquesta los módulos del PBI 1271694 en la tab Beneficios
 * (slots ② cobrand y ③ Lifemiles Plus; el slot ① del catálogo por estatus es
 * del bloque 9 y NO se toca).
 *
 * Sección "Beneficios por tus tarjetas" (`cobrandEnabled`):
 *  - `cobrandVM.empty` → CobrandEmptyState (caso real de TODAS las cuentas UAT).
 *  - con cards → CobrandSlider (paginación N de M; oculta con 1 tarjeta).
 *
 * Sección LM+ (`lmPlusEnabled` && `state !== 'unavailable'` — wrapper no
 * deployado/error ⇒ NO se renderiza NADA de LM+: no podemos afirmar "sin
 * plan" sin dato):
 *  - `active`/`suspended` → título de sección + LmPlusPlanCard.
 *  - `none` → LmPlusBanner SIN título (§D: el banner reemplaza a la sección
 *    entera, incluido el título).
 *
 * SIN fetch: recibe los VMs ya resueltos (cobrand.service +
 * club-subscription.service) — el host (members-elite) cablea.
 *
 * ## Props
 * - `cobrandVM`: `{empty, cards, actions}` | null (null → sección oculta).
 * - `lmPlusVM`: `{state, plan, upsell}` | null (null/unavailable → oculta).
 * - `labels`: i18n del bloque elite.
 * - `flags`: `{cobrandEnabled, lmPlusEnabled}` (cfg.benefitsFlags).
 * - `milesLabel`: string — label de millas por tarjeta ya interpolado.
 * - `lmPlusUrls`: `{manage, upgrade, activate, subscribe}` — URLs
 *   configurables (CF/autoría).
 * - `suspendedUntil`: string — fecha del aviso de suspensión ({date}).
 * - `customClassName`: string.
 */
export const BenefitsSection = ({
  cobrandVM = null,
  lmPlusVM = null,
  labels = {},
  flags = {},
  lmPlusBanner = null,
  milesLabel = '',
  lmPlusUrls = {},
  suspendedUntil = '',
  customClassName = '',
  ...rest
}) => {
  const cobrandEnabled = flags.cobrandEnabled !== false && !!cobrandVM;
  const lmState = lmPlusVM?.state || 'unavailable';
  const lmPlusEnabled = flags.lmPlusEnabled !== false && lmPlusVM && lmState !== 'unavailable';

  if (!cobrandEnabled && !lmPlusEnabled) return null;

  return html`
    <div
      class=${`flex flex-col gap-6 ${customClassName}`}
      data-name="benefits-section"
      ...${rest}
    >
      ${cobrandEnabled && html`
        <section class="flex flex-col gap-4" data-name="benefits-cobrand" aria-label=${labels.cobrandSectionTitle || ''}>
          <h3 class="!m-0">
            <span class="block text-lg font-semibold leading-normal text-[#1b1b1b]">
              ${labels.cobrandSectionTitle || ''}
            </span>
          </h3>
          ${cobrandVM.empty ? html`
            <${CobrandEmptyState} labels=${labels} actions=${cobrandVM.actions} />
          ` : html`
            <${CobrandSlider}
              cards=${cobrandVM.cards}
              actions=${cobrandVM.actions}
              labels=${labels}
              milesLabel=${milesLabel}
            />
          `}
        </section>
      `}

      ${lmPlusEnabled && html`
        <section class="flex flex-col gap-4" data-name="benefits-lm-plus" aria-label=${labels.lmPlusSectionTitle || ''}>
          ${lmState === 'none' ? renderLmPlusNone(lmPlusBanner, labels, lmPlusUrls) : html`
            <h3 class="!m-0">
              <span class="block text-lg font-semibold leading-normal text-[#1b1b1b]">
                ${labels.lmPlusSectionTitle || ''}
              </span>
            </h3>
            <${LmPlusPlanCard}
              state=${lmState}
              plan=${lmPlusVM.plan}
              upsell=${lmPlusVM.upsell}
              labels=${labels}
              manageUrl=${lmPlusUrls.manage || ''}
              upgradeUrl=${lmPlusUrls.upgrade || ''}
              activateUrl=${lmPlusUrls.activate || ''}
              suspendedUntil=${suspendedUntil}
            />
          `}
        </section>
      `}
    </div>
  `;
};

export default BenefitsSection;
