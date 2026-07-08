import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { MemberStatusButton } from './member-status-button.js';

const html = htm.bind(h);

const sectionTitle = 'text-2xl font-bold mb-4';
const cellLabel = 'text-[10px] uppercase tracking-wider text-zinc-500 mb-1';
const TIERS = ['lifemiles', 'gold', 'red-plus', 'silver', 'diamond', 'magno'];

/**
 * MemberStatusButtonSample - Showcase de los 6 tiers × 4 estados.
 *
 * Estados forzados (hover/pressed/focus) se simulan con clases `!important`
 * para inspección visual. En runtime el componente responde a interacción real.
 *
 * Figma:
 *  - default: 350:13635
 *  - hover:   350:13668
 *  - pressed: 350:13700
 *  - focus:   350:13733
 */
export const MemberStatusButtonSample = () => html`
  <div class="p-10 max-w-[1200px] mx-auto">
    <header class="mb-8">
      <h1 class="text-3xl font-bold mb-2">MemberStatusButton</h1>
      <p class="text-sm text-zinc-600">
        Botón pill por tier de membresía Members. 6 tiers × 4 estados.
        Probá <kbd>TAB</kbd> para ver el focus ring real.
      </p>
    </header>

    <!-- ============== Default ============== -->
    <section class="mb-12 p-6 rounded-[12px] bg-zinc-700">
      <h2 class=${`${sectionTitle} text-white`}>Default</h2>
      <div class="grid grid-cols-2 gap-4">
        ${TIERS.map((tier) => html`
          <div>
            <div class=${`${cellLabel} text-zinc-300`}>${tier}</div>
            <${MemberStatusButton} tier=${tier} />
          </div>
        `)}
      </div>
    </section>

    <!-- ============== Hover (forced) ============== -->
    <section class="mb-12 p-6 rounded-[12px] bg-zinc-400">
      <h2 class=${sectionTitle}>Hover (forzado)</h2>
      <div class="grid grid-cols-2 gap-4">
        ${TIERS.map((tier) => html`
          <div>
            <div class=${cellLabel}>${tier}</div>
            <${MemberStatusButton}
              tier=${tier}
              customClassName="!bg-white !border-transparent !text-[var(--ms-invert-text)]"
            />
          </div>
        `)}
      </div>
    </section>

    <!-- ============== Pressed (forced) ============== -->
    <section class="mb-12 p-6 rounded-[12px] bg-white border border-zinc-200">
      <h2 class=${sectionTitle}>Pressed (forzado)</h2>
      <div class="grid grid-cols-2 gap-4">
        ${TIERS.map((tier) => html`
          <div>
            <div class=${cellLabel}>${tier}</div>
            <${MemberStatusButton}
              tier=${tier}
              customClassName="!bg-[#e9e9e9] !border-transparent !text-[var(--ms-invert-text)]"
            />
          </div>
        `)}
      </div>
    </section>

    <!-- ============== Focus (forced) ============== -->
    <section class="mb-12 p-6 rounded-[12px] bg-zinc-400">
      <h2 class=${sectionTitle}>Focus (forzado · ring azul + white spacer)</h2>
      <div class="grid grid-cols-2 gap-4">
        ${TIERS.map((tier) => html`
          <div>
            <div class=${cellLabel}>${tier}</div>
            <${MemberStatusButton}
              tier=${tier}
              customClassName="!shadow-[0_0_0_1.5px_#28a8ff,0_0_0_3px_#ffffff]"
            />
          </div>
        `)}
      </div>
    </section>

    <!-- ============== Disabled ============== -->
    <section class="mb-12 p-6 rounded-[12px] bg-zinc-100">
      <h2 class=${sectionTitle}>Disabled</h2>
      <div class="grid grid-cols-2 gap-4">
        ${TIERS.slice(0, 2).map((tier) => html`
          <div>
            <div class=${cellLabel}>${tier}</div>
            <${MemberStatusButton} tier=${tier} disabled=${true} />
          </div>
        `)}
      </div>
    </section>
  </div>
`;

export default MemberStatusButtonSample;
