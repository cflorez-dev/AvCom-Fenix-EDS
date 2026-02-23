import { h } from '@dropins/tools/preact.js';
import { useMemo, useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { HubDestinations } from './hub-destinations.js';

const html = htm.bind(h);

const destination = (destinationName, countryName, imageUrl, href) => ({
  destinationName,
  countryName,
  imageUrl,
  href,
});

const HUB_DESTINATIONS_SAMPLE_DATA = [
  {
    code: 'BOG',
    label: 'Bogotá',
    regions: [
      {
        id: 'co',
        name: 'Colombia',
        zoneValue: 'south-america',
        zoneLabel: 'Suramérica',
        destinations: [
          destination('Arauca', 'Colombia', 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=480&h=480&fit=crop', '/es/destinos/que-hacer-en-arauca'),
          destination('Armenia', 'Colombia', 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=480&h=480&fit=crop', '/es/destinos/que-hacer-en-armenia'),
          destination('Barrancabermeja', 'Colombia', 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=480&h=480&fit=crop', '/es/destinos/que-hacer-en-barrancabermeja'),
          destination('Barranquilla', 'Colombia', 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=480&h=480&fit=crop', '/es/destinos/que-hacer-en-barranquilla'),
          destination('Bucaramanga', 'Colombia', 'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=480&h=480&fit=crop', '/es/destinos/que-hacer-en-bucaramanga'),
          destination('Cartagena', 'Colombia', 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=480&h=480&fit=crop', '/es/destinos/que-hacer-en-cartagena'),
        ],
      },
      {
        id: 'us',
        name: 'Estados Unidos',
        zoneValue: 'north-america',
        zoneLabel: 'Norteamérica',
        destinations: [
          destination('Boston', 'Estados Unidos', 'https://images.unsplash.com/photo-1499092346589-b9b6be3e94b2?w=480&h=480&fit=crop', '/es/destinos/que-hacer-en-boston'),
          destination('Chicago', 'Estados Unidos', 'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=480&h=480&fit=crop', '/es/destinos/que-hacer-en-chicago'),
          destination('Dallas', 'Estados Unidos', 'https://images.unsplash.com/photo-1477414348463-c0eb7f1359b6?w=480&h=480&fit=crop', '/es/destinos/que-hacer-en-dallas'),
          destination('Fort Lauderdale', 'Estados Unidos', 'https://images.unsplash.com/photo-1535498730771-e735b998cd64?w=480&h=480&fit=crop', '/es/destinos/que-hacer-en-fort-lauderdale'),
          destination('Houston', 'Estados Unidos', 'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?w=480&h=480&fit=crop', '/es/destinos/que-hacer-en-houston'),
        ],
      },
      {
        id: 'ec',
        name: 'Ecuador',
        zoneValue: 'south-america',
        zoneLabel: 'Suramérica',
        destinations: [
          destination('Baltra, Galápagos', 'Ecuador', 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=480&h=480&fit=crop', '/es/destinos/que-hacer-en-baltra-galapagos'),
          destination('Cuenca', 'Ecuador', 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=480&h=480&fit=crop', '/es/destinos/que-hacer-en-cuenca'),
          destination('Guayaquil', 'Ecuador', 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=480&h=480&fit=crop', '/es/destinos/que-hacer-en-guayaquil'),
          destination('Manta', 'Ecuador', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=480&h=480&fit=crop', '/es/destinos/que-hacer-en-manta'),
        ],
      },
      {
        id: 'mx',
        name: 'México',
        zoneValue: 'north-america',
        zoneLabel: 'Norteamérica',
        destinations: [
          destination('Cancún', 'México', 'https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=480&h=480&fit=crop', '/es/destinos/que-hacer-en-cancun'),
          destination('Ciudad de México', 'México', 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=480&h=480&fit=crop', '/es/destinos/que-hacer-en-ciudad-de-mexico'),
          destination('Monterrey', 'México', 'https://images.unsplash.com/photo-1473187983305-f615310e7daa?w=480&h=480&fit=crop', '/es/destinos/que-hacer-en-monterrey'),
        ],
      },
    ],
  },
  {
    code: 'MDE',
    label: 'Medellín',
    regions: [
      {
        id: 'co',
        name: 'Colombia',
        zoneValue: 'south-america',
        zoneLabel: 'Suramérica',
        destinations: [
          destination('Bogotá', 'Colombia', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=480&h=480&fit=crop', '/es/destinos/que-hacer-en-bogota'),
          destination('Cartagena', 'Colombia', 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=480&h=480&fit=crop', '/es/destinos/que-hacer-en-cartagena'),
          destination('Pereira', 'Colombia', 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=480&h=480&fit=crop', '/es/destinos/que-hacer-en-pereira'),
        ],
      },
      {
        id: 'pe',
        name: 'Perú',
        zoneValue: 'south-america',
        zoneLabel: 'Suramérica',
        destinations: [
          destination('Lima', 'Perú', 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=480&h=480&fit=crop', '/es/destinos/que-hacer-en-lima'),
          destination('Cusco', 'Perú', 'https://images.unsplash.com/photo-1531065208531-4036c0dba3ca?w=480&h=480&fit=crop', '/es/destinos/que-hacer-en-cusco'),
        ],
      },
      {
        id: 'es',
        name: 'España',
        zoneValue: 'europe',
        zoneLabel: 'Europa',
        destinations: [
          destination('Madrid', 'España', 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=480&h=480&fit=crop', '/es/destinos/que-hacer-en-madrid'),
          destination('Barcelona', 'España', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=480&h=480&fit=crop', '/es/destinos/que-hacer-en-barcelona'),
        ],
      },
    ],
  },
  {
    code: 'SAL',
    label: 'San Salvador',
    regions: [
      {
        id: 'gt',
        name: 'Guatemala',
        zoneValue: 'central-america',
        zoneLabel: 'Centroamérica',
        destinations: [
          destination('Ciudad de Guatemala', 'Guatemala', 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=480&h=480&fit=crop', '/es/destinos/que-hacer-en-ciudad-de-guatemala'),
        ],
      },
      {
        id: 'cr',
        name: 'Costa Rica',
        zoneValue: 'central-america',
        zoneLabel: 'Centroamérica',
        destinations: [
          destination('San José', 'Costa Rica', 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=480&h=480&fit=crop', '/es/destinos/que-hacer-en-san-jose'),
        ],
      },
      {
        id: 'us',
        name: 'Estados Unidos',
        zoneValue: 'north-america',
        zoneLabel: 'Norteamérica',
        destinations: [
          destination('Los Ángeles', 'Estados Unidos', 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=480&h=480&fit=crop', '/es/destinos/que-hacer-en-los-angeles'),
          destination('Miami', 'Estados Unidos', 'https://images.unsplash.com/photo-1535498730771-e735b998cd64?w=480&h=480&fit=crop', '/es/destinos/que-hacer-en-miami'),
        ],
      },
    ],
  },
];

const I18N_SERVICE_MOCK = {
  es: [
    { Key: 'hubDestinations.heading.template', Text: 'Te llevamos a [XX] destinos desde [YYYY]' },
    { Key: 'hubDestinations.search.placeholder', Text: 'Busca ciudades, países y otros destinos' },
    { Key: 'hubDestinations.filters.allGeographicAreas', Text: 'Todas las zonas geográficas' },
    { Key: 'hubDestinations.region.title', Text: 'Destinos en [Z]' },
    { Key: 'hubDestinations.count.singular', Text: '[XX] ciudad' },
    { Key: 'hubDestinations.count.plural', Text: '[XX] ciudades' },
    { Key: 'hubDestinations.emptyState.title', Text: 'No se encontraron resultados' },
    { Key: 'hubDestinations.emptyState.description', Text: 'No encontramos coincidencias para "[QUERY]".' },
  ],
  en: [
    { Key: 'hubDestinations.heading.template', Text: 'We take you to [XX] destinations from [YYYY]' },
    { Key: 'hubDestinations.search.placeholder', Text: 'Search for cities, countries, and other destinations' },
    { Key: 'hubDestinations.filters.allGeographicAreas', Text: 'All geographic areas' },
    { Key: 'hubDestinations.region.title', Text: 'Destinations in [Z]' },
    { Key: 'hubDestinations.count.singular', Text: '[XX] city' },
    { Key: 'hubDestinations.count.plural', Text: '[XX] cities' },
    { Key: 'hubDestinations.emptyState.title', Text: 'No results found' },
    { Key: 'hubDestinations.emptyState.description', Text: 'No matches were found for "[QUERY]".' },
  ],
  pt: [
    { Key: 'hubDestinations.heading.template', Text: 'Nós levamos você para [XX] destinos desde [YYYY]' },
    { Key: 'hubDestinations.search.placeholder', Text: 'Procure cidades, países e outros destinos' },
    { Key: 'hubDestinations.filters.allGeographicAreas', Text: 'Todas as áreas geográficas' },
    { Key: 'hubDestinations.region.title', Text: 'Destinos em [Z]' },
    { Key: 'hubDestinations.count.singular', Text: '[XX] cidade' },
    { Key: 'hubDestinations.count.plural', Text: '[XX] cidades' },
    { Key: 'hubDestinations.emptyState.title', Text: 'Nenhum resultado encontrado' },
    { Key: 'hubDestinations.emptyState.description', Text: 'Nenhuma correspondência para "[QUERY]".' },
  ],
  fr: [
    { Key: 'hubDestinations.heading.template', Text: 'Nous vous emmenons vers [XX] destinations depuis [YYYY]' },
    { Key: 'hubDestinations.search.placeholder', Text: 'Recherchez des villes, des pays et d’autres destinations' },
    { Key: 'hubDestinations.filters.allGeographicAreas', Text: 'Toutes les zones géographiques' },
    { Key: 'hubDestinations.region.title', Text: 'Destinations en [Z]' },
    { Key: 'hubDestinations.count.singular', Text: '[XX] ville' },
    { Key: 'hubDestinations.count.plural', Text: '[XX] villes' },
    { Key: 'hubDestinations.emptyState.title', Text: 'Aucun résultat trouvé' },
    { Key: 'hubDestinations.emptyState.description', Text: 'Aucun résultat pour "[QUERY]".' },
  ],
};

const mapI18nServiceResponse = (language) => Object.fromEntries(
  (I18N_SERVICE_MOCK[language] || []).map(({ Key, Text }) => [Key, Text]),
);

/**
 * HubDestinationsSample - Showcase for HubDestinations organism.
 * Simulates i18n labels loaded from a service (Key/Text format).
 */
export const HubDestinationsSample = () => {
  const [language, setLanguage] = useState('es');
  const [lastEvent, setLastEvent] = useState('Sin interacción');

  const i18n = useMemo(() => mapI18nServiceResponse(language), [language]);

  return html`
    <div class="w-full p-4 md:p-8 bg-bg-page-light flex flex-col gap-6">
      <div class="flex flex-col gap-2">
        <h2 class="text-2xl font-bold text-text-normal-primary m-0">
          Hub Destinations
        </h2>
        <p class="text-sm text-text-normal-secondary m-0">
          Demo con i18n simulado desde servicio y filtrado por origen, búsqueda y zona geográfica.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        ${['es', 'en', 'pt', 'fr'].map((lang) => {
    const stateClass = language === lang
      ? 'bg-brand-primary border-brand-primary text-white'
      : 'bg-white border-border-input-default text-text-normal-primary hover:bg-bg-page-light';

    return html`
            <button
              key=${lang}
              type="button"
              onClick=${() => setLanguage(lang)}
              class=${`px-3 py-1 rounded-full border text-sm font-semibold uppercase transition-colors ${stateClass}`}
            >
              ${lang}
            </button>
          `;
  })}
      </div>

      <div class="rounded-xl border border-border-default-light bg-white p-3">
        <p class="text-xs text-text-normal-secondary m-0">
          Último evento: ${lastEvent}
        </p>
      </div>

      <${HubDestinations}
        origins=${HUB_DESTINATIONS_SAMPLE_DATA}
        defaultOriginCode="BOG"
        locale=${language}
        i18n=${i18n}
        onOriginChange=${(origin) => setLastEvent(`Origen seleccionado: ${origin.label}`)}
        onSearchChange=${(value) => setLastEvent(`Búsqueda: ${value || '(vacío)'}`)}
        onGeographicAreaChange=${(value) => setLastEvent(`Zona geográfica: ${value}`)}
      />
    </div>
  `;
};

export default HubDestinationsSample;
