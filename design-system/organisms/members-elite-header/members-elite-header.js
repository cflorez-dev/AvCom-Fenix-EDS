import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { getStoredLanguage } from '../../../scripts/services/header/language-country-selector.js';
import { getEliteTierTokens } from '../../helpers/members-tier-theme.js';
import Breadcrumb from '../../molecules/breadcrumb/breadcrumb.js';

const html = htm.bind(h);

const resolveLang = () => String(
  getStoredLanguage()
  || (typeof document !== 'undefined' && document.documentElement.lang)
  || 'es',
).toLowerCase().slice(0, 2);

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/**
 * Formatea una fecha a "Mes Dia, Año" por locale (ej. "Dic 31, 2026"). MISMA
 * implementación que el formatter del hero (`members-hero.js` — no exportado);
 * se reusa la lógica idéntica (no es un formatter nuevo). Acepta 'YYYY-MM-DD' o
 * ISO completo (toma la parte de fecha).
 */
const formatDate = (iso, lang) => {
  if (!iso) return '';
  const dateOnly = String(iso).split('T')[0];
  const d = new Date(`${dateOnly}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  try {
    const month = new Intl.DateTimeFormat(lang, { month: 'short' }).format(d).replace('.', '');
    return `${capitalize(month)} ${d.getDate()}, ${d.getFullYear()}`;
  } catch (e) {
    return iso;
  }
};

/**
 * Cóndor decorativo del header elite (watermark). Refinamiento 2026-07-15: usa el
 * MISMO vector que el drawer hero — `assets/logos/members/decorative-vector.svg`,
 * la pluma fina 117×132 del spec Figma §A ("cóndor decorativo 117×131") — vía
 * `<img>` para render pixel-perfect. Antes usaba un SVG inline denso con fill
 * 0.55 y viewBox 224×200 a `h-full` (≈213×190), sobredimensionado, que ensuciaba
 * el gradiente del hero. El tamaño y la posición se resuelven en `styles.css`
 * (`.members-elite-header [data-name='members-elite-header-condor']`): mobile
 * chico arriba-derecha, desktop 117×131 anclado abajo a la izquierda de la
 * balance box. Es un watermark de color fijo (blanco→gris tenue del propio SVG),
 * igual que el drawer; no se tinta por tier. Puramente decorativo (`aria-hidden`).
 */
const EliteHeaderCondor = () => {
  const codeBasePath = (typeof window !== 'undefined' && window.hlx?.codeBasePath) || '';
  const src = `${codeBasePath}/assets/logos/members/decorative-vector.svg`;
  return html`
    <img
      src=${src}
      alt=""
      aria-hidden="true"
      data-name="members-elite-header-condor"
      class="pointer-events-none select-none"
    />
  `;
};

/**
 * MembersEliteHeader — header personalizado por estatus de la página "Progreso
 * Elite y beneficios" (1271692, Bloque 2). Fondo gradiente strong + cóndor
 * decorativo + breadcrumb (2/3 niveles por breakpoint) + saludo + línea
 * `[displayName tier] | Vence: [fecha]` + balance box (overlay por tier) con
 * "Tienes / X millas" + "Fecha de vencimiento / [fecha|–]".
 *
 * Theming: `getEliteTierTokens` (CF nuevo → legacy → preset; NO toca el hero).
 * Reglas (decisión 5): "Vence:" OCULTO para Lifemiles base y TODAS las variantes
 * Cenit; empty → "0 millas" y "–"; nombre del tier por CF `displayName` (fallback
 * al `tier` crudo). Tipografía (Figma 765:51843): saludo H4 24px SemiBold; línea
 * tier 18px Regular (nombre y "Vence" mismo peso); balance label 14px Regular /
 * valor 18px Bold. Breakpoints §A: ≤767 vertical (balance full-width), 768-1023 horizontal,
 * ≥1024 max-width 1248 / padding 32 / alto ~190.
 *
 * ## Props
 * @param {Object} props
 * @param {{firstName?:string, tier?:string, cenit?:{level:1|2|null}}} props.user
 * @param {{totalMiles?:number|null, milesExpiryDate?:string|null}} [props.balance]
 * @param {string|null} [props.statusExpiry] - vigencia del estatus (ISO/date-only).
 * @param {Object<string,object>} [props.tierThemes] - dict de tiers del CF (cfg.tiers).
 * @param {Object} props.labels - labels elite (getEliteLabelsSync/loadEliteLabels).
 * @param {string|null} [props.activeCrumbLabel] - (1279360, aditivo) reemplaza el
 *   label del crumb activo (el shell "Gestión de cuenta" pasa
 *   `labels.breadcrumbAccountActive`). Default null → crumb elite intacto.
 * @param {{label?:string, href?:string, enabled?:boolean}|null} [props.headerCta] -
 *   (1279360, aditivo, gated) CTA "Mi Lifemiles ›" a la derecha de la fila del
 *   breadcrumb, SOLO desktop, cuando `enabled === true`. Default null → header
 *   elite byte-idéntico (mobile nunca lo renderiza).
 */
export const MembersEliteHeader = ({
  user = {},
  balance = {},
  statusExpiry = null,
  tierThemes = {},
  labels = {},
  activeCrumbLabel = null,
  headerCta = null,
}) => {
  const lang = resolveLang();
  const tokens = getEliteTierTokens(user.tier, tierThemes);
  const cfEntry = tierThemes[tokens.key] || tierThemes[user.tier] || {};

  // Nombre del tier. FIX UAT ronda 1 (2026-07-06): para variantes CENIT el
  // displayName del CF es el del tier BASE (los tokens colapsan cenit→base) y
  // PISABA el nombre completo ("LifeMiles Diamond" en vez de "Diamond Cenit One
  // Million"). Con cenit: manda la string del SERVICIO (AC: el nombre completo
  // llega en `tier`); sin cenit: CF displayName (por locale) → servicio → base.
  const hasCenit = (user?.cenit?.level ?? null) != null;
  // Strip del prefijo de marca ("LifeMiles Gold" → "Gold") para alinear con Figma
  // (el header usa nombres cortos, contexto-figma §A) y con los labels de las
  // barras (que ya lo hacen). Solo sin cenit: el nombre cenit del servicio
  // ("Diamond Cenit One Million") no lleva prefijo, y el base "Lifemiles" no se
  // toca (el `\s+` exige una palabra después del prefijo).
  const stripBrand = (s) => String(s).replace(/^\s*lifemiles\s+/i, '').trim();
  const tierName = (hasCenit && user.tier)
    ? user.tier
    : stripBrand(cfEntry.displayName || user.tier || capitalize(tokens.key));

  // Saludo: con nombre o variante sin nombre (§7.3).
  const firstName = (user.firstName || '').trim();
  const greeting = firstName
    ? (labels.headerGreeting || 'Hola, {name}').replace('{name}', firstName)
    : (labels.headerGreetingNoName || 'Hola');

  // "| Vence:" se muestra solo para tiers que vencen (NO Lifemiles base, NO
  // Cenit) y solo si hay fecha (§7.3: sin fecha → ocultar el segmento entero).
  const cenitLevel = user?.cenit?.level ?? null;
  const showVence = tokens.key !== 'lifemiles' && cenitLevel == null && !!statusExpiry;

  const numberFmt = (n) => {
    try { return new Intl.NumberFormat(lang).format(n); } catch (e) { return String(n); }
  };
  const milesUnit = labels.milesUnit || 'millas';
  // Empty: sin millas → "0 millas"; sin fecha de vencimiento de millas → "–".
  const milesText = balance?.totalMiles != null
    ? `${numberFmt(balance.totalMiles)} ${milesUnit}`.trim()
    : `0 ${milesUnit}`.trim();
  const expiryText = balance?.milesExpiryDate ? formatDate(balance.milesExpiryDate, lang) : '–';

  const bgGradient = `linear-gradient(90deg, ${tokens.gradientStrongFrom} ${tokens.gradientStrongFromStop}, ${tokens.gradientStrongTo} ${tokens.gradientStrongToStop})`;

  // Breadcrumb: home ("Mi Lifemiles") + niveles. Desktop 3, mobile 2 (§A).
  const bcHome = {
    isHome: true, url: `/${lang}/members`, label: labels.breadcrumbMyLifemiles || 'Mi Lifemiles',
  };
  const bcAccount = { url: `/${lang}/members/profile`, label: labels.breadcrumbAccount || 'Cuenta Lifemiles' };
  // Crumb activo: el shell account (1279360) reemplaza el label vía
  // `activeCrumbLabel` (aditivo); sin él, el label elite intacto.
  const bcElite = {
    label: activeCrumbLabel || labels.breadcrumbElite || 'Progreso Elite y beneficios',
    isActive: true,
  };
  const breadcrumbHome = labels.breadcrumbMyLifemiles || 'Mi Lifemiles';

  // CTA "Mi Lifemiles ›" (1279360, gated): solo desktop, solo si enabled. Default
  // (null/off) → el header elite queda byte-idéntico (misma clase `md:block`).
  const hasHeaderCta = !!(headerCta && headerCta.enabled);

  // Balance box: dos data-pairs con divisor. bg = overlay del tier.
  // Figma 765:65049 (tablet 768-1023) / 765:65087 (desktop ≥1024): label
  // Static2 14px Regular blanco; valor 18px SemiBold en tablet / 18px Bold en
  // desktop, blanco. Padding 16/16/12/16 (top/x/bottom), rounded 16, gap-41
  // entre los dos pares. Ancho: mobile full-width; **≥768px ancho FIJO 317px**
  // (285 inner + 32 padding lateral) según spec Figma.
  // Tipografía responsive:
  //  - `<768px` (mobile) → label + valor 14px / 19px (spec original mobile)
  //  - `768-1023px` (tablet) → label 14px, valor 18px / 24px SemiBold
  //  - `≥1024px` (desktop) → label 14px, valor 18px / 24px Bold
  // `!text-*` / `!leading-*`: `span` / reglas base globales pueden pisar las
  // utilidades — important las fuerza al spec.
  // `align` controla la alineación interna del pair:
  //  - 'start' (default) → label + valor a la izquierda (pair izquierdo).
  //  - 'end' → label + valor a la derecha (pair derecho, Figma 1059:65545).
  const dataPair = (label, value, align = 'start') => {
    const alignClass = align === 'end' ? 'items-end text-right' : 'items-start';
    return html`
      <div class="flex flex-col gap-[2px] min-w-0 ${alignClass}">
        <span class="!text-[14px] !leading-[19px] antialiased whitespace-nowrap">${label}</span>
        <span class="!text-[14px] !leading-[19px] md:!text-[18px] md:!leading-[24px] font-semibold lg:font-bold whitespace-nowrap">${value}</span>
      </div>
    `;
  };

  const balanceBox = html`
    <div
      class="rounded-2xl pt-4 pb-3 px-4 flex items-center justify-between gap-x-[41px] w-full md:w-[317px] shrink-0"
      style=${{ backgroundColor: tokens.overlay, borderColor: tokens.borderAccent }}
    >
      ${dataPair(labels.youHaveLabel || 'Tienes', milesText, 'start')}
      ${dataPair(labels.milesExpiryLabel || 'Fecha de vencimiento', expiryText, 'end')}
    </div>
  `;

  return html`
    ${/* Full-bleed (refinamiento 2026-07-14 puntos 1.3/2.1): el gradiente va en
        la CSS var `--elite-header-bg` y lo pinta el ::before de 100vw definido
        en styles.css (.members-elite-header::before, patrón has-custom-bg).
        Sin overflow-hidden (clipearía el breakout) ni rounded-2xl (Figma
        765:64978: el hero full-width no tiene esquinas en ningún breakpoint).
        El cóndor (`EliteHeaderCondor`, <img> del vector 117×131) se ancla al
        CONTENIDO vía styles.css: desktop abajo-izquierda de la balance box
        (bottom:0, right:368px medido en Figma). */ ''}
    <div
      class="members-elite-header relative z-0 pt-6 pb-8 md:pt-8"
      style=${{ '--elite-header-bg': bgGradient, color: tokens.text }}
      data-name="members-elite-header"
      data-tier=${tokens.key}
    >
      <${EliteHeaderCondor} />

      <div class="relative z-10 flex flex-col gap-6 lg:gap-8">
        ${/* Breadcrumb: 3 niveles desktop/tablet, 2 niveles mobile (§A). El shell
            account (1279360) agrega el CTA "Mi Lifemiles ›" a la derecha de la
            fila desktop (flex justify-between) SOLO cuando `headerCta.enabled`. */ ''}
        <div class=${`hidden ${hasHeaderCta ? 'md:flex md:items-center md:justify-between md:gap-4' : 'md:block'}`}>
          <${Breadcrumb} tone="dark" homeLabel=${breadcrumbHome} items=${[bcHome, bcAccount, bcElite]} alwaysShowHomeLabel=${true} />
          ${/* CTA "Mi Lifemiles ›" — Figma `1056:32654` (Action Button, 113×24):
              texto Static1 (16px) Regular blanco + chevron-right 24×24, gap 4px.
              SIN border/background/padding/pill (es un text link con ícono, no
              un botón outlined). El SVG chevron va inline (viewBox 16, `currentColor`)
              en lugar del atom Icon: (1) evita paint-flash del cache async del atom
              en un elemento above-the-fold, (2) el path 30.88%×50% del slot coincide
              exacto con el `chevron-right.svg` original — solo escala del viewBox 16
              al display 24×24. */ ''}
          ${hasHeaderCta ? html`
            <a
              href=${headerCta.href || '#'}
              data-name="members-header-cta"
              class="inline-flex items-center gap-[var(--spacing-tiny)] shrink-0 h-6 text-base leading-none whitespace-nowrap transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-stroke-focus"
            >
              <span>${headerCta.label || ''}</span>
              <svg
                class="shrink-0 w-6 h-6"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M6.47027 4L5.53027 4.94L8.58361 8L5.53027 11.06L6.47027 12L10.4703 8L6.47027 4Z"
                  fill="currentColor"
                />
              </svg>
            </a>
          ` : null}
        </div>
        <div class="md:hidden">
          ${/* Mobile: home con ícono + label (Figma 1059:65517 "🏠 Mi Lifemiles").
              alwaysShowHomeLabel fuerza el texto también en mobile. */ ''}
          <${Breadcrumb} tone="dark" homeLabel=${breadcrumbHome} items=${[bcHome, bcElite]} alwaysShowHomeLabel=${true} />
        </div>

        <div class="flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-8">
          <div class="flex flex-col gap-[4px] min-w-0 pb-[4px]">
            ${/* Saludo SemiBold, tipografía responsive:
                 - `<1024px` → 18px / 24px line-height
                 - `≥1024px` → 24px / 32px line-height
                `!text-*` / `!leading-*`: una regla base sin @layer
                `h1 { font-size / line-height }` vence a las utilidades Tailwind
                (mismo gotcha que button/p); important las fuerza al spec. */ ''}
            <h1 class="!m-0 !text-[18px] !leading-[24px] lg:!text-[24px] lg:!leading-[32px] font-semibold">${greeting}</h1>
            ${/* Línea [tier] | Vence: fecha. Figma 765:51857/51860: nombre y
                "Vence" MISMO peso (Regular, no bold). Tipografía responsive:
                 - `<1024px` → 14px / 19px line-height
                 - `≥1024px` → 18px / 24px line-height
                `!text-*` / `!leading-*`: el `p { clamp() }` global sin @layer
                vence a las utilidades Tailwind — important las fuerza al spec.
                Los 3 spans hijos (tierName, separador, Vence) heredan tamaño y
                line-height del <p>. */ ''}
            <p class="!m-0 !text-[14px] !leading-[19px] lg:!text-[18px] lg:!leading-[24px]">
              <span>${tierName}</span>${showVence
  ? html`<span class="relative -top-px px-2 text-[rgba(217,217,217,0.50)]" aria-hidden="true">|</span>
  <span>${labels.headerExpiresLabel || 'Vence:'} ${formatDate(statusExpiry, lang)}</span>`
  : ''}
            </p>
          </div>
          ${balanceBox}
        </div>
      </div>
    </div>
  `;
};

export default MembersEliteHeader;
