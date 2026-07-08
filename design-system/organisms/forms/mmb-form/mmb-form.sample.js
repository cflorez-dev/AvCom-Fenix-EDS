import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { MMBForm } from './mmb-form.js';

const html = htm.bind(h);

/**
 * MMBFormSample - Showcase del organism MMBForm con las variantes principales.
 *
 * Renderizar con `?mock=true` para cargar i18n y environment mockeados desde
 * `/development/juan/mocks/`. Sin ese query param, intentara ir al proxy real AEM.
 */
export const MMBFormSample = () => html`
  <div class="flex flex-col gap-[var(--spacing-x-x-large)] p-[var(--spacing-x-large)] max-w-xl mx-auto">
    <!-- Header -->
    <div>
      <h1 class="text-[var(--heading-h600-size)] font-[var(--heading-h600-weight)] text-[var(--text-normal-primary)] mb-[var(--spacing-small)]">
        MMBForm Component
      </h1>
      <p class="text-[var(--paragraph-p300-size)] text-[var(--text-normal-secondary)]">
        Formulario de acceso a Manage My Booking. Valida PNR + Apellido en front, redirige via deeplink (sin API).
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
        <${MMBForm} />
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
        <${MMBForm} simplified=${true} />
      </div>
    </section>

    <!-- 3. Stacked layout -->
    <section>
      <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-medium)]">
        3. Stacked layout (espacios angostos)
      </h2>
      <div class="p-6 bg-white rounded-2xl shadow-[0px_2px_20px_2px_rgba(73,73,73,0.25)] max-w-[400px]">
        <${MMBForm} stackedLayout=${true} />
      </div>
    </section>

    <!-- 4. openInNewTab = false -->
    <section>
      <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-medium)]">
        4. openInNewTab = false
      </h2>
      <p class="text-[var(--paragraph-p200-size)] text-[var(--text-normal-secondary)] mb-2">
        Navega en la misma pestana (configurable por autor).
      </p>
      <div class="p-6 bg-white rounded-2xl shadow-[0px_2px_20px_2px_rgba(73,73,73,0.25)]">
        <${MMBForm} openInNewTab=${false} />
      </div>
    </section>

    <!-- Validation notes -->
    <section class="mt-8 p-4 bg-[var(--bg-page-light)] rounded-lg">
      <h3 class="font-bold mb-2">Casos de validacion a probar:</h3>
      <ul class="list-disc list-inside space-y-1 text-[var(--paragraph-p200-size)]">
        <li>PNR: digitar <code>ABC!@#123</code> → solo queda <code>ABC123</code> (alfanumerico, uppercase)</li>
        <li>Apellido: digitar <code>Perez123!</code> → solo queda <code>Perez</code> (letras + acentos + enie + espacios)</li>
        <li>Apellido: acepta <code>Muñoz-Perez</code> (enie y guion)</li>
        <li>Submit con campos vacios: muestra errores, NO redirige</li>
        <li>Submit con datos validos: abre URL <code>{baseUrl}/{lang}?pnr=X&lastname=Y</code></li>
      </ul>
    </section>
  </div>
`;

export default MMBFormSample;
