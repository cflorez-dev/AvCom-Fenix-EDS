import { h } from '@dropins/tools/preact.js';
import { useState, useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Button } from '../../atoms/button/button.js';
import { BookingBox } from '../booking-box/booking-box.js';
import { sanitizeHTMLAsync, isSafeUrl } from '../../../scripts/utils/sanitize.js';

const html = htm.bind(h);

// AEM richtext fields are emitted wrapped in a block element: a <p>...</p> for
// plain text, or a heading (<h1>-<h6>, optionally with an id) when the author
// applies Heading formatting. Injecting that block inside our own titleLevel
// heading would nest invalidly (e.g. <h6><h1>…</h1></h6>) — invalid HTML, bad
// for a11y/SEO, and the nested heading inherits the global h1-h6 styles
// (margin 0.8em/0.25em, line-height 1.25, weight 600), which is the root cause
// of bug 1258888/1258898 (extra top/bottom space on the title). Strip a single
// outer <p> or heading wrapper, keeping only its inner (inline) content so the
// titleLevel element remains the one and only heading.
const stripOuterParagraph = (raw) => {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  const match = trimmed.match(/^<(p|h[1-6])\b[^>]*>([\s\S]*)<\/\1>$/i);
  return match ? match[2].trim() : trimmed;
};

// Parsing seguro de input numérico para offsets/blur (acepta vacío como 0,
// negativos para offsets, y rechaza cualquier cosa que no sea un número entero o decimal).
const parsePxInput = (value) => {
  if (value === undefined || value === null || value === '') return 0;
  const trimmed = String(value).trim();
  if (trimmed === '') return 0;
  // Permite negativos para offsets, decimales opcionales
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) return 0;
  return parseFloat(trimmed);
};

// Valida un color HEX (3, 4, 6 u 8 dígitos) y normaliza el formato.
// Acepta también palabras CSS estándar y rgb/rgba.
const HEX_COLOR_RE = /^#[0-9a-fA-F]{3,8}$/;
const RGB_COLOR_RE = /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*(?:\d*\.?\d+)\s*)?\)$/;
const CSS_NAMED_COLOR_RE = /^[a-zA-Z]+$/; // currentColor, transparent, red, etc.

const isSafeShadowColor = (value) => {
  if (!value || typeof value !== 'string') return false;
  const v = value.trim();
  return HEX_COLOR_RE.test(v) || RGB_COLOR_RE.test(v) || CSS_NAMED_COLOR_RE.test(v);
};

// Compone el valor CSS final de text-shadow desde los 4 inputs del autor.
// Si el color es inválido cae a un default seguro (negro 25%).
const buildTextShadow = (offsetX, offsetY, blur, color) => {
  const x = parsePxInput(offsetX);
  const y = parsePxInput(offsetY);
  const b = Math.max(0, parsePxInput(blur));
  const safeColor = isSafeShadowColor(color) ? color.trim() : '#00000040';
  return `${x}px ${y}px ${b}px ${safeColor}`;
};

const ALIGN_CLASSES = {
  left: 'text-left items-start',
  center: 'text-center items-center',
  right: 'text-right items-end',
};

const COLOR_VARS = {
  light: 'var(--text-normal-lighter)',
  dark: 'var(--text-normal-primary)',
};

export const CmsNewHeroBanner = ({
  title = '',
  titleLevel = 'h1',
  description = '',
  imageAlt = '',
  loading = 'eager',
  contentAlignment = 'left',
  textColor = 'light',
  showTextShadow = false,
  textShadowOffsetX = '0',
  textShadowOffsetY = '2',
  textShadowBlur = '8',
  textShadowColor = '#00000025',
  actionMode = 'none',
  ctaText = '',
  ctaUrl = '',
  defaultTripType = 'round-trip',
  actionButtons = [],
  i18n = {},
  customClassName = '',
  ...rest
}) => {
  const [sanitizedDescription, setSanitizedDescription] = useState('');

  // El overlap del BookingBox (qué tanto sobresale debajo de la imagen) ya está
  // definido como tokens fijos por breakpoint en el CSS: 84/200/208 px
  // (desktop/tablet/mobile) según Figma HOME-13052026. No se calcula dinámicamente.

  // Sanitize description (rich text from CMS) on mount/update
  useEffect(() => {
    let cancelled = false;
    sanitizeHTMLAsync(description, {
      USE_PROFILES: { html: true },
      ADD_ATTR: ['style', 'target', 'rel', 'title'],
    }).then((clean) => {
      if (!cancelled) setSanitizedDescription(clean);
    });
    return () => { cancelled = true; };
  }, [description]);

  // Compose inline style for text-shadow only when toggle is active.
  // The 4 inputs are validated and composed into a single CSS value.
  const textShadowValue = buildTextShadow(
    textShadowOffsetX,
    textShadowOffsetY,
    textShadowBlur,
    textShadowColor,
  );
  const textShadowStyle = showTextShadow ? { textShadow: textShadowValue } : {};

  const colorStyle = { color: COLOR_VARS[textColor] || COLOR_VARS.light };
  const combinedStyle = { ...colorStyle, ...textShadowStyle };

  const alignClass = ALIGN_CLASSES[contentAlignment] || ALIGN_CLASSES.left;

  // CTA button URL safety
  const safeCtaUrl = isSafeUrl(ctaUrl) ? ctaUrl : '#';

  return html`
    <section
      class="cms-new-hero-banner relative w-full ${customClassName}"
      data-loading=${loading}
      data-action-mode=${actionMode}
      ...${rest}
    >
      <div class="cms-new-hero-banner__bg" role=${imageAlt ? 'img' : 'presentation'} aria-label=${imageAlt || undefined}></div>

      <div class="cms-new-hero-banner__content w-full max-w-[1312px] px-4 md:px-6 lg:px-8">
        <div class="cms-new-hero-banner__text flex flex-col gap-0 md:gap-[4px] ${alignClass}" style=${combinedStyle}>
          <${titleLevel} class="cms-new-hero-banner__title !m-0" dangerouslySetInnerHTML=${{ __html: stripOuterParagraph(title) }} />
          ${sanitizedDescription && html`
            <div class="cms-new-hero-banner__description" dangerouslySetInnerHTML=${{ __html: sanitizedDescription }} />
          `}
          ${actionMode === 'button' && ctaText && html`
            <div class="cms-new-hero-banner__cta mt-6">
              <${Button} variant="primary" size="md" href=${safeCtaUrl}>${ctaText}</${Button}>
            </div>
          `}
        </div>

        ${actionMode === 'booking' && html`
          <div class="cms-new-hero-banner__booking">
            <${BookingBox}
              actionButtons=${actionButtons}
              defaultTripType=${defaultTripType}
              i18n=${i18n}
            />
          </div>
        `}
      </div>
    </section>
  `;
};

export default CmsNewHeroBanner;
