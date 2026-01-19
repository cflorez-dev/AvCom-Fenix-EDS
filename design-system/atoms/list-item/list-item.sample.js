import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { ListItem } from './list-item.js';

const html = htm.bind(h);

/**
 * ListItemSample - Showcase for the ListItem component
 */
export const ListItemSample = () => {
  const [selectedIndex, setSelectedIndex] = useState(2); // Madrid selected by default

  const destinations = [
    { label: 'Bogotá, Colombia', description: 'El Dorado Airport (BOG)', icon: 'flags/colombia-flag', iconBeforeIsFlag: true, iconAfter: 'navigation/chevron-right', iconAfterIsFlag: false, disabled: false },
    { label: 'Miami, United States', description: 'Miami International Airport (MIA)', icon: 'flags/estados-unidos-flag', iconBeforeIsFlag: true, disabled: false },
    { label: 'Madrid, Spain', description: 'Adolfo Suárez Madrid-Barajas Airport (MAD)', icon: 'flags/spain-flag', iconBeforeIsFlag: true, disabled: true },
    { label: 'Mexico City, Mexico', description: null, icon: 'flags/mexico-flag', iconBeforeIsFlag: true, disabled: false },
    { label: 'Buenos Aires, Argentina', description: 'Ezeiza International Airport (EZE)', icon: 'action/favorite', iconBeforeIsFlag: false, iconAfter: 'navigation/chevron-right', iconAfterIsFlag: false, disabled: false },
  ];

  return html`
  <div class="p-10 max-w-[75rem] mx-auto">
    <h1 class="text-2xl font-bold mb-6">
      ListItem Component
    </h1>
    
    <section class="mb-8">
      <h2 class="text-xl font-bold mb-4">Interactive Examples (Click to select)</h2>
      <p class="text-sm text-gray-600 mb-4">Click each item to select it. Hover to see hover state. Press Tab for focus state. Use Enter or Space to select via keyboard.</p>
      <div class="flex flex-col gap-2">
        ${destinations.map((dest, index) => html`
          <${ListItem} 
            key=${index}
            label=${dest.label}
            description=${dest.description}
            iconBefore=${dest.icon}
            iconBeforeIsFlag=${dest.iconBeforeIsFlag || false}
            iconAfter=${dest.iconAfter || null}
            iconAfterIsFlag=${dest.iconAfterIsFlag || false}
            disabled=${dest.disabled}
            selected=${selectedIndex === index}
            onClick=${() => !dest.disabled && setSelectedIndex(index)}
          />
        `)}
      </div>
    </section>
  </div>
  `;
};

export default ListItemSample;
