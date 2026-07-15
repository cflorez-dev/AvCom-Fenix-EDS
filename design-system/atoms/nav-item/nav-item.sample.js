import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { NavItem } from './nav-item.js';

const html = htm.bind(h);

const sectionTitle = 'text-2xl font-bold mb-4';
const cellLabel = 'text-[10px] uppercase tracking-wider text-zinc-500 mb-1';

/**
 * NavItemSample - Showcase de todas las combinaciones state × size × active.
 *
 * Estados (default/hover) se muestran apilados con clases forzadas para inspección
 * estática; en runtime el componente responde a interacción real (hover, focus-visible).
 *
 * Layout responsive:
 *  - Cambia automáticamente a vista mobile cuando el viewport es <768px.
 *  - Para verlo, redimensioná la ventana o usá las dev tools.
 */
export const NavItemSample = () => html`
  <div class="p-10 max-w-[1400px] mx-auto">
    <header class="mb-8">
      <h1 class="text-3xl font-bold mb-2">NavItem</h1>
      <p class="text-sm text-zinc-600">
        Figma 14:25206. Atomo de navegación con underline verde para estado
        <code>active</code>. Probá <kbd>TAB</kbd> para ver el focus ring y
        redimensioná la ventana ≥ 768px para ver el layout mobile.
      </p>
    </header>

    <!-- ============== Desktop · size=default (76px) ============== -->
    <section class="mb-12">
      <h2 class=${sectionTitle}>Desktop · size="default" (76px)</h2>
      <div class="flex flex-wrap items-center gap-6 border-b border-zinc-200 pb-6">
        <div>
          <div class=${cellLabel}>default · !active</div>
          <${NavItem} label="Label" />
        </div>
        <div>
          <div class=${cellLabel}>hover (forzado) · !active</div>
          <${NavItem}
            label="Label"
            customClassName="md:!bg-[var(--color-background-brand-secondary-hover)] md:!font-bold"
          />
        </div>
        <div>
          <div class=${cellLabel}>focus no current (forzado)</div>
          <${NavItem}
            label="Label"
            customClassName="[&_.ds-focus-ring]:!border-[var(--color-border-stroke-focus)]"
          />
        </div>
        <div>
          <div class=${cellLabel}>default · active</div>
          <${NavItem} label="Label" active=${true} />
        </div>
        <div>
          <div class=${cellLabel}>hover (forzado) · active</div>
          <${NavItem}
            label="Label"
            active=${true}
            customClassName="md:!bg-[var(--color-background-brand-secondary-hover)]"
          />
        </div>
        <div>
          <div class=${cellLabel}>focus current (forzado)</div>
          <${NavItem}
            label="Label"
            active=${true}
            customClassName="[&_.ds-focus-ring]:!border-[var(--color-border-stroke-focus)]"
          />
        </div>
      </div>
    </section>

    <!-- ============== Desktop · size=compact (50px) ============== -->
    <section class="mb-12">
      <h2 class=${sectionTitle}>Desktop · size="compact" (50px)</h2>
      <div class="flex flex-wrap items-center gap-6 border-b border-zinc-200 pb-6">
        <div>
          <div class=${cellLabel}>default · !active</div>
          <${NavItem} label="Label" size="compact" />
        </div>
        <div>
          <div class=${cellLabel}>hover (forzado) · !active</div>
          <${NavItem}
            label="Label"
            size="compact"
            customClassName="md:!bg-[var(--color-background-brand-secondary-hover)] md:!font-bold"
          />
        </div>
        <div>
          <div class=${cellLabel}>focus no current (forzado)</div>
          <${NavItem}
            label="Label"
            size="compact"
            customClassName="[&_.ds-focus-ring]:!border-[var(--color-border-stroke-focus)]"
          />
        </div>
        <div>
          <div class=${cellLabel}>default · active</div>
          <${NavItem} label="Label" size="compact" active=${true} />
        </div>
        <div>
          <div class=${cellLabel}>hover (forzado) · active</div>
          <${NavItem}
            label="Label"
            size="compact"
            active=${true}
            customClassName="md:!bg-[var(--color-background-brand-secondary-hover)]"
          />
        </div>
        <div>
          <div class=${cellLabel}>focus current (forzado)</div>
          <${NavItem}
            label="Label"
            size="compact"
            active=${true}
            customClassName="[&_.ds-focus-ring]:!border-[var(--color-border-stroke-focus)]"
          />
        </div>
      </div>
    </section>

    <!-- ============== Mobile (forzado: device='mobile') ============== -->
    <section class="mb-12">
      <h2 class=${sectionTitle}>Mobile · device="mobile" (con icono arrow-forward)</h2>
      <p class="text-xs text-zinc-500 mb-4">
        Forzando <code>device="mobile"</code> el átomo siempre renderiza el layout
        de mobile (72px alto, label medium 20px + icono) sin importar el viewport.
        Útil para overlays / drawers de navegación.
      </p>
      <div class="flex flex-col gap-2 max-w-[375px] border border-zinc-200 rounded p-2">
        <${NavItem} label="Label" device="mobile" />
        <${NavItem} label="Mis viajes" device="mobile" />
        <${NavItem} label="Lifemiles" device="mobile" />
        <${NavItem} label="Preferencias" device="mobile" href="/preferencias" />
      </div>
    </section>

    <!-- ============== Mobile responsive (auto, según viewport) ============== -->
    <section class="mb-12">
      <h2 class=${sectionTitle}>Responsive · device="auto" (default)</h2>
      <p class="text-xs text-zinc-500 mb-4">
        Comportamiento normal: en desktop (≥768px) muestra layout horizontal sin
        icono; en mobile (&lt;768px) muestra layout con icono. Redimensioná la
        ventana para verlo cambiar.
      </p>
      <div class="flex flex-col md:flex-row gap-2 max-w-[375px] md:max-w-none border border-zinc-200 rounded p-2">
        <${NavItem} label="Label" />
        <${NavItem} label="Mis viajes" />
        <${NavItem} label="Lifemiles" />
      </div>
    </section>

    <!-- ============== Tab group (uso real esperado) ============== -->
    <section class="mb-12">
      <h2 class=${sectionTitle}>Uso real: tab group</h2>
      <div class="flex border-b border-zinc-200">
        <${NavItem} label="Label" active=${true} />
        <${NavItem} label="Mis viajes" />
        <${NavItem} label="Lifemiles" />
        <${NavItem} label="Preferencias" />
      </div>
    </section>

    <!-- ============== Como link (href) ============== -->
    <section class="mb-12">
      <h2 class=${sectionTitle}>Como link (href + onClick)</h2>
      <div class="flex flex-wrap gap-4">
        <${NavItem} label="Inicio" href="/" />
        <${NavItem} label="Reservas" href="/reservas" active=${true} />
        <${NavItem} label="Externo" href="https://avianca.com" />
      </div>
    </section>
  </div>
`;

export default NavItemSample;
