import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { Alert } from '../../../molecules/alert/alert.js';
import { MMBForm } from '../../forms/mmb-form/mmb-form.js';

const html = htm.bind(h);

/**
 * FormHeaderBanner - Banner component with form for Avianca
 *
 * @param {Object} props - Component properties
 * @param {Object} [props.imageData] - Image data { src: string, alt: string }
 * @param {string} [props.imageAlt=''] - Alternative text for the image
 * @param {'lazy'|'eager'} [props.loadingMode='eager'] - Image loading strategy.
 *   When 'eager', automatically sets fetchpriority="high" for LCP optimization
 * @param {string} [props.titleText=''] - Main title text
 * @param {'h1'|'h2'|'h3'|'h4'|'h5'|'h6'} [props.titleLevel='h1'] - Semantic level of the title
 * @param {string} [props.subtitleText=''] - Subtitle text
 * @param {'h2'|'h3'|'h4'|'h5'|'h6'|'p'} [props.subtitleLevel='p'] - Semantic level of the subtitles
 * @param {boolean} [props.showAlert=false] - Show alert
 * @param {'info'|'success'|'warning'|'error'} [props.alertType='info'] - Alert type
 * @param {boolean} [props.alertDismissible=true] - Allow closing the alert
 * @param {string} [props.alertContent=''] - Alert HTML content (rich text)
 * @param {'none'|'mmb'} [props.formType='none'] - Optional form to render inside the panel
 * @param {boolean} [props.openInNewTab=true] - MMB form: open deeplink in new tab
 * @param {string} [props.customClassName=''] - Additional CSS classes
 * @param {Object} [props.rest] - Additional properties
 * @returns {import('preact').VNode} FormHeaderBanner component
 */
export const FormHeroHeaderBanner = ({
  imageData = null,
  imageAlt = '',
  loadingMode = 'eager',
  titleText = '',
  titleLevel = 'h1',
  subtitleText = '',
  subtitleLevel = 'p',
  showAlert = false,
  alertType = 'info',
  alertDismissible = true,
  alertContent = '',
  formType = 'none',
  openInNewTab,
  customClassName = '',
  ...rest
}) => {
  // Map alertType to Alert component variant
  const getAlertVariant = (type) => {
    if (type === 'info') return 'informative';
    if (type === 'warning') return 'caution';
    return type; // 'success' or 'error' map directly
  };

  const alertVariant = getAlertVariant(alertType);

  // Determine fetchpriority based on loading mode
  // Only set fetchpriority="high" if eager (likely LCP/above the fold)
  // For lazy loading, don't set fetchpriority (or use "low")
  const fetchPriority = loadingMode === 'eager' ? 'high' : null;

  // Serve the original uploaded asset (no AEM optimization) per client request:
  // ?format=webply&optimize=medium re-encoded the PNG at medium quality, introducing
  // visible artifacts on these banners. Strip any query params to serve the original.
  const imageSrc = imageData?.src ? imageData.src.split('?')[0] : '';

  // Build img attributes for the background image
  const heroImgAttributes = {
    src: imageSrc,
    alt: imageData?.alt || imageAlt || '',
    loading: loadingMode,
    class: 'w-full h-full object-cover aspect-[358/180] sm:aspect-[735/180] rounded-t-3xl md:aspect-auto md:rounded-3xl',
  };

  // Add fetchpriority only if eager (LCP optimization)
  if (fetchPriority) {
    heroImgAttributes.fetchpriority = fetchPriority;
  }

  return html`
  <div class="form-hero-header-banner-container w-full ${customClassName}" ...${rest}>
    <div class="mx-auto max-w-screen-xl rounded-3xl bg-transparent relative shadow-[0px_2px_20px_2px_rgba(73,73,73,0.25)] md:shadow-none md:p-6 md:flex md:justify-end">
        <div class="md:absolute md:top-0 md:left-0 md:w-full md:h-full md:z-[-1]">
          ${imageSrc ? html`
            <picture class="block w-full h-full">
              <img ...${heroImgAttributes} />
            </picture>
          ` : null}
        </div>
        <div class=${`bg-white rounded-3xl md:rounded-2xl md:max-w-[480px] md:min-h-[300px] md:h-max overflow-auto ${formType === 'none' ? 'md:max-h-[480px]' : ''}`}>
          <div class="p-4 lg:p-6">
              <div class="flex flex-col justify-start items-start gap-[4px]">
                  <${titleLevel} class="!m-0 self-stretch justify-start text-text-normal-primary !font-bold">${titleText}</${titleLevel}>
                  <${subtitleLevel} class="!m-0 self-stretch justify-start text-text-normal-primary !font-normal">${subtitleText}</${subtitleLevel}>
              </div>
              ${formType === 'mmb' ? html`
                <div class="mt-6">
                  <${MMBForm} simplified=${true} buttonBelow=${true} context="heroBanner" />
                </div>
              ` : null}
              <div class="mt-6">
                ${showAlert ? html`
                  <${Alert}
                    variant=${alertVariant}
                    contentHTML=${alertContent}
                    dismissible=${alertDismissible}
                    marqueeMode=${false}
                    isRounded=${true}
                  />
                ` : null}
              </div>
          </div>
        </div>
    </div>
  </div>
  `;
};

export default FormHeroHeaderBanner;
