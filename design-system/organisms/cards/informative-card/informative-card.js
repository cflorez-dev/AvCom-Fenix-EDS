import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { Button } from '../../../atoms/button/button.js';
import { Icon } from '../../../atoms/icon/icon.js';

const html = htm.bind(h);

/**
 * InformativeCard - Tarjeta informativa de Avianca
 * Soporta layouts horizontal y vertical con diferentes tipos de acción
 *
 * @param {Object} props - Component properties
 * @param {'horizontal'|'vertical'} [props.variant='horizontal'] - Layout de la tarjeta
 * @param {string} props.title - Título de la tarjeta (requerido)
 * @param {string} props.details - Texto descriptivo de la tarjeta (requerido)
 * @param {string} props.image - URL de la imagen (requerido)
 * @param {string} [props.imageAlt=''] - Texto alternativo para la imagen
 * @param {'none'|'button'|'chevron'|'both'} [props.ActionType='none']
 * @param {string} [props.buttonText=null] - Texto del botón (requerido si ActionType es 'button')
 * @param {Function} [props.onClick] - Callback para click en botón/chevron
 * @returns {import('preact').VNode} InformativeCard component
 */
export const InformativeCard = ({
  variant = 'horizontal',
  title,
  details,
  image,
  imageAlt = '',
  loading = 'lazy',
  ActionType = 'none', // 'button', 'chevron', 'none', 'both' (only for dev)
  buttonText = null,
  onClick,
}) => {
  const focusClasses = 'focus-visible:!outline focus-visible:!outline-2 focus-visible:!outline-border-stroke-focus focus-visible:!outline-offset-2';

  const cursorClass = ((ActionType === 'chevron' || ActionType === 'none') && onClick) ? 'cursor-pointer' : '';
  const loadingMode = loading === 'eager' ? 'eager' : 'lazy';
  const imageDecoding = loadingMode === 'eager' ? 'sync' : 'async';
  const imageFetchPriority = loadingMode === 'eager' ? 'high' : 'low';

  return html`
    ${(variant === 'horizontal') ? html`
      <div 
        data-button="${ActionType === 'button' ? 'true' : ''}" 
        data-chevronicon="${ActionType === 'chevron' ? 'true' : ''}" 
        data-direction="${ActionType === 'horizontal' ? 'horizontal' : 'vertical'}" 
        class="w-80 min-w-72 h-full bg-background-card-lighter rounded-2xl outline outline-1 outline-offset-[-1px] outline-border-brand-primary-disable inline-flex justify-start items-center overflow-hidden hover:shadow-[0px_2px_20px_2px_rgba(73,73,73,0.25)] transition-shadow mdlg:w-full mdlg:min-w-0 ${focusClasses} ${cursorClass}"
        tabIndex=${0}
        onClick=${(ActionType === 'chevron' || ActionType === 'none') ? onClick : undefined}
      >
        <div class="self-stretch max-w-48 px-6 rounded-tl-2xl rounded-bl-2xl flex justify-center items-center">
          <img
            class="w-20 h-20 relative"
            src=${image}
            alt=${imageAlt}
            loading=${loadingMode}
            decoding=${imageDecoding}
            fetchpriority=${imageFetchPriority}
          />
        </div>
        <div class="flex-1 pr-5 rounded-tr-2xl rounded-br-2xl flex justify-start items-center gap-3">
          <div class="flex-1 min-h-40 py-5 inline-flex flex-col justify-center items-start gap-3">
            <div class="flex-1 flex flex-col justify-center items-start gap-2">
              <div class="justify-start text-text-normal-primary text-xl font-bold">${title}</div>
              <div class="self-stretch justify-start text-text-normal-primary text-base font-normal leading-6">${details}</div>
            </div>
            ${(ActionType === 'button' || ActionType === 'both') && buttonText ? html`
              <div class="self-stretch inline-flex justify-end items-center gap-2">
                <${Button}
                  variant="secondary"
                  size="xs"
                  onClick=${onClick}
                >
                  ${buttonText}
                </${Button}>
              </div>
            ` : ''}
          </div>
          ${(ActionType === 'chevron' || ActionType === 'both') ? html`
            <div data-direction="right" data-state="default" class="w-6 h-6 flex justify-center items-center">
              <${Icon} icon="navigation/chevron-right" size="m" customSize=${true}/>
            </div>
          ` : ''}
        </div>
      </div>
    ` : html`
      <div 
        class="w-80 min-w-80 h-full bg-background-card-lighter rounded-2xl outline outline-1 outline-offset-[-1px] outline-border-brand-primary-disable inline-flex flex-col justify-center items-center overflow-hidden hover:shadow-[0px_2px_20px_2px_rgba(73,73,73,0.25)] transition-shadow mdlg:w-full mdlg:min-w-0 ${focusClasses} ${cursorClass}"
        tabIndex=${0}
        onClick=${(ActionType === 'chevron' || ActionType === 'none') ? onClick : undefined}
      >
        <div class="w-full h-32 max-w-48 px-6 rounded-tl-2xl rounded-bl-2xl inline-flex justify-center items-center">
            <img
              class="w-20 h-20 relative"
              src=${image}
              alt=${imageAlt}
              loading=${loadingMode}
              decoding=${imageDecoding}
              fetchpriority=${imageFetchPriority}
            />
        </div>
        <div class="self-stretch p-6 rounded-tr-2xl rounded-br-2xl inline-flex justify-start items-center gap-3">
            <div class="flex-1 inline-flex flex-col justify-center items-center gap-3">
                <div class="self-stretch flex flex-col justify-start items-center gap-2">
                    <div class="justify-start text-text-normal-primary text-xl font-bold">${title}</div>
                    <div class="self-stretch text-center justify-start text-text-normal-primary text-base font-normal leading-6">${details}</div>
                </div>
                ${(ActionType === 'button' || ActionType === 'both') && buttonText ? html`
                  <div class="self-stretch inline-flex justify-center items-center gap-2">
                      <${Button}
                        variant="secondary"
                        size="xs"
                        onClick=${onClick}
                      >
                        ${buttonText}
                      </${Button}>
                  </div>
                ` : ''}
            </div>
        </div>
    </div>
    `}
  `;
};

export default InformativeCard;
