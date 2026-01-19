import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { Alert } from '../../molecules/alert/alert.js';

const html = htm.bind(h);

/**
 * FormHeaderBanner - Banner component with form for Avianca
 *
 * @param {Object} props - Component properties
 * @param {Object} [props.imageData] - Image data { src: string, alt: string }
 * @param {string} [props.imageAlt=''] - Alternative text for the image
 * @param {'lazy'|'eager'} [props.loadingMode='eager'] - Image loading strategy
 * @param {string} [props.titleText=''] - Main title text
 * @param {'h1'|'h2'|'h3'|'h4'|'h5'|'h6'} [props.titleLevel='h1'] - Semantic level of the title
 * @param {string} [props.subtitleText=''] - Subtitle text
 * @param {'h2'|'h3'|'h4'|'h5'|'h6'|'p'} [props.subtitleLevel='p'] - Semantic level of the subtitle
 * @param {'left'|'center'|'right'} [props.contentAlignment='left'] - Content alignment
 * @param {boolean} [props.showAlert=false] - Show alert
 * @param {'info'|'success'|'warning'|'error'} [props.alertType='info'] - Alert type
 * @param {boolean} [props.alertDismissible=true] - Allow closing the alert
 * @param {string} [props.alertContent=''] - Alert HTML content (rich text)
 * @param {string} [props.customClassName=''] - Additional CSS classes
 * @param {Object} [props.rest] - Additional properties
 * @returns {import('preact').VNode} FormHeaderBanner component
 */
export const FormHeaderBanner = ({
  imageData = null,
  imageAlt = '',
  loadingMode = 'eager',
  titleText = '',
  titleLevel = 'h1',
  subtitleText = '',
  subtitleLevel = 'p',
  contentAlignment = 'left',
  showAlert = false,
  alertType = 'info',
  alertDismissible = true,
  alertContent = '',
  customClassName = '',
  ...rest
}) => {
  const containerClasses = `form-header-banner-container ${customClassName}`.trim();

  // Map alertType to Alert component variant
  const getAlertVariant = (type) => {
    if (type === 'info') return 'informative';
    if (type === 'warning') return 'caution';
    return type; // 'success' or 'error' map directly
  };

  const alertVariant = getAlertVariant(alertType);

  return html`
  <div class=${containerClasses} data-alignment=${contentAlignment} ...${rest}>
    <div class="w-full py-8 relative inline-flex flex-col justify-center items-center gap-14">
      <div class="self-stretch px-4 flex flex-col justify-start items-center gap-9">
          <div data-alert="true" data-device="mob" data-form="true" class="w-full max-w-[1248px] rounded-[24px] shadow-[0px_2px_20px_2px_rgba(73,73,73,0.25)] flex flex-col min-[1024px]:flex-row justify-center items-start overflow-hidden">
              <div class="self-stretch h-44 min-[1024px]:h-auto">
                ${imageData?.src ? html`
                  <picture class="w-full h-full">
                    <img 
                      src=${imageData.src} 
                      alt=${imageData.alt || imageAlt || ''} 
                      loading=${loadingMode}
                      class="w-full h-full object-cover"
                    />
                  </picture>
                ` : null}
              </div>
              <div class="self-stretch p-4 min-[1024px]:p-8 bg-background-card-lighter flex flex-col justify-start items-start gap-6 w-[100%] min-[1024px]:min-w-[690px] min-[1248px]:min-w-[848px]">
                  <div class="self-stretch flex flex-col justify-start items-start gap-[4px]">
                      <${titleLevel} class="!m-0 self-stretch justify-start text-text-normal-primary !text-[24px] min-[1024px]:!text-[32px] font-bold">${titleText}</${titleLevel}>
                      <${subtitleLevel} class="!m-0 self-stretch justify-start text-text-normal-primary !font-normal !text-[16px] min-[1024px]:!text-[20px] leading-6">${subtitleText}</${subtitleLevel}>
                  </div>
                  <div class="self-stretch flex flex-col justify-center items-start w-full h-[64px] gap-4 border border-red-600">
                      <!-- form -->
                      <p>form</p>
                  </div>
                  <div data-content="true" data-title="false" data-type="informative" class="w-full max-w-[1248px] min-w-48  inline-flex justify-start items-start gap-2">
                    ${showAlert ? html`
                      <${Alert} 
                        variant=${alertVariant}
                        marqueeMode=${false} 
                        isRounded=${true} 
                        contentHTML=${alertContent}
                        dismissible=${alertDismissible}
                      />
                    ` : null}
                  </div>
              </div>
          </div>
      </div>
    </div>
  </div>
  `;
};

export default FormHeaderBanner;
