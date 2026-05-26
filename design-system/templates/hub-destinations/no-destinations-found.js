import { h } from '@dropins/tools/preact.js';
import htm from 'htm';

const noFlightsImage = `${window.hlx?.codeBasePath || ''}/assets/NoFlightsB.jpg`;

const html = htm.bind(h);

/**
 * NoDestinationsFound - Empty state shown when no destinations match current filters.
 *
 * ## Props
 * - `title`: `string` – Empty state title.
 * - `description`: `string` – Empty state description.
 * - `customClassName`: `string` – Additional classes.
 */
export const NoDestinationsFound = ({
  title = '',
  description = '',
  customClassName = '',
  ...rest
}) => html`
		<div
			data-name="noDestinationsFound"
			class="w-full flex flex-col items-center gap-4 my-16 justify-center ${customClassName}"
			...${rest}
		>
			<picture>
				<source srcset=${noFlightsImage} type="image/jpeg" />
				<img
					src=${noFlightsImage}
					alt=${title || 'No destinations found'}
					loading="lazy"
					decoding="async"
				/>
			</picture>
			<p class="font-bold text-text-normal-primary !m-0">
				${title}
			</p>
		</div>
	`;

export default NoDestinationsFound;
