import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { Accordion } from '../accordion/accordion.js';
import { Icon } from '../../atoms/icon/icon.js';
import { Button } from '../../atoms/button/button.js';

const html = htm.bind(h);

/**
 * BenefitCategoryCard — una card del catálogo de Beneficios por estatus
 * (1271693, bloque 9 · componente BenefitsCards de Figma). REWORK diamond
 * (2026-07-23, Figma desktop 765:40353 / mobile 765:40680): card `rounded-16`
 * + caja interna DASHED `rounded-12`, header (overline + título 28px en color
 * del tier + chip ícono `--bg-hover-light`) + filas de sub-beneficio (label izq
 * en `--text-normal-primary` → valor der, divisor solid entre filas) + CTA
 * al pie.
 *
 * Responsive (decisión del contenedor BenefitsCatalog vía `collapsible`):
 *  - **Desktop** (`collapsible=false`, Figma 765:40353): SIN Accordion. Layout
 *    plano con eyebrow + título a la IZQUIERDA y chip 45×45 top-RIGHT.
 *    Contenido siempre abierto, CTA anclado bottom-right.
 *  - **Mobile** (`collapsible=true`, Figma 765:40680): usa `Accordion`. Header
 *    con chip 32×32 a la IZQUIERDA + [eyebrow + título] + chevron top-right.
 *    La 1ª categoría abre por defecto (AC), el resto colapsadas.
 *
 * El valor de cada sub-beneficio es TIPADO (`value.kind`). Pixel-smoke vs
 * Figma diamond (765:40353/40680):
 *  - `count`     → "N de M"       → **ambos en TIER COLOR** (número 24px bold
 *                                   + " de M" 14px regular, baseline align).
 *  - `discount`  → "X% descuento" → oscuro.
 *  - `unlimited` → "Ilimitado"    → oscuro.
 *  - `na`        → "No aplica"    → oscuro (Figma 765-38911: bold, NO gris).
 *
 * ## Props
 * - `category`: VM de categoría (`toBenefitsCatalogVM`): `{ key, title, eyebrow,
 *   icon, ctaLabel, ctaUrl, subBenefits:[{ label, value:{kind,amount?,percent?} }] }`.
 *   `title` ya resuelto por el contenedor (labels[titleKey] || title del CF).
 * - `labels`: i18n (`benefitsValue*`).
 * - `tierColor`: hex del tier (theming `getEliteTierTokens(tier).overlay`) para
 *   el TÍTULO de la categoría Y el valor `count`. Nunca hex quemado.
 * - `collapsible`: boolean — mobile = solo la 1ª abierta; desktop (false) = todas
 *   abiertas por defecto (accordion en ambos modos).
 * - `defaultOpen`: boolean — apertura inicial en mobile (la 1ª categoría). En
 *   desktop se ignora (siempre abierta).
 * - `formatNumber`: (n)=>string — formateo del contador por locale.
 * - `onToggle`: (open:boolean)=>void — solo aplica en modo accordion.
 * - `customClassName`: string.
 */

/** Interpolación simple `{n}` para los templates de valor. */
const tpl = (template, params = {}) => String(template || '').replace(
  /\{(\w+)\}/g,
  (m, k) => (params[k] !== undefined && params[k] !== null ? String(params[k]) : m),
);

/** Ícono ilustrativo: key del átomo Icon o URL de imagen del DAM. */
const CategoryIcon = ({ icon, size = 24 }) => {
  if (!icon) return null;
  const isUrl = /^(https?:\/\/|\/)/.test(icon);
  return isUrl
    ? html`<img src=${icon} alt="" style=${{ width: `${size}px`, height: `${size}px` }} class="object-contain" />`
    : html`<${Icon} icon=${icon} customSize=${size} />`;
};

/** Valor localizado según su kind. Para `count`, Figma diamond desktop
 *  (765:40353) / mobile (765:40680) muestra el número DISPONIBLE y el sufijo
 *  " de {total}" AMBOS en **tier color**, alineados por baseline: número
 *  bold 24px + sufijo regular 14px → devuelve un contenedor con los dos
 *  tramos. `total` es el máximo POR TIER (config, Plan B); si falta → se muestra
 *  SOLO el número disponible, SIN " de M" (LM entrega el disponible pero no el
 *  máximo del tier — `totalAccrual` es histórico, no el otorgado).
 *  `value.suffix` sustituye el sufijo por defecto (Figma Silver 765:39295 card
 *  Equipaje: "1 piezas adicionales"). Los otros kinds devuelven string plano
 *  (dark bold, sin color de tier). `text` devuelve `value.text` tal cual (Figma
 *  card Abordaje: "Grupo B"). */
const valueText = (value, labels, formatNumber, tierColor) => {
  const kind = value?.kind;
  if (kind === 'count') {
    // Sufijo " de {total}" SOLO si hay máximo (`value.total`). Si falta (LM da el
    // DISPONIBLE pero no el máximo del tier — gate Plan B) → solo el número, sin
    // denominador. `value.suffix` custom siempre gana (Figma Silver 765:39295).
    let suffix = '';
    if (value.suffix) suffix = String(value.suffix);
    else if (value.total != null) {
      suffix = tpl(labels.benefitsValueCountSuffix, { total: formatNumber(value.total) });
    }
    return html`
      <span class="inline-flex items-end gap-[4px] whitespace-nowrap" style=${{ color: tierColor }}>
        <span class="text-[24px] font-bold leading-[24px]">${formatNumber(value.amount)}</span>
        ${suffix && html`<span class="text-[14px] font-normal leading-normal">${suffix}</span>`}
      </span>`;
  }
  if (kind === 'discount') return tpl(labels.benefitsValueDiscount, { n: value.percent });
  if (kind === 'unlimited') return labels.benefitsValueUnlimited || '';
  if (kind === 'text') return value.text || '';
  return labels.benefitsValueNa || ''; // na (o kind desconocido)
};

/**
 * Fila de sub-beneficio: label (izq, puede ir a 2 líneas) → valor (der). Divisor
 * arriba salvo en la primera fila. Pixel-smoke vs Figma diamond 765:40353/40680:
 *  · `count`     → número 24px bold + " de N" 14px regular, **ambos en TIER
 *                  COLOR** (baseline align, gap 4px).
 *  · `discount`  → texto oscuro bold (`--text-normal-primary`).
 *  · `unlimited` → "Ilimitado" oscuro bold.
 *  · `text`      → string tal cual (Figma Silver card Abordaje: "Grupo B").
 *  · `na`        → "No aplica" oscuro bold (Figma 765-38911, NO gris).
 *
 * Extensiones opcionales (Figma Silver 765:39295):
 *  · `sub.labelIcon` → ícono pequeño (16×16) antes del label (card Equipaje:
 *    "🧳 Equipaje de bodega (23 kg)").
 *  · `sub.labelBold` → tramo bold anclado al final del label (card Bono Elite:
 *    "Acumulables **en tus vuelos con Avianca**").
 */
const SubBenefitRow = ({
  sub, labels, formatNumber, showDivider, tierColor,
}) => {
  const kind = sub?.value?.kind;
  // Valores no-count en texto oscuro bold. Para `count` el color se aplica
  // dentro de `valueText` (spans en tier color, baseline align).
  const valueClass = 'text-[var(--text-normal-primary)] font-semibold';
  // `none` = fila puramente descriptiva (Figma Silver 765:39295 card Equipaje
  // row 1 "🧳 Equipaje de bodega (23 kg)"): sin columna de valor a la derecha,
  // el label ocupa todo el ancho.
  const hideValue = kind === 'none';
  return html`
    <div
      class=${`flex items-center justify-between gap-3 ${showDivider ? 'mt-3 pt-3 border-t border-dashed border-[var(--border-stroke-default)]' : ''}`}
      data-name="benefit-subitem"
      data-kind=${kind || ''}
    >
      <span class="flex-1 min-w-0 flex items-center gap-2 text-[14px] font-normal leading-normal text-[var(--text-normal-primary)]">
        ${sub.labelIcon ? html`<span class="shrink-0 text-[var(--icon-normal-primary)]" data-name="benefit-subitem-icon"><${CategoryIcon} icon=${sub.labelIcon} size=${16} /></span>` : null}
        <span class="min-w-0">
          ${sub.label}${sub.labelBold ? html` <strong class="font-semibold text-[var(--text-normal-primary)]">${sub.labelBold}</strong>` : null}
        </span>
      </span>
      ${hideValue ? null : html`
        <span
          class=${`shrink-0 leading-normal whitespace-nowrap text-right ${kind === 'count' ? '' : `text-[14px] ${valueClass}`}`}
          data-name="benefit-value"
        >${valueText(sub.value, labels, formatNumber, tierColor)}</span>
      `}
    </div>
  `;
};

/** CTA de la card (Figma 765:39056): pill outlined blanco con borde 2px dark,
 *  texto Bold 14px, radius 32px. Estados hover/active/focus + focus-visible ring
 *  provistos por el átomo `Button` (variant="secondary", size="xs"). `href`
 *  hace que renderice `<a>` automáticamente. Se omite si no hay `ctaLabel`. */
const CardCta = ({ label, url }) => {
  if (!label) return null;
  return html`
    <${Button}
      variant="secondary"
      size="xs"
      href=${url || null}
      customClassName="self-end mt-auto !text-[14px] !leading-normal !font-bold"
      data-name="benefit-cta"
    >${label}</${Button}>
  `;
};

export const BenefitCategoryCard = ({
  category = null,
  labels = {},
  tierColor = 'var(--text-normal-primary)',
  collapsible = false,
  defaultOpen = false,
  formatNumber = (n) => Number(n || 0).toLocaleString('es-CO'),
  onToggle = null,
  customClassName = '',
  ...rest
}) => {
  if (!category) return null;
  const {
    title = '',
    eyebrow = '',
    icon = '',
    ctaLabel = '',
    ctaUrl = '',
    subBenefits = [],
    footnote = '',
    footnoteIcon = '',
    disclaimer = '',
  } = category;

  // ── Nodos compartidos header ─────────────────────────────────────────────
  // Tokens Figma (diamond desktop 765:40894 / mobile 765:41218):
  //  · Título de categoría: `h3` (Red Hat SemiBold, 28px) — **igual mobile+desktop**.
  //  · Eyebrow: `static1` Regular 16px en `--text-normal-primary` (#1b1b1b).
  //  · Chip ícono: `--bg-hover-light` circle. Mobile 32×32 (ícono 20px), desktop
  //    45×45 (ícono 28px). Ícono `--icon-normal-primary`.
  // Tipografía por Figma (mobile 765:66695 / tablet 765:66925 / desktop 765:67182):
  // Título de categoría 28px `Regular` con `leading-normal` — **igual en todos
  // los breakpoints** (el refresh visual 2026-07 unifica el peso del título:
  // ya no es h3 SemiBold histórico).
  const titleNode = html`<span class="text-[28px] font-normal leading-normal" style=${{ color: tierColor }}>${title}</span>`;
  const eyebrowNode = eyebrow
    ? html`<span class="text-[16px] font-normal leading-normal text-[var(--text-normal-primary)]">${eyebrow}</span>`
    : null;
  const iconChipMobile = icon
    ? html`<span class="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[var(--bg-hover-light)] text-[var(--icon-normal-primary)]" data-name="benefit-category-icon"><${CategoryIcon} icon=${icon} size=${20} /></span>`
    : null;
  const iconChipDesktop = icon
    ? html`<span class="shrink-0 flex items-center justify-center w-[45px] h-[45px] rounded-full bg-[var(--bg-hover-light)] text-[var(--icon-normal-primary)]" data-name="benefit-category-icon"><${CategoryIcon} icon=${icon} size=${28} /></span>`
    : null;

  // Caja interna dashed alrededor de las filas (pixel-smoke Figma diamond
  // 765:40353 / 765:40680): `rounded-[12px]`, `border-dashed`, padding 12px.
  // Los divisores solid entre sub-beneficios quedan DENTRO de la caja.
  const rows = html`
    <div class="rounded-[12px] border border-dashed border-[var(--border-stroke-default)] p-3" data-name="benefit-subitems-box">
      <div class="flex flex-col w-full" data-name="benefit-subitems">
        ${subBenefits.map((sub, i) => html`
          <${SubBenefitRow}
            key=${sub.label || i}
            sub=${sub}
            labels=${labels}
            formatNumber=${formatNumber}
            tierColor=${tierColor}
            showDivider=${i > 0}
          />
        `)}
      </div>
    </div>
  `;

  // Nota al pie (opcional): banner gris al fondo del cuerpo de la card
  // (Figma desktop 765:38701, card Equipaje: "15% de descuento en la compra de
  // equipaje..."). Solo se pinta si el CF/config lo declara. `footnoteIcon`
  // permite override por card (Figma Silver 765:39295 usa `action/lock` en la
  // card Equipaje); default `alert/info`.
  const footnoteNode = footnote ? html`
    <div class="flex items-start gap-2 rounded-xl bg-[var(--bg-hover-light)] px-3 py-2" data-name="benefit-category-footnote">
      <${Icon} icon=${footnoteIcon || 'alert/info'} customSize=${16} color="var(--icon-normal-primary)" />
      <span class="text-[13px] font-normal leading-[18px] text-[var(--text-normal-secondary)]">${footnote}</span>
    </div>
  ` : null;

  // Disclaimer (opcional): nota plana con asterisco, sin caja ni ícono
  // (Figma Silver 765:39295 card Asientos: "*No aplica para tarifas Basic
  // y Light"). Se pinta DEBAJO del footnote y ANTES del CTA.
  const disclaimerNode = disclaimer ? html`
    <p class="text-[13px] font-normal leading-[18px] text-[var(--text-normal-secondary)] mt-1" data-name="benefit-category-disclaimer">${disclaimer}</p>
  ` : null;

  const cardClass = `flex flex-col h-full bg-white rounded-[16px] border border-[var(--border-stroke-default)] p-4 ${customClassName}`;

  // ── DESKTOP (`collapsible=false`, Figma 765:38701) ─────────────────────────
  // Layout SIN accordion: eyebrow + título a la IZQUIERDA, ícono top-RIGHT
  // (SIN fondo). Sin chevron; contenido siempre abierto. Botón CTA anclado
  // bottom-right. Se preserva `flex-1` en el body para alinear al pie las
  // 3 columnas del grid (`items-stretch` del contenedor).
  if (!collapsible) {
    return html`
      <section
        class=${cardClass}
        data-name="benefit-category-card"
        data-category=${category.key || ''}
        data-mode="static"
        ...${rest}
      >
        <header class="flex items-start justify-between gap-3" data-name="benefit-category-header">
          <span class="flex flex-col gap-[4px] min-w-0">
            ${eyebrowNode}
            ${titleNode}
          </span>
          ${iconChipDesktop}
        </header>
        <div class="flex flex-col w-full gap-3 mt-4 flex-1">
          ${rows}
          ${footnoteNode}
          ${disclaimerNode}
        </div>
        <div class="flex justify-end mt-4">
          <${CardCta} label=${ctaLabel} url=${ctaUrl} />
        </div>
      </section>
    `;
  }

  // ── MOBILE (`collapsible=true`, Figma 765:38908) ──────────────────────────
  // Accordion: ícono a la IZQUIERDA + [eyebrow + título] + chevron top-right.
  // La 1ª categoría abre por defecto (AC); el resto colapsadas.
  // Header mobile (Figma 765:66701): chip 32×32 + gap-8 + [eyebrow + título]
  // apilados SIN gap (los items se encadenan directo, sin aire entre eyebrow
  // y título).
  const accordionHeader = html`
    <span class="flex items-start gap-2">
      ${iconChipMobile}
      <span class="flex flex-col text-left min-w-0">
        ${eyebrowNode}
        ${titleNode}
      </span>
    </span>
  `;

  return html`
    <section
      class=${cardClass}
      data-name="benefit-category-card"
      data-category=${category.key || ''}
      data-mode="accordion"
      ...${rest}
    >
      <${Accordion}
        title=${accordionHeader}
        defaultOpen=${defaultOpen}
        onToggle=${onToggle}
        chevronColor="var(--icon-normal-primary)"
        customClassName="!gap-2"
      >
        <div class="flex flex-col w-full gap-4">
          ${rows}
          ${footnoteNode}
          ${disclaimerNode}
          <${CardCta} label=${ctaLabel} url=${ctaUrl} />
        </div>
      </${Accordion}>
    </section>
  `;
};

export default BenefitCategoryCard;
