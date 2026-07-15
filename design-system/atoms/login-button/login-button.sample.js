import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { LoginButton } from './login-button.js';

const html = htm.bind(h);

const TIERS = [
  { id: 'logged-out', label: 'Logged out' },
  { id: 'lifemiles', label: 'Lifemiles' },
  { id: 'red-plus', label: 'Red Plus' },
  { id: 'silver', label: 'Silver' },
  { id: 'gold', label: 'Gold' },
  { id: 'diamond', label: 'Diamond' },
  { id: 'magno', label: 'Magno' },
];

const sectionTitle = 'text-2xl font-bold mb-4';
const subTitle = 'text-sm font-semibold mb-3 text-zinc-700';
const rowLabel = 'w-24 text-xs font-medium text-zinc-600';
const cellLabel = 'text-[10px] uppercase tracking-wider text-zinc-500 mb-1';

/**
 * LoginButtonSample – Showcase de todos los tiers × variations × estados.
 * Estados (default/hover/active) se renderizan apilados con clases forzadas
 * para inspección visual estática; en runtime el botón responde a interacción
 * normal (hover, focus-visible para TAB).
 */
export const LoginButtonSample = () => html`
  <div class="p-10 max-w-[1400px] mx-auto">
    <header class="mb-8">
      <h1 class="text-3xl font-bold mb-2">LoginButton (Members)</h1>
      <p class="text-sm text-zinc-600">
        Figma 40:6320. Atomo nuevo del design system. Bordes por tier, fondo
        uniforme entre estados (transparent → #e9e9e9 → #d9d9d9). Probá <kbd>TAB</kbd>
        para ver el focus ring y hover real con mouse.
      </p>
    </header>

    <!-- ============== Variation: Full-Button ============== -->
    <section class="mb-12">
      <h2 class=${sectionTitle}>Variation: Full-Button</h2>

      <h3 class=${subTitle}>Logged out (≥768px)</h3>
      <div class="flex items-center gap-6 mb-8 flex-wrap">
        <div>
          <div class=${cellLabel}>default</div>
          <${LoginButton} tier="logged-out" />
        </div>
        <div>
          <div class=${cellLabel}>hover (forzado)</div>
          <${LoginButton}
            tier="logged-out"
            customClassName="!bg-[var(--color-background-brand-secondary-hover)]"
          />
        </div>
        <div>
          <div class=${cellLabel}>active (forzado)</div>
          <${LoginButton}
            tier="logged-out"
            customClassName="!bg-[var(--color-background-brand-secondary-active)]"
          />
        </div>
      </div>

      <h3 class=${subTitle}>Members (logged-in) — name "Sebastián"</h3>
      <div class="space-y-3">
        ${TIERS.filter((t) => t.id !== 'logged-out').map((t) => html`
          <div key=${t.id} class="flex items-center gap-6 flex-wrap">
            <span class=${rowLabel}>${t.label}</span>
            <${LoginButton} tier=${t.id} userName="Sebastián" />
            <${LoginButton}
              tier=${t.id}
              userName="Sebastián"
              customClassName="!bg-[var(--color-background-brand-secondary-hover)]"
            />
            <${LoginButton}
              tier=${t.id}
              userName="Sebastián"
              customClassName="!bg-[var(--color-background-brand-secondary-active)]"
            />
            <span class="text-[10px] text-zinc-500">default · hover · active</span>
          </div>
        `)}
      </div>
    </section>

    <!-- ============== Variation: Chip ============== -->
    <section class="mb-12">
      <h2 class=${sectionTitle}>Variation: Chip (mobile ≥ 768px)</h2>

      <h3 class=${subTitle}>Logged out — solo icono</h3>
      <div class="flex items-center gap-6 mb-8 flex-wrap">
        <div>
          <div class=${cellLabel}>default</div>
          <${LoginButton} tier="logged-out" variation="chip" />
        </div>
        <div>
          <div class=${cellLabel}>hover (forzado)</div>
          <${LoginButton}
            tier="logged-out"
            variation="chip"
            customClassName="!bg-[var(--color-background-brand-secondary-hover)]"
          />
        </div>
        <div>
          <div class=${cellLabel}>active (forzado)</div>
          <${LoginButton}
            tier="logged-out"
            variation="chip"
            customClassName="!bg-[var(--color-background-brand-secondary-active)]"
          />
        </div>
      </div>

      <h3 class=${subTitle}>Members (logged-in) — iniciales "SR" + tooltip "Mi perfil"</h3>
      <div class="space-y-3">
        ${TIERS.filter((t) => t.id !== 'logged-out').map((t) => html`
          <div key=${t.id} class="flex items-center gap-6 flex-wrap">
            <span class=${rowLabel}>${t.label}</span>
            <${LoginButton} tier=${t.id} variation="chip" userInitials="SR" />
            <${LoginButton}
              tier=${t.id}
              variation="chip"
              userInitials="SR"
              customClassName="!bg-[var(--color-background-brand-secondary-hover)]"
            />
            <${LoginButton}
              tier=${t.id}
              variation="chip"
              userInitials="SR"
              customClassName="!bg-[var(--color-background-brand-secondary-active)]"
            />
            <span class="text-[10px] text-zinc-500">default · hover · active</span>
          </div>
        `)}
      </div>
    </section>

    <!-- ============== Como link (href) ============== -->
    <section class="mb-12">
      <h2 class=${sectionTitle}>Como link (href)</h2>
      <div class="flex items-center gap-6 flex-wrap">
        <${LoginButton} tier="logged-out" href="/login" />
        <${LoginButton} tier="lifemiles" userName="Sebastián" href="/profile" />
        <${LoginButton} tier="diamond" variation="chip" userInitials="SR" href="/profile" />
      </div>
    </section>
  </div>
`;

export default LoginButtonSample;
