import { h } from '@dropins/tools/preact.js';
import { useState, useRef } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Icon } from '../../../atoms/icon/icon.js';
import { Button } from '../../../atoms/button/button.js';
import { sanitizeHTML } from '../../../../scripts/utils/sanitize.js';

const html = htm.bind(h);

/**
 * InteractiveBanner - Container component for interactive banner with left and right panels
 * Mobile-first responsive banner with two interactive panels
 * @param {Object} props - Component props
 * @param {Object} props.leftPanel - Left panel data
 * @param {string} props.leftPanel.defaultTitle - Title for default state
 * @param {string} props.leftPanel.defaultDescriptionLine1 - First line of description
 * @param {string} props.leftPanel.defaultDescriptionLine2 - Second line of description
 * @param {string} props.leftPanel.defaultMedia - Media URL for default state
 * @param {string} props.leftPanel.defaultBackgroundImage - Background image URL
 * @param {string} props.leftPanel.interactiveDescription - Interactive state description
 * @param {string} props.leftPanel.interactiveButtonText - Interactive state button text
 * @param {string} props.leftPanel.interactiveButtonUrl - Interactive state button URL
 * @param {boolean} props.leftPanel.interactiveButtonOpenInNewTab - Open button link in new tab
 * @param {string} props.leftPanel.interactiveOverlayBackground - Overlay background CSS value
 * @param {string} props.leftPanel.interactiveBackgroundImage - Interactive state background
 * @param {Object} props.rightPanel - Right panel data (same structure as leftPanel)
 * @param {string} props.customClassName - Additional CSS classes
 * @returns {import('preact').VNode} Preact component
 */
const InteractiveBanner = ({
  leftPanel = {},
  rightPanel = {},
  customClassName = '',
  ...rest
}) => {
  const [activeState, setActiveState] = useState('default');
  const [isDesktop, setIsDesktop] = useState(false);
  const prevActiveStateRef = useRef('default');

  const changeActiveState = (newState) => {
    prevActiveStateRef.current = activeState;
    setActiveState(newState);
  };

  // Detect desktop viewport (>=1024px)
  useState(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const toggleActiveState = (side) => {
    const nextState = activeState === `${side}-active` ? 'default' : `${side}-active`;
    changeActiveState(nextState);
  };

  const handlePanelInteraction = (side, isEntering) => {
    if (isDesktop) {
      // Desktop: hover behavior
      changeActiveState(isEntering ? `${side}-active` : 'default');
    }
    // Mobile: click behavior is handled by toggleActiveState
  };

  /**
   * Renders a single panel with all its states and content
   */
  const renderPanel = (panelData, side) => {
    const hasDescriptionText = (panelData.defaultDescriptionLine1 && panelData.defaultDescriptionLine1.trim() !== '') || (panelData.defaultDescriptionLine2 && panelData.defaultDescriptionLine2.trim() !== '');
    const showDefaultMedia = !hasDescriptionText && panelData.defaultMedia && panelData.defaultMedia.trim() !== '';
    const isLeft = side === 'left';
    const isActive = activeState === `${side}-active`;

    // Translate panels vertically on mobile and horizontally on desktop (>=1024px).
    let panelTranslateClass = 'translate-y-0 lg:translate-y-0 lg:translate-x-0';
    if (isLeft && activeState === 'right-active') {
      panelTranslateClass = '-translate-y-full lg:translate-y-0 lg:-translate-x-full';
    } else if (!isLeft && activeState === 'left-active') {
      panelTranslateClass = 'translate-y-full lg:translate-y-0 lg:translate-x-full';
    } else if (!isLeft && activeState === 'right-active') {
      panelTranslateClass = '-translate-y-full lg:translate-y-0 lg:-translate-x-full';
    }

    // Ensure the panel being pushed out stays underneath the one that remains.
    const isPushedOut = (activeState === 'left-active' && !isLeft)
      || (activeState === 'right-active' && isLeft);
    // Always z-10 — changing z-index dynamically on the same frame as translate
    // forces a GPU layer recomposition that cancels the CSS transition.
    // overflow-hidden on the parent handles visual clipping as panels slide out.
    const panelZClass = isPushedOut ? 'z-0' : 'z-10';
    // Spring easing only on right-active (left panel slides out to the left).
    // Coefficient 1.008 gives ~5px max overshoot on a ~600px panel (≈0.8% of travel),
    // matching the Figma spring: slides in, overshoots ~5px, settles at left:0.
    const panelEasingClass = isDesktop && (activeState === 'right-active' || prevActiveStateRef.current === 'right-active') ? 'ease-[cubic-bezier(0.34,1.20,0.64,1)]' : 'ease-out';

    // Interactive panel emerges from the center: down on mobile, right on desktop.
    // Content remains in DOM for SEO crawlability
    const interactiveTranslateClass = isActive
      ? 'translate-y-full opacity-100 lg:translate-y-0 lg:translate-x-full'
      : 'translate-y-1/2 opacity-0 lg:translate-y-0 lg:translate-x-1/2 [&_a]:pointer-events-none [&_button]:pointer-events-none';

      const leftBannerComplementInteractiveClasses = isActive
      ? 'translate-y-full opacity-100 lg:translate-y-0 lg:translate-x-full'
      : 'translate-y-1/2 opacity-0 lg:translate-y-0 lg:translate-x-full [&_a]:pointer-events-none [&_button]:pointer-events-none';

    // Overlay background with fallback
    const overlayBackground = panelData.interactiveOverlayBackground || 'rgba(27, 27, 27, 0.70)';

    // Determine which background images to use (desktop or mobile)
    const defaultBg = panelData.defaultBackgroundImage || '';
    const defaultBgMobile = panelData.defaultBackgroundImageMobile || defaultBg;
    const interactiveBg = panelData.interactiveBackgroundImage || '';
    const interactiveBgMobile = panelData.interactiveBackgroundImageMobile || interactiveBg;

    return html`
      <div
        data-state=${activeState}
        class="self-stretch flex-1 flex flex-col justify-end items-start relative min-h-[240px] transition-transform duration-500 ${panelEasingClass} ${panelTranslateClass} z-10 max-[1247px]:cursor-pointer"
        onMouseEnter=${() => handlePanelInteraction(side, true)}
        onMouseLeave=${() => handlePanelInteraction(side, false)}
        onClick=${() => toggleActiveState(side)}
      >
        <!-- Default background - Mobile -->
        <div
          class="absolute z-10 inset-0 bg-cover md:hidden"
          style="background-image: url('${defaultBgMobile}'); will-change: transform;"
        ></div>
        <!-- Default background - Desktop -->
        <div
          class="absolute z-10 inset-0 bg-cover hidden md:block"
          style="background-image: url('${defaultBg}'); will-change: transform;"
        ></div>

        <!-- Content area -->
        <div class="relative z-10 w-full px-6 pb-8 min-[1248px]:p-8 flex flex-col gap-4">
          ${panelData.defaultTitle && html`
            <div class="self-stretch">
              <div class="text-text-normal-lighter text-xl font-bold leading-auto lg:text-2xl xl:text-[1.75rem]">
                ${panelData.defaultTitle}
              </div>
            </div>
          `}
          
          <div class="self-stretch flex justify-between items-end gap-4">
            ${hasDescriptionText && html`
              <div class="flex-1 flex flex-col gap-0">
                ${panelData.defaultDescriptionLine1 && html`
                  <div class="text-white text-2xl font-normal leading-6 xl:text-[1.75rem] xl:leading-[1.625rem]">
                    ${panelData.defaultDescriptionLine1}
                  </div>
                `}
                ${panelData.defaultDescriptionLine2 && html`
                  <div class="text-white text-base font-bold leading-[1.3125rem] xl:text-lg xl:leading-6">
                    ${panelData.defaultDescriptionLine2}
                  </div>
                `}
              </div>
            `}
            
            ${showDefaultMedia && html`
              <div class="flex-1 flex justify-start items-end">
                <img
                  src=${panelData.defaultMedia}
                  alt=${panelData.defaultTitle || 'Banner media'}
                  class="h-auto object-contain max-h-[2.813rem] xl:max-h-[3.125rem]"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            `}
            
            <div
              class="w-8 h-8 relative flex items-center justify-center flex-shrink-0 self-center cursor-pointer max-[1248px]:flex hidden"
            >
              <!-- Mobile: rotate-90 (abajo), Desktop tablet: rotate-0 (derecha) -->
              <div class="absolute inset-0 flex items-center justify-center max-[1024px]:rotate-90 min-[1024px]:max-[1248px]:rotate-0 transition-all duration-200 ease-out ${isActive ? 'opacity-0' : 'opacity-100'}">
                <${Icon} icon="navigation/chevron-right" customSize=${true} color="var(--icon-normal-light)" />
              </div>
              <div class="absolute inset-0 flex items-center justify-center max-[1024px]:-rotate-90 min-[1024px]:max-[1248px]:rotate-180 transition-all duration-200 ease-out ${isActive ? 'opacity-100' : 'opacity-0'}">
                <${Icon} icon="navigation/chevron-right" customSize=${true} color="var(--icon-normal-light)" />
              </div>
            </div>
          </div>
        </div>

        <!-- Interactive panel container -->
        <div class="absolute inset-0 z-0 transition-all duration-500 ease-out ${leftBannerComplementInteractiveClasses}">
          <!-- Interactive background - Mobile -->
          <div
            class="absolute inset-0 bg-cover md:hidden"
            style="background: url('${interactiveBgMobile}') lightgray 50% / cover no-repeat;"
          ></div>
          <!-- Interactive background - Desktop -->
          <div
            class="absolute inset-0 bg-cover bg-center hidden md:block"
            style="background: url('${interactiveBg}') lightgray 50% / cover no-repeat;"
          ></div>
          <div class="self-stretch w-full h-full relative inline-flex flex-col justify-end items-end gap-2.5 overflow-hidden lg:px-8 lg:pb-6">
            <div class="w-full h-full absolute inset-0"></div>
            <div class="self-stretch p-4 rounded-tl-2xl rounded-tr-2xl backdrop-blur-[4px] flex flex-col justify-end items-end gap-4 lg:rounded-2xl min-[1024px]:max-[1247px]:flex-col min-[1024px]:max-[1247px]:items-end lg:flex-row lg:items-center lg:justify-center" style="background: ${overlayBackground};">
              ${panelData.interactiveDescription && html`
                <div
                  class="self-stretch text-text-normal-lighter text-sm font-normal leading-[1.5] min-[1024px]:max-[1247px]:text-left lg:flex-1 lg:text-left"
                  dangerouslySetInnerHTML=${{ __html: sanitizeHTML(panelData.interactiveDescription) }}
                ></div>
              `}
              ${(panelData.interactiveButtonText && panelData.interactiveButtonUrl) && html`
                <a
                  href=${panelData.interactiveButtonUrl}
                  target=${panelData.interactiveButtonOpenInNewTab ? '_blank' : '_self'}
                  rel=${panelData.interactiveButtonOpenInNewTab ? 'noopener noreferrer' : ''}
                  class="self-stretch lg:self-auto block leading-[0]"
                  aria-label=${`${panelData.interactiveButtonText}${panelData.interactiveButtonOpenInNewTab ? ' (opens in new tab)' : ''}`}
                >
                  <${Button}
                    variant="tertiary"
                    size="xs"
                    customClassName="w-full"
                  >
                    ${panelData.interactiveButtonText}
                  </Button>
                </a>
              `}
            </div>
          </div>
        </div>
      </div>
    `;
  };

  return html`
    <div
      data-state=${activeState}
      class="w-full rounded-2xl lg:rounded-[1.5rem] flex flex-col lg:flex-row overflow-hidden bg-background-brand-primary-default ${customClassName}"
      ...${rest}
    >
      ${renderPanel(leftPanel, 'left')}
      ${renderPanel(rightPanel, 'right')}
    </div>
  `;
};

export default InteractiveBanner;
