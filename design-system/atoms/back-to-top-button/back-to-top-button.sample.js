import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { BackToTopButton } from './back-to-top-button.js';

const html = htm.bind(h);

/**
 * BackToTopButton Samples
 * Showcases different configurations of the back-to-top button component
 */

export const backToTopButtonSamples = {
  title: 'Back to Top Button',
  description: 'Button that appears after scroll and returns user to top of page',
  samples: [
    {
      title: 'Custom Icon',
      description: 'Button with custom arrow icon',
      code: html`
        <div class="relative h-[150vh] bg-gradient-to-b from-pink-50 to-purple-50 p-8">
          <div class="max-w-2xl mx-auto">
            <h2 class="heading-h500 !mb-4">Custom Icon</h2>
            <p class="paragraph-p300 !mb-4">
              This button uses a custom chevron-up icon (bottom-right position).
            </p>
            <div class="space-y-4">
              ${Array.from({ length: 15 }, (_, i) => html`
                <div key=${i} class="bg-white p-4 rounded-lg shadow-sm">
                  <p class="paragraph-p200">Content block ${i + 1}</p>
                </div>
              `)}
            </div>
          </div>
          
          <${BackToTopButton} 
            threshold=${250}
            icon=${html`
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none"
                class="w-[24px] h-[24px]"
              >
                <path 
                  d="M18 15L12 9L6 15" 
                  stroke="currentColor" 
                  stroke-width="2" 
                  stroke-linecap="round" 
                  stroke-linejoin="round"
                />
              </svg>
            `}
          />
        </div>
      `,
    },
  ],
};

export default backToTopButtonSamples;
