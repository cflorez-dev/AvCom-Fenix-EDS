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
 */
export const MembersEliteHeader = ({
  user = {},
  balance = {},
  statusExpiry = null,
  tierThemes = {},
  labels = {},
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
  const bcElite = { label: labels.breadcrumbElite || 'Progreso Elite y beneficios', isActive: true };
  const breadcrumbHome = labels.breadcrumbMyLifemiles || 'Mi Lifemiles';

  // Balance box: dos data-pairs con divisor. bg = overlay del tier.
  // Figma 765:51861: label Static2 14px Regular blanco; valor size/medium 18px
  // Bold blanco. AMBOS valores ("X millas" y la fecha) mismo tamaño/peso.
  const dataPair = (label, value) => html`
    <div class="flex flex-col gap-1 min-w-0">
      <span class="text-sm leading-tight">${label}</span>
      <span class="text-lg font-bold leading-tight whitespace-nowrap">${value}</span>
    </div>
  `;

  const balanceBox = html`
    <div
      class="rounded-2xl px-4 py-3 md:px-5 md:py-4 flex items-stretch gap-4 md:gap-6 w-full md:w-auto shrink-0 border-l-4 md:border-l-0"
      style=${{ backgroundColor: tokens.overlay, borderColor: tokens.borderAccent }}
    >
      ${dataPair(labels.youHaveLabel || 'Tienes', milesText)}
      <div class="w-px self-stretch bg-white/25" aria-hidden="true"></div>
      ${dataPair(labels.milesExpiryLabel || 'Fecha de vencimiento', expiryText)}
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
    <header
      class="members-elite-header relative p-4 md:p-6 lg:p-8 min-h-fit lg:min-h-[190px]"
      style=${{ '--elite-header-bg': bgGradient, color: tokens.text }}
      data-name="members-elite-header"
      data-tier=${tokens.key}
    >
      <${EliteHeaderCondor} />

      <div class="relative z-10 flex flex-col gap-4 lg:gap-6">
        ${/* Breadcrumb: 3 niveles desktop/tablet, 2 niveles mobile (§A). */ ''}
        <div class="hidden md:block">
          <${Breadcrumb} tone="dark" homeLabel=${breadcrumbHome} items=${[bcHome, bcAccount, bcElite]} />
        </div>
        <div class="md:hidden">
          <${Breadcrumb} tone="dark" homeLabel=${breadcrumbHome} items=${[bcHome, bcElite]} />
        </div>

        <div class="flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-8">
          <div class="flex flex-col gap-1 min-w-0">
            ${/* Saludo 24px SemiBold. `!text-2xl`: una regla base sin @layer
                `h1 { font-size }` vence a la utilidad Tailwind (mismo gotcha que
                button/p); important la fuerza a 24px. */ ''}
            <h1 class="!m-0 !text-2xl font-semibold leading-tight">${greeting}</h1>
            ${/* Línea [tier] | Vence: fecha. Figma 765:51857/51860: 18px Regular
                blanco, nombre y "Vence" MISMO peso (no bold). `!text-lg`: el
                `p { clamp() }` global sin @layer vence a text-lg en <p>. */ ''}
            <p class="!m-0 !text-lg leading-tight">
              <span>${tierName}</span>${showVence
  ? html` <span aria-hidden="true">|</span> ${labels.headerExpiresLabel || 'Vence:'} ${formatDate(statusExpiry, lang)}`
  : ''}
            </p>
          </div>
          ${balanceBox}
        </div>
      </div>
    </header>
  `;
};

export default MembersEliteHeader;
