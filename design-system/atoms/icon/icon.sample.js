import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { Icon } from './icon.js';

const html = htm.bind(h);

/**
 * Icon Component Samples
 * These examples are displayed in the Design System Block
 */

// Sample 1: Basic sizes
export const IconSizeSamples = () => html`
  <div class="flex flex-col gap-[var(--spacing-large)]">
    <div>
      <h3 class="text-[var(--heading-h500-size)] font-[var(--heading-h500-weight)] mb-[var(--spacing-small)]">
        Icon Sizes
      </h3>
      <p class="text-[var(--paragraph-p300-size)] text-[var(--text-normal-secondary)] mb-[var(--spacing-medium)]">
        The Icon component supports five predefined sizes: xs (8x8), s (16x16), m (20x20), xl (24x24), and l (40x40)
      </p>
    </div>

    <div class="flex items-center gap-[var(--spacing-x-large)]">
      <div class="flex flex-col items-center gap-[var(--spacing-tiny)]">
        <${Icon} icon="action/favorite" size="xs" />
        <span class="text-[var(--paragraph-p100-size)]">Extra Small (8px)</span>
      </div>

      <div class="flex flex-col items-center gap-[var(--spacing-tiny)]">
        <${Icon} icon="action/favorite" size="s" />
        <span class="text-[var(--paragraph-p100-size)]">Small (16px)</span>
      </div>

      <div class="flex flex-col items-center gap-[var(--spacing-tiny)]">
        <${Icon} icon="action/favorite" size="m" />
        <span class="text-[var(--paragraph-p100-size)]">Medium (20px)</span>
      </div>

      <div class="flex flex-col items-center gap-[var(--spacing-tiny)]">
        <${Icon} icon="action/favorite" size="xl" />
        <span class="text-[var(--paragraph-p100-size)]">Extra Large (24px)</span>
      </div>

      <div class="flex flex-col items-center gap-[var(--spacing-tiny)]">
        <${Icon} icon="action/favorite" size="l" />
        <span class="text-[var(--paragraph-p100-size)]">Large (40px)</span>
      </div>
    </div>
  </div>
`;

// Sample 2: Colors using CSS Variables
export const IconColorSamples = () => html`
  <div class="flex flex-col gap-[var(--spacing-large)]">
    <div>
      <h3 class="text-[var(--heading-h500-size)] font-[var(--heading-h500-weight)] mb-[var(--spacing-small)]">
        Custom Colors with CSS Variables
      </h3>
      <p class="text-[var(--paragraph-p300-size)] text-[var(--text-normal-secondary)] mb-[var(--spacing-medium)]">
        Pass the color prop with a CSS variable to customize. If not passed, it uses the original SVG color.
      </p>
    </div>

    <div class="flex items-center gap-[var(--spacing-x-large)]">
      <div class="flex flex-col items-center gap-[var(--spacing-tiny)]">
        <${Icon}
          icon="action/accessibility"
          size="m"
          color="var(--color-info)"
        />
        <span class="text-[var(--paragraph-p100-size)]">With color --color-info</span>
      </div>

      <div class="flex flex-col items-center gap-[var(--spacing-tiny)]">
        <${Icon}
          icon="action/add"
          size="m"
          color="var(--color-warning)"
        />
        <span class="text-[var(--paragraph-p100-size)]">With color --color-warning</span>
      </div>

      <div class="flex flex-col items-center gap-[var(--spacing-tiny)]">
        <${Icon}
          icon="action/android"
          size="m"
          color="var(--color-error)"
        />
        <span class="text-[var(--paragraph-p100-size)]">With color --color-error</span>
      </div>
    </div>
  </div>
`;

// Sample 4: Gallery of all available icons
export const IconGallerySample = () => {
  const iconCategories = [
    {
      title: 'Action Icons',
      description: 'Icons for user actions like add, edit, delete',
      icons: [
        'action/accessibility',
        'action/accessibility-dots',
        'action/add',
        'action/add2',
        'action/addpeople',
        'action/alarm',
        'action/alarm-add',
        'action/alarm-off',
        'action/alarm-on',
        'action/android',
        'action/aspect-ratio',
        'action/assessment',
        'action/assignment',
        'action/assignment-ind',
        'action/assignment-late',
        'action/assignment-return',
        'action/assignment-returned',
        'action/attachment',
        'action/autorenew',
        'action/backup',
        'action/badge',
        'action/basura2',
        'action/bookmark',
        'action/bookmark-outline',
        'action/bug-report',
        'action/cached',
        'action/camera-mic',
        'action/class',
        'action/contact-cal',
        'action/data-setting',
        'action/delete',
        'action/device-info',
        'action/dns',
        'action/done-all',
        'action/download',
        'action/edit',
        'action/edit-underline',
        'action/exit-to-app',
        'action/explore',
        'action/favorite',
        'action/favorite-outline',
        'action/find-in-page',
        'action/find-replace',
        'action/flip-to-back',
        'action/hide',
        'action/minus',
        'action/pause',
        'action/play',
        'action/plane',
        'action/remove',
        'action/slash',
        'action/speaker-notes',
        'action/view',
      ],
    },
    {
      title: 'Navigation Icons',
      description: 'Icons for navigation and UI controls',
      icons: [
        'navigation/apps',
        'navigation/arrow-back',
        'navigation/arrow-forward',
        'navigation/cancel',
        'navigation/chevron-left',
        'navigation/chevron-right',
        'navigation/close',
        'navigation/dot',
        'navigation/expand-less',
        'navigation/expand-more',
        'navigation/fullscreen',
        'navigation/fullscreen-exit',
        'navigation/heart',
        'navigation/home',
        'navigation/list',
        'navigation/list-order-up',
        'navigation/menu',
        'navigation/more-horiz',
        'navigation/more-vert',
        'navigation/open-in-new',
        'navigation/refresh',
        'navigation/unfold-less',
        'navigation/unfold-more',
      ],
    },
    {
      title: 'Alert Icons',
      description: 'Icons for alerts, notifications, and status indicators',
      icons: [
        'alert/active',
        'alert/announcement',
        'alert/Block',
        'alert/check_circle_outline',
        'alert/check_circle',
        'alert/Denied',
        'alert/Error',
        'alert/help',
        'alert/Icon',
        'alert/Important-Notification',
        'alert/Important',
        'alert/info',
        'alert/New-Promo',
        'alert/New-Releases',
        'alert/Notification',
        'alert/notifications_off',
        'alert/notifications_on',
        'alert/price',
        'alert/Report',
        'alert/success',
      ],
    },
    {
      title: 'Flags',
      description: 'Country flags',
      icons: [
        'flags/argentina-flag',
        'flags/colombia-flag',
        'flags/estados-unidos-flag',
        'flags/republica-dominicana-flag',
        'flags/bolivia-flag',
        'flags/costa-rica-flag',
        'flags/guatemala-flag',
        'flags/panama-flag',
        'flags/uruguay-flag',
        'flags/brasil-flag',
        'flags/ecuador-flag',
        'flags/mexico-flag',
        'flags/nicaragua-flag',
        'flags/honduras-flag',
        'flags/peru-flag',
        'flags/france-flag',
        'flags/uk-flag',
        'flags/paraguay-flag',
        'flags/chile-flag',
        'flags/canada-flag',
        'flags/europe-flag',
        'flags/el-salvador-flag',
        'flags/spain-flag',
        'flags/others-flag'
      ],
    },
  ];

  return html`
    <div class="flex flex-col gap-[var(--spacing-x-large)]">
      <div>
        <h3 class="text-[var(--heading-h500-size)] font-[var(--heading-h500-weight)]">
          Available Icons Gallery
        </h3>
      </div>

      ${iconCategories.map((category) => html`
        <div class="flex flex-col gap-[var(--spacing-medium)]">
          <div class="border-b border-[var(--border-subtle)] pb-[var(--spacing-small)]">
            <h4 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] text-[var(--text-normal-primary)]">
              ${category.title}
            </h4>
            <p class="text-[var(--paragraph-p200-size)] text-[var(--text-normal-secondary)] mt-[var(--spacing-tiny)]">
              ${category.description}
            </p>
          </div>

          <div class="grid grid-cols-6 gap-[var(--spacing-medium)]">
            ${category.icons.map((iconName) => html`
              <div
                key=${iconName}
                class="flex flex-col items-center gap-[var(--spacing-tiny)] p-[var(--spacing-small)] rounded-[var(--border-radius-medium)] hover:bg-[var(--bg-page-light)] transition-colors cursor-pointer"
                title=${iconName}
              >
                <${Icon} icon=${iconName} size="m" />
                <span class="text-[var(--paragraph-p100-size)] text-center text-[var(--text-normal-secondary)] w-full break-words">
                  ${iconName}
                </span>
              </div>
            `)}
          </div>
        </div>
      `)}
    </div>
  `;
};

// Sample 6: Accessibility
export const IconAccessibilitySample = () => html`
  <div class="flex flex-col gap-[var(--spacing-large)]">
    <div>
      <h3 class="text-[var(--heading-h500-size)] font-[var(--heading-h500-weight)] mb-[var(--spacing-small)]">
        Accessibility
      </h3>
      <p class="text-[var(--paragraph-p300-size)] text-[var(--text-normal-secondary)] mb-[var(--spacing-medium)]">
        Decorative icons use aria-hidden. Icons with meaning require ariaLabel
      </p>
    </div>

    <div class="flex flex-col gap-[var(--spacing-medium)]">
      <div>
        <p class="text-[var(--paragraph-p200-size)] mb-[var(--spacing-x-small)]">
          <strong>Decorative icon</strong> (with text):
        </p>
        <button class="inline-flex items-center gap-[var(--spacing-x-small)] px-[var(--spacing-medium)] py-[var(--spacing-small)]">
          <${Icon} icon="action/add2" size="s" />
          <span>Add</span>
        </button>
        <code class="block mt-[var(--spacing-x-small)] text-[var(--paragraph-p100-size)] text-[var(--text-normal-secondary)]">
          '&lt;Icon icon="action/add2" size="s" /&gt;'
        </code>
      </div>

      <div>
        <p class="text-[var(--paragraph-p200-size)] mb-[var(--spacing-x-small)]">
          <strong>Meaningful icon</strong> (without text):
        </p>
        <button class="inline-flex items-center justify-center w-10 h-10">
          <${Icon}
            icon="action/basura2"
            size="m"
            ariaLabel="delete icon"
          />
        </button>
        <code class="block mt-[var(--spacing-x-small)] text-[var(--paragraph-p100-size)] text-[var(--text-normal-secondary)]">
          '&lt;Icon icon="action/basura2" size="m" ariaLabel="delete icon" /&gt;'
        </code>
      </div>
    </div>
  </div>
`;

// Export all samples
export const iconSamples = [
  {
    title: 'Sizes',
    component: IconSizeSamples,
  },
  {
    title: 'Colors',
    component: IconColorSamples,
  },
  {
    title: 'Gallery',
    component: IconGallerySample,
  },
  {
    title: 'Accessibility',
    component: IconAccessibilitySample,
  },
];
