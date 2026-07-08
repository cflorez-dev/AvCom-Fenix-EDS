import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { Modal } from './modal.js';
import { Button } from '../../atoms/button/button.js';
import { LinkButton } from '../../atoms/link-button/link-button.js';
import { Icon } from '../../atoms/icon/icon.js';

const html = htm.bind(h);

export const ModalAviancaLayout = ({
  isOpen,
  onClose,
  title,
  description,
  primaryButtonLabel,
  secondaryButtonLabel,
  icon,
  image,
  coverImage,
  coverImageAlt = '',
  imageAlt = '',
  onPrimaryClick,
  onSecondaryClick,
  primaryButtonHref,
  secondaryButtonHref,
  primaryButtonDisabled = false,
  secondaryButtonDisabled = false,
  showCloseButton = true,
  role = 'dialog',
  variant = 'center',
  clickOutsideToClose = true,
  escapeToClose = true,
  customClassName = '',
  contentClassName = '',
  // Overrides opcionales (default = comportamiento actual → consumidores existentes sin cambios).
  // Members (1255601) los usa para pixel-perfect: título 24px y descripción sin cap/gutter.
  // `titleStyle` va inline porque el `h2` global del sitio (styles.css, SIN @layer) vence a las
  // utilities de Tailwind en la cascada; solo lo superan !important o un estilo inline.
  titleClassName = '',
  titleStyle = '',
  descriptionClassName = 'max-h-[81px] overflow-y-auto pr-[20px]',
  ...rest
}) => {
  const hasButtons = !!(primaryButtonLabel || secondaryButtonLabel);
  const handlePrimaryClick = (e) => {
    if (primaryButtonHref) {
      if (onPrimaryClick) {
        onPrimaryClick(e);
      }
    } else {
      e.preventDefault();
      if (onPrimaryClick) {
        onPrimaryClick(e);
      }
    }
  };

  const handleSecondaryClick = (e) => {
    if (secondaryButtonHref) {
      if (onSecondaryClick) {
        onSecondaryClick(e);
      }
    } else {
      e.preventDefault();
      if (onSecondaryClick) {
        onSecondaryClick(e);
      }
    }
  };

  const modalContent = html`
    <div class="flex flex-col h-full gap-6">
    <!-- Header section -->
    <section class="flex flex-col !m-0">
    ${(coverImage || image || icon) && html`
      <div class="flex justify-center items-center pt-3 ${coverImage ? 'h-[208px]' : ''}">
        ${coverImage && html`
          <picture class="absolute top-0 w-full z-0">
            <source 
              srcset=${coverImage} 
              type="image/webp"
            />
            <img 
              src=${coverImage} 
              alt=${coverImageAlt || title || ''} 
              class="max-w-full object-contain"
              loading="lazy"
            />
          </picture>
        `}
        ${!coverImage && image && html`
          <img 
            src=${image} 
            alt=${imageAlt || title || ''} 
            class="max-w-full max-h-[200px] object-contain"
            loading="lazy"
          />
        `}
        ${!coverImage && !image && icon && html`
          ${icon.startsWith('http') ? html`
            <img
              src=${icon}
              alt=${imageAlt || title || ''}
              class="w-[80px] h-[80px] object-contain"
              loading="lazy"
            />
          ` : html`
            <${Icon} icon=${icon} customSize=${80} customClassName="w-[80px] h-[80px] text-[var(--text-normal-primary)]" />
          `}
        `}
      </div>
    `}
    </section>

      <!-- Content section -->
      <section class="flex flex-col !m-0 gap-4">
        ${title && html`
          <h2
            class="text-center !text-text-normal-primary !m-0 ${titleClassName}"
            style=${titleStyle}
          >
            ${title}
          </h2>
        `}

        ${description && html`
          <div class="">
            <div
              class="text-text-normal-secondary !text-lg text-center leading-[27px] break-words font-normal ${descriptionClassName}">
              <span dangerouslySetInnerHTML=${{ __html: description }}></span>
            </div>
          </div>
        `}
      </section>


      <!-- Buttons section -->

      ${hasButtons && html`
        <section class="flex flex-col !m-0 gap-4">
          ${primaryButtonLabel && html`
            ${primaryButtonHref ? html`
              <a
                href=${primaryButtonHref}
                onClick=${handlePrimaryClick}
                class="inline-block w-full"
                data-no-modal-fx="true"
              >
                <${Button} 
                  variant="primary" 
                  disabled=${primaryButtonDisabled}
                  customClassName="w-full sm:w-auto h-[50px] [&:hover]:scale-100 !w-full"
                >
                  ${primaryButtonLabel}
                </${Button}>
              </a>
            ` : html`
              <${Button} 
                variant="primary" 
                onClick=${handlePrimaryClick}
                disabled=${primaryButtonDisabled}
                customClassName="w-full sm:w-auto h-[50px] [&:hover]:scale-100"
              >
                ${primaryButtonLabel}
              </${Button}>
            `}
          `}
            ${secondaryButtonLabel && html`
              <${LinkButton}
                href=${secondaryButtonHref || undefined}
                onClick=${secondaryButtonHref ? handleSecondaryClick : handleSecondaryClick}
                variant="link"
                size="medium"
                colorVariant="informative"
                disabled=${secondaryButtonDisabled}
                customClassName="w-full sm:w-auto [&]:!leading-[26px] hover:!font-bold active:!font-bold"
                data-no-modal-fx="true"
              >
                ${secondaryButtonLabel}
              </${LinkButton}>
            `}
      </section>
      `}
    </div>
  `;

  const aviancaContentClassName = `max-w-[440px] w-full p-8 [&>div:first-child]:px-8 [&>div:first-child]:py-8 ${contentClassName}`.trim();
  const closeButtonClassName = 'z-10 [&_button]:!bg-transparent [&_button]:hover:!bg-[#D9D9D9] [&_button]:active:!bg-[#B8B8B8] [&_button]:hover:scale-100 [&_button]:active:scale-100 [&_button]:active:translate-y-0 [&_button]:!w-6 [&_button]:!h-6 [&_button]:!min-w-6 [&_button]:!min-h-6 [&_button]:!p-0';
  const closeIconSlot = html`
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M12.6666 4.27301L11.7266 3.33301L7.99992 7.05967L4.27325 3.33301L3.33325 4.27301L7.05992 7.99967L3.33325 11.7263L4.27325 12.6663L7.99992 8.93967L11.7266 12.6663L12.6666 11.7263L8.93992 7.99967L12.6666 4.27301Z" fill="var(--icon-normal-primary, #1B1B1B)"/>
    </svg>
  `;
  return html`
    <${Modal}
      isOpen=${isOpen}
      onClose=${onClose}
      variant=${variant}
      size="sm"
      showCloseButton=${showCloseButton}
      clickOutsideToClose=${clickOutsideToClose}
      escapeToClose=${escapeToClose}
      customClassName=${customClassName}
      contentClassName=${aviancaContentClassName}
      closeButtonClassName=${closeButtonClassName}
      closeIconSlot=${closeIconSlot}
      role=${role}
      ...${rest}
    >
      ${modalContent}
    </${Modal}>
  `;
};

export default ModalAviancaLayout;
