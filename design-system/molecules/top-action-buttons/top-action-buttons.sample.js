import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { TopActionButtons } from './top-action-buttons.js';
import { ActionButton } from '../../atoms/action-button/action-button.js';

const html = htm.bind(h);

/**
 * TopActionButtonsSample - Showcase de TopActionButtons
 */
export const TopActionButtonsSample = () => {
  // Sample icon paths (using svg data URIs para demo)
  const calendarIcon = 'data:image/svg+xml,<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="6" width="18" height="15" rx="2" stroke="currentColor" stroke-width="2"/><path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const userIcon = 'data:image/svg+xml,<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="2"/><path d="M5 20c0-4 3-7 7-7s7 3 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const mapIcon = 'data:image/svg+xml,<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 18l-6 3V6l6-3m0 15l6-3m-6 3V6m6 9l6 3V3l-6 3m0 12V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const tagIcon = 'data:image/svg+xml,<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="7" cy="7" r="1" fill="currentColor"/></svg>';
  const infoIcon = 'data:image/svg+xml,<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 16v-4M12 8h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

  return html`
    <div class="flex flex-col gap-[var(--spacing-x-x-large)] p-[var(--spacing-x-large)]">
      <!-- Header -->
      <div>
        <h1 class="text-[var(--heading-h600-size)] font-[var(--heading-h600-weight)] text-[var(--text-normal-primary)] mb-[var(--spacing-small)]">
          TopActionButtons Component
        </h1>
        <p class="text-[var(--paragraph-p300-size)] text-[var(--text-normal-secondary)]">
          Container responsive para botones de acciones rápidas (max 5)
        </p>
      </div>

      <!-- Default: 2 Action Buttons -->
      <section>
        <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-medium)] text-[var(--text-normal-primary)]">
          Default: 2 Botones
        </h2>
        <${TopActionButtons}>
          <${ActionButton}
            icon=${calendarIcon}
            label="Agregar fechas"
            onClick=${() => console.log('Fechas clicked')}
          />
          <${ActionButton}
            icon=${userIcon}
            label="Viajeros"
            onClick=${() => console.log('Viajeros clicked')}
          />
        </${TopActionButtons}>
      </section>

      <!-- MAX: 5 Action Buttons -->
      <section>
        <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-medium)] text-[var(--text-normal-primary)]">
          MAX: 5 Botones
        </h2>
        <${TopActionButtons}>
          <${ActionButton}
            icon=${calendarIcon}
            label="Agregar fechas"
          />
          <${ActionButton}
            icon=${userIcon}
            label="Viajeros"
          />
          <${ActionButton}
            icon=${mapIcon}
            label="Destinos cercanos"
          />
          <${ActionButton}
            icon=${tagIcon}
            label="Promociones"
          />
          <${ActionButton}
            icon=${infoIcon}
            label="Información"
          />
        </${TopActionButtons}>
      </section>

      <!-- Validation: More than 5 (will warn in console) -->
      <section>
        <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-medium)] text-[var(--text-normal-primary)]">
          Validación: Más de 5 (solo muestra 5)
        </h2>
        <${TopActionButtons}>
          <${ActionButton} icon=${calendarIcon} label="Button 1" />
          <${ActionButton} icon=${userIcon} label="Button 2" />
          <${ActionButton} icon=${mapIcon} label="Button 3" />
          <${ActionButton} icon=${tagIcon} label="Button 4" />
          <${ActionButton} icon=${infoIcon} label="Button 5" />
          <${ActionButton} icon=${calendarIcon} label="Button 6 (ignored)" />
          <${ActionButton} icon=${userIcon} label="Button 7 (ignored)" />
        </${TopActionButtons}>
        <p class="text-[var(--paragraph-p200-size)] text-[var(--text-normal-secondary)] mt-[var(--spacing-small)]">
          ⚠️ Revisa la consola: warning de máximo 5 botones
        </p>
      </section>
      
      <!-- Custom ClassName -->
      <section>
        <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-medium)] text-[var(--text-normal-primary)]">
          Con Custom ClassName (bg-[var(--bg-page-light)] p-4 rounded-lg)
        </h2>
        <${TopActionButtons} customClassName="bg-[var(--bg-page-light)] p-4 rounded-lg">
          <${ActionButton}
            icon=${calendarIcon}
            label="Agregar fechas"
          />
          <${ActionButton}
            icon=${userIcon}
            label="Viajeros"
          />
        </${TopActionButtons}>
      </section>
    </div>
  `;
};

export default TopActionButtonsSample;
