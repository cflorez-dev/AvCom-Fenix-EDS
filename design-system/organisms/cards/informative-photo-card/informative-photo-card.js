import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { Button } from '../../../atoms/button/button.js';

const html = htm.bind(h);

/**
 * InformativePhotoCard - Informative card with featured image
 * Designed to display content with main image, title, description and action
 *
 * @param {Object} props - Component properties
 * @param {string} props.title - Card title (required)
 * @param {string} props.details - Card descriptive text (required)
 * @param {string} props.image - Image URL (required)
 * @param {string} [props.imageAlt=''] - Alternative text for the image
 * @param {string} [props.buttonText=''] - Button text
 * @param {string} [props.buttonURL=''] - Button URL
 * @param {boolean} [props.ctaTargetBlank=false] - Open link in new tab
 * @param {string} [props.ctaRel='dofollow'] - Link rel attribute ('dofollow', 'nofollow', 'sponsored')
 * @param {Function} [props.onClick] - Callback for button click
 * @param {string} [props.loading='lazy'] - Image loading strategy ('lazy' or 'eager')
 * @param {string} [props.customClassName=''] - Additional CSS classes
 * @returns {import('preact').VNode} InformativePhotoCard component
 */
export const InformativePhotoCard = ({
  title,
  details,
  image,
  imageAlt = '',
  buttonText = '',
  buttonURL = '',
  ctaTargetBlank = false,
  ctaRel = 'dofollow',
  onClick,
  loading = 'lazy',
  customClassName = '',
}) => {
  // Determine if customClassName has a fixed width
  const hasCustomWidth = customClassName.includes('w-[') || customClassName.includes('w-96');
  const widthClass = hasCustomWidth ? '' : 'w-75 min-w-72';

  // Card is clickable only when there's no buttonText but there is a buttonURL
  const isCardClickable = !buttonText && buttonURL;

  // Normalize rel attribute: 'dofollow' means no rel attribute
  const relAttribute = ctaRel && ctaRel.toLowerCase() !== 'dofollow' ? ctaRel.toLowerCase() : null;
  
  // Target attribute
  const targetAttribute = ctaTargetBlank ? '_blank' : null;

  // Focus classes only apply when card is clickable (no button)
  const focusClasses = isCardClickable 
    ? 'focus-within:outline-2 focus-within:outline-border-stroke-focus focus-within:outline-offset-2 cursor-pointer' 
    : '';

  const handleCardClick = (e) => {
    if (!isCardClickable) return;
    
    // Don't navigate if clicking on a link inside details
    if (e.target.tagName === 'A') return;
    
    if (buttonURL) {
      if (ctaTargetBlank) {
        const newWindow = window.open(buttonURL, '_blank');
        // Add security and SEO attributes
        if (newWindow && relAttribute) {
          newWindow.opener = null;
        }
      } else {
        window.location.href = buttonURL;
      }
    }
    
    if (onClick) {
      onClick(e);
    }
  };

  return html`
    <div 
      class="${widthClass} rounded-2xl outline-1 outline-border-stroke-default inline-flex flex-col justify-center items-center ${focusClasses} ${customClassName}"
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
        <div class="self-stretch h-44 bg-background-card-lighter rounded-tl-2xl rounded-tr-2xl inline-flex justify-center items-center overflow-hidden">
            <img class="flex-1 self-stretch" src="${image}" alt="${imageAlt}" loading="${loading}" />
        </div>
        <div class="self-stretch bg-background-card-lighter rounded-bl-2xl rounded-br-2xl flex flex-col justify-start items-start gap-2.5">
            <div class="self-stretch min-w-64 p-6 flex flex-col justify-center items-center gap-3">
                <div class="self-stretch inline-flex justify-center items-center gap-2">
                    <div class="flex-1 inline-flex flex-col justify-center items-center gap-2">
                        <div class="text-center justify-start text-text-normal-primary text-xl font-bold">${title}</div>
                        <div 
                          class="self-stretch text-center justify-start text-text-normal-primary text-base font-normal leading-6"
                          dangerouslySetInnerHTML=${{ __html: details }}
                        />
                    </div>
                </div>
                ${buttonText ? html`
                  <div class="self-stretch inline-flex justify-center items-center gap-2">
                    ${buttonURL ? html`
                      <a 
                        href=${buttonURL} 
                        target=${targetAttribute}
                        rel=${targetAttribute ? (relAttribute ? `noopener noreferrer ${relAttribute}` : 'noopener noreferrer') : relAttribute}
                        class="no-underline outline-none"
                        onClick=${(e) => {
                          if (onClick) {
                            e.preventDefault();
                            onClick(e);
                          }
                        }}
                      >
                        <${Button}
                          variant="secondary"
                          size="xs"
                          as="span"
                        >
                          ${buttonText}
                        </${Button}>
                      </a>
                    ` : html`
                      <${Button}
                        variant="secondary"
                        size="xs"
                        onClick=${onClick}
                      >
                        ${buttonText}
                      </${Button}>
                    `}
                  </div>
                ` : ''}
            </div>
        </div>
    </div>
  `;
};

export default InformativePhotoCard;
