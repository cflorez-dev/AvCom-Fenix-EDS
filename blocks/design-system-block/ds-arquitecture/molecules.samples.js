import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { HeadingDropdownSelectorSample } from '../../../design-system/molecules/heading-dropdown-selector/heading-dropdown-selector.sample.js';
import { AccordionSample } from '../../../design-system/molecules/accordion/accordion.sample.js';
import { ModalSample } from '../../../design-system/molecules/modal/modal.sample.js';
import { AlertSample } from '../../../design-system/molecules/alert/alert.sample.js';
import { ToastAlertSample } from '../../../design-system/molecules/toast-alert/toast-alert.sample.js';
import { CitySelectorSample } from '../../../design-system/molecules/city-selector/city-selector.sample.js';
import { PassengerSelectorSample } from '../../../design-system/molecules/passenger-selector/passenger-selector.sample.js';
import { TopActionButtonsSample } from '../../../design-system/molecules/top-action-buttons/top-action-buttons.sample.js';
import { OriginDestinationSelectorSample } from '../../../design-system/molecules/origin-destination-selector/origin-destination-selector.sample.js';
import { CarouselSample } from '../../../design-system/molecules/carousel/carousel.sample.js';
import { CarouselNavigationButtonSample } from '../../../design-system/atoms/carousel-navigation-button/carousel-navigation-button.sample.js';
import { DateRangePickerSample } from '../../../design-system/molecules/date-range-picker/date-range-picker.sample.js';
import { CalendarMonthSample } from '../../../design-system/molecules/calendar-month/calendar-month.sample.js';
import { MonthGridSample } from '../../../design-system/molecules/month-grid/month-grid.sample.js';
import { DateSelectorSample } from '../../../design-system/molecules/date-selector/date-selector.sample.js';
import { PriceIndicatorSample } from '../../../design-system/atoms/price-indicator/price-indicator.sample.js';
import { SidemenuSample } from '../../../design-system/molecules/sidemenu/sidemenu.sample.js';
import { MembersHeroCompactSample } from '../../../design-system/molecules/members-hero-compact/members-hero-compact.sample.js';
import { MembersDataGridSample } from '../../../design-system/molecules/members-data-grid/members-data-grid.sample.js';
import { MembersMembershipCardSample } from '../../../design-system/molecules/members-membership-card/members-membership-card.sample.js';
import { MembersQuickActionsSample } from '../../../design-system/molecules/members-quick-actions/members-quick-actions.sample.js';
import { MembersEliteProgressSample } from '../../../design-system/molecules/members-elite-progress/members-elite-progress.sample.js';
import { MembersHeroExpandedSample } from '../../../design-system/molecules/members-hero-expanded/members-hero-expanded.sample.js';
import { MembersHeroSkeletonSample } from '../../../design-system/molecules/members-hero-skeleton/members-hero-skeleton.sample.js';
import { MembersTabsSample } from '../../../design-system/molecules/members-tabs/members-tabs.sample.js';
import { MembersEliteSkeletonSample } from '../../../design-system/molecules/members-elite-skeleton/members-elite-skeleton.sample.js';
import { InlineDateFieldSample } from '../../../design-system/molecules/inline-date-field/inline-date-field.sample.js';
import { MembersAccountTabsSample } from '../../../design-system/molecules/members-account-tabs/members-account-tabs.sample.js';
import { ProfileCompletionAlertSample } from '../../../design-system/molecules/profile-completion-alert/profile-completion-alert.sample.js';
import { EditableAccordionSectionSample } from '../../../design-system/molecules/editable-accordion-section/editable-accordion-section.sample.js';
import { OptInItemSample } from '../../../design-system/molecules/opt-in-item/opt-in-item.sample.js';
import { SecurityEditRowSample } from '../../../design-system/molecules/security-edit-row/security-edit-row.sample.js';
import { InformativeModalSample } from '../../../design-system/molecules/informative-modal/informative-modal.sample.js';
import { SavedCardItemSample } from '../../../design-system/molecules/saved-card-item/saved-card-item.sample.js';
import { AviancaCreditsCardSample } from '../../../design-system/molecules/avianca-credits-card/avianca-credits-card.sample.js';
import { GoalCardSample } from '../../../design-system/molecules/goal-card/goal-card.sample.js';
import { GoalProgressRowSample } from '../../../design-system/molecules/goal-progress-row/goal-progress-row.sample.js';
import { CenitPanelSample } from '../../../design-system/molecules/cenit-panel/cenit-panel.sample.js';
import { AchievementAlertSample } from '../../../design-system/molecules/achievement-alert/achievement-alert.sample.js';
import { HowToEarnPanelSample } from '../../../design-system/molecules/how-to-earn-panel/how-to-earn-panel.sample.js';
import { NewYearStatusModalSample } from '../../../design-system/molecules/new-year-status-modal/new-year-status-modal.sample.js';
import { AcceleratorTooltipSample } from '../../../design-system/molecules/accelerator-tooltip/accelerator-tooltip.sample.js';
import { CobrandCardSample } from '../../../design-system/molecules/cobrand-card/cobrand-card.sample.js';
import { CobrandEmptyStateSample } from '../../../design-system/molecules/cobrand-empty-state/cobrand-empty-state.sample.js';
import { LmPlusPlanCardSample } from '../../../design-system/molecules/lm-plus-plan-card/lm-plus-plan-card.sample.js';
import { LmPlusSubscriptionCardSample } from '../../../design-system/molecules/lm-plus-subscription-card/lm-plus-subscription-card.sample.js';
import { LmPlusBannerSample } from '../../../design-system/molecules/lm-plus-banner/lm-plus-banner.sample.js';
import { DarksiteFlightInfoSample } from '../../../design-system/molecules/darksite-flight-info/darksite-flight-info.sample.js';
import { DarksiteMultiFlightInfoSample } from '../../../design-system/molecules/darksite-multi-flight-info/darksite-multi-flight-info.sample.js';
import { DarksiteContactInfoSample } from '../../../design-system/molecules/darksite-contact-info/darksite-contact-info.sample.js';
import { DarksiteInformativeBannerSample } from '../../../design-system/molecules/darksite-informative-banner/darksite-informative-banner.sample.js';

const html = htm.bind(h);

export const MoleculesSamples = () => html`
    <div>
        <h2>Molecules samples</h2>
        <${AlertSample} />
        <${ToastAlertSample} />
        <${HeadingDropdownSelectorSample} />
        <${AccordionSample} />
        <${ModalSample} />
        <${CitySelectorSample} />
        <${PassengerSelectorSample} />
        <${TopActionButtonsSample} />
        <${OriginDestinationSelectorSample} />
        <${CarouselSample} />
        <${CarouselNavigationButtonSample} />
        <${MonthGridSample} />
        <${CalendarMonthSample} />
        <${PriceIndicatorSample} />
        <${DateSelectorSample} />
        <${DateRangePickerSample} />
        <${SidemenuSample} />

        <!-- Members hero (1263924, Sub A) -->
        <${MembersHeroCompactSample} />
        <${MembersDataGridSample} />
        <${MembersMembershipCardSample} />
        <${MembersQuickActionsSample} />
        <${MembersEliteProgressSample} />
        <${MembersHeroExpandedSample} />
        <${MembersHeroSkeletonSample} />

        <!-- Members ProgElite+Ben (1271689) -->
        <${MembersTabsSample} />
        <${MembersEliteSkeletonSample} />

        <!-- Members Gestión de cuenta (1279360, kit DS + shell) -->
        <${InlineDateFieldSample} />
        <${MembersAccountTabsSample} />
        <${ProfileCompletionAlertSample} />
        <${EditableAccordionSectionSample} />
        <${InformativeModalSample} />
        <${OptInItemSample} />
        <${SecurityEditRowSample} />

        <!-- Members Gestión de cuenta — Wallet (1279362) -->
        <${SavedCardItemSample} />
        <${AviancaCreditsCardSample} />

        <!-- Members ProgElite+Ben tab Progreso (1271699) -->
        <${GoalCardSample} />
        <${GoalProgressRowSample} />
        <${CenitPanelSample} />
        <${AchievementAlertSample} />
        <${HowToEarnPanelSample} />
        <${NewYearStatusModalSample} />

        <!-- Members ProgElite+Ben casos especiales (1271694) -->
        <${AcceleratorTooltipSample} />
        <${CobrandCardSample} />
        <${CobrandEmptyStateSample} />
        <${LmPlusPlanCardSample} />
        <${LmPlusSubscriptionCardSample} />
        <${LmPlusBannerSample} />
        <!-- Darksite interstitial content (Figma 9611:8004) -->
        <${DarksiteFlightInfoSample} />

        <!-- Darksite interstitial content — variante multi vuelos (Figma 9611:7745) -->
        <${DarksiteMultiFlightInfoSample} />

        <!-- Darksite líneas de contacto aisladas (Figma 9611:8017) -->
        <${DarksiteContactInfoSample} />

        <!-- Darksite banner informativo del home (Figma 9611:7981) -->
        <${DarksiteInformativeBannerSample} />
    </div>
        `;

export default MoleculesSamples;
