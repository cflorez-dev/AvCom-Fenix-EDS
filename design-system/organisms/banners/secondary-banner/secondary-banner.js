import { h } from '@dropins/tools/preact.js';
import {
  useEffect,
  useState,
  useMemo,
} from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Button } from '../../../atoms/button/button.js';
import loadSVGIcon from '../../../../scripts/utils/svg.helper.js';
import { sanitizeSVG } from '../../../../scripts/utils/sanitize.js';

const html = htm.bind(h);

/**
 * SecondaryBanner - Banner secundario de Avianca con imagen y contenido
 * Soporta variantes desktop y mobile con colores dinámicos del CMS
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
 * @param {'dofollow'|'nofollow'|'sponsored'} props.ctaLinkType - Tipo de link (default: 'dofollow')
 * @param {'light'|'dark'} props.mode - Modo visual (default: 'light')
 * @param {'solid'|'gradient'} props.backgroundType - Tipo de fondo (default: 'solid')
 * @param {string} props.backgroundColor - Color de fondo hex (default: '#1b1b1b')
 * @param {string} props.gradientColorStart - Color inicial del gradiente hex
 * @param {string} props.gradientColorEnd - Color final del gradiente hex
 * @param {string} props.condorStrokeColor - Color del stroke del condor SVG hex
 * @param {boolean} props.showCondor - Whether to display the condor SVG decoration (default: true)
 * @param {'lazy'|'eager'} props.loading - Modo de carga de imagen (default: 'lazy')
 * @returns {import('preact').VNode} SecondaryBanner component
 */
export const SecondaryBanner = ({
  title = '',
  firstLabel = '',
  // eslint-disable-next-line no-unused-vars -- CU-207 CA5: model field kept, not rendered
  secondaryLabel = '',
  imageDesktop = '',
  imageMobile = '',
  pictureDesktop = null,
  pictureMobile = null,
  imageAlt = '',
  ctaText = '',
  ctaUrl = '',
  ctaLinkType = 'dofollow',
  mode = 'light',
  backgroundColor = '#1b1b1b',
  gradientColorStart = '',
  gradientColorEnd = '',
  condorStrokeColor = '',
  showCondor = true,
  loading = 'lazy',
}) => {
  // States for loaded SVG elements
  const [condorBgSVG, setCondorBgSVG] = useState(null);
  const [condorVectorSVG, setCondorVectorSVG] = useState(null);

  // State for button size based on screen width
  const initialWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
  // Bug 2: tablet (>=768px) uses the large button ('md'); only mobile stays compact ('xs')
  const [buttonSize, setButtonSize] = useState(initialWidth < 768 ? 'xs' : 'md');

  // State for detecting desktop viewport (>= 768px)
  // Non-fullCover variant applies the desktop layout (and desktop SVGs) from tablet up.
  const [isDesktop, setIsDesktop] = useState(initialWidth >= 768);
  const loadingMode = loading === 'eager' ? 'eager' : 'lazy';
  const imageDecoding = loadingMode === 'eager' ? 'sync' : 'async';
  const imageFetchPriority = loadingMode === 'eager' ? 'high' : 'low';

  // Unique gradient id per component instance
  const gradientId = useMemo(
    () => `condorGradient-${Math.random().toString(36).slice(2, 9)}`,
    [],
  );

  // Detect screen width and set button size and desktop state
  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      setButtonSize(width < 768 ? 'xs' : 'md'); // Bug 2: large button from tablet up
      setIsDesktop(width >= 768);
    };

    updateScreenSize();

    window.addEventListener('resize', updateScreenSize);

    return () => {
      window.removeEventListener('resize', updateScreenSize);
    };
  }, []);

  const basePath = window.hlx?.codeBasePath || '';

  useEffect(() => {
    if (!showCondor) {
      setCondorBgSVG(null);
      setCondorVectorSVG(null);
      return undefined;
    }

    let cancelled = false;

    const loadCondorSVGs = async () => {
      try {
        // Select SVG paths based on screen size
        const bgPath = isDesktop
          ? `${basePath}/assets/logos/condor-vector-bg-gradient-desktop.svg`
          : `${basePath}/assets/logos/condor-vector-bg-gradient.svg`;

        const vectorPath = isDesktop
          ? `${basePath}/assets/logos/condor-vector-desktop.svg`
          : `${basePath}/assets/logos/condor-vector.svg`;

        // Load both SVGs in parallel to avoid sequential flash
        const [bgSVG, vectorSVG] = await Promise.all([
          loadSVGIcon(bgPath),
          loadSVGIcon(vectorPath),
        ]);

        // Discard result if effect was re-triggered (e.g. resize during load)
        if (cancelled) return;

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

          const bgPaths = bgSVG.querySelectorAll('path');
          bgPaths.forEach((path) => {
            path.setAttribute('fill', `url(#${gradientId})`);
            path.removeAttribute('style');
          });
        } else {
          const bgPaths = bgSVG.querySelectorAll('path');
          const solidColor = backgroundColor || '#1b1b1b';
          bgPaths.forEach((path) => {
            path.setAttribute('fill', solidColor);
            path.setAttribute('style', `fill: ${solidColor};`);
          });
        }
        // Right-anchored at all md+ breakpoints so SVGs stay aligned with the second column
        // (image) regardless of viewport width. 87px offset keeps BG behind the condor.
        bgSVG.setAttribute('class', 'absolute top-0 md:right-[87px] md:h-[243px] md:w-auto');

        const strokeColor = condorStrokeColor || 'white';
        const vectorPaths = vectorSVG.querySelectorAll('path');
        vectorPaths.forEach((path) => {
          const strokeWidth = path.getAttribute('stroke-width') || '2';
          path.setAttribute('stroke', strokeColor);
          path.setAttribute('style', `fill: none; stroke: ${strokeColor}; stroke-width: ${strokeWidth};`);
        });
        // Right-anchored at all md+ breakpoints so the condor follows the second column
        // (image) start as viewport shrinks, keeping engranaje with BG at any width.
        vectorSVG.setAttribute('class', 'absolute top-0 md:right-[1px] md:h-[243px] md:w-auto');

        // Set both SVGs atomically to prevent partial render
        setCondorBgSVG(bgSVG);
        setCondorVectorSVG(vectorSVG);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error loading Condor SVGs:', error);
      }
    };

    loadCondorSVGs();

    return () => { cancelled = true; };
  }, [
    showCondor,
    basePath,
    condorStrokeColor,
    gradientColorStart,
    gradientColorEnd,
    backgroundColor,
    isDesktop,
  ]);

  const renderSVG = (svgElement) => {
    if (!svgElement) return null;
    return html`
      <span
        dangerouslySetInnerHTML=${{ __html: sanitizeSVG(svgElement.outerHTML) }}
        class="block right-0 overflow-hidden"
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
          class="w-full h-full object-cover object-[right_top]"
        />
      </picture>
    `;
  };

  // Build picture element JSX for mobile
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
          class="w-full h-full object-cover object-[right_top]"
        />
      </picture>
    `;
  };

  // When condor is hidden, image covers the full banner (like the legacy layout).
  // When condor is shown, image stays on the right side with the condor pattern.
  const fullCoverImage = !showCondor;

   // Text color classes based on mode
  // In full-cover mode (no condor), always use white for contrast against the image.
  // In standard mode (condor), keep the existing CSS variable logic untouched.
  const textColorClasses = fullCoverImage
    ? '!text-white'
    : (mode === 'dark'
      ? '!text-[var(--color-text-banner-light)]'
      : '!text-[var(--color-text-banner-dark)]');

  // Compute banner background: use gradient when both colors are set, otherwise solid
  const bannerBackground = (gradientColorStart && gradientColorEnd)
    ? `background: linear-gradient(to bottom, ${gradientColorStart}, ${gradientColorEnd});`
    : `background: ${backgroundColor || '#1b1b1b'};`;

  // Pre-compute CTA link attributes (shared by mobile + desktop layouts)
  const isInternalCtaLink = ctaUrl.startsWith('/') || ctaUrl.startsWith('#');
  const ctaTarget = isInternalCtaLink ? '_self' : '_blank';
  let ctaRel;
  if (isInternalCtaLink) {
    ctaRel = ctaLinkType !== 'dofollow' ? ctaLinkType : undefined;
  } else {
    ctaRel = `noopener noreferrer${ctaLinkType !== 'dofollow' ? ` ${ctaLinkType}` : ''}`;
  }

  return html`
    <div
      class=${`max-w-xl w-full ${fullCoverImage ? 'h-[216px]' : 'h-auto md:min-h-[243px]'} min-[1024px]:h-[243px] relative rounded-[16px] shadow-[0px_2px_25px_2px_rgba(120,124,130,0.15)] my-[32px] mx-[16px] min-[1024px]:mx-[32px] overflow-hidden lg:pb-[18px]`}
      style=${bannerBackground}
      data-name="secondary-banner"
    >
      <!-- Mobile Version (< 768): vertical stack — image top, content below (Figma 9012-160538) -->
      ${fullCoverImage ? '' : html`
      <div class="md:hidden flex flex-col w-full">
        <!-- Image top (full width, 170px) -->
        <div class="relative w-full h-[170px] overflow-hidden">
          ${buildMobilePicture()}
          ${showCondor ? html`
            <div class="absolute top-0 right-0 w-[140px] h-[140px] pointer-events-none z-10 overflow-hidden [&_svg]:absolute [&_svg]:top-0 [&_svg]:right-0 [&_svg]:h-full [&_svg]:w-auto">
              ${renderSVG(condorVectorSVG)}
            </div>
          ` : ''}
        </div>
        <!-- Content below image -->
        <div data-banner-mode=${mode} class="relative z-20 flex flex-col gap-[16px] items-start justify-center p-[16px]">
          <div class="self-stretch flex flex-col justify-center items-start gap-[4px]">
            <h2 class=${`self-stretch justify-start ${textColorClasses} font-bold font-['Red_Hat_Display'] !text-[18px] !leading-none`}>
              ${title}
            </h2>
            <div class="self-stretch justify-start ${textColorClasses} text-[14px] leading-[21px] font-normal font-['Red_Hat_Display']">
              ${firstLabel}
            </div>
          </div>
          ${ctaText && ctaUrl ? html`
            <div data-appearance="secondary" data-iconafter="false" data-iconbefore="false" data-icononly="false" data-size="default" data-state="default">
              <a
                href=${ctaUrl}
                target=${ctaTarget}
                rel=${ctaRel}
                class="inline-block"
              >
                <${Button}
                  variant=${mode === 'dark' ? 'primary' : 'secondary'}
                  size=${buttonSize}
                >
                  ${ctaText}
                </${Button}>
              </a>
            </div>
          ` : ''}
        </div>
      </div>
      `}

      <!-- Desktop / Tablet Version (>= 768): layout avalado, sin cambios -->
      <div class=${fullCoverImage ? 'w-full h-full' : 'hidden md:block w-full h-full'}>
       <!-- Left content section -->
        <div class=${`w-full ${fullCoverImage ? 'h-[216px] lg:h-[243px]' : 'h-[216px] md:h-[243px]'} p-0 absolute left-0 top-0 inline-flex flex-col justify-between items-start z-2`}>
          <div data-banner-mode=${mode} class=${` relative w-full ${fullCoverImage ? '' : 'min-[1024px]:w-[873px]'} flex flex-col justify-start items-start gap-10`}>
          <!-- Background condor pattern -->
            <div class=${`absolute top-0 w-[100%] pointer-events-none ${fullCoverImage ? 'h-[216px] lg:h-[243px]' : 'h-[216px] md:h-[243px]'} z-10`}>
              ${renderSVG(condorBgSVG)}
              ${renderSVG(condorVectorSVG)}
              
            </div>
          <!-- Background condor pattern -->
          <div class=${`w-full h-full relative z-20 flex flex-row gap-[8px] md:gap-0 ${fullCoverImage ? 'md:min-h-[216px]' : 'md:min-h-[243px]'} lg:min-h-0`}>
              <div class=${`min-w-0 h-fit md:h-[243px] lg:h-fit flex flex-col gap-[24px] justify-center md:justify-between lg:justify-center z-10 p-[16px] min-[1024px]:p-[24px] ${fullCoverImage ? 'w-full min-[1024px]:max-w-[510px]' : 'flex-1 md:max-w-[61%] lg:max-w-none'}`}>
                <div class="z-10 self-stretch flex flex-col justify-center items-start gap-[4px]">
                  <h2 class=${`line-clamp-none md:line-clamp-3 self-stretch justify-start ${textColorClasses} font-bold font-['Red_Hat_Display'] ${fullCoverImage ? 'banner-title-scaled' : '!text-[18px] md:!text-[24px] lg:!text-[28px] !leading-none'}`}>
                    ${title}
                  </h2>
                  <div class="line-clamp-none md:line-clamp-3 self-stretch justify-start ${textColorClasses} text-[14px] leading-[21px] md:text-[18px] md:leading-[27px] font-normal font-['Red_Hat_Display']">
                    ${firstLabel}
                  </div>
                </div>
                ${ctaText && ctaUrl ? html`
                  <div data-appearance="secondary" data-iconafter="false" data-iconbefore="false" data-icononly="false" data-size="default" data-state="default">
                    <a 
                      href=${ctaUrl}
                      target=${(ctaUrl.startsWith('/') || ctaUrl.startsWith('#')) ? '_self' : '_blank'}
                      rel=${(ctaUrl.startsWith('/') || ctaUrl.startsWith('#'))
                        ? (ctaLinkType === 'dofollow' ? undefined : ctaLinkType)
                        : `noopener noreferrer${ctaLinkType !== 'dofollow' ? ` ${ctaLinkType}` : ''}`
                      }
                      class="inline-block"
                    >
                      <${Button}
                        variant=${mode === 'dark' ? 'primary' : 'secondary'}
                        size=${buttonSize}
                      >
                        ${ctaText}
                      </${Button}>
                    </a>
                  </div>
                ` : ''}
              </div>
              ${fullCoverImage ? '' : html`<div class="spacer w-[181px] md:w-[300px] lg:w-[271px] shrink-0"></div>`}
          </div>
      </div>


        </div>
          

        <!-- Right image section - Mobile picture (fullCover: < 1024px; non-full: < 1024px so tablet 768-1023 also uses mobile image) -->
      <div class=${`absolute right-0 top-0 h-[216px] md:h-[243px] lg:hidden z-1 overflow-hidden ${fullCoverImage ? 'w-full max-w-full max-h-full' : 'max-w-[216px] max-h-[216px] w-full min-[480px]:w-[50%] md:max-w-[300px] md:max-h-none md:w-[300px]'}`}>
        <div class="w-full h-full relative">
          ${buildMobilePicture()}
        </div>
      </div>

        <!-- Right image section - Desktop picture (>= 1024px only) -->
      <div class=${`hidden lg:block absolute top-0 h-[243px] z-1 overflow-hidden ${fullCoverImage ? 'left-0 w-full max-w-full' : 'left-0 ml-[597px] max-w-[651px] w-[651px]'}`}>
        <div class="w-full h-full relative">
          ${buildDesktopPicture()}
        </div>
      </div>

      </div>
      <!-- /Desktop / Tablet Version -->
    </div>
  `;
};

export default SecondaryBanner;
