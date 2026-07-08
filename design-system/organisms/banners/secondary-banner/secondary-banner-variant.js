import { h } from '@dropins/tools/preact.js';
import {
  useEffect,
  useState,
  useMemo,
} from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import loadSVGIcon from '../../../../scripts/utils/svg.helper.js';

const html = htm.bind(h);

// Inject scoping overrides for SecondaryBannerLeft.
//
// Componente default = uso STANDALONE (ej. dashboard Members):
//   - Banner height lg+: 240px
//   - Image container max-w xl: 540px
//   - Condor bgSVG: height + min-height 220px md (768–1023) / 240px ≥1024 (override de Tailwind md:min-h-[229px]), aspect-ratio 107/120, stroke-width 1.5, width 71.5% ≥1248
//   - Condor vector (nested <svg>): width 214px
//   - CTAs: display:flex, h:52px, min-w:100px, padding 0 16px (24px ≥1024),
//           font 14/19 mobile, 20/26 ≥1024
//   - Heading: <h3> visible / <h4> oculto; line-height 24 mobile / 37 ≥1024
//   - Content padding: 16px mobile / 24px ≥1024
//   - Content gap: 16px mobile / 24px ≥1024
//   - Image desktop md (768–1023): object-fit cover (rellena el alto; lg+ ya usaba cover)
//
// Cuando vive dentro de `.megamenu-banner` se revierte a los valores históricos
// del slot del megamenu:
//   - Banner height ≥1024: 220px
//   - Image container max-w ≥1280: 338px
//   - bgSVG: h-full + aspect-ratio auto (sin restricción), width 80% ≥1248 (Tailwind default)
//   - bgSVG paths: stroke-width 2
//   - Condor vector: width 206px (valor original del atributo SVG)
//   - CTAs: inline-flex, h:32px, padding 0 16px (px-4), sin min-width, font 14/19
//   - Heading: <h4> visible / <h3> oculto (preserva jerarquía semántica del megamenu)
//   - Content padding: 16px (igual a Tailwind default p-[16px])
//   - Content gap: 16px (igual a Tailwind default gap-[16px])
//   - Image desktop md (768–1023): object-fit contain (Tailwind default, letterbox preservado)
//
// IMPORTANTE: las reglas viven dentro de `@layer utilities` (el mismo layer
// donde Tailwind emite las utilities con `!important`). Si fuesen unlayered,
// las utilities `lg:!h-[240px] xl:!h-[240px]` de Tailwind las ganarían — el
// algoritmo de cascade layers da prioridad al layer DEFINIDO MÁS TEMPRANO
// cuando ambas declaraciones son `!important`. Estando en el mismo layer,
// gana la especificidad:
//   - Standalone defaults: `(0,3,0)` (1 attr + 1 attr + 1 class) > Tailwind `(0,1,0)`
//   - Megamenu overrides:  `(0,4,0)` (.megamenu-banner + standalone) > standalone `(0,3,0)`
// Inyectado una sola vez por documento.
const SECONDARY_BANNER_LEFT_STYLE_ID = 'secondary-banner-left-megamenu-overrides';
if (typeof document !== 'undefined' && !document.getElementById(SECONDARY_BANNER_LEFT_STYLE_ID)) {
  const styleEl = document.createElement('style');
  styleEl.id = SECONDARY_BANNER_LEFT_STYLE_ID;
  styleEl.textContent = [
    '@layer utilities {',
    // === STANDALONE defaults (outside .megamenu-banner) ===
    '[data-name="secondary-banner"][data-image-position="left"] .megamenu-svg-image{',
    'height:220px!important;',
    'min-height:220px!important;',
    'top: 0px!important;',
    'aspect-ratio:107/120!important;}',
    // Standalone bgSVG height bump al alcanzar lg (≥1024): banner pasa de 220 → 240px
    '@media(min-width:1024px){',
    '[data-name="secondary-banner"][data-image-position="left"] .megamenu-svg-image{',
    'height:240px!important;',
    'min-height:240px!important;}',
    '}',
    '[data-name="secondary-banner"][data-image-position="left"] .megamenu-svg-image path{',
    'stroke-width:1.5!important;}',
    '[data-name="secondary-banner"][data-image-position="left"] .megamenu-svg-image>svg{',
    'width:214px!important;}',
    // Standalone bgSVG width override at xl (1248px+): 71.5% en lugar del 80% que pone Tailwind
    '@media(min-width:1248px){',
    '[data-name="secondary-banner"][data-image-position="left"] .megamenu-svg-image{',
    'width:71.5%!important;}',
    '}',
    // Standalone CTAs (los <a> dentro de .secondary-banner-content)
    '[data-name="secondary-banner"][data-image-position="left"] .secondary-banner-content a{',
    'display:flex!important;',
    'height:52px!important;',
    'min-width:100px!important;',
    'padding:0 var(--x-large, 16px)!important;',
    'font-size:14px!important;',
    'line-height:19px!important;}',
    '@media(min-width:1024px){',
    '[data-name="secondary-banner"][data-image-position="left"] .secondary-banner-content a{',
    'padding:0 var(--x-large, 24px)!important;',
    'font-size:20px!important;',
    'line-height:26px!important;}',
    '}',
    // Standalone <h3> heading line-height (mobile 24, ≥1024 37)
    '[data-name="secondary-banner"][data-image-position="left"] .secondary-banner-heading-standalone{',
    'line-height:24px!important;}',
    '@media(min-width:1024px){',
    '[data-name="secondary-banner"][data-image-position="left"] .secondary-banner-heading-standalone{',
    'line-height:37px!important;}',
    '}',
    // Standalone .secondary-banner-content padding (16px mobile, 24px ≥1024)
    '[data-name="secondary-banner"][data-image-position="left"] .secondary-banner-content{',
    'padding:16px!important;}',
    '@media(min-width:1024px){',
    '[data-name="secondary-banner"][data-image-position="left"] .secondary-banner-content{',
    'padding:24px!important;}',
    '}',
    // Standalone .secondary-banner-content gap (24px ≥1024; mobile = Tailwind default 16px)
    '@media(min-width:1024px){',
    '[data-name="secondary-banner"][data-image-position="left"] .secondary-banner-content{',
    'gap:24px!important;}',
    '}',
    // Standalone img desktop a md (768–1023): object-fit:cover en lugar de Tailwind
    // `object-contain` para que llene toda la altura del contenedor (sin letterbox).
    // ≥1024 ya usa Tailwind `lg:object-cover`, así que no necesita override.
    '@media(min-width:768px) and (max-width:1023.98px){',
    '[data-name="secondary-banner"][data-image-position="left"] .megamenu-container-image img{',
    'object-fit:cover!important;}',
    '}',
    // === MEGAMENU overrides (revert to historical sizing) ===
    '@media(min-width:1024px){',
    '.megamenu-banner [data-name="secondary-banner"][data-image-position="left"]{',
    'height:220px!important;}',
    '}',
    '@media(min-width:1280px){',
    '.megamenu-banner [data-name="secondary-banner"][data-image-position="left"] .megamenu-container-image{',
    'max-width:338px!important;}',
    '}',
    '.megamenu-banner [data-name="secondary-banner"][data-image-position="left"] .megamenu-svg-image{',
    'height:100%!important;',
    'aspect-ratio:auto!important;}',
    '.megamenu-banner [data-name="secondary-banner"][data-image-position="left"] .megamenu-svg-image path{',
    'stroke-width:2!important;}',
    '.megamenu-banner [data-name="secondary-banner"][data-image-position="left"] .megamenu-svg-image>svg{',
    'width:206px!important;}',
    // Revert bgSVG width al xl:w-[80%] original dentro del megamenu
    '@media(min-width:1248px){',
    '.megamenu-banner [data-name="secondary-banner"][data-image-position="left"] .megamenu-svg-image{',
    'width:80%!important;}',
    '}',
    // Revert CTAs to megamenu sizing (h-[32px] px-4 inline-flex, text-sm 14/19)
    '.megamenu-banner [data-name="secondary-banner"][data-image-position="left"] .secondary-banner-content a{',
    'display:inline-flex!important;',
    'height:32px!important;',
    'min-width:auto!important;',
    'padding:0 16px!important;',
    'font-size:14px!important;',
    'line-height:19px!important;}',
    // Revert .secondary-banner-content padding to megamenu sizing (16px en todos los breakpoints)
    '.megamenu-banner [data-name="secondary-banner"][data-image-position="left"] .secondary-banner-content{',
    'padding:16px!important;}',
    // Revert .secondary-banner-content gap al Tailwind default (16px) dentro del megamenu ≥1024
    '@media(min-width:1024px){',
    '.megamenu-banner [data-name="secondary-banner"][data-image-position="left"] .secondary-banner-content{',
    'gap:16px!important;}',
    '}',
    // Revert img desktop a md dentro del megamenu: mantener `object-contain` original
    '@media(min-width:768px) and (max-width:1023.98px){',
    '.megamenu-banner [data-name="secondary-banner"][data-image-position="left"] .megamenu-container-image img{',
    'object-fit:contain!important;}',
    '}',
    // Dual-heading visibility: standalone shows <h3>, megamenu shows <h4>.
    // Default (standalone): hide the megamenu <h4>.
    '[data-name="secondary-banner"][data-image-position="left"] .secondary-banner-heading-megamenu{',
    'display:none!important;}',
    // Inside .megamenu-banner: hide the standalone <h3>, show <h4>.
    '.megamenu-banner [data-name="secondary-banner"][data-image-position="left"] .secondary-banner-heading-standalone{',
    'display:none!important;}',
    '.megamenu-banner [data-name="secondary-banner"][data-image-position="left"] .secondary-banner-heading-megamenu{',
    'display:block!important;}',
    '}',
  ].join('');
  document.head.appendChild(styleEl);
}

/**
 * SecondaryBannerLeft - Variante left del banner secundario de Avianca.
 * Layout invertido: imagen a la izquierda, contenido a la derecha.
 * Responsive: flex-col en mobile (imagen top 170px), flex-row en md+ (imagen left 50%).
 *
 * @param {Object} props - Component properties
 * @param {string} props.title - Título del banner (requerido)
 * @param {string} props.firstLabel - Primera etiqueta descriptiva
 * @param {string} props.secondaryLabel - Etiqueta secundaria
 * @param {string} props.imageDesktop - URL de imagen desktop
 * @param {string} props.imageMobile - URL de imagen mobile
 * @param {Object|null} props.pictureDesktop - Picture element completo para desktop
 * @param {Object|null} props.pictureMobile - Picture element completo para mobile
 * @param {string} props.imageAlt - Texto alternativo para la imagen
 * @param {string} props.ctaText - Texto del botón CTA
 * @param {string} props.ctaUrl - URL del botón CTA
 * @param {'dofollow'|'nofollow'|'sponsored'} props.ctaLinkType
 *   Tipo de link (default: 'dofollow')
 * @param {string} props.cta2Text - Texto del segundo botón CTA
 * @param {string} props.cta2Url - URL del segundo botón CTA
 * @param {'dofollow'|'nofollow'|'sponsored'} props.cta2LinkType
 *   Tipo de link del segundo CTA (default: 'dofollow')
 * @param {'light'|'dark'|'light-contrast'|'dark-contrast'|'light-contrast-60'} props.ctaStyle
 *   Combinación de estilos para CTA1 (primary filled) + CTA2 (secondary).
 *   'light' → CTA1 light filled / CTA2 dark filled
 *   'dark' → CTA1 dark filled / CTA2 light filled (default)
 *   'light-contrast' → CTA1 light filled / CTA2 dark bg + light border
 *   'dark-contrast' → CTA1 dark filled / CTA2 light bg + dark border
 *   'light-contrast-60' → CTA1 light filled / CTA2 dark@60% bg + light border
 * @param {'light'|'dark'} props.mode - Modo visual (default: 'light')
 * @param {string} props.backgroundColor - Color de fondo hex (default: '#1b1b1b')
 * @param {string} props.gradientColorStart - Color inicial del gradiente hex
 * @param {string} props.gradientColorEnd - Color final del gradiente hex
 * @param {string} props.condorStrokeColor - Color del stroke del condor SVG hex
 * @param {boolean} props.showCondor - Whether to display the condor SVG decoration (default: true)
 * @param {'lazy'|'eager'} props.loading - Modo de carga de imagen (default: 'lazy')
 * @returns {import('preact').VNode} SecondaryBannerLeft component
 */
export const SecondaryBannerLeft = ({
  title = '',
  firstLabel = '',
  secondaryLabel = '',
  imageDesktop = '',
  imageMobile = '',
  pictureDesktop = null,
  pictureMobile = null,
  imageAlt = '',
  ctaText = '',
  ctaUrl = '',
  ctaLinkType = 'dofollow',
  cta2Text = '',
  cta2Url = '',
  cta2LinkType = 'dofollow',
  ctaStyle = 'dark',
  mode = 'light',
  backgroundColor = '#1b1b1b',
  gradientColorStart = '',
  gradientColorEnd = '',
  condorStrokeColor = '',
  showCondor = true,
  loading = 'lazy',
}) => {
  const [condorBgSVG, setCondorBgSVG] = useState(null);
  const [condorVectorSVG, setCondorVectorSVG] = useState(null);


  // Initialize breakpoint state synchronously to avoid SVG-fetch race during megamenu cloning.
  // Desktop layout (image left, condor right) starts at md (768px) — uniforme hasta 1248px+.
  const initialWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
  const [isDesktop, setIsDesktop] = useState(initialWidth >= 768);
  const loadingMode = loading === 'eager' ? 'eager' : 'lazy';
  const imageDecoding = loadingMode === 'eager' ? 'sync' : 'async';
  const imageFetchPriority = loadingMode === 'eager' ? 'high' : 'low';

  const gradientId = useMemo(
    () => `condorGradient-${Math.random().toString(36).slice(2, 9)}`,
    [],
  );

  // Detect screen width — desktop at 768px
  useEffect(() => {
    const updateScreenSize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  const basePath = window.hlx?.codeBasePath || '';

  useEffect(() => {
    if (!showCondor) {
      setCondorBgSVG(null);
      setCondorVectorSVG(null);
      return;
    }

    const loadCondorSVGs = async () => {
      try {
        // Left variant uses a dedicated bg SVG for all breakpoints
        const bgPath = `${basePath}/assets/logos/condor-vector-bg-gradient-left.svg`;

        // Vector SVG: mobile vs desktop variant (768+)
        const vectorPath = isDesktop
          ? `${basePath}/assets/logos/condor-vector-left-desktop.svg`
          : `${basePath}/assets/logos/condor-vector-left.svg`;

        const bgSVG = await loadSVGIcon(bgPath);

        if (gradientColorStart && gradientColorEnd) {
          const svgNS = bgSVG.namespaceURI || 'http://www.w3.org/2000/svg';
          const ownerDoc = bgSVG.ownerDocument || document;
          let defs = bgSVG.querySelector('defs');
          if (!defs) {
            defs = ownerDoc.createElementNS(svgNS, 'defs');
            bgSVG.insertBefore(defs, bgSVG.firstChild);
          }

          let gradient = defs.querySelector(`#${gradientId}`);
          if (!gradient) {
            gradient = ownerDoc.createElementNS(svgNS, 'linearGradient');
            gradient.setAttribute('id', gradientId);
            gradient.setAttribute('x1', '0%');
            gradient.setAttribute('y1', '0%');
            gradient.setAttribute('x2', '0%');
            gradient.setAttribute('y2', '100%');
            defs.appendChild(gradient);
          } else {
            gradient.innerHTML = '';
          }

          const stop1 = ownerDoc.createElementNS(svgNS, 'stop');
          stop1.setAttribute('offset', '0%');
          stop1.setAttribute('stop-color', gradientColorStart);
          gradient.appendChild(stop1);

          const stop2 = ownerDoc.createElementNS(svgNS, 'stop');
          stop2.setAttribute('offset', '100%');
          stop2.setAttribute('stop-color', gradientColorEnd);
          gradient.appendChild(stop2);

          const paths = bgSVG.querySelectorAll('path');
          paths.forEach((path) => {
            path.setAttribute('fill', `url(#${gradientId})`);
            path.removeAttribute('style');
          });
        } else {
          const paths = bgSVG.querySelectorAll('path');
          const solidColor = backgroundColor || '#1b1b1b';
          paths.forEach((path) => {
            path.setAttribute('fill', solidColor);
            path.setAttribute('style', `fill: ${solidColor};`);
          });
        }
        bgSVG.setAttribute('class', 'megamenu-svg-image absolute top-[-2px] right-0 w-[74%] lg:min-w-[315px] md:min-h-[229px] xl:w-[80%] h-full overflow-visible');
        bgSVG.setAttribute('preserveAspectRatio', 'xMinYMid slice');

        // Load vector and merge it INTO bgSVG as a nested <svg> so both share
        // the bgSVG viewBox (957x229) and scale together. The vector is placed
        // at viewBox x=-25 (centered on the curve at x≈78), aligning with the
        // visible left edge of the gradient shape.
        const vectorSVG = await loadSVGIcon(vectorPath);
        const strokeColor = condorStrokeColor || 'white';
        const vPaths = vectorSVG.querySelectorAll('path');
        vPaths.forEach((path) => {
          const strokeWidth = path.getAttribute('stroke-width') || '2';
          path.setAttribute('stroke', strokeColor);
          path.setAttribute('style', `fill: none; stroke: ${strokeColor}; stroke-width: ${strokeWidth};`);
        });

        if (isDesktop) {
          // Build nested <svg> with vector content inside bgSVG
          const svgNS2 = bgSVG.namespaceURI || 'http://www.w3.org/2000/svg';
          const ownerDoc2 = bgSVG.ownerDocument || document;
          const nested = ownerDoc2.createElementNS(svgNS2, 'svg');
          nested.setAttribute('x', '-25');
          nested.setAttribute('y', '0');
          nested.setAttribute('width', '206');
          nested.setAttribute('height', '229');
          nested.setAttribute('viewBox', '0 0 206 222');
          nested.setAttribute('preserveAspectRatio', 'xMidYMid meet');
          nested.setAttribute('overflow', 'visible');
          vPaths.forEach((p) => nested.appendChild(p.cloneNode(true)));
          bgSVG.appendChild(nested);
        }

        setCondorBgSVG(bgSVG);

        // Mobile-only: vector rendered separately (no bgSVG on mobile)
        vectorSVG.removeAttribute('width');
        vectorSVG.removeAttribute('height');
        vectorSVG.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        vectorSVG.setAttribute('class', 'absolute top-[-59px] right-[-50vw] !w-[141px] !h-[157px]');
        setCondorVectorSVG(vectorSVG);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error loading Condor SVGs:', error);
      }
    };

    loadCondorSVGs();
  }, [
    showCondor,
    basePath,
    condorStrokeColor,
    gradientColorStart,
    gradientColorEnd,
    backgroundColor,
    isDesktop,
  ]);

  const renderSVG = (svgElement, wrapperClass = 'block relative w-full h-full right-0') => {
    if (!svgElement) return null;
    return html`
      <span
        dangerouslySetInnerHTML=${{ __html: svgElement.outerHTML }}
        class=${wrapperClass}
        style=${{ lineHeight: 0 }}
      />
    `;
  };

  const buildDesktopPicture = () => {
    const sources = pictureDesktop?.sources || [];
    const src = imageDesktop || pictureDesktop?.src || '';
    const alt = imageAlt || pictureDesktop?.alt || '';

    return html`
      <picture class="w-full h-full">
        ${sources.map((source) => html`
          <source
            type=${source.type || undefined}
            srcset=${source.srcset || undefined}
            media=${source.media || undefined}
          />
        `)}
        <img
          src=${src}
          alt=${alt}
          loading=${loadingMode}
          decoding=${imageDecoding}
          fetchpriority=${imageFetchPriority}
          class="w-full h-full object-contain lg:object-cover object-left lg:object-top"
        />
      </picture>
    `;
  };

  const buildMobilePicture = () => {
    const sources = pictureMobile?.sources || [];
    const src = imageMobile || pictureMobile?.src || '';
    const alt = imageAlt || pictureMobile?.alt || '';

    return html`
      <picture class="w-full h-full">
        ${sources.map((source) => html`
          <source
            type=${source.type || undefined}
            srcset=${source.srcset || undefined}
            media=${source.media || undefined}
          />
        `)}
        <img
          src=${src}
          alt=${alt}
          loading=${loadingMode}
          decoding=${imageDecoding}
          fetchpriority=${imageFetchPriority}
          class="w-full h-full object-cover object-center"
        />
      </picture>
    `;
  };

  // Text color classes based on mode
  let textColorClasses;
  if (mode === 'dark') {
    textColorClasses = '!text-[var(--color-text-banner-light)] ';
  } else {
    textColorClasses = '!text-[var(--color-text-banner-dark)] ';
  }

  // Banner background — always applied. On desktop the condor bgSVG + image
  // visually cover this; on mobile it provides the visible fill color.
  const bannerBackground = (gradientColorStart && gradientColorEnd)
    ? { background: `linear-gradient(to bottom, ${gradientColorStart}, ${gradientColorEnd})` }
    : { background: backgroundColor || '#1b1b1b' };

  // Pre-compute link attributes for CTA 1
  const isInternalCtaLink = ctaUrl.startsWith('/') || ctaUrl.startsWith('#');
  const ctaTarget = isInternalCtaLink ? '_self' : '_blank';
  let ctaRel;
  if (isInternalCtaLink) {
    ctaRel = ctaLinkType !== 'dofollow' ? ctaLinkType : undefined;
  } else {
    const followSuffix = ctaLinkType !== 'dofollow' ? ` ${ctaLinkType}` : '';
    ctaRel = `noopener noreferrer${followSuffix}`;
  }

  // Pre-compute link attributes for CTA 2
  const isInternalCta2Link = cta2Url && (cta2Url.startsWith('/') || cta2Url.startsWith('#'));
  const cta2Target = isInternalCta2Link ? '_self' : '_blank';
  let cta2Rel;
  if (cta2Text && cta2Url) {
    if (isInternalCta2Link) {
      cta2Rel = cta2LinkType !== 'dofollow' ? cta2LinkType : undefined;
    } else {
      const followSuffix2 = cta2LinkType !== 'dofollow' ? ` ${cta2LinkType}` : '';
      cta2Rel = `noopener noreferrer${followSuffix2}`;
    }
  }

  // Button style classes — 4 combinations of CTA1 (primary filled) + CTA2 (secondary).
  // Naming: '<theme>' = matched (CTA2 filled inverse) | '<theme>-contrast' = CTA2 cross border.
  const btnBase = "inline-flex items-center justify-center h-[32px] px-4 rounded-[32px] border-2 font-['Red_Hat_Display'] !text-sm font-bold leading-[19px] whitespace-nowrap transition-all focus-visible:outline-none";
  // Primary — Dark mode page (white filled button on light pages)
  // default #FFF · hover #E9E9E9 · active #D9D9D9
  const fillLight = `${btnBase} bg-[#FFF] border-[#FFF] !text-[#1B1B1B] hover:bg-[#E9E9E9] hover:border-[#E9E9E9] active:bg-[#D9D9D9] active:border-[#D9D9D9] focus-visible:bg-[#FFF] focus-visible:border-[#FFF]`;
  // Primary — Light mode page (dark filled button on light pages)
  // default #1B1B1B · hover #494949 · active #6C6C6C
  const fillDark = `${btnBase} bg-[#1B1B1B] border-[#1B1B1B] !text-[#FFF] hover:bg-[#494949] hover:border-[#494949] active:bg-[#6C6C6C] active:border-[#6C6C6C] focus-visible:bg-[#1B1B1B] focus-visible:border-[#1B1B1B]`;
  // Secondary — Dark mode page (light border, semi-transparent dark bg)
  // default rgba(27,27,27,0.60) · hover #494949 · active #6C6C6C · focus #1B1B1B
  const darkBgLightBorder = `${btnBase} bg-[rgba(27,27,27,0.60)] border-[#FFF] !text-[#FFF] hover:bg-[#494949] active:bg-[#6C6C6C] focus-visible:bg-[#1B1B1B] focus-visible:border-[#FFF]`;
  // Secondary — Light mode page (dark border, semi-transparent white bg)
  // default rgba(255,255,255,0.60) · hover #E9E9E9 · active #D9D9D9 · focus #1B1B1B (inverted)
  const lightBgDarkBorder = `${btnBase} bg-[rgba(255,255,255,0.60)] border-[#1B1B1B] !text-[#1B1B1B] hover:bg-[#E9E9E9] active:bg-[#D9D9D9] focus-visible:bg-[#1B1B1B] focus-visible:border-[#FFF] focus-visible:!text-[#FFF]`;
  // Alias kept for backward compat with 'light-contrast-60' combo (same as darkBgLightBorder spec)
  const dark60BgLightBorder = darkBgLightBorder;
  const ctaCombos = {
    light: { cta1: fillLight, cta2: fillDark },
    dark: { cta1: fillDark, cta2: fillLight },
    'light-contrast': { cta1: fillLight, cta2: darkBgLightBorder },
    'light-contrast-inverse': { cta1: darkBgLightBorder, cta2: fillLight },
    'dark-contrast': { cta1: fillDark, cta2: lightBgDarkBorder },
    'dark-contrast-inverse': { cta1: lightBgDarkBorder, cta2: fillDark },
    'light-contrast-60': { cta1: fillLight, cta2: dark60BgLightBorder },
    'light-contrast-60-inverse': { cta1: dark60BgLightBorder, cta2: fillLight },
  };
  const combo = ctaCombos[ctaStyle] || ctaCombos.dark;
  const cta1Class = combo.cta1;
  const cta2Class = combo.cta2;
  const hasCta1 = ctaText && ctaUrl;
  const hasCta2 = cta2Text && cta2Url;
  const hasAnyCta = hasCta1 || hasCta2;

  return html`
    <div
      class="max-w-xl w-full relative rounded-[16px] shadow-[0px_2px_20px_2px_rgba(73,73,73,0.25)] my-[32px] mx-[16px] md:mx-[32px] overflow-hidden md:!h-fit lg:!h-fit xl:!h-fit"
      style=${bannerBackground}
      data-name="secondary-banner"
      data-image-position="left"
    >
      ${showCondor && !isDesktop ? html`
        <div class="md:hidden absolute top-0 left-0 w-[50%] h-full pointer-events-none z-20 overflow-visible">
          ${renderSVG(condorVectorSVG, 'block w-full h-full overflow-visible')}
        </div>
      ` : ''}
      ${showCondor ? html`
        <!-- Desktop: bgSVG contains vector as nested <svg>, single unit -->
        <div class="secondary-banner-condor-overlay hidden md:block absolute top-0 left-0 right-0 h-full pointer-events-none z-10">
          ${renderSVG(condorBgSVG)}
        </div>
      ` : ''}
      <div class="flex flex-col md:flex-row md:h-full">
        <!-- Image section: full-width top on mobile (170px), left column on desktop (44%).
             xl:max-w default 540px (standalone, ej. dashboard Members). Override a 338px
             scopeado a .megamenu-banner via <style> inyectado al top de este módulo. -->
        <div class="megamenu-container-image relative md:absolute w-full h-[170px] md:h-full md:w-[50%] md:min-w-[515px] lg:min-w-[350px] xl:w-[55%] xl:max-w-[540px] shrink-0 overflow-hidden">
          <div class="md:hidden w-full h-[170px] overflow-hidden">
            ${buildMobilePicture()}
          </div>
          <div class="hidden md:block w-full h-full overflow-hidden">
            ${buildDesktopPicture()}
          </div>
        </div>
        <!-- Content section: below image on mobile, right column on desktop -->
        <div class="secondary-banner-content flex-1 flex flex-col gap-[24px] items-start justify-center md:items-end p-[16px] relative w-auto z-11" data-banner-mode=${mode}>
          <div class="megamenu-content-container flex flex-col gap-[4px] w-full lg:relative lg:right-[2px]">
            <!-- Dual heading: <h3> visible standalone / <h4> visible inside .megamenu-banner.
                 Ambas se renderizan; CSS oculta la que no aplica al contexto. Este patrón
                 es clone-safe (el megamenu hace cloneNode del DOM y por eso un swap dinámico
                 vía useEffect no funciona). "display:none" también remueve del accessibility
                 tree, evitando duplicación para lectores de pantalla. -->
            <h3 class=${`secondary-banner-heading-standalone w-full ${textColorClasses} !m-0 font-bold font-['Red_Hat_Display'] !leading-[26px] md:!leading-[32px] antialiased`}>
              ${title}
            </h3>
            <h4 class=${`secondary-banner-heading-megamenu w-full ${textColorClasses} !m-0 font-bold font-['Red_Hat_Display'] !leading-[26px] md:!leading-[32px] antialiased`}>
              ${title}
            </h4>
            ${firstLabel ? html`
              <p class=${`w-full ${textColorClasses} font-['Red_Hat_Display'] font-normal !leading-[21px] md:!leading-[24px] !m-0 antialiased`}>
                ${firstLabel}
              </p>
            ` : ''}
            ${secondaryLabel ? html`
              <p class=${`w-full ${textColorClasses} font-['Red_Hat_Display'] font-normal !leading-[21px] md:!leading-[24px] !m-0 opacity-90 antialiased`}>
                ${secondaryLabel}
              </p>
            ` : ''}
          </div>
          ${hasAnyCta ? html`
            <div class="flex w-full justify-end items-center gap-[8px]">
              ${hasCta2 ? html`
                <a
                  href=${cta2Url}
                  target=${cta2Target}
                  rel=${cta2Rel}
                  class=${cta2Class}
                >
                  ${cta2Text}
                </a>
              ` : ''}
              ${hasCta1 ? html`
                <a
                  href=${ctaUrl}
                  target=${ctaTarget}
                  rel=${ctaRel}
                  class=${cta1Class}
                >
                  ${ctaText}
                </a>
              ` : ''}
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
};

export default SecondaryBannerLeft;
