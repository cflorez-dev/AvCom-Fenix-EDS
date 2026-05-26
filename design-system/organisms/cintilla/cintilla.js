import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { processContentHTML } from '../../helpers/process-content-html.js';

const html = htm.bind(h);

/**
 * Validate that a value is a hex color (#RGB, #RRGGBB, #RRGGBBAA) or rgb/rgba.
 * @param {string} value
 * @returns {boolean}
 */
const isValidColor = (value) => {
  if (!value || typeof value !== 'string') return false;
  return /^(#[0-9a-fA-F]{3,8}|rgba?\([\d\s,.%]+\))$/.test(value.trim());
};

/**
 * Cintilla - Banner organism with configurable bg/text/link colors
 * Uses processContentHTML to render rich text with DS-consistent styling.
 *
 * ## ⚠ Trust assumption
 * `contentHTML` MUST be pre-sanitized by the caller. The organism uses
 * `dangerouslySetInnerHTML` and does NOT sanitize internally (kept pure for
 * Preact functional component compatibility). The CMS block decorator
 * (`blocks/cintilla/cintilla.js`) is responsible for calling
 * `sanitizeHTMLAsync()` from `scripts/utils/sanitize.js` before rendering.
 * The DS sample uses hardcoded HTML so no sanitization is needed there.
 *
 * ## Props
 * - `contentHTML`: `string` – Rich text HTML from CMS (paragraphs + optional <a>).
 *   **Must be pre-sanitized** (use `sanitizeHTMLAsync` upstream).
 * - `bgColor`: `string` – Background color (hex/rgba). Default `#fff1f7`.
 * - `textColor`: `string` – Text color (hex/rgba). Default `#1b1b1b`.
 * - `linkColor`: `string` – Link color (hex/rgba). Default `#ff3093`.
 * - `linkTarget`: `'self' | 'blank'` – Link target attribute (default `'self'`).
 * - `customClassName`: `string` – Additional CSS classes for the root.
 *
 * ## Behavior
 * - Container-level truncation: text is clamped to 2 lines on mobile/tablet (<1024 px),
 *   flows naturally on desktop (≥1024 px). Multi-<p> content is treated as one continuous
 *   block (paragraph margins are reset to 0) so the line count is computed across all <p>.
 * - Min-height 48px (1 línea Figma) on all breakpoints — guards against collapse with
 *   empty or very short content (CU-224/CA4). With 2-line content the height grows
 *   naturally to 74px (texto 42 + py 16*2), matching Figma's multi-line case spec.
 * - Layout: full-width background (via .cintilla-wrapper override in blocks/cintilla.css),
 *   responsive lateral padding (16 mobile / 24 tablet / 32 desktop), constant py-16, and
 *   inner content wrapper limited to max-w-[1248px] centered.
 * - Typography: text-[14px] / leading-[1.5] / font-weight 400 (Red Hat Display Regular).
 * - Color validation: invalid hex/rgba values fall back to default.
 *
 * @example
 * ```javascript
 * <${Cintilla}
 *   contentHTML="<p>¿Tienes dudas? Resuélvelas en nuestro <a href='/help'>Centro de ayuda</a></p>"
 *   bgColor="#fff1f7"
 *   textColor="#1b1b1b"
 *   linkColor="#ff3093"
 * />
 * ```
 */
export const Cintilla = ({
  contentHTML = '',
  bgColor = '#fff1f7',
  textColor = '#1b1b1b',
  linkColor = '#ff3093',
  linkTarget = 'self',
  customClassName = '',
}) => {
  const safeBg = isValidColor(bgColor) ? bgColor : '#fff1f7';
  const safeText = isValidColor(textColor) ? textColor : '#1b1b1b';
  const safeLink = isValidColor(linkColor) ? linkColor : '#ff3093';

  // Process the rich text HTML to apply DS classes + customLinkColor inline.
  // `-my-[2px]` on the link compensates the `p-[2px]` that the link button atom
  // hard-codes in process-content-html (kept for focus-ring spacing). Without
  // this, the inline-flex `<a>` empuja el line-box del `<p>` de 21 a 25 → el
  // cintilla de 1 línea sale en 57 en vez de 53. El negative margin no cambia
  // el tamaño visual del `<a>` ni el focus ring; sólo le dice al flujo que el
  // elemento ocupa 21px verticales en vez de 25.
  const processedContent = processContentHTML(contentHTML, 'informative', {
    pClassName: '!text-[14px] !leading-[21px] !font-normal !m-0',
    customLinkColor: safeLink,
    linkButtonOptions: {
      linkTarget,
      size: 'inline',
      customClassName: '-my-[2px]',
    },
  });

  // Outer container: full-width background (driven full-bleed by .cintilla-wrapper
  // in blocks/cintilla/cintilla.css). Lateral padding is responsive per Figma
  // breakpoints — mobile 16, tablet (≥768) 24, desktop (≥1024) 32 — and vertical
  // padding stays constant at 16 so the 2-line case reaches 74px (matches Figma
  // node 9456-7910). With 1 line the cintilla measures 53px (16+21+16); min-h-[48px]
  // guards against collapse for empty/very short content. Inner wrapper limits
  // content to max-w-[1248px] centered.
  const containerClasses = [
    'w-full',
    'min-h-[48px]',
    'px-[16px]',
    'md:px-[24px]',
    'min-[1024px]:px-[32px]',
    'py-[16px]',
    'flex',
    'flex-col',
    'items-center',
    'justify-center',
    'text-center',
    'font-[family-name:var(--family-red-hat-display,"Red_Hat_Display")]',
    customClassName,
  ].filter(Boolean).join(' ');

  const innerClasses = 'w-full max-w-[1248px] line-clamp-2 min-[1024px]:line-clamp-none';

  return html`
    <div
      data-name="cintilla"
      class=${containerClasses}
      style=${{ backgroundColor: safeBg, color: safeText }}
    >
      <div
        class=${innerClasses}
        dangerouslySetInnerHTML=${{ __html: processedContent }}
      />
    </div>
  `;
};

export default Cintilla;
