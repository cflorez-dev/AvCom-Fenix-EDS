import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { HeaderButton } from './header-button.js';

const html = htm.bind(h);

const sectionTitle = 'text-2xl font-bold mb-4';
const subTitle = 'text-sm font-semibold mb-3 text-zinc-700';
const cellLabel = 'text-[10px] uppercase tracking-wider text-zinc-500 mb-1';

// SVG icon de bandera de ejemplo (Colombia) inline para los samples.
// En producción el block consumidor pasa <img src=...>.
const FlagCo = () => html`
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="16" height="8" fill="#FCD116"/>
    <rect y="8" width="16" height="4" fill="#003893"/>
    <rect y="12" width="16" height="4" fill="#CE1126"/>
  </svg>
`;

// SVG icon genérico (carrito) para mostrar el modo icon-only.
const CartIcon = () => html`
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M7 18C5.9 18 5.01 18.9 5.01 20S5.9 22 7 22 9 21.1 9 20 8.1 18 7 18ZM1 2V4H3L6.6 11.59L5.25 14.04C5.09 14.32 5 14.65 5 15C5 16.1 5.9 17 7 17H19V15H7.42C7.28 15 7.17 14.89 7.17 14.75L7.2 14.63L8.1 13H15.55C16.3 13 16.96 12.59 17.3 11.97L20.88 5.5C20.96 5.34 21 5.17 21 5C21 4.45 20.55 4 20 4H5.21L4.27 2H1ZM17 18C15.9 18 15.01 18.9 15.01 20S15.9 22 17 22 19 21.1 19 20 18.1 18 17 18Z"
      fill="currentColor"
    />
  </svg>
`;

// SVG icon de persona para la variante "Iniciar sesión" (Figma 12:18877).
const PersonIcon = () => html`
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M9 9C10.6575 9 12 7.6575 12 6C12 4.3425 10.6575 3 9 3C7.3425 3 6 4.3425 6 6C6 7.6575 7.3425 9 9 9ZM9 10.5C6.9975 10.5 3 11.505 3 13.5V15H15V13.5C15 11.505 11.0025 10.5 9 10.5Z"
      fill="currentColor"
    />
  </svg>
`;

/**
 * HeaderButtonSample – Showcase de todas las variantes/estados del átomo.
 * Estados (default/hover/active/focus/open) se renderizan apilados; en
 * runtime el botón responde a interacción normal.
 */
export const HeaderButtonSample = () => html`
  <div class="p-10 max-w-[1400px] mx-auto">
    <header class="mb-8">
      <h1 class="text-3xl font-bold mb-2">HeaderButton</h1>
      <p class="text-sm text-zinc-600">
        Figma 14:25237. Pill 36px, border 1px, bg transparente. Estado
        <code>open</code> → border verde + chevron volteado. Probá
        <kbd>TAB</kbd> para ver el focus ring y hover real con mouse.
      </p>
    </header>

    <!-- ============== With label + chevron ============== -->
    <section class="mb-12">
      <h2 class=${sectionTitle}>Con label + chevron</h2>

      <h3 class=${subTitle}>Estados (default · hover · active · focus · open)</h3>
      <div class="flex items-center gap-6 mb-8 flex-wrap">
        <div>
          <div class=${cellLabel}>default</div>
          <${HeaderButton}
            icon=${html`<${FlagCo} />`}
            label="COP"
            ariaLabel="Seleccionar país e idioma: COP"
          />
        </div>
        <div>
          <div class=${cellLabel}>hover (forzado)</div>
          <${HeaderButton}
            icon=${html`<${FlagCo} />`}
            label="COP"
            customClassName="!bg-[var(--color-background-brand-secondary-hover)]"
          />
        </div>
        <div>
          <div class=${cellLabel}>active (forzado)</div>
          <${HeaderButton}
            icon=${html`<${FlagCo} />`}
            label="COP"
            customClassName="!bg-[var(--color-background-brand-secondary-active)]"
          />
        </div>
        <div>
          <div class=${cellLabel}>focus (TAB real)</div>
          <${HeaderButton}
            icon=${html`<${FlagCo} />`}
            label="COP"
          />
        </div>
        <div>
          <div class=${cellLabel}>open</div>
          <${HeaderButton}
            icon=${html`<${FlagCo} />`}
            label="COP"
            state="open"
            aria-expanded="true"
          />
        </div>
      </div>

      <h3 class=${subTitle}>Sin icono (solo label + chevron)</h3>
      <div class="flex items-center gap-6 mb-8 flex-wrap">
        <${HeaderButton} label="Ayuda" />
        <${HeaderButton} label="Ayuda" state="open" />
      </div>
    </section>

    <!-- ============== Icon-only (chip) ============== -->
    <section class="mb-12">
      <h2 class=${sectionTitle}>Icon-only (chip con tooltip-hint)</h2>

      <h3 class=${subTitle}>Estados</h3>
      <div class="flex items-center gap-6 mb-8 flex-wrap">
        <div>
          <div class=${cellLabel}>default</div>
          <${HeaderButton}
            icon=${html`<${CartIcon} />`}
            tooltipText="Carrito"
            chevron=${false}
          />
        </div>
        <div>
          <div class=${cellLabel}>hover (forzado)</div>
          <${HeaderButton}
            icon=${html`<${CartIcon} />`}
            tooltipText="Carrito"
            chevron=${false}
            customClassName="!bg-[var(--color-background-brand-secondary-hover)]"
          />
        </div>
        <div>
          <div class=${cellLabel}>active (forzado)</div>
          <${HeaderButton}
            icon=${html`<${CartIcon} />`}
            tooltipText="Carrito"
            chevron=${false}
            customClassName="!bg-[var(--color-background-brand-secondary-active)]"
          />
        </div>
        <div>
          <div class=${cellLabel}>focus (TAB real)</div>
          <${HeaderButton}
            icon=${html`<${CartIcon} />`}
            tooltipText="Carrito"
            chevron=${false}
          />
        </div>
        <div>
          <div class=${cellLabel}>open</div>
          <${HeaderButton}
            icon=${html`<${CartIcon} />`}
            tooltipText="Carrito"
            chevron=${false}
            state="open"
          />
        </div>
      </div>

      <h3 class=${subTitle}>Notification dot (verde, Figma 104:7034)</h3>
      <p class="text-xs text-zinc-500 mb-4">
        El dot se renderiza en la esquina top-right del trigger. Compatible
        con o sin chevron. Solo aplica con <code>state='default'</code>
        (en <code>open</code> el dot desaparece para no competir con el
        borde verde del estado abierto).
      </p>
      <div class="flex items-center gap-6 mb-8 flex-wrap">
        <div>
          <div class=${cellLabel}>sin chevron</div>
          <${HeaderButton}
            icon=${html`<${CartIcon} />`}
            tooltipText="Carrito"
            chevron=${false}
            notification=${true}
          />
        </div>
        <div>
          <div class=${cellLabel}>con chevron (Figma 104:7034)</div>
          <${HeaderButton}
            icon=${html`<${CartIcon} />`}
            tooltipText="Carrito"
            notification=${true}
          />
        </div>
      </div>
    </section>

    <!-- ============== Icon + chevron, sin label (Figma 12:19041) ============== -->
    <section class="mb-12">
      <h2 class=${sectionTitle}>Icon + chevron (sin label)</h2>
      <p class="text-xs text-zinc-500 mb-4">
        Figma 12:19041. Trigger de un dropdown que muestra solo icono + chevron
        (ej. menú de carrito con sub-acciones, selector compacto sin texto).
        El tooltip-hint sigue activo si se pasa <code>tooltipText</code>.
      </p>
      <div class="flex items-center gap-6 mb-8 flex-wrap">
        <div>
          <div class=${cellLabel}>default</div>
          <${HeaderButton}
            icon=${html`<${CartIcon} />`}
            tooltipText="Carrito"
          />
        </div>
        <div>
          <div class=${cellLabel}>hover (forzado)</div>
          <${HeaderButton}
            icon=${html`<${CartIcon} />`}
            tooltipText="Carrito"
            customClassName="!bg-[var(--color-background-brand-secondary-hover)]"
          />
        </div>
        <div>
          <div class=${cellLabel}>active (forzado)</div>
          <${HeaderButton}
            icon=${html`<${CartIcon} />`}
            tooltipText="Carrito"
            customClassName="!bg-[var(--color-background-brand-secondary-active)]"
          />
        </div>
        <div>
          <div class=${cellLabel}>focus (TAB real)</div>
          <${HeaderButton}
            icon=${html`<${CartIcon} />`}
            tooltipText="Carrito"
          />
        </div>
        <div>
          <div class=${cellLabel}>open</div>
          <${HeaderButton}
            icon=${html`<${CartIcon} />`}
            tooltipText="Carrito"
            state="open"
          />
        </div>
      </div>
    </section>

    <!-- ============== Icon + label, sin chevron (Figma 12:18877) ============== -->
    <section class="mb-12">
      <h2 class=${sectionTitle}>Icon + label (sin chevron)</h2>
      <p class="text-xs text-zinc-500 mb-4">
        Figma 12:18877. CTA directo, sin dropdown asociado. Equivale al CTA
        "Iniciar sesión" del header (logged-out). Usa <code>chevron={false}</code>
        ya que no hay popover. Cuando el block consumidor lo necesite con
        comportamiento de menú post-login, pasar <code>chevron={true}</code>.
      </p>
      <div class="flex items-center gap-6 mb-8 flex-wrap">
        <div>
          <div class=${cellLabel}>default</div>
          <${HeaderButton}
            icon=${html`<${PersonIcon} />`}
            label="Iniciar sesión"
            chevron=${false}
          />
        </div>
        <div>
          <div class=${cellLabel}>hover (forzado)</div>
          <${HeaderButton}
            icon=${html`<${PersonIcon} />`}
            label="Iniciar sesión"
            chevron=${false}
            customClassName="!bg-[var(--color-background-brand-secondary-hover)]"
          />
        </div>
        <div>
          <div class=${cellLabel}>active (forzado)</div>
          <${HeaderButton}
            icon=${html`<${PersonIcon} />`}
            label="Iniciar sesión"
            chevron=${false}
            customClassName="!bg-[var(--color-background-brand-secondary-active)]"
          />
        </div>
        <div>
          <div class=${cellLabel}>focus (TAB real)</div>
          <${HeaderButton}
            icon=${html`<${PersonIcon} />`}
            label="Iniciar sesión"
            chevron=${false}
          />
        </div>
      </div>
    </section>

    <!-- ============== Device hint (data-attr informativo) ============== -->
    <section class="mb-12">
      <h2 class=${sectionTitle}>Device hint (data-device)</h2>
      <p class="text-xs text-zinc-500 mb-4">
        El prop <code>device</code> ya no afecta la visibilidad del chevron;
        es puramente informativo y se expone como <code>data-device</code>
        para que el block consumidor pueda targetearlo con CSS si necesita.
        La visibilidad del chevron la decide el prop <code>chevron</code>.
      </p>

      <h3 class=${subTitle}>device="desktop"</h3>
      <div class="flex items-center gap-6 mb-6 flex-wrap">
        <${HeaderButton}
          icon=${html`<${FlagCo} />`}
          label="COP"
          device="desktop"
        />
        <${HeaderButton}
          icon=${html`<${CartIcon} />`}
          tooltipText="Carrito"
          chevron=${false}
          device="desktop"
        />
      </div>

      <h3 class=${subTitle}>device="mobile" (chevron sigue visible si chevron=true)</h3>
      <div class="flex items-center gap-6 mb-6 flex-wrap">
        <${HeaderButton}
          icon=${html`<${FlagCo} />`}
          label="COP"
          device="mobile"
        />
        <${HeaderButton}
          icon=${html`<${CartIcon} />`}
          tooltipText="Carrito"
          device="mobile"
        />
      </div>
    </section>

    <!-- ============== Como link ============== -->
    <section class="mb-12">
      <h2 class=${sectionTitle}>Render como link (href)</h2>
      <div class="flex items-center gap-6 mb-6 flex-wrap">
        <${HeaderButton}
          icon=${html`<${FlagCo} />`}
          label="COP"
          href="#"
        />
      </div>
    </section>
  </div>
`;

export default HeaderButtonSample;
