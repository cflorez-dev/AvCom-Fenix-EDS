import { h } from '@dropins/tools/preact.js';
import { useState, useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { BenefitCategoryCard } from '../../molecules/benefit-category-card/benefit-category-card.js';
import { getEliteTierTokens } from '../../helpers/members-tier-theme.js';
import { Icon } from '../../atoms/icon/icon.js';

const html = htm.bind(h);

/** Interpolación simple `{tier}` para el título del módulo. */
const tpl = (template, params = {}) => String(template || '').replace(
  /\{(\w+)\}/g,
  (m, k) => (params[k] !== undefined && params[k] !== null ? String(params[k]) : m),
);

/**
 * Hook de viewport: `true` en mobile (≤767). Desktop-first (default `false`) para
 * SSR / entornos sin `matchMedia`: el catálogo cae al grid estático. No hay hook
 * de media query en el repo, así que va local (mismo patrón matchMedia del sitio).
 */
const useIsMobile = (query = '(max-width: 767px)') => {
  const [isMobile, setIsMobile] = useState(
    () => (typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query).matches
      : false),
  );
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const mql = window.matchMedia(query);
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener?.('change', onChange);
    return () => mql.removeEventListener?.('change', onChange);
  }, [query]);
  return isMobile;
};

/** Link inferior del módulo (see-all / T&C). Externo salvo ruta interna. El
 * ícono (1271693 AC "ícono ajustable desde el CMS") acepta URL de imagen del DAM
 * (asset ref → `<img>`) O key del átomo Icon (SVG). */
const CatalogLink = ({ href, label, icon }) => {
  if (!href || !label) return null;
  const isUrl = icon && /^(https?:\/\/|\/)/.test(icon);
  return html`
    <a
      href=${href}
      class="inline-flex items-center gap-2 rounded-full bg-[var(--bg-card-lighter)] shadow-[0px_0px_3px_0px_rgba(90,90,90,0.2)] px-4 py-2 text-[14px] font-bold leading-normal text-[var(--text-normal-primary)] no-underline w-full md:w-auto justify-center"
      data-name="benefits-catalog-link"
    >
      <span>${label}</span>
      ${icon && (isUrl
    ? html`<img src=${icon} alt="" width="16" height="16" class="object-contain shrink-0" />`
    : html`<${Icon} icon=${icon} customSize=${16} color="var(--icon-normal-primary)" />`)}
    </a>
  `;
};

/**
 * BenefitsCatalog — slot ① de la tab Beneficios (1271693, bloque 9 · componente
 * BenefitsCards). REWORK plan A: título "Beneficios por tu estatus {tier}" +
 * grid de cards (3 columnas desktop / 2 tablet / accordions verticales mobile,
 * la 1ª abierta) + links "Conoce todos los beneficios" / "Términos y condiciones"
 * DEBAJO del grid.
 *
 * SIN fetch: recibe el VM ya resuelto (`benefits-catalog.service` →
 * `toBenefitsCatalogVM`). `state:'unavailable'` o sin categorías → NO renderiza
 * nada (fail-soft: no afirmar "sin beneficios" sin dato). El gate
 * `benefitsEnabled` lo aplica el host (members-elite).
 *
 * El color por TIER (título de categoría + valores Active) sale del theming
 * existente (`getEliteTierTokens(tier).overlay`) — NO hex quemados. El título de
 * cada categoría se resuelve acá: `title` explícito del CF (gana si está
 * presente — permite override literal) o `labels[titleKey]` (i18n key).
 *
 * ## Props
 * - `catalogVM`: `{state, seeAllUrl?, termsUrl?, categories:[...]}` | null.
 * - `labels`: i18n del bloque elite (`benefits*`).
 * - `tier`: string del tier del socio (para el color y el título del módulo).
 * - `cfTiers`: dict de tiers del CF (theming); default `{}`.
 * - `formatNumber`: (n)=>string — formateo del contador por locale.
 * - `customClassName`: string.
 */
export const BenefitsCatalog = ({
  catalogVM = null,
  labels = {},
  tier = '',
  cfTiers = {},
  formatNumber = (n) => Number(n || 0).toLocaleString('es-CO'),
  customClassName = '',
  ...rest
}) => {
  const isMobile = useIsMobile();
  if (!catalogVM || catalogVM.state === 'unavailable') return null;
  const categories = Array.isArray(catalogVM.categories) ? catalogVM.categories : [];
  if (categories.length === 0) return null;

  const tokens = getEliteTierTokens(tier, cfTiers);
  const tierColor = tokens.overlay;
  // Título del módulo. `tier` viene crudo de LM: puede ser "Lifemiles Gold"
  // (elite), simplemente "lifemiles" (base) o kebab-case del mock como
  // "red-plus". Pixel-smoke Figma (765:39020 "Red Plus"): siempre en
  // TitleCase con espacios — quitamos el prefijo "Lifemiles ", normalizamos
  // separadores (`-`, `_`) a espacios y capitalizamos cada palabra.
  const stripped = String(tier || '').replace(/^\s*lifemiles\s+/i, '').trim();
  const tierDisplay = stripped
    ? stripped
      .replace(/[-_]+/g, ' ')
      .split(/\s+/)
      .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ''))
      .join(' ')
    : '';
  const moduleTitle = tpl(labels.benefitsCatalogTitle, { tier: tierDisplay });

  return html`
    <section
      class=${`flex flex-col gap-4 md:gap-6 ${customClassName}`}
      data-name="benefits-catalog"
      ...${rest}
    >
      ${moduleTitle && html`
        <h2 class="!m-0 !text-[20px] !font-semibold !leading-normal text-[var(--text-normal-primary)]" data-name="benefits-catalog-title">${moduleTitle}</h2>
      `}

      ${/* Grid: 1 col ≤767 (accordions) · 2 cols 768–1023 · 3 cols ≥1024 (AC). */ ''}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch" data-name="benefits-catalog-grid">
        ${categories.map((cat, i) => {
    // `title` literal del CF gana sobre `labels[titleKey]` — permite override
    // por card sin tocar el spreadsheet i18n (útil para placeholders alineados
    // con el diseño Silver/Gold antes de que autoría cargue el CF real).
    const title = cat.title || (cat.titleKey && labels[cat.titleKey]) || '';
    return html`
          <${BenefitCategoryCard}
            key=${cat.key || i}
            category=${{ ...cat, title }}
            labels=${labels}
            tierColor=${tierColor}
            collapsible=${isMobile}
            defaultOpen=${i === 0}
            formatNumber=${formatNumber}
          />
        `;
  })}
      </div>

      ${/* Banner informativo (Figma, casos secundarios): los beneficios pueden
          estar disponibles por tarjetas cobrand. Texto configurable vía i18n
          (`benefitsCardBanner`); si no hay texto, no se renderiza. */ ''}
      ${labels.benefitsCardBanner && html`
        <div class="flex items-start gap-2 rounded-xl bg-[var(--bg-hover-light)] px-4 py-3" data-name="benefits-catalog-banner">
          <${Icon} icon="alert/info" customSize=${20} color="var(--icon-normal-primary)" />
          <span class="text-[14px] font-normal leading-[19px] text-[var(--text-normal-secondary)]">${labels.benefitsCardBanner}</span>
        </div>
      `}

      ${/* Links del módulo (DEBAJO del grid): inline en desktop, apilados
          full-width en mobile. */ ''}
      ${(catalogVM.seeAllUrl || catalogVM.termsUrl) && html`
        <div class="flex flex-col md:flex-row gap-3" data-name="benefits-catalog-links">
          <${CatalogLink} href=${catalogVM.seeAllUrl} label=${labels.benefitsSeeAll} icon=${catalogVM.seeAllIcon || 'navigation/open-in-new'} />
          <${CatalogLink} href=${catalogVM.termsUrl} label=${labels.benefitsTerms} icon=${catalogVM.termsIcon || 'navigation/open-in-new'} />
        </div>
      `}
    </section>
  `;
};

export default BenefitsCatalog;
