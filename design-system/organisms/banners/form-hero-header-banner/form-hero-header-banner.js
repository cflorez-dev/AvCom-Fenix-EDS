import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { Alert } from '../../../molecules/alert/alert.js';
import { createOptimizedPicture } from '../../../../scripts/aem.js';

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

  // Create the optimized picture element
  // Breakpoints must be in descending order (largest to smallest) for <picture> media queries
  const pictureElement = imageData?.src ? createOptimizedPicture(
    imageData.src,
    imageData.alt || imageAlt || '',
    loadingMode === 'eager',
    [
      { media: '(min-width: 1024px)', width: '1248' },
      { media: '(min-width: 768px)', width: '960' },
      { media: '(min-width: 640px)', width: '735' },
      { width: '358' },
    ],
  ) : null;

  // Add classes and attributes to the img element inside picture
  if (pictureElement) {
    const img = pictureElement.querySelector('img');
    if (img) {
      img.className = 'w-full h-full object-cover aspect-[358/180] sm:aspect-[735/180] rounded-t-3xl md:aspect-auto md:rounded-3xl';
      if (fetchPriority) {
        img.setAttribute('fetchpriority', fetchPriority);
      }
    }
  }

  // Get the HTML string from the picture element
  const pictureHTML = pictureElement ? pictureElement.outerHTML : '';

  return html`
  <div class="form-hero-header-banner-container w-full ${customClassName}" ...${rest}>
    <div class="mx-auto max-w-screen-xl rounded-3xl bg-transparent relative shadow-[0px_2px_20px_2px_rgba(73,73,73,0.25)] md:shadow-none md:p-6 md:flex md:justify-end">
        <div class="md:absolute md:top-0 md:left-0 md:w-full md:h-full md:z-[-1]" dangerouslySetInnerHTML=${{ __html: pictureHTML }}>
        </div>
        <div class="bg-white rounded-3xl md:rounded-2xl md:max-w-[480px] md:max-h-[480px] md:min-h-[300px] md:h-max overflow-auto">
          <div class="p-6">
              <div class="flex flex-col justify-start items-start gap-[4px]">
                  <${titleLevel} class="!m-0 self-stretch justify-start text-text-normal-primary !text-2xl md:!text-[28px] !font-bold">${titleText}</${titleLevel}>
                  <${subtitleLevel} class="!m-0 self-stretch justify-start text-text-normal-primary !font-normal leading-6 !text-base">${subtitleText}</${subtitleLevel}>
              </div>
              <div class="mt-6">
                ${showAlert ? html`
                  <${Alert} 
                    variant=${alertVariant}
                    marqueeMode=${false} 
                    isRounded=${true}
                    fullWidth=${true}
                    contentHTML=${alertContent}
                    dismissible=${alertDismissible}
                    dismissIconHTML='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M12.6663 4.27203L11.7263 3.33203L7.99967 7.0587L4.27301 3.33203L3.33301 4.27203L7.05967 7.9987L3.33301 11.7254L4.27301 12.6654L7.99967 8.9387L11.7263 12.6654L12.6663 11.7254L8.93967 7.9987L12.6663 4.27203Z" fill="#1B1B1B"/></svg>'
                    dismissButtonClassName='h-[24px] w-[24px]'
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
