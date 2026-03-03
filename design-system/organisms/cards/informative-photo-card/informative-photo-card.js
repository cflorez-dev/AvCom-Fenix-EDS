import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { Button } from '../../../atoms/button/button.js';

const html = htm.bind(h);

/**
 * Builds the rel attribute value for links based on target and rel settings
 * @param {string|null} targetAttribute - Target attribute value ('_blank' or null)
 * @param {string|null} relAttribute - Rel attribute value (or null if dofollow)
 * @returns {string|null} The computed rel attribute value
 */
const buildRelAttribute = (targetAttribute, relAttribute) => {
  // If target is _blank, always include security attributes
  if (targetAttribute === '_blank') {
    // If there's an additional rel attribute (nofollow, sponsored, etc.), append it
    if (relAttribute) {
      return `noopener noreferrer ${relAttribute}`;
    }
    // Default security attributes for external links
    return 'noopener noreferrer';
  }

  // If target is not _blank, return the rel attribute as-is (or null)
  return relAttribute;
};

/**
 * Processes HTML content and adds m-0 class to all <p> elements
 * @param {string} htmlContent - HTML content string
 * @returns {string} Processed HTML with m-0 class added to <p> elements
 */
const processDetailsContent = (htmlContent) => {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return htmlContent;
  }

  // Match <p> tags (opening tags) with or without existing class attribute
  // Pattern matches: <p>, <p class="...">, <p class='...'>, <p class=...>
  return htmlContent.replace(
    /<p(\s+[^>]*)?>/gi,
    (match, attributes = '') => {
      // Check if class attribute already exists
      const classMatch = attributes.match(/class\s*=\s*["']([^"']*)["']/i);
      if (classMatch) {
        // If class exists, check if m-0 is already present
        const existingClasses = classMatch[1];
        if (!existingClasses.includes('m-0')) {
          // Add m-0 to existing classes
          return match.replace(
            /class\s*=\s*["']([^"']*)["']/i,
            `class="${existingClasses} !m-0"`
          );
        }
        // m-0 already exists, return as-is
        return match;
      } else {
        // No class attribute, add it with m-0
        return `<p${attributes} class="!m-0">`;
      }
    }
  );
};

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
 * @param {string} [props.ctaRel='dofollow'] - rel attribute ('dofollow', 'nofollow', 'sponsored')
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

  // Build rel attribute using helper function
  const computedRelAttribute = buildRelAttribute(targetAttribute, relAttribute);

  // Process details content to add m-0 class to <p> elements
  const processedDetails = processDetailsContent(details);

  // Focus classes only apply when card is clickable (no button)
  const focusClasses = isCardClickable
    ? 'focus-visible:outline-2 focus-visible:outline-border-stroke-focus focus-visible:outline-offset-2 cursor-pointer'
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
      class="${widthClass} h-[325px] rounded-2xl outline-1 outline-border-stroke-default inline-flex flex-col justify-center items-center transition-shadow duration-300 ${buttonText ? '' : 'cursor-pointer'} ${focusClasses} ${customClassName}"
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
            <img class="flex-1 object-cover object-top" src="${image}" alt="${imageAlt}" loading="${loading}" />
        </div>
        <div class="self-stretch min-h-[149px] bg-background-card-lighter rounded-bl-2xl rounded-br-2xl flex flex-col justify-start items-start gap-2.5">
            <div class="self-stretch min-w-0 p-6 flex flex-col justify-center items-center gap-3">
                <div class="self-stretch inline-flex justify-center items-center gap-2">
                    <div class="flex-1 inline-flex flex-col justify-center items-center gap-2">
                        <div class="text-center justify-start text-text-normal-primary text-xl font-bold leading-[26px]">${title}</div>
                        <div 
                          class="self-stretch text-center justify-start text-text-normal-primary text-base font-normal leading-6"
                          dangerouslySetInnerHTML=${{ __html: processedDetails }}
                        />
                    </div>
                </div>
                ${buttonText ? html`
                  <div class="self-stretch inline-flex justify-center items-center gap-2">
                    ${buttonURL ? html`
                      <a 
                        href=${buttonURL} 
                        target=${targetAttribute}
                        rel=${computedRelAttribute}
                        class="no-underline outline-none inline-flex"
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
                          customClassName="h-[31px]"
                        >
                          ${buttonText}
                        </${Button}>
                      </a>
                    ` : html`
                      <${Button}
                        variant="secondary"
                        size="xs"
                        onClick=${onClick}
                        customClassName="h-[31px]"
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
