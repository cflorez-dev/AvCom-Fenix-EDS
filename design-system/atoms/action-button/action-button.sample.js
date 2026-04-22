import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { ActionButton } from './action-button.js';

const html = htm.bind(h);

/**
 * ActionButtonSample - Showcase de ActionButton
 */
export const ActionButtonSample = () => html`
  <div class="flex flex-col gap-[var(--spacing-x-x-large)] p-[var(--spacing-x-large)]">
    <!-- Header -->
    <div>
      <h1 class="text-[var(--heading-h600-size)] font-[var(--heading-h600-weight)] text-[var(--text-normal-primary)] mb-[var(--spacing-small)]">
        ActionButton Component
      </h1>
      <p class="text-[var(--paragraph-p300-size)] text-[var(--text-normal-secondary)]">
        Botón de acceso rápido con icono y texto para top actions del Booking Box
      </p>
    </div>

    <!-- Default Variant: Icon Left with Circular Background -->
    <section>
      <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-medium)] text-[var(--text-normal-primary)]">
        Default Variant (Icon Left - Circular BG)
      </h2>
      <div class="flex gap-[var(--spacing-medium)] flex-wrap">
        <${ActionButton}
          icon="/icons/action/plane.svg"
          label="Autos"
          href="/autos"
        />
        <${ActionButton}
          icon="/icons/action/class.svg"
          label="Hoteles"
          href="/hoteles"
        />
        <${ActionButton}
          icon="/icons/action/speaker-notes.svg"
          label="Experiencias"
          href="/experiencias"
        />
        <${ActionButton}
          icon="/icons/alert/info.svg"
          label="Paquetes"
          href="/paquetes"
        />
      </div>
    </section>

    <!-- iconRight Variant: Text First + Small Icon Right -->
    <section>
      <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-medium)] text-[var(--text-normal-primary)]">
        iconRight Variant (Text First + Small Icon)
      </h2>
      <div class="flex flex-col gap-[var(--spacing-medium)] max-w-xs">
        <${ActionButton}
          icon="/icons/action/plane.svg"
          label="Compra con millas"
          variant="iconRight"
          href="/millas"
        />
        <${ActionButton}
          icon="/icons/action/plane.svg"
          label="Ver más opciones"
          variant="iconRight"
          href="/opciones"
        />
        <${ActionButton}
          icon="/icons/alert/info.svg"
          label="Información adicional"
          variant="iconRight"
          href="/info"
        />
      </div>
    </section>

    <!-- With onClick Handler -->
    <section>
      <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-medium)] text-[var(--text-normal-primary)]">
        With onClick Handler (Button Mode)
      </h2>
      <div class="flex gap-[var(--spacing-medium)] flex-wrap">
        <${ActionButton}
          icon="/icons/action/plane.svg"
          label="Click Me"
          onClick=${() => alert('Default variant clicked!')}
        />
        <${ActionButton}
          icon="/icons/alert/info.svg"
          label="Click Me Too"
          variant="iconRight"
          onClick=${() => alert('iconRight variant clicked!')}
        />
      </div>
    </section>

    <!-- Custom Styling -->
    <section>
      <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-medium)] text-[var(--text-normal-primary)]">
        Custom Styling
      </h2>
      <div class="flex gap-[var(--spacing-medium)] flex-wrap">
        <${ActionButton}
          icon="/icons/action/plane.svg"
          label="Custom Class"
          customClassName="!bg-blue-50 !shadow-lg"
        />
        <${ActionButton}
          icon="/icons/alert/info.svg"
          label="Custom Class"
          variant="iconRight"
          customClassName="!bg-green-50 !shadow-lg"
        />
      </div>
    </section>
  </div>
`;

export default ActionButtonSample;
