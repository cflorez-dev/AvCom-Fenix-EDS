import { h } from "@dropins/tools/preact.js";
import htm from "htm";
import { Chip } from "../../../atoms/chip/chip.js";

const html = htm.bind(h);

export const PromotionCard = ({
  image = '',
  imageAlt = '',
  destination = '',
  label = '',
  discountChip = '',
  discountChipVariant = 'discount',
  currency = '',
  price = '',
  complementPrice = '',
  comparativeCurrency = '',
  comparativePrice = '',
  showLifemilesChip = false,
  lifemilesTag = '',
  lifemilesTagVariant = "lifemiles",
  loading = 'lazy',
  onClick,
}) => {
  const focusClasses = 'focus:outline focus:outline-2 focus:outline-border-stroke-focus focus:outline-offset-2';
  const cursorClass = 'cursor-pointer';
  const loadingMode = loading === 'eager' ? 'eager' : 'lazy';
  const imageDecoding = loadingMode === 'eager' ? 'sync' : 'async';
  const imageFetchPriority = loadingMode === 'eager' ? 'high' : 'low';

  const handleKeyDown = (e) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick(e);
    }
  };

  return html`
    <div 
      className="w-full min-h-[264px] relative rounded-2xl flex flex-col justify-end items-center group ${focusClasses} ${cursorClass}"
      onClick=${onClick || undefined}
      onKeyDown=${onClick ? handleKeyDown : undefined}
      tabIndex=${onClick ? 0 : undefined}
    >
      <div className="self-stretch h-[264px] rounded-2xl flex flex-col justify-center items-center overflow-hidden relative">
        <img
          className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-300 ease-in-out group-hover:scale-[1.04]"
          src=${image}
          alt=${imageAlt}
          loading=${loadingMode}
          decoding=${imageDecoding}
          fetchpriority=${imageFetchPriority}
        />
      </div>
      <div className="absolute w-full self-stretch p-3 bg-[var(--color-background-card-lighter-alpha)] rounded-bl-2xl rounded-br-2xl backdrop-blur-[3px] flex flex-col justify-start items-start">
        <div className="self-stretch p-3 bg-[var(--color-background-card-lighter)] rounded-2xl flex flex-col justify-end items-start gap-2">
          <div className="self-stretch inline-flex justify-start items-center gap-2">
            <div className="flex-1 justify-end text-text-normal-primary text-lg font-bold line-clamp-1 leading-6">${destination}</div>
            ${discountChip ? html`
              <${Chip} variant=${discountChipVariant}>
                ${discountChip}
              </${Chip}>
            ` : ''}
          </div>
          <div className="self-stretch inline-flex justify-end items-start gap-2">
            <div className="flex-1 justify-center text-text-normal-primary text-xs font-normal leading-[1.125rem]">${label}</div>
            <div className="inline-flex flex-col justify-start items-end">
              <div className="inline-flex justify-start items-center gap-1">
                <div className="justify-start text-text-normal-primary text-base font-bold leading-auto">${currency}</div>
                <div className="justify-start text-text-normal-primary text-base font-bold leading-auto">${price}</div>
              </div>
              ${complementPrice ? html`
                <div data-type="discount">
                  <div className="text-right justify-start text-red-600 text-xs font-normal line-through leading-4">${currency} ${complementPrice}</div>
                </div>
              ` : ''}
              ${!complementPrice && comparativeCurrency && comparativePrice ? html`
                <div data-property-1="secondPrice">
                  <div className="text-right justify-start text-text-normal-secondary text-xs font-normal leading-[1.125rem]">${comparativeCurrency} ${comparativePrice}</div>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
      ${showLifemilesChip && lifemilesTag ? html`
        <div className="w-28 pr-3 pt-3 right-[0] top-0 absolute inline-flex justify-end items-end gap-2">
          <${Chip} 
            variant=${lifemilesTagVariant}>
              ${lifemilesTag}
          </${Chip}>
        </div>
      ` : ''}
    </div>
  `;
};

export default PromotionCard;
