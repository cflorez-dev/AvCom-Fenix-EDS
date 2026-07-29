import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { PromotionCardSample } from '../../../design-system/organisms/cards/promotion-card/promotion-card.sample.js';
import { InformativeCardSample } from '../../../design-system/organisms/cards/informative-card/informative-card.sample.js';
import { InformativePhotoCardSample } from '../../../design-system/organisms/cards/informative-photo-card/informative-photo-card.sample.js';
import { PromotionalCardCarrouselSample } from '../../../design-system/organisms/cards/promotional-card-carrousel/promotional-card-carrousel.sample.js';
import { LinkCardSample } from '../../../design-system/organisms/cards/link-card/link-card.sample.js';
import { PosFormSample } from '../../../design-system/organisms/header/pos-form/pos-form.sample.js';
import { HeaderDarksiteSample } from '../../../design-system/organisms/header/header-darksite/header-darksite.sample.js';
import { MarquesinaSample } from '../../../design-system/organisms/marquesina/marquesina.sample.js';
import { CintillaSample } from '../../../design-system/organisms/cintilla/cintilla.sample.js';
import { BookingBoxSample } from '../../../design-system/organisms/booking-box/booking-box.sample.js';
import { CarouselDestinationsSample } from '../../../design-system/organisms/carousel-destinations/carousel-destinations.sample.js';
import { SecondaryBannerSample } from '../../../design-system/organisms/banners/secondary-banner/secondary-banner.sample.js';
import { MembersHeroSample } from '../../../design-system/organisms/members-hero/members-hero.sample.js';
import { MembersEliteSample } from '../../../design-system/organisms/members-elite/members-elite.sample.js';
import { MembersEliteHeaderSample } from '../../../design-system/organisms/members-elite-header/members-elite-header.sample.js';
import { MembersAccountSample } from '../../../design-system/organisms/members-account/members-account.sample.js';
import { MembersWalletSample } from '../../../design-system/organisms/members-wallet/members-wallet.sample.js';
import { MembersAccountDataSample } from '../../../design-system/organisms/members-account-data/members-account-data.sample.js';
import { MembersAccountSettingsSample } from '../../../design-system/organisms/members-account-settings/members-account-settings.sample.js';
import { GoalProgressPanelSample } from '../../../design-system/organisms/goal-progress-panel/goal-progress-panel.sample.js';
import { BenefitsSectionSample } from '../../../design-system/organisms/benefits-section/benefits-section.sample.js';
import { FooterBottomSample } from '../../../design-system/organisms/footer/footer-bottom/footer-bottom.sample.js';

const html = htm.bind(h);

export const OrganismsSamples = () => html`
    <div>
        <h2>Organisms samples</h2>
        <${CarouselDestinationsSample} />
        <${BookingBoxSample} />
        <${LinkCardSample} />
        <${InformativeCardSample} />
        <${InformativePhotoCardSample} />
        <${PromotionCardSample} />
        <${PromotionalCardCarrouselSample} />
        <${PosFormSample} />
        <${HeaderDarksiteSample} />
        <${MarquesinaSample} />
        <${CintillaSample} />
        <${SecondaryBannerSample} />

        <!-- Members hero (1263924, Sub A) -->
        <${MembersHeroSample} />

        <!-- Members ProgElite+Ben (1271689) -->
        <${MembersEliteSample} />

        <!-- Members ProgElite+Ben header (1271692) -->
        <${MembersEliteHeaderSample} />

        <!-- Members Gestión de cuenta (1279360, shell) -->
        <${MembersAccountSample} />

        <!-- Members Gestión de cuenta — Wallet (1279362) -->
        <${MembersWalletSample} />

        <!-- Members Gestión de cuenta — Tab Datos (1279361) -->
        <${MembersAccountDataSample} />

        <!-- Members Gestión de cuenta — Tab Ajustes (1279363) -->
        <${MembersAccountSettingsSample} />

        <!-- Members ProgElite+Ben tab Progreso (1271699) -->
        <${GoalProgressPanelSample} />

        <!-- Members ProgElite+Ben casos especiales (1271694) -->
        <${BenefitsSectionSample} />
        <${FooterBottomSample} />
    </div>
  `;

export default OrganismsSamples;
