import { h } from '@dropins/tools/preact.js';
import htm from 'htm';

const html = htm.bind(h);

/**
 * PriceIndicator - Visual indicator showing price categories with legend
 *
 * ## Props
 * - `text`: `string` –
 *      Text to display (e.g., "Find the best price"). Default: 'Find the best price'.
 * - `showLegend`: `boolean` – If true, shows the legend with price categories (default: true).
 * - `customClassName`: `string` – Additional CSS classes.
 * - `...rest`: Other HTML props.
 *
 * ## Design (Figma)
 * - Node ID: 2742-3893 - Price indicator legend
 *
 * ## Behavior
 * - Shows colored circles representing low/medium/high prices
 * - Text is optional
 * - Can be used in desktop and mobile calendars
 *
 * ## Usage Examples
 *
 * ### With text and legend
 * ```javascript
 * <${PriceIndicator} text="Find the best price" />
 * ```
 *
 * ### Legend only
 * ```javascript
 * <${PriceIndicator} text="" />
 * ```
 *
 * @example
 * <${PriceIndicator} />
 */
export const PriceIndicator = ({
  text = 'Find the best price',
  showLegend = true,
  customClassName = '',
  ...rest
}) => html`
<div
    class="flex items-center gap-4 max-h-max ${customClassName}"
    data-name="priceIndicator"
    ...${rest}
>
    ${text && html`
    <span class="!text-[length:var(--font-size-small)] text-[var(--text-normal-primary)] leading-[21px]">
        ${text}
    </span>
    `}
    
    ${showLegend && html`
    <div class="flex items-center gap-4">
        <!-- Low Price -->
        <div class="flex items-center gap-[4px]">
        <div class="w-3 h-3 rounded-full bg-[var(--price-indicator-low)]"></div>
        <span class="!text-[length:var(--font-size-small)] text-[var(--text-normal-primary)] leading-[21px]">$</span>
        </div>
        
        <!-- Medium Price -->
        <div class="flex items-center gap-[4px]">
        <div class="w-3 h-3 rounded-full bg-[var(--price-indicator-medium)]"></div>
        <span class="!text-[length:var(--font-size-small)] text-[var(--text-normal-primary)] leading-[21px]">$$</span>
        </div>
        
        <!-- High Price -->
        <div class="flex items-center gap-[4px]">
        <div class="w-3 h-3 rounded-full bg-[var(--price-indicator-high)]"></div>
        <span class="!text-[length:var(--font-size-small)] text-[var(--text-normal-primary)] leading-[21px]">$$$</span>
        </div>
    </div>
    `}
</div>
`;

export default PriceIndicator;
