import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { processContentHTML } from '../../helpers/process-content-html.js';

const html = htm.bind(h);

/**
 * TipsCards - Container component for multiple tip cards
 * Renders cards in a responsive grid layout with rounded border
 * All-in-one component that includes card items rendering
 * @param {Object} props - Component props
 * @param {Array<Object>} props.cards - Array of card objects
 *   with {icon, iconAlt, title, description}
 * @param {string} props.loading - Image loading strategy ('lazy' | 'eager')
 * @param {boolean} props.showTitle - Whether to show container title
 * @param {string} props.size - Card size variant ('large' | 'medium' | 'small')
 * @param {string} props.customClassName - Additional CSS classes
 * @returns {import('preact').VNode} Preact component
 */
const TipsCards = ({
  cards = [],
  loading = 'lazy',
  size = 'large',
  customClassName = '',
  ...rest
}) => html`
  <div
    class="w-full lg:max-w-[1248px] p-4 lg:px-8 lg:py-6 bg-background-brand-primary-lighter rounded-2xl outline outline-offset-[-1px] outline-border-brand-primary-disable inline-flex flex-col justify-start items-start gap-6 ${customClassName}"
    ...${rest}
  >
    <div class="self-stretch flex flex-col justify-start items-start gap-6">
      <div class="self-stretch flex flex-col lg:inline-flex lg:flex-row justify-start items-start gap-6">
        ${cards.map((card, index) => html`
          ${index > 0 && html`
            <div class="self-stretch border-t border-border-stroke-default lg:border-t-0 lg:border-l lg:self-stretch"></div>
          `}
          <div data-size=${size} class="self-stretch lg:flex-1 lg:min-w-0 inline-flex justify-start items-start gap-3">
            ${card.icon && html`
              <div class="w-6 h-6 relative flex-shrink-0">
                <img
                  src=${card.icon}
                  alt=${card.iconAlt || 'Tip icon'}
                  loading=${loading}
                  decoding="async"
                  class="w-5 h-5 left-[2px] top-[2px] absolute object-contain"
                />
              </div>
            `}
            <div class="flex-1 min-w-0 inline-flex flex-col justify-start items-start gap-3">
              ${card.title && html`
                <div class="self-stretch justify-start text-text-normal-primary text-lg lg:text-xl font-bold leading-[1.5rem] lg:!leading-auto">
                  ${card.title}
                </div>
              `}
              ${card.description && html`
                <div
                  class="tips-card-description self-stretch justify-start text-text-normal-primary text-sm font-normal leading-normal"
                  dangerouslySetInnerHTML=${{
    __html: processContentHTML(card.description || '', 'informative', {
      pClassName: '!text-sm font-normal leading-normal !m-0',
    }),
  }}
                ></div>
              `}
            </div>
          </div>
        `)}
      </div>
    </div>
  </div>
`;

export default TipsCards;
