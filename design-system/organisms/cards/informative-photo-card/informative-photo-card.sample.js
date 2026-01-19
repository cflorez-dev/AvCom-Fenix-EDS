import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { InformativePhotoCard } from './informative-photo-card.js';

const html = htm.bind(h);

export const InformativePhotoCardSample = () => {
  const sampleImage = `${window.hlx?.codeBasePath || ''}/assets/samples/Oferta-San-Andres.png`;

  return html`
    <div class="p-10 max-w-screen-xl mx-auto">
      <h1 class="mb-[var(--spacing-x-large)] text-[var(--font-size-x-large)] font-bold">
        Informative Photo Card Samples
      </h1>

      <div class="flex flex-col gap-12">
        <!-- Basic card with button -->
        <div>
          <h2 class="mb-6 text-2xl font-bold text-[var(--text-normal-primary)]">With button</h2>
          <${InformativePhotoCard}
            title="Title"
            details="Details"
            image=${sampleImage}
            imageAlt="Destinos turísticos"
            buttonText="Ver más"
            onClick=${() => console.log('Click en Ver más')}
          />
        </div>

        <!-- Card without button -->
        <div>
          <h2 class="mb-6 text-2xl font-bold text-[var(--text-normal-primary)]">Without button</h2>
          <${InformativePhotoCard}
            title="Viaja con comodidad"
            details="Disfruta de nuestros servicios premium a bordo en todos tus vuelos"
            image=${sampleImage}
            imageAlt="Servicios premium"
          />
        </div>

        <!-- Card with long content -->
        <div>
          <h2 class="mb-6 text-2xl font-bold text-[var(--text-normal-primary)]">Long content</h2>
          <${InformativePhotoCard}
            title="Programa de fidelización LifeMiles"
            details="Acumula millas en cada vuelo y disfruta de beneficios exclusivos para viajeros frecuentes"
            image=${sampleImage}
            imageAlt="LifeMiles programa"
            buttonText="Únete ahora"
            onClick=${() => console.log('Click en Únete ahora')}
          />
        </div>

        <!-- Grid with multiple cards -->
        <div>
          <h2 class="mb-6 text-2xl font-bold text-[var(--text-normal-primary)]">Card grid</h2>
          <div class="flex gap-4 flex-wrap">
            <${InformativePhotoCard}
              title="Check-in online"
              details="Ahorra tiempo y realiza tu check-in desde casa"
              image=${sampleImage}
              imageAlt="Check-in online"
              buttonText="Hacer check-in"
              onClick=${() => console.log('Check-in')}
            />
            <${InformativePhotoCard}
              title="Equipaje facturado"
              details="Conoce las políticas y tarifas de equipaje"
              image=${sampleImage}
              imageAlt="Equipaje"
              buttonText="Más información"
              onClick=${() => console.log('Equipaje info')}
            />
            <${InformativePhotoCard}
              title="Asistencia al viajero"
              details="Soporte 24/7 para todas tus necesidades"
              image=${sampleImage}
              imageAlt="Asistencia"
              buttonText="Contactar"
              onClick=${() => console.log('Contactar')}
            />
          </div>
        </div>
      </div>
    </div>
  `;
};

export default InformativePhotoCardSample;
