import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { FlexibleContentBanner } from './flexible-content-banner.js';

const html = htm.bind(h);

// Placeholder images (placehold.co); replace with real assets when QAing
// against the AEM author. Width/height match the aspect ratio used by the
// organism (16/9 on mobile, ~1.5:1 on desktop for the split half).
const IMG_BUSINESS_DESKTOP = 'https://placehold.co/720x480/d4a373/ffffff?text=Business+Class+Desktop';
const IMG_BUSINESS_MOBILE = 'https://placehold.co/360x240/d4a373/ffffff?text=Business+Mobile';
const IMG_DESTINATIONS_DESKTOP = 'https://placehold.co/1248x420/1b4332/ffffff?text=Destinations+Desktop';
const IMG_DESTINATIONS_MOBILE = 'https://placehold.co/720x480/1b4332/ffffff?text=Destinations+Mobile';
const IMG_PROMO_DESKTOP = 'https://placehold.co/720x480/3a86ff/ffffff?text=Promo+Desktop';
const IMG_PROMO_MOBILE = 'https://placehold.co/360x240/3a86ff/ffffff?text=Promo+Mobile';

const longDescription = 'Sabores únicos, ingredientes frescos y un menú excepcional creado por chefs reconocidos transforman cada vuelo en un momento para recordar — disfruta la mejor experiencia gastronómica a 10.000 metros de altura sin perder el confort ni la elegancia.';

const variants = [
  {
    label: '1 · Split · Text right · Dark scheme · Solid background',
    props: {
      title: '¡Vive la experiencia de Business Class!',
      description: longDescription,
      textPosition: 'right',
      imageMode: 'split',
      imageDesktop: IMG_BUSINESS_DESKTOP,
      imageMobile: IMG_BUSINESS_MOBILE,
      imageAlt: 'Business class meal',
      colorScheme: 'dark',
      solidBackgroundType: 'solid',
      backgroundColor: '#FFF5E6',
      cta1Text: 'Conoce más',
      cta1Url: '/business-class',
      ctaAlignmentDesktop: 'left',
      ctaOrientationMobile: 'horizontal',
    },
  },
  {
    label: '2 · Split · Text left · Light scheme · Gradient background',
    props: {
      title: 'Vuela donde quieras con nuestras promos',
      description: 'Reserva ahora y obtén hasta <strong>30% de descuento</strong> en tus próximos vuelos a Sudamérica.',
      textPosition: 'left',
      imageMode: 'split',
      imageDesktop: IMG_DESTINATIONS_DESKTOP,
      imageMobile: IMG_DESTINATIONS_MOBILE,
      imageAlt: 'Destinations promotion',
      colorScheme: 'light',
      solidBackgroundType: 'gradient',
      gradientColorStart: '#1b4332',
      gradientColorEnd: '#40916c',
      gradientDirection: 'to right',
      cta1Text: 'Ver destinos',
      cta1Url: '/destinos',
      cta2Text: 'Términos y condiciones',
      cta2Url: '/terminos',
      ctaAlignmentDesktop: 'right',
      ctaOrientationMobile: 'horizontal',
    },
  },
  {
    label: '3 · Image background · Text right · Light scheme · 2 CTAs',
    props: {
      title: 'Nuevo destino: Lisboa',
      description: 'Conecta con Europa desde Bogotá con tarifas especiales por tiempo limitado.',
      textPosition: 'right',
      imageMode: 'image-background',
      imageDesktop: IMG_PROMO_DESKTOP,
      imageMobile: IMG_PROMO_MOBILE,
      imageAlt: 'Lisbon promotion',
      colorScheme: 'light',
      cta1Text: 'Reservar ahora',
      cta1Url: 'https://avianca.com/booking',
      cta2Text: 'Más info',
      cta2Url: '/info-lisboa',
      ctaAlignmentDesktop: 'right',
      ctaOrientationMobile: 'vertical',
    },
  },
  {
    label: '4 · Image background · Text left · Dark scheme · 1 CTA',
    props: {
      title: 'Programa LifeMiles: vuela y acumula',
      description: 'Cada milla cuenta. Únete y disfruta de beneficios exclusivos en cada viaje.',
      textPosition: 'left',
      imageMode: 'image-background',
      imageDesktop: IMG_BUSINESS_DESKTOP,
      imageMobile: IMG_BUSINESS_MOBILE,
      imageAlt: 'LifeMiles program',
      colorScheme: 'dark',
      cta1Text: 'Inscribirme',
      cta1Url: '/lifemiles',
      ctaAlignmentDesktop: 'left',
      ctaOrientationMobile: 'horizontal',
    },
  },
  {
    label: '5 · Split · Text right · Dark · CTAs Mobile Vertical · 2 CTAs',
    props: {
      title: 'Equipaje protegido',
      description: 'Asegura tu equipaje con nuestro nuevo servicio premium.',
      textPosition: 'right',
      imageMode: 'split',
      imageDesktop: IMG_DESTINATIONS_DESKTOP,
      imageMobile: IMG_DESTINATIONS_MOBILE,
      imageAlt: 'Luggage protection service',
      colorScheme: 'dark',
      solidBackgroundType: 'solid',
      backgroundColor: '#FFE5E5',
      cta1Text: 'Comprar protección',
      cta1Url: '/equipaje-protegido',
      cta2Text: 'Saber más',
      cta2Url: '/protect-info',
      ctaAlignmentDesktop: 'left',
      ctaOrientationMobile: 'vertical',
    },
  },
  {
    label: '6 · Split · Text left · Light · Gradient · CTA2 alone (promoted to primary)',
    props: {
      title: 'Únete al club',
      description: 'Beneficios exclusivos esperan por ti.',
      textPosition: 'left',
      imageMode: 'split',
      imageDesktop: IMG_PROMO_DESKTOP,
      imageMobile: IMG_PROMO_MOBILE,
      imageAlt: 'Club promotion',
      colorScheme: 'light',
      solidBackgroundType: 'gradient',
      gradientColorStart: '#240046',
      gradientColorEnd: '#9d4edd',
      gradientDirection: 'to bottom',
      cta1Text: '',
      cta1Url: '',
      cta2Text: 'Únete ahora',
      cta2Url: '/club',
      ctaAlignmentDesktop: 'right',
      ctaOrientationMobile: 'horizontal',
    },
  },
];

/**
 * Sample showcase for FlexibleContentBanner — 6 variants covering the matrix
 * of textPosition × imageMode × colorScheme × backgroundType × ctaAlignment ×
 * ctaOrientationMobile × ctaCount.
 */
export const FlexibleContentBannerSample = () => html`
  <div class="flex flex-col gap-12 p-6 bg-gray-50">
    <header>
      <h1 class="text-2xl font-bold mb-2 text-[#1b1b1b]">Flexible Content Banner — DS Sample</h1>
      <p class="text-base text-gray-700">
        Side-by-side variations covering the configuration matrix from the
        PBI 1242943 design (Figma node <code>9156-36436</code>).
      </p>
    </header>

    ${variants.map((variant, idx) => html`
      <section class="flex flex-col gap-3">
        <h2 class="text-base font-semibold text-[#1b1b1b]">
          ${`Variant ${idx + 1}`}
          <span class="font-normal text-gray-600">— ${variant.label.replace(/^\d+ · /, '')}</span>
        </h2>
        <${FlexibleContentBanner} ...${variant.props} />
      </section>
    `)}
  </div>
`;

export default FlexibleContentBannerSample;
