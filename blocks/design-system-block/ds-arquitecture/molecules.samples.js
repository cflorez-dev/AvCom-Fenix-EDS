import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { HeadingDropdownSelectorSample } from '../../../design-system/molecules/heading-dropdown-selector/heading-dropdown-selector.sample.js';
import { AccordionSample } from '../../../design-system/molecules/accordion/accordion.sample.js';
import { ModalSample } from '../../../design-system/molecules/modal/modal.sample.js';
import { AlertSample } from '../../../design-system/molecules/alert/alert.sample.js';
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

const html = htm.bind(h);

export const MoleculesSamples = () => html`
    <div>
        <h2>Molecules samples</h2>
        <${AlertSample} />
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
    </div>
        `;

export default MoleculesSamples;
