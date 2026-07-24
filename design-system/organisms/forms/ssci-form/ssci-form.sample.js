import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { SSCIForm } from './ssci-form.js';

const html = htm.bind(h);

/**
 * SSCIFormSample - Showcase del organism SSCIForm con las variantes principales.
 *
 * Renderizar con `?mock=true` para cargar i18n y environment mockeados desde
 * `/development/juan/mocks/`. Sin ese query param, intentara ir al proxy real AEM.
 */
export const SSCIFormSample = () => html`
  <div class="flex flex-col gap-[var(--spacing-x-x-large)] p-[var(--spacing-x-large)] max-w-[1248px] mx-auto">
    <!-- Header -->
    <div>
      <h1 class="text-[var(--heading-h600-size)] font-[var(--heading-h600-weight)] text-[var(--text-normal-primary)] mb-[var(--spacing-small)]">
        SSCIForm Component
      </h1>
      <p class="text-[var(--paragraph-p300-size)] text-[var(--text-normal-secondary)]">
        Formulario de acceso a Self Service Check-In (SSCI). Valida PNR + Apellido en front, redirige via deeplink (sin API).
      </p>
      <p class="text-[var(--paragraph-p200-size)] text-[var(--text-normal-secondary)] mt-2">
        Probar con <code>?mock=true</code> para cargar i18n mockeado. Cambiar <code>selected-language</code> cookie para alternar idiomas.
      </p>
    </div>

    <!-- 1. Default -->
    <section>
      <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-medium)]">
        1. Default (integrado en banner landing)
      </h2>
      <div class="p-6 bg-white rounded-2xl shadow-[0px_2px_20px_2px_rgba(73,73,73,0.25)]">
        <${SSCIForm} />
      </div>
    </section>

    <!-- 2. Simplified (megamenu) -->
    <section>
      <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-medium)]">
        2. Simplified (megamenu)
      </h2>
      <p class="text-[var(--paragraph-p200-size)] text-[var(--text-normal-secondary)] mb-2">
        Sin titulo ni descripcion. El contenedor (megamenu) provee su propio heading.
      </p>
      <div class="p-6 bg-white rounded-2xl shadow-[0px_2px_20px_2px_rgba(73,73,73,0.25)]">
        <${SSCIForm} simplified=${true} context="megamenu" />
      </div>
    </section>

    <!-- 3. Stacked layout -->
    <section>
      <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-medium)]">
        3. Stacked layout (espacios angostos)
      </h2>
      <div class="p-6 bg-white rounded-2xl shadow-[0px_2px_20px_2px_rgba(73,73,73,0.25)] max-w-[400px]">
        <${SSCIForm} stackedLayout=${true} />
      </div>
    </section>

    <!-- 4. Button below (hero banner card) -->
    <section>
      <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-medium)]">
        4. Simplified + buttonBelow (hero card)
      </h2>
      <p class="text-[var(--paragraph-p200-size)] text-[var(--text-normal-secondary)] mb-2">
        Variante usada dentro de la tarjeta flotante del <code>formHeroHeaderBanner</code>.
      </p>
      <div class="p-6 bg-white rounded-2xl shadow-[0px_2px_20px_2px_rgba(73,73,73,0.25)] max-w-[480px]">
        <${SSCIForm} simplified=${true} buttonBelow=${true} context="heroBanner" />
      </div>
    </section>

    <!-- Validation notes -->
    <section class="mt-8 p-4 bg-[var(--bg-page-light)] rounded-lg">
      <h3 class="font-bold mb-2">Casos de validacion a probar:</h3>
      <ul class="list-disc list-inside space-y-1 text-[var(--paragraph-p200-size)]">
        <li>PNR: digitar <code>ABCDEFG</code> &rarr; queda truncado en <code>ABCDEF</code> (6 chars)</li>
        <li>PNR: digitar <code>ñ á É !</code> &rarr; rechazado por keypress</li>
        <li>Apellido: digitar <code>perez</code> &rarr; se convierte a <code>PEREZ</code> en tiempo real</li>
        <li>Apellido: digitar <code>ñ á ü 1 ! #</code> &rarr; rechazado por keypress</li>
        <li>Submit con campos vacios: muestra errores, NO redirige</li>
        <li>Submit con datos validos: abre URL <code>{baseUrl}{path}?identifier=X&lastName=Y&lang=Z</code></li>
      </ul>
    </section>
  </div>
`;

export default SSCIFormSample;
