import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { Button } from '../../../atoms/button/button.js';
import { LinkButton } from '../../../atoms/link-button/link-button.js';
import { Icon } from '../../../atoms/icon/icon.js';
import { processContentHTML } from '../../../helpers/process-content-html.js';
import { sanitizeHTML } from '../../../../scripts/utils/sanitize.js';

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
  buttonVariant = 'link', // Bug 12: author-selectable CTA style (link | secondary)
  onClick,
}) => {
  const hasInteractiveAction = typeof onClick === 'function';
  const isCardClickable = (ActionType === 'chevron' || ActionType === 'none') && hasInteractiveAction;
  const hasChevron = ActionType === 'chevron' || ActionType === 'both';
  const focusClasses = isCardClickable
    ? 'focus-visible:!outline focus-visible:!outline-2 focus-visible:!outline-border-stroke-focus focus-visible:!outline-offset-2'
    : '';
  // El hover de TODA la card es afordancia de "la card entera es clicable", así que
  // se gatea con isCardClickable. Con ActionType==='button' la única interacción es
  // el botón terciario interno: la card no debe reaccionar, el botón da su feedback.
  const hoverClasses = isCardClickable
    ? 'hover:shadow-[0px_2px_20px_2px_rgba(73,73,73,0.25)] transition-shadow'
    : '';
  const cursorClass = isCardClickable ? 'cursor-pointer' : '';
  // Sin href el LinkButton renderiza un <button>, y styles.css aplica
  // `input, textarea, select, button { font: inherit }` fuera de toda capa; una regla
  // sin capa gana a cualquier utilidad de @layer utilities, así que `hover:font-bold`
  // no llega a aplicarse. El `!` es lo que iguala este CTA al resto de enlaces.
  const ctaClasses = 'w-auto hover:!font-bold active:!font-bold';
  const loadingMode = loading === 'eager' ? 'eager' : 'lazy';
  const imageDecoding = loadingMode === 'eager' ? 'sync' : 'async';
  const imageFetchPriority = loadingMode === 'eager' ? 'high' : 'low';

  // Process details content with shared rich text mapper (LinkButton styles, lists, etc.)
  const processedDetails = processContentHTML(details, 'informative', {
    pClassName: 'text-sm mdlg:text-base',
    // Los enlaces inline del rich-text deben ir subrayados (el LinkButton no aplica
    // underline por defecto; sin esto quedarían sin underline tras el fix del CTA).
    linkButtonOptions: { underline: true },
  });

  return html`
    ${(variant === 'horizontal') ? html`
      <div 
        data-button="${ActionType === 'button' ? 'true' : ''}" 
        data-chevronicon="${ActionType === 'chevron' ? 'true' : ''}" 
        data-direction="${ActionType === 'horizontal' ? 'horizontal' : 'vertical'}" 
        class="w-[240px] min-w-[240px] md:w-auto md:min-w-[220px] md:max-w-none h-auto relative bg-background-card-lighter rounded-2xl outline outline-1 outline-offset-[-1px] outline-border-brand-primary-disable flex flex-col mdlg:inline-flex mdlg:flex-row justify-start items-stretch mdlg:items-center gap-4 mdlg:gap-0 overflow-hidden md:overflow-visible mdlg:overflow-hidden mdlg:w-full mdlg:min-w-[220px] ${hoverClasses} ${focusClasses} ${cursorClass}"
        tabIndex=${isCardClickable ? 0 : undefined}
        onClick=${isCardClickable ? onClick : undefined}
      >
        <div class="self-stretch w-full pt-4 px-4 mdlg:w-auto mdlg:max-w-[92px] mdlg:p-4 mdlg:rounded-tl-2xl mdlg:rounded-bl-2xl flex justify-start mdlg:justify-center items-center mdlg:items-start">
          <img
            class="w-[60px] h-[60px] relative"
            src=${image}
            alt=${imageAlt}
            loading=${loadingMode}
            decoding=${imageDecoding}
            fetchpriority=${imageFetchPriority}
          />
        </div>
        <div class="w-full pl-4 ${hasChevron ? 'pr-12' : 'pr-4'} pb-4 mdlg:flex-1 mdlg:w-auto mdlg:pl-0 mdlg:pr-4 mdlg:pb-0 mdlg:rounded-tr-2xl mdlg:rounded-br-2xl mdlg:self-stretch flex justify-start items-center mdlg:items-start gap-3">
          <div class="flex-1 mdlg:py-4 inline-flex flex-col justify-start items-start gap-3 mdlg:gap-6">
            <div class="flex-1 flex flex-col justify-center items-start gap-2">
              <div class="justify-start text-text-normal-primary text-base mdlg:text-xl font-bold">${title}</div>
              <div
                class="self-stretch justify-start text-text-normal-primary text-sm mdlg:text-base font-normal leading-normal"
                dangerouslySetInnerHTML=${{ __html: sanitizeHTML(processedDetails) }}
              />
            </div>
            ${(ActionType === 'button' || ActionType === 'both') && buttonText ? html`
              <div class="self-stretch flex w-full mdlg:inline-flex mdlg:w-auto ${buttonVariant === 'secondary' ? 'justify-end' : 'justify-start mdlg:justify-end'} items-center gap-2">
                ${buttonVariant === 'secondary' ? html`
                  <${Button}
                    variant="secondary"
                    size="xs"
                    onClick=${onClick}
                    customClassName="w-full mdlg:w-auto"
                  >
                    ${buttonText}
                  </${Button}>
                ` : html`
                  <${LinkButton}
                    variant="link"
                    size="default"
                    colorVariant="informative"
                    onClick=${onClick}
                    customClassName=${ctaClasses}
                  >
                    ${buttonText}
                  </${LinkButton}>
                `}
              </div>
            ` : ''}
          </div>
          ${(ActionType === 'chevron' || ActionType === 'both') ? html`
            <div data-direction="right" data-state="default" class="w-6 h-6 flex justify-center items-center self-center absolute right-4 top-1/2 -translate-y-1/2 mdlg:static mdlg:translate-y-0">
              <${Icon} icon="navigation/chevron-right" size="m" customSize=${true}/>
            </div>
          ` : ''}
        </div>
      </div>
    ` : html`
      <div 
        class="w-[240px] min-w-[240px] h-auto bg-background-card-lighter rounded-2xl outline outline-1 outline-offset-[-1px] outline-border-brand-primary-disable inline-flex flex-col justify-center items-center overflow-hidden md:w-auto md:min-w-[220px] mdlg:w-full mdlg:min-w-[220px] ${hoverClasses} ${focusClasses} ${cursorClass}"
        tabIndex=${isCardClickable ? 0 : undefined}
        onClick=${isCardClickable ? onClick : undefined}
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
                    <div class="text-center justify-start text-text-normal-primary text-xl font-bold">${title}</div>
                    <div
                      class="self-stretch text-center justify-start text-text-normal-primary text-base font-normal leading-6"
                      dangerouslySetInnerHTML=${{ __html: sanitizeHTML(processedDetails) }}
                    />
                </div>
                ${(ActionType === 'button' || ActionType === 'both') && buttonText ? html`
                  <div class="self-stretch flex w-full mdlg:inline-flex mdlg:w-auto justify-center items-center gap-2">
                      <${Button}
                        variant="secondary"
                        size="xs"
                        onClick=${onClick}
                        customClassName="w-full mdlg:w-auto"
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
