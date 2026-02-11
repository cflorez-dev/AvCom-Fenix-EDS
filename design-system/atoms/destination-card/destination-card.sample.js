import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { DestinationCard } from './destination-card.js';

const html = htm.bind(h);

/**
 * DestinationCardSample - Ejemplos de uso del componente DestinationCard
 * Showcases different states and configurations of the destination card component
 */
export const DestinationCardSample = () => {
  const destinations = [
    {
      name: 'Arauca',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=480&h=480&fit=crop',
    },
    {
      name: 'Armenia',
      image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=480&h=480&fit=crop',
    },
    {
      name: 'Barrancabermeja',
      image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=480&h=480&fit=crop',
    },
    {
      name: 'Boston',
      image: 'https://images.unsplash.com/photo-1501979376754-2ff867a4f659?w=480&h=480&fit=crop',
    },
    {
      name: 'Chicago',
      image: 'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=480&h=480&fit=crop',
    },
    {
      name: 'Dallas',
      image: 'https://images.unsplash.com/photo-1545194445-dddb8f4487c6?w=480&h=480&fit=crop',
    },
  ];

  return html`
    <div class="p-8 bg-gray-100">
      <h2 class="text-2xl font-bold mb-6 text-gray-800">DestinationCard</h2>
      
      <h3 class="text-lg font-semibold mb-4 text-gray-700">Estados</h3>
      <div class="flex gap-6 mb-8">
        <div>
          <p class="text-sm text-gray-500 mb-2">Default</p>
          <${DestinationCard}
            destinationName="Arauca"
            imageUrl="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=480&h=480&fit=crop"
          />
        </div>
        <div>
          <p class="text-sm text-gray-500 mb-2">Con texto complementario</p>
          <${DestinationCard}
            destinationName="Bogotá"
            complementaryText="Capital de Colombia"
            imageUrl="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=480&h=480&fit=crop"
          />
        </div>
        <div>
          <p class="text-sm text-gray-500 mb-2">Hover (interactúa con la card)</p>
          <${DestinationCard}
            destinationName="Armenia"
            imageUrl="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=480&h=480&fit=crop"
          />
        </div>
      </div>

      <h3 class="text-lg font-semibold mb-4 text-gray-700">Con link</h3>
      <div class="flex gap-6 mb-8">
        <${DestinationCard}
          destinationName="Chicago"
          imageUrl="https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=480&h=480&fit=crop"
          href="https://www.avianca.com"
        />
        <${DestinationCard}
          destinationName="Nueva York"
          complementaryText="Estados Unidos"
          imageUrl="https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=480&h=480&fit=crop"
          href="https://www.avianca.com"
        />
      </div>

      <h3 class="text-lg font-semibold mb-4 text-gray-700">Grid de destinos (simula carousel)</h3>
      <div class="flex gap-4 overflow-x-auto pb-4">
        ${destinations.map(
          (dest) => html`
            <${DestinationCard}
              key=${dest.name}
              destinationName=${dest.name}
              imageUrl=${dest.image}
              onClick=${() => console.log(`Clicked: ${dest.name}`)}
            />
          `
        )}
      </div>
    </div>
  `;
};

export default DestinationCardSample;
