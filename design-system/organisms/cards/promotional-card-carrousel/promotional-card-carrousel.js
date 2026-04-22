import { h } from '@dropins/tools/preact.js';
import { useState, useEffect, useRef } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Button } from '../../../atoms/button/button.js';

const html = htm.bind(h);

/**
 * PromotionalCardCarrousel - Horizontal promotional card for carousels
 * Designed to display promotions with image, title, description and CTA
 * Supports two color variants: dark and light
 *
 * @param {Object} props - Component properties
 * @param {'dark'|'light'} [props.variant='dark'] - Card color variant
 * @param {string} props.title - Promotion title (required)
 * @param {string} props.description - Promotion description (required)
 * @param {HTMLElement} props.pictureElement - Optimized picture element from createOptimizedPicture
 * @param {string} [props.imageAlt=''] - Alternative text for the image
 * @param {string} [props.buttonText=''] - Button text
 * @param {string} [props.buttonURL=''] - Button URL
 * @param {Function} [props.onClick] - Callback for button click
 * @param {string} [props.backgroundColor=''] - Custom background color (optional)
 * @param {string} [props.customClassName=''] - Additional CSS classes
 * @param {'lazy'|'eager'} [props.loading='lazy'] - Image loading strategy
 * @returns {import('preact').VNode} PromotionalCardCarrousel component
 */
export const PromotionalCardCarrousel = ({
  variant = 'light',
  title,
  description,
  pictureElement,
  buttonText = '',
  buttonURL = '',
  onClick,
  backgroundColor = '',
  customClassName = '',
  loading = 'lazy',
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const imageContainerRef = useRef(null);

  // Detect mobile viewport (< 1024px)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Insert pictureElement into DOM and apply responsive classes
  useEffect(() => {
    if (imageContainerRef.current && pictureElement) {
      imageContainerRef.current.innerHTML = '';
      const clonedPicture = pictureElement.cloneNode(true);
      // Apply responsive classes to img element inside picture
      const imgElement = clonedPicture.querySelector('img');
      if (imgElement) {
        const imageClasses = isMobile
          ? 'w-[7.5rem] h-[10.875rem] object-cover'
          : 'w-[11.25rem] h-[10.875rem] object-cover';
        imgElement.className = imageClasses;
        imgElement.loading = loading;
        imgElement.decoding = loading === 'eager' ? 'sync' : 'async';
        imgElement.fetchpriority = loading === 'eager' ? 'high' : 'low';
        imgElement.sizes = '(max-width: 768px) 120px, 180px';
        const displayWidth = isMobile ? 120 : 180;
        const displayHeight = 174;
        imgElement.width = displayWidth;
        imgElement.height = displayHeight;
      }
      imageContainerRef.current.appendChild(clonedPicture);
    }
  }, [pictureElement, isMobile, loading]);

  const bgColorClass = variant === 'light' ? 'bg-background-brand-primary-darker' : 'bg-background-brand-primary-lighter';
  const textColorClass = variant === 'light' ? 'text-text-normal-lighter' : 'text-text-normal-primary';
  const buttonVariant = variant === 'light' ? 'tertiary' : 'primary';

  // Determine if the card is clickable
  const hasButton = buttonText && buttonURL;
  const isCardClickable = !buttonText && buttonURL;

  const handleCardClick = (e) => {
    // If not clickable, do nothing
    if (!isCardClickable) {
      return;
    }

    // If the click comes from the button, do nothing (the button handles its own click)
    if (e.target.closest('[data-name="button"]')) {
      return;
    }

    // Navigate to the URL
    if (buttonURL) {
      window.location.href = buttonURL;
    }

    // Execute onClick if it exists
    if (onClick) {
      onClick(e);
    }
  };

  // Determine flex classes: if customClassName has flex-none, don't use flex-1
  const hasCustomFlex = customClassName.includes('flex-none') || customClassName.includes('w-96');
  const flexClass = hasCustomFlex ? '' : 'flex-1';

  // Responsive classes for mobile
  const cardClasses = isMobile
    ? 'w-96 max-w-96 min-w-96'
    : flexClass;

  return html`
    <div 
      class="${cardClasses} rounded-2xl inline-flex justify-start items-center overflow-hidden ${isCardClickable ? 'cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-border-stroke-focus)]' : ''} ${!isMobile ? 'hover:shadow-[0px_2px_20px_2px_rgba(73,73,73,0.25)] transition-shadow' : ''} ${customClassName}"
      data-name="promotionalCardCarrousel"
      data-variant="${variant}"
      onClick=${isCardClickable ? handleCardClick : null}
      tabIndex=${isCardClickable ? '0' : null}
      role=${isCardClickable ? 'button' : null}
      onKeyDown=${isCardClickable ? (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick(e);
    }
  } : null}
    >
      <div ref=${imageContainerRef} class="flex-shrink-0"></div>
      <div 
        class="flex-1 h-[10.875rem] px-3 py-4 ${backgroundColor ? '' : bgColorClass} inline-flex flex-col justify-between items-end"
        style=${backgroundColor ? `background-color: ${backgroundColor}` : ''}
      >
        <div class="self-stretch flex flex-col justify-start items-start gap-2">
          <div class="self-stretch justify-start ${textColorClass} text-xl font-bold leading-[1.625rem]">
            ${title}
          </div>
          <div class="self-stretch justify-start ${textColorClass} text-sm font-normal leading-[1.5]">
            ${description}
          </div>
        </div>
        ${hasButton ? html`
          <${Button}
            variant="${buttonVariant}"
            size="xs"
            onClick=${(e) => {
    e.stopPropagation();
    if (buttonURL) {
      window.location.href = buttonURL;
    }
    if (onClick) {
      onClick(e);
    }
  }}
          >
            ${buttonText}
          </${Button}>
        ` : ''}
      </div>
    </div>
  `;
};

export default PromotionalCardCarrousel;
