import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { ToastAlert } from './toast-alert.js';
import { Button } from '../../atoms/button/button.js';

const html = htm.bind(h);

/**
 * ToastAlertSample component for showcasing ToastAlert component variations
 * @returns {import('preact').VNode} Sample showcase
 */
export const ToastAlertSample = () => {
  const [liveToast, setLiveToast] = useState(null);

  const handleDismiss = () => {
    console.log('ToastAlert dismissed');
  };

  const triggerLiveToast = (variant) => {
    // Re-mount with a fresh key so the enter animation + auto-dismiss timer restart.
    setLiveToast({ variant, key: Date.now() });
  };

  return html`
    <div class="flex flex-col gap-[var(--spacing-x-large)] max-w-[120rem] mx-auto p-6">
      <div>
        <h1 class="text-[var(--heading-h500-size)] font-[var(--heading-h500-weight)] mb-[var(--spacing-small)]">
          ToastAlert Component
        </h1>
        <p class="text-[var(--paragraph-p300-size)] text-[var(--text-normal-secondary)] mb-[var(--spacing-medium)]">
          Temporary floating notification that appears in the UI to briefly inform the user
          about an event or the result of an action.
        </p>
      </div>

      <!-- Sample 1: All Variants -->
      <section class="flex flex-col gap-[var(--spacing-large)]">
        <div>
          <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-small)]">
            All Variants
          </h2>
          <p class="text-[var(--paragraph-p200-size)] text-[var(--text-normal-secondary)] mb-[var(--spacing-medium)]">
            The ToastAlert component supports 4 variants, each with its own outline color and icon.
          </p>
        </div>

        <div class="flex flex-col gap-[var(--spacing-medium)] bg-[#f5f5f5] p-6 rounded-xl">
          <div>
            <h3 class="text-[var(--paragraph-p200-size)] font-medium mb-[var(--spacing-x-small)]">Positiva (success)</h3>
            <${ToastAlert}
              variant="success"
              title="¡Tu acción se completó con éxito!"
              dismissible=${true}
              autoDismiss=${false}
              onDismiss=${handleDismiss}
            />
          </div>

          <div>
            <h3 class="text-[var(--paragraph-p200-size)] font-medium mb-[var(--spacing-x-small)]">Informativa</h3>
            <${ToastAlert}
              variant="informative"
              title="Recuerda revisar los detalles del servicio."
              dismissible=${true}
              autoDismiss=${false}
              onDismiss=${handleDismiss}
            />
          </div>

          <div>
            <h3 class="text-[var(--paragraph-p200-size)] font-medium mb-[var(--spacing-x-small)]">Caución</h3>
            <${ToastAlert}
              variant="caution"
              title="Podrías perder cambios no guardados."
              dismissible=${true}
              autoDismiss=${false}
              onDismiss=${handleDismiss}
            />
          </div>

          <div>
            <h3 class="text-[var(--paragraph-p200-size)] font-medium mb-[var(--spacing-x-small)]">Crítica / error</h3>
            <${ToastAlert}
              variant="error"
              title="¡Urgente! Se requiere acción inmediata."
              dismissible=${true}
              autoDismiss=${false}
              onDismiss=${handleDismiss}
            />
          </div>
        </div>
      </section>

      <!-- Sample 2: With description -->
      <section class="flex flex-col gap-[var(--spacing-large)]">
        <div>
          <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-small)]">
            With Description
          </h2>
          <p class="text-[var(--paragraph-p200-size)] text-[var(--text-normal-secondary)] mb-[var(--spacing-medium)]">
            Use the <code>description</code> prop to render a secondary line below the title.
          </p>
        </div>

        <div class="flex flex-col gap-[var(--spacing-medium)] bg-[#f5f5f5] p-6 rounded-xl">
          <${ToastAlert}
            variant="success"
            title="Documento guardado"
            description="Tu documento se guardó correctamente, ya puedes continuar editando."
            dismissible=${true}
            autoDismiss=${false}
            onDismiss=${handleDismiss}
          />
        </div>
      </section>

      <!-- Sample 3: Without dismiss button -->
      <section class="flex flex-col gap-[var(--spacing-large)]">
        <div>
          <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-small)]">
            Without Dismiss Button
          </h2>
        </div>

        <div class="flex flex-col gap-[var(--spacing-medium)] bg-[#f5f5f5] p-6 rounded-xl">
          <${ToastAlert}
            variant="informative"
            title="Notificación persistente sin botón de cierre."
            dismissible=${false}
            autoDismiss=${false}
          />
        </div>
      </section>

      <!-- Sample 4: Live floating behavior -->
      <section class="flex flex-col gap-[var(--spacing-large)]">
        <div>
          <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-small)]">
            Live Behavior (Floating + Auto-dismiss)
          </h2>
          <p class="text-[var(--paragraph-p200-size)] text-[var(--text-normal-secondary)] mb-[var(--spacing-medium)]">
            Trigger a real toast: it fades in from the right (300ms), floats fixed at the
            top-right of the viewport with a 24px offset, and auto-dismisses after 5s.
          </p>
        </div>

        <div class="flex flex-wrap gap-[var(--spacing-small)] bg-[#f5f5f5] p-6 rounded-xl">
          <${Button} variant="secondary" size="sm" onClick=${() => triggerLiveToast('success')}>
            Show success toast
          </${Button}>
          <${Button} variant="secondary" size="sm" onClick=${() => triggerLiveToast('informative')}>
            Show informative toast
          </${Button}>
          <${Button} variant="secondary" size="sm" onClick=${() => triggerLiveToast('caution')}>
            Show caution toast
          </${Button}>
          <${Button} variant="secondary" size="sm" onClick=${() => triggerLiveToast('error')}>
            Show error toast
          </${Button}>
        </div>
      </section>

      ${liveToast && html`
        <${ToastAlert}
          key=${liveToast.key}
          variant=${liveToast.variant}
          title="Tu acción se completó con éxito."
          description="Puedes continuar con el flujo, esta notificación se cerrará sola."
          isFloating=${true}
          autoDismiss=${true}
          duration=${5000}
          onDismiss=${() => setLiveToast(null)}
        />
      `}
    </div>
  `;
};
