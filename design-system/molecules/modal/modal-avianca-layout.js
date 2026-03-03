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
            class="text-center !text-text-normal-primary !m-0"
          >
            ${title}
          </h2>
        `}

        ${description && html`
          <div class="">
            <div
              class="text-text-normal-secondary !text-lg text-center leading-[27px] break-words font-normal max-h-[81px] overflow-y-auto pr-[20px]">
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
  const closeButtonClassName = 'z-10 [&_button]:bg-white/60 [&_button]:hover:scale-100 [&_button]:active:scale-100';
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
      role=${role}
      ...${rest}
    >
      ${modalContent}
    </${Modal}>
  `;
};

export default ModalAviancaLayout;
