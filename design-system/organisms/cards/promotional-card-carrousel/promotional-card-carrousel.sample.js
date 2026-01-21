import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { PromotionalCardCarrousel } from './promotional-card-carrousel.js';

const html = htm.bind(h);

export const PromotionalCardCarrouselSample = () => {
  const sampleImage = `${window.hlx?.codeBasePath || ''}/assets/samples/light.png`;
  const sampleImageTwo = `${window.hlx?.codeBasePath || ''}/assets/samples/dark.png`;

  return html`
    <div class="p-10 max-w-screen-xl mx-auto">
      <h1 class="mb-[var(--spacing-x-large)] text-[var(--font-size-x-large)] font-bold">
        Promotional Card Carrousel Samples
      </h1>

      <div class="flex flex-col gap-12">
        <div>
          <h2 class="mb-6 text-2xl font-bold text-[var(--text-normal-primary)]">Light Variant</h2>
          <div class="flex flex-col gap-6">
            <div>
              <h3 class="mb-3 text-lg font-semibold text-[var(--text-normal-secondary)]">With button</h3>
              <${PromotionalCardCarrousel}
                variant="light"
                title="Únete a lifemiles"
                description="Obtén millaje bajo siempre y ahorra más."
                image=${sampleImage}
                imageAlt="Promoción de millas"
                backgroundColor="#380980"
                buttonText="Conoce más"
                buttonURL="#promocion"
                onClick=${() => console.log('Click en Conoce más - Dark')}
              />
            </div>

            <div>
              <h3 class="mb-3 text-lg font-semibold text-[var(--text-normal-secondary)]">Without button</h3>
              <${PromotionalCardCarrousel}
                variant="light"
                title="Ofertas especiales"
                description="Descubre destinos increíbles con tarifas exclusivas"
                image=${sampleImage}
                imageAlt="Ofertas especiales"
                backgroundColor="#380980"
              />
            </div>
          </div>
        </div>

        <div>
          <h2 class="mb-6 text-2xl font-bold text-[var(--text-normal-primary)]">Dark Variant</h2>
          <div class="flex flex-col gap-6">
            <div>
              <h3 class="mb-3 text-lg font-semibold text-[var(--text-normal-secondary)]">With button</h3>
              <${PromotionalCardCarrousel}
                variant="dark"
                title="Más millas por dólar"
                description="volando con cualquiera de nuestras tarifas"
                image=${sampleImageTwo}
                imageAlt="Promoción de millas"
                backgroundColor="#E4DFD5"
                buttonText="Conoce más"
                buttonURL="#promocion"
                onClick=${() => console.log('Click en Conoce más - Light')}
              />
            </div>

            <div>
              <h3 class="mb-3 text-lg font-semibold text-[var(--text-normal-secondary)]">Without button</h3>
              <${PromotionalCardCarrousel}
                variant="dark"
                title="Viaja con comodidad"
                description="Disfruta de nuestros servicios premium en todos tus vuelos"
                image=${sampleImageTwo}
                backgroundColor="#E4DFD5"
                imageAlt="Servicios premium"
              />
            </div>
          </div>
        </div>

        <!-- Carousel simulation -->
        <div>
          <h2 class="mb-6 text-2xl font-bold text-[var(--text-normal-primary)]">Carousel Simulation</h2>
          <div class="flex gap-4 overflow-x-auto pb-4">
            <${PromotionalCardCarrousel}
              variant="light"
              title="Acumula millas"
              description="Con cada vuelo ganas más beneficios"
              image=${sampleImage}
              imageAlt="Acumula millas"
              backgroundColor="#380980"
              buttonText="Ver detalles"
              onClick=${() => console.log('Tarjeta 1')}
            />
            <${PromotionalCardCarrousel}
              variant="dark"
              title="Vuelos internacionales"
              description="Conectamos América con el mundo"
              image=${sampleImageTwo}
              backgroundColor="#E4DFD5"
              imageAlt="Vuelos internacionales"
              buttonText="Explorar destinos"
              onClick=${() => console.log('Tarjeta 2')}
            />
            <${PromotionalCardCarrousel}
              variant="light"
              title="LifeMiles premium"
              description="Beneficios exclusivos para ti"
              image=${sampleImage}
              imageAlt="LifeMiles"
              backgroundColor="#380980"
              buttonText="Únete ahora"
              onClick=${() => console.log('Tarjeta 3')}
            />
            <${PromotionalCardCarrousel}
              variant="dark"
              title="Check-in fácil"
              description="Ahorra tiempo con nuestro sistema digital"
              image=${sampleImageTwo}
              imageAlt="Check-in"
              backgroundColor="#E4DFD5"
              buttonText="Empezar"
              onClick=${() => console.log('Tarjeta 4')}
            />
          </div>
        </div>
      </div>
    </div>
  `;
};

export default PromotionalCardCarrouselSample;
