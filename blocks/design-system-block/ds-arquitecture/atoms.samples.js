import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { ButtonSample } from '../../../design-system/atoms/button/button.sample.js';
import { LinkButtonSample } from '../../../design-system/atoms/link-button/link-button.sample.js';
import { LogoSample } from '../../../design-system/atoms/logo/logo.sample.js';
import { ChipSample } from '../../../design-system/atoms/chip/chip.sample.js';
import { SimpleLoaderSample } from '../../../design-system/atoms/simple-loader/simple-loader.sample.js';
import { InputSample } from '../../../design-system/atoms/inputs/input/input.sample.js';
import { SelectSample } from '../../../design-system/atoms/inputs/select/select.sample.js';
import { iconSamples } from '../../../design-system/atoms/icon/icon.sample.js';
import { ListItemSample } from '../../../design-system/atoms/list-item/list-item.sample.js';
import { backToTopButtonSamples } from '../../../design-system/atoms/back-to-top-button/back-to-top-button.sample.js';
import { ActionButtonSample } from '../../../design-system/atoms/action-button/action-button.sample.js';
import { SwapButtonSample } from '../../../design-system/atoms/swap-button/swap-button.sample.js';
import { TripTypeToggleSample } from '../../../design-system/atoms/trip-type-toggle/trip-type-toggle.sample.js';
import { IncrementerSample } from '../../../design-system/atoms/incrementer/incrementer.sample.js';
import { DateInputSample } from '../../../design-system/atoms/date-input/date-input.sample.js';
import { DayCellSample } from '../../../design-system/atoms/day-cell/day-cell.sample.js';
import { WeekdayHeaderSample } from '../../../design-system/atoms/weekday-header/weekday-header.sample.js';

const html = htm.bind(h);

export const AtomsSamples = () => html`
    <div>
        <h2>Atoms samples</h2>
        <${ChipSample} />
        <${ButtonSample} />
        <${InputSample} />
        <${SelectSample} />
        <${LogoSample} />
        <${LinkButtonSample} />
        <${SimpleLoaderSample} />
        <${ListItemSample} />
        <${ActionButtonSample} />
        <${SwapButtonSample} />
        <${TripTypeToggleSample} />
        <${IncrementerSample} />
        <${DateInputSample} />
        <${DayCellSample} />
        <${WeekdayHeaderSample} />
        
        <!-- Icon Samples -->
        <div class="mt-[var(--spacing-xx-large)]">
          <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-large)]">
            Icon Component
          </h2>
          ${iconSamples.map((sample) => html`
            <div key=${sample.title} class="mb-[var(--spacing-xx-large)]">
              <${sample.component} />
            </div>
          `)}
        </div>
        
        <!-- Back to Top Button Samples -->
        <div class="mt-[var(--spacing-xx-large)]">
          <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-large)]">
            ${backToTopButtonSamples.title}
          </h2>
          <p class="text-[var(--paragraph-p300-size)] mb-[var(--spacing-large)] text-[var(--text-normal-secondary)]">
            ${backToTopButtonSamples.description}
          </p>
          ${backToTopButtonSamples.samples.map((sample) => html`
            <div key=${sample.title} class="mb-[var(--spacing-xx-large)] border-t pt-[var(--spacing-large)]">
              <h3 class="text-[var(--heading-h500-size)] font-[var(--heading-h500-weight)] mb-[var(--spacing-small)]">
                ${sample.title}
              </h3>
              <p class="text-[var(--paragraph-p200-size)] mb-[var(--spacing-medium)] text-[var(--text-normal-secondary)]">
                ${sample.description}
              </p>
              <div class="relative">
                ${sample.code}
              </div>
            </div>
          `)}
        </div>
    </div>
  `;

export default AtomsSamples;
