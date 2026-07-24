import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Alert } from '../../molecules/alert/alert.js';
import { CabinUpgradeForm } from '../../organisms/forms/cabin-upgrade-form/cabin-upgrade-form.js';
import { MMBForm } from '../../organisms/forms/mmb-form/mmb-form.js';
import { SSCIForm } from '../../organisms/forms/ssci-form/ssci-form.js';

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
 * @param {'h2'|'h3'|'h4'|'h5'|'h6'|'p'} [props.subtitleLevel='p'] - Semantic level of the subtitle
 * @param {'left'|'center'|'right'} [props.contentAlignment='left'] - Content alignment
 * @param {'cabin-upgrade'|'mmb'|'ssci'|'none'} [props.formType='cabin-upgrade'] - Type of form to display
 * @param {boolean} [props.openInNewTab=true] - MMB form: open deeplink in new tab
 * @param {boolean} [props.showAlert=false] - Show alert
 * @param {'info'|'success'|'warning'|'error'} [props.alertType='info'] - Alert type
 * @param {boolean} [props.alertDismissible=true] - Allow closing the alert
 * @param {string} [props.alertContent=''] - Alert HTML content (rich text)
 * @param {Function} [props.onFormSubmit] - Callback when form is submitted
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
  formType = 'cabin-upgrade',
  openInNewTab,
  showAlert = false,
  alertType = 'info',
  alertDismissible = true,
  alertContent = '',
  onFormSubmit = () => {},
  modalDescription,
  modalImageData,
  modalImageAlt,
  customClassName = '',
  ...rest
}) => {
  const [isAlertVisible, setIsAlertVisible] = useState(showAlert);

  const handleAlertDismiss = () => {
    setIsAlertVisible(false);
  };

  const containerClasses = `form-header-banner-container ${customClassName}`.trim();

  // Map alertType to Alert component variant
  const getAlertVariant = (type) => {
    if (type === 'info') return 'informative';
    if (type === 'warning') return 'caution';
    return type; // 'success' or 'error' map directly
  };

  const alertVariant = getAlertVariant(alertType);

  // Render form based on formType
  const renderForm = () => {
    if (formType === 'cabin-upgrade') {
      return html`<${CabinUpgradeForm}
      modalDescription=${modalDescription}
      modalImageData=${modalImageData}
      modalImageAlt=${modalImageAlt}
      onSubmit=${onFormSubmit} />`;
    }
    if (formType === 'mmb') {
      // simplified=true because the banner already renders its own title/subtitle.
      // context="headerBanner" → the organism reads mmbForm.showHelperText.headerBanner from i18n.
      // openInNewTab is read from i18n (`mmbForm.openInNewTab`) inside the organism.
      return html`<${MMBForm}
      simplified=${true}
      context="headerBanner"
      onSubmit=${onFormSubmit} />`;
    }
    if (formType === 'ssci') {
      // Check-in (SSCI) form. simplified=true: el banner ya pinta su título/subtítulo.
      // context="headerBanner" para tomar los textos/helpers de i18n del banner ancho.
      return html`<${SSCIForm}
      simplified=${true}
      context="headerBanner"
      onSubmit=${onFormSubmit} />`;
    }
    return null; // Si formType === 'none' o no reconocido
  };

  // Determine fetchpriority based on loading mode
  // Only set fetchpriority="high" if eager (likely LCP/above the fold)
  // For lazy loading, don't set fetchpriority (or use "low")
  const fetchPriority = loadingMode === 'eager' ? 'high' : null;

  // Serve the original uploaded asset (no AEM optimization) per client request:
  // the AEM-authored fallback src carries ?width=750&format=webply&optimize=medium,
  // which re-encoded the PNG at medium quality and looked pixelated. Strip query params.
  const imageSrc = imageData?.src ? imageData.src.split('?')[0] : undefined;

  // Build img attributes object
  const imgAttributes = {
    src: imageSrc,
    alt: imageData?.alt || imageAlt || '',
    loading: loadingMode,
    class: 'w-full h-full object-cover',
  };

  // Add fetchpriority only if eager (LCP optimization)
  if (fetchPriority) {
    imgAttributes.fetchpriority = fetchPriority;
  }

  return html`
  <div class=${containerClasses} data-alignment=${contentAlignment} ...${rest}>
    <div class="w-full py-8 relative inline-flex flex-col justify-center items-center gap-14">
      <div class="self-stretch flex flex-col justify-start items-center gap-9">
          <div data-alert="true" data-device="mob" data-form="true" class="w-full max-w-[1248px] rounded-[24px] shadow-[0px_2px_20px_2px_rgba(73,73,73,0.25)] flex flex-col min-[1024px]:flex-row justify-center items-start overflow-hidden">
              <div class="relative self-stretch h-[180px] min-[1024px]:h-auto min-[1024px]:flex-1 overflow-hidden">
                ${imageData?.src ? html`
                  <picture class="absolute inset-0 block w-full h-full">
                    <img ...${imgAttributes} />
                  </picture>
                ` : null}
              </div>

              <div class="self-stretch p-4 min-[1024px]:p-8 bg-background-card-lighter flex flex-col justify-start items-start gap-6 w-[100%] min-[1024px]:min-w-[660px] min-[1024px]:w-[660px] min-[1248px]:max-w-[848px] min-[1248px]:w-[848px]">
                  <div class="self-stretch flex flex-col justify-start items-start gap-[4px]">
                      <${titleLevel} class="!m-0 self-stretch justify-start text-text-normal-primary !leading-[32px] min-[1024px]:!leading-[42px] font-bold">${titleText}</${titleLevel}>
                      <${subtitleLevel} class="!m-0 self-stretch justify-start text-text-normal-primary !font-normal leading-[30px]">${subtitleText}</${subtitleLevel}>
                  </div>
                  ${formType !== 'none' ? html`
                    <div class="self-stretch flex flex-col justify-center items-start w-full gap-4">
                        ${renderForm()}
                    </div>
                  ` : null}
                  ${isAlertVisible ? html`
                    <div data-content="true" data-title="false" data-type="informative" class="w-full max-w-[1248px] min-w-48  inline-flex justify-start items-start gap-2">
                      <${Alert} 
                        variant=${alertVariant}
                        marqueeMode=${false} 
                        isRounded=${true} 
                        contentHTML=${alertContent}
                        dismissible=${alertDismissible}
                        onDismiss=${handleAlertDismiss}
                      />
                    </div>
                  ` : null}
              </div>
          </div>
      </div>
    </div>
  </div>
  `;
};

export default FormHeaderBanner;
