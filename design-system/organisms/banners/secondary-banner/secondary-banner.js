import { h } from '@dropins/tools/preact.js';
import {
  useEffect,
  useState,
  useMemo,
} from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Button } from '../../../atoms/button/button.js';
import loadSVGIcon from '../../../../scripts/utils/svg.helper.js';

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
  const [buttonSize, setButtonSize] = useState(initialWidth < 1024 ? 'xs' : 'md');

  // State for detecting desktop viewport (>= 1024px)
  const [isDesktop, setIsDesktop] = useState(initialWidth >= 1024);
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
      setButtonSize(width < 1024 ? 'xs' : 'md');
      setIsDesktop(width >= 1024);
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
        bgSVG.setAttribute('class', 'absolute top-0 right-0 min-[1024px]:right-[87px] min-[1024px]:h-[243px] min-[1024px]:w-auto');

        const strokeColor = condorStrokeColor || 'white';
        const vectorPaths = vectorSVG.querySelectorAll('path');
        vectorPaths.forEach((path) => {
          const strokeWidth = path.getAttribute('stroke-width') || '2';
          path.setAttribute('stroke', strokeColor);
          path.setAttribute('style', `fill: none; stroke: ${strokeColor}; stroke-width: ${strokeWidth};`);
        });
        vectorSVG.setAttribute('class', 'absolute top-0 right-[1px] min-[1024px]:h-[243px] min-[1024px]:w-auto');

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
        dangerouslySetInnerHTML=${{ __html: svgElement.outerHTML }}
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
          class=" w-full h-full object-cover object-[right_top]"
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

  return html`
    <!-- Desktop Version -->
    <div 
      class="block max-w-[1248px] w-full h-[216px] min-[1024px]:h-[243px] relative rounded-[24px] shadow-[0px_2px_20px_2px_rgba(73,73,73,0.25)] my-[32px] mx-[16px] min-[1024px]:mx-[32px] overflow-hidden pb-[18px]"
      style=${bannerBackground}
    >
       <!-- Left content section -->
        <div class="w-full h-[216px] md:h-[230px] lg:h-[243px] p-0 absolute left-0 top-0 inline-flex flex-col justify-between items-start z-2">
          <div data-banner-mode=${mode} class=${` relative w-full ${fullCoverImage ? '' : 'min-[1024px]:w-[873px]'} flex flex-col justify-start items-start gap-10`}>
          <!-- Background condor pattern -->
            <div class="absolute top-0 w-[100%] pointer-events-none h-[216px] md:h-[230px] lg:h-[243px] z-10">
              ${renderSVG(condorBgSVG)}
              ${renderSVG(condorVectorSVG)}
              
            </div>
          <!-- Background condor pattern -->
          <div class="w-full h-full relative z-20 flex flex-row gap-[8px] min-[769px]:gap-0">
              <div class=${`min-w-0 h-[216px] min-[1024px]:h-[243px] flex flex-col justify-between z-10 p-[16px] min-[1024px]:p-[24px] ${fullCoverImage ? 'w-full min-[1024px]:max-w-[510px]' : 'flex-1'}`}>
                <div class="z-10 self-stretch flex flex-col justify-center items-start gap-[4px]">
                  <h2 class=${`${ctaText && ctaUrl ? 'line-clamp-2' : 'line-clamp-4'} self-stretch justify-start ${textColorClasses} font-bold font-['Red_Hat_Display'] ${fullCoverImage ? 'banner-title-scaled' : ''}`}>
                    ${title}
                  </h2>
                  <div class="${ctaText && ctaUrl ? 'line-clamp-2' : 'line-clamp-4'} self-stretch justify-start ${textColorClasses} leading-[21px] min-[769px]:!leading-[32px] text-[16px] min-[1024px]:text-[24px] font-normal font-['Red_Hat_Display']">
                    ${firstLabel}
                  </div>
                  <div class="${ctaText && ctaUrl ? 'line-clamp-2' : 'line-clamp-4'} self-stretch justify-start ${textColorClasses} leading-[16px] min-[769px]:!leading-[21px] text-[12px] min-[1024px]:text-[16px] font-normal font-['Red_Hat_Display'] opacity-90">
                    ${secondaryLabel}
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
              ${fullCoverImage ? '' : html`<div class="spacer w-[181px] lg:w-[271px] shrink-0"></div>`}
          </div>
      </div>


        </div>
          

        <!-- Right image section - Mobile (< 1024px) -->
      <div class=${`absolute right-0 top-0 h-[216px] md:h-[230px] lg:hidden z-1 overflow-hidden ${fullCoverImage ? 'w-full max-w-full max-h-full' : 'max-w-[216px] max-h-[216px] w-full min-[480px]:w-[50%]'}`}>
        <div class="w-full h-full relative">
          ${buildMobilePicture()}
        </div>
      </div>

        <!-- Right image section - Desktop (>= 1024px) -->
      <div class=${`hidden lg:block absolute top-0 h-[243px] z-1 overflow-hidden ${fullCoverImage ? 'left-0 w-full max-w-full' : 'left-0 ml-[597px] max-w-[651px] w-[651px]'}`}>
        <div class="w-full h-full relative">
          ${buildDesktopPicture()}
        </div>
      </div>

   

      
    </div>

   
  `;
};

export default SecondaryBanner;
