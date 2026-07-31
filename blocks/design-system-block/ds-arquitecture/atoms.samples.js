import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { ButtonSample } from '../../../design-system/atoms/button/button.sample.js';
import { LoginButtonSample } from '../../../design-system/atoms/login-button/login-button.sample.js';
import { NavItemSample } from '../../../design-system/atoms/nav-item/nav-item.sample.js';
import { HeaderButtonSample } from '../../../design-system/atoms/header-button/header-button.sample.js';
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
import { DestinationCardSample } from '../../../design-system/atoms/destination-card/destination-card.sample.js';
import { TooltipSample } from '../../../design-system/atoms/tooltip/tooltip.sample.js';
import { MemberStatusButtonSample } from '../../../design-system/atoms/member-status-button/member-status-button.sample.js';
import { MembersCopyMembershipSample } from '../../../design-system/atoms/members-copy-membership/members-copy-membership.sample.js';
import { MembersDataPairSample } from '../../../design-system/atoms/members-data-pair/members-data-pair.sample.js';
import { MembersProgressBarSample } from '../../../design-system/atoms/members-progress-bar/members-progress-bar.sample.js';
import { MembersQuickActionSample } from '../../../design-system/atoms/members-quick-action/members-quick-action.sample.js';
import { SegmentedControlSample } from '../../../design-system/atoms/segmented-control/segmented-control.sample.js';
import { SwitchSample } from '../../../design-system/atoms/switch/switch.sample.js';
import { SummaryTextSample } from '../../../design-system/atoms/summary-text/summary-text.sample.js';
import { StatusProfileChipSample } from '../../../design-system/atoms/status-profile-chip/status-profile-chip.sample.js';
import { ProgressItemSample } from '../../../design-system/atoms/progress-item/progress-item.sample.js';
import { FloatingActionButtonSample } from '../../../design-system/atoms/floating-action-button/floating-action-button.sample.js';
import { CarouselDestinationsSample } from '../../../design-system/organisms/carousel-destinations/carousel-destinations.sample.js';
import { HubDestinationsSample } from '../../../design-system/templates/hub-destinations/hub-destinations.sample.js';

const html = htm.bind(h);

export const AtomsSamples = () => html`
    <div>
        <h2>Atoms samples</h2>
        <${HubDestinationsSample} />
        <${CarouselDestinationsSample} />
        <${DestinationCardSample} />
        <${ChipSample} />
        
        <${ButtonSample} />
        <${LoginButtonSample} />
        <${NavItemSample} />
        <${HeaderButtonSample} />
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
        <${TooltipSample} />
        <${MemberStatusButtonSample} />

        <!-- Members hero (1263924, Sub A) -->
        <${MembersCopyMembershipSample} />
        <${MembersDataPairSample} />
        <${MembersProgressBarSample} />
        <${MembersQuickActionSample} />

        <!-- Members ProgElite+Ben (1271689) -->
        <${SegmentedControlSample} />

        <!-- Members Gestión de cuenta (1279360, kit DS) -->
        <${SwitchSample} />
        <${SummaryTextSample} />
        <${StatusProfileChipSample} />

        <!-- Members ProgElite+Ben tab Progreso (1271699) -->
        <${ProgressItemSample} />

        <!-- Members ProgElite+Ben casos especiales (1271694) -->
        <${FloatingActionButtonSample} />

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
