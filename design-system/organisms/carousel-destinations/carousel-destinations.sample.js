import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { CarouselDestinations } from './carousel-destinations.js';

const html = htm.bind(h);

/**
 * CarouselDestinationsSample - Showcase of the CarouselDestinations organism
 * Displays different configurations matching the Figma design
 */
export const CarouselDestinationsSample = () => {
  const colombiaDestinations = [
    {
      destinationName: 'Arauca',
      imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=480&h=480&fit=crop',
    },
    {
      destinationName: 'Armenia',
      imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=480&h=480&fit=crop',
    },
    {
      destinationName: 'Barrancabermeja',
      imageUrl: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=480&h=480&fit=crop',
    },
    {
      destinationName: 'Barranquilla',
      imageUrl: 'https://images.unsplash.com/photo-1501979376754-2ff867a4f659?w=480&h=480&fit=crop',
    },
    {
      destinationName: 'Bucaramanga',
      imageUrl: 'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=480&h=480&fit=crop',
    },
    {
      destinationName: 'Cartagena',
      imageUrl: 'https://images.unsplash.com/photo-1545194445-dddb8f4487c6?w=480&h=480&fit=crop',
    },
    {
      destinationName: 'Cúcuta',
      imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=480&h=480&fit=crop',
    },
    {
      destinationName: 'Ibagué',
      imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=480&h=480&fit=crop',
    },
    {
      destinationName: 'Ipiales',
      imageUrl: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=480&h=480&fit=crop',
    },
    {
      destinationName: 'Leticia',
      imageUrl: 'https://images.unsplash.com/photo-1501979376754-2ff867a4f659?w=480&h=480&fit=crop',
    },
    {
      destinationName: 'Medellín',
      imageUrl: 'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=480&h=480&fit=crop',
    },
    {
      destinationName: 'Neiva',
      imageUrl: 'https://images.unsplash.com/photo-1545194445-dddb8f4487c6?w=480&h=480&fit=crop',
    },
    {
      destinationName: 'Pasto',
      imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=480&h=480&fit=crop',
    },
    {
      destinationName: 'Popayán',
      imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=480&h=480&fit=crop',
    },
  ];

  const internationalDestinations = [
    {
      destinationName: 'Miami',
      complementaryText: 'Estados Unidos',
      imageUrl: 'https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?w=480&h=480&fit=crop',
      href: 'https://www.avianca.com',
    },
    {
      destinationName: 'Madrid',
      complementaryText: 'España',
      imageUrl: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=480&h=480&fit=crop',
      href: 'https://www.avianca.com',
    },
    {
      destinationName: 'Ciudad de México',
      complementaryText: 'México',
      imageUrl: 'https://images.unsplash.com/photo-1518659526054-190340b32735?w=480&h=480&fit=crop',
      href: 'https://www.avianca.com',
    },
    {
      destinationName: 'Lima',
      complementaryText: 'Perú',
      imageUrl: 'https://images.unsplash.com/photo-1531968455001-5c5272a67c71?w=480&h=480&fit=crop',
      href: 'https://www.avianca.com',
    },
    {
      destinationName: 'São Paulo',
      complementaryText: 'Brasil',
      imageUrl: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=480&h=480&fit=crop',
      href: 'https://www.avianca.com',
    },
    {
      destinationName: 'Buenos Aires',
      complementaryText: 'Argentina',
      imageUrl: 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=480&h=480&fit=crop',
      href: 'https://www.avianca.com',
    },
    {
      destinationName: 'Nueva York',
      complementaryText: 'Estados Unidos',
      imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=480&h=480&fit=crop',
      href: 'https://www.avianca.com',
    },
    {
      destinationName: 'Londres',
      complementaryText: 'Reino Unido',
      imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=480&h=480&fit=crop',
      href: 'https://www.avianca.com',
    },
  ];

  return html`
    <div class="p-8 flex flex-col gap-12" style=${{ backgroundColor: 'var(--bg-page-light, #fafafa)' }}>
      <h2 class="text-2xl font-bold text-gray-800">CarouselDestinations</h2>

      <!-- Default: Colombia destinations (matches Figma) -->
      <section>
        <h3 class="text-lg font-semibold mb-4 text-gray-700">Destinos nacionales (Figma design)</h3>
        <${CarouselDestinations}
          title="Destinos en Colombia"
          totalCount="24 ciudades"
          destinations=${colombiaDestinations}
        />
      </section>

      <!-- International destinations with complementary text and links -->
      <section>
        <h3 class="text-lg font-semibold mb-4 text-gray-700">Destinos internacionales (con texto complementario y links)</h3>
        <${CarouselDestinations}
          title="Destinos internacionales"
          totalCount="8 ciudades"
          destinations=${internationalDestinations}
        />
      </section>

      <!-- Without count badge -->
      <section>
        <h3 class="text-lg font-semibold mb-4 text-gray-700">Sin badge de conteo</h3>
        <${CarouselDestinations}
          title="Explora destinos"
          destinations=${colombiaDestinations.slice(0, 8)}
        />
      </section>

      <!-- Without gradient fade -->
      <section>
        <h3 class="text-lg font-semibold mb-4 text-gray-700">Sin gradiente de fade</h3>
        <${CarouselDestinations}
          title="Más destinos"
          totalCount="6 ciudades"
          destinations=${colombiaDestinations.slice(0, 6)}
          showGradientFade=${false}
        />
      </section>
    </div>
  `;
};

export default CarouselDestinationsSample;
