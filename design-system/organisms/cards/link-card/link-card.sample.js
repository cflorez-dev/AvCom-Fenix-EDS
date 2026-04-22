import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { LinkCard } from './link-card.js';

const html = htm.bind(h);

export const LinkCardSample = () => {
  const sampleImage = `${window.hlx?.codeBasePath || ''}/assets/samples/link-card-sample-2.png`;

  return html`
    <div class="p-[40px] max-w-[1200px] mx-auto">
      <h1 class="mb-[var(--spacing-x-large)] text-[var(--font-size-x-large)] font-[var(--font-weight-bold)]">
        Link Card Controller Examples
      </h1>

      <!-- Configuraciones basadas en columns y rows -->
      <section class="mb-[var(--spacing-x-large)]">
        <h2 class="mb-[var(--spacing-medium)] text-[var(--font-size-large)] font-[var(--font-weight-bold)]">
          Configuraciones según columns/rows
        </h2>

        <!-- Horizontal: 2 columns, 1 row -->
        <div class="mb-[var(--spacing-large)]">
          <h3 class="mb-[var(--spacing-small)] text-[var(--font-size-medium)] font-[var(--font-weight-bold)]">
            Horizontal (columns: 2, rows: 1)
          </h3>
          <div class="grid grid-cols-[repeat(auto-fill,minmax(400px,1fr))] gap-[var(--spacing-medium)] max-w-[752px]">
            <${LinkCard}
              title="Equipaje"
              description="Entérate de las condiciones que debes tener en cuenta al momento de preparar tu equipaje."
              image=${sampleImage}
              imageAlt="Equipaje"
              linkText="Conoce más"
              columns=${2}
              rows=${1}
              href="#"
            />
          </div>
        </div>

        <!-- Vertical: 1 column, 2 rows -->
        <div class="mb-[var(--spacing-large)]">
          <h3 class="mb-[var(--spacing-small)] text-[var(--font-size-medium)] font-[var(--font-weight-bold)]">
            Vertical (columns: 1, rows: 2)
          </h3>
          <div class="grid gap-[var(--spacing-medium)] max-w-[372px]">
            <${LinkCard}
              title="Experiencia avianca"
              description="¡Listo para despegar! Descubre los servicios a bordo que te ofrecemos al volar con nosotros."
              image=${sampleImage}
              imageAlt="Experiencia avianca"
              linkText="Descubre más"
              columns=${1}
              rows=${2}
              href="#"
            />
          </div>
        </div>

        <!-- Vertical: 1 column, 3 rows -->
        <div class="mb-[var(--spacing-large)]">
          <h3 class="mb-[var(--spacing-small)] text-[var(--font-size-medium)] font-[var(--font-weight-bold)]">
            Vertical (columns: 1, rows: 3)
          </h3>
          <div class="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-[var(--spacing-medium)] max-w-[372px]">
            <${LinkCard}
              title="Destinos especiales"
              description="Conoce nuestros destinos únicos y las mejores ofertas para tu próximo viaje de ensueño."
              image=${sampleImage}
              imageAlt="Destinos especiales"
              linkText="Ver destinos"
              columns=${1}
              rows=${3}
              href="#"
            />
          </div>
        </div>

        <!-- Vertical: 2 columns, 2 rows -->
        <div class="mb-[var(--spacing-large)]">
          <h3 class="mb-[var(--spacing-small)] text-[var(--font-size-medium)] font-[var(--font-weight-bold)]">
            Vertical (columns: 2, rows: 2)
          </h3>
          <div class="grid grid-cols-[repeat(auto-fill,minmax(600px,1fr))] gap-[var(--spacing-medium)] max-w-[752px]">
            <${LinkCard}
              title="Check-in online"
              description="Ahorra tiempo y haz tu check-in desde la comodidad de tu hogar o dispositivo móvil."
              image=${sampleImage}
              imageAlt="Check-in online"
              linkText="Hacer check-in"
              columns=${2}
              rows=${2}
              href="#"
            />
          </div>
        </div>

      </section>

      

    </div>
  `;
};

export default {
  title: 'Link Card Controller',
  component: LinkCardSample,
};
