import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { PromotionCardSample } from '../../../design-system/organisms/cards/promotion-card/promotion-card.sample.js';
import { InformativeCardSample } from '../../../design-system/organisms/cards/informative-card/informative-card.sample.js';
import { InformativePhotoCardSample } from '../../../design-system/organisms/cards/informative-photo-card/informative-photo-card.sample.js';
import { PromotionalCardCarrouselSample } from '../../../design-system/organisms/cards/promotional-card-carrousel/promotional-card-carrousel.sample.js';
import { LinkCardSample } from '../../../design-system/organisms/cards/link-card/link-card.sample.js';
import { PosFormSample } from '../../../design-system/organisms/header/pos-form/pos-form.sample.js';
import { MarquesinaSample } from '../../../design-system/organisms/marquesina/marquesina.sample.js';
import { BookingBoxSample } from '../../../design-system/organisms/booking-box/booking-box.sample.js';

const html = htm.bind(h);

export const OrganismsSamples = () => html`
    <div>
        <h2>Organisms samples</h2>
        <${BookingBoxSample} />
        <${LinkCardSample} />
        <${InformativeCardSample} />
        <${InformativePhotoCardSample} />
        <${PromotionCardSample} />
        <${PromotionalCardCarrouselSample} />
        <${PosFormSample} />
        <${MarquesinaSample} />
    </div>
  `;

export default OrganismsSamples;
