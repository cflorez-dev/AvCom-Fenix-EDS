import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { Input } from '../../atoms/inputs/input/input.js';
import { Select } from '../../atoms/inputs/select/select.js';
import { HeadingDropdownSelector } from '../../molecules/heading-dropdown-selector/heading-dropdown-selector.js';

const html = htm.bind(h);

/**
 * HeadingDestinations - Presentation organism for destination hub heading controls.
 *
 * ## Props
 * - `headingText`: `string` – Heading template already resolved.
 * - `selectedOriginLabel`: `string` – Current selected origin label.
 * - `originOptions`: `Array<string>` – Origin labels for dropdown.
 * - `onOriginChange`: `(label: string) => void` – Origin change callback.
 * - `searchTerm`: `string` – Current search value.
 * - `searchPlaceholder`: `string` – Search placeholder text.
 * - `onSearchChange`: `(value: string) => void` – Search change callback.
 * - `geographicAreaOptions`: `Array<{value:string,label:string}>` – Area options.
 * - `selectedGeographicArea`: `string` – Selected area value.
 * - `onGeographicAreaChange`: `(value: string) => void` – Area change callback.
 * - `geographicAreaPlaceholder`: `string` – Placeholder for area select.
 * - `customClassName`: `string` – Extra classes.
 */
export const HeadingDestinations = ({
  headingText = '',
  selectedOriginLabel = '',
  originOptions = [],
  onOriginChange,
  searchTerm = '',
  searchPlaceholder = '',
  onSearchChange,
  geographicAreaOptions = [],
  selectedGeographicArea = '',
  onGeographicAreaChange,
  geographicAreaPlaceholder = '',
  customClassName = '',
  ...rest
}) => {
  return html`
    <div
      data-name="headingDestinations"
      class="max-w-[1248px] px-[16px] min-[480px]:px-[32px] min-[1248px]:px-0 self-center w-full flex flex-col gap-4 min-[1248px]:flex-row min-[1248px]:items-center min-[1248px]:justify-between ${customClassName}"
      ...${rest}
    >
    <div class="w-auto">
      <${HeadingDropdownSelector}
        label=${headingText}
        value=${selectedOriginLabel}
        options=${originOptions}
        onChange=${onOriginChange}
        customClassName="!justify-start !h-auto !self-auto w-auto"
      />
    </div>

      <div class="w-full flex flex-col md:flex-row gap-4 min-[1248px]:w-[696px]">
        <${Input}
          id="hub-destinations-search"
          label=${searchPlaceholder}
          value=${searchTerm}
          onChange=${onSearchChange}
          truncateOption=${true}
          prefixIconName="action/search"
          customClassName="w-full md:max-lg:flex-1 min-[1248px]:!w-[340px] min-[1248px]:min-w-[340px] [&_input]:!font-bold [&>div]:!outline-[var(--color-border-input-default)]"
        />

        <${Select}
          label=${geographicAreaPlaceholder}
          options=${geographicAreaOptions}
          value=${selectedGeographicArea}
          onChange=${onGeographicAreaChange}
          hasPrefixIcon=${false}
          truncateOption=${true}
          customClassName="w-full md:max-lg:flex-1 min-[1248px]:!w-[340px] min-[1248px]:min-w-[340px] [&>div]:!outline-[var(--color-border-input-default)]"
        />
      </div>
    </div>
  `;
};

export default HeadingDestinations;
