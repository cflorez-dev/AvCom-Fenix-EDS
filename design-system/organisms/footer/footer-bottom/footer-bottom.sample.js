import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { FooterBottom } from './footer-bottom.js';

const html = htm.bind(h);

/**
 * FooterBottomSample - Showcase of FooterBottom darksite variants
 */
export const FooterBottomSample = () => html`
    <div class="space-y-12">

      <!-- Darksite Dark Variant (transparent bg, white text) -->
      <section>
        <h2 class="text-2xl font-bold mb-4 text-[var(--text-normal-primary)]">
          FooterBottom — Darksite Dark
        </h2>
        <p class="text-sm text-[var(--text-normal-secondary)] mb-6">
          Variante minimal sobre fondo oscuro. Solo copyright centrado, sin iconos sociales
          ni app stores. El fondo es transparente (hereda del padre).
        </p>
        <div class="rounded-lg overflow-hidden border border-[#333]">
          <div class="bg-[#1B1B1B] p-0">
            <${FooterBottom}
              variant="darksite-dark"
              copyrightText="Copyright © Avianca ${new Date().getFullYear()}"
            />
          </div>
        </div>
      </section>

      <!-- Darksite Light Variant (#1B1B1B bg, white text) -->
      <section>
        <h2 class="text-2xl font-bold mb-4 text-[var(--text-normal-primary)]">
          FooterBottom — Darksite Light
        </h2>
        <p class="text-sm text-[var(--text-normal-secondary)] mb-6">
          Variante minimal sobre fondo claro/white. Solo copyright centrado con bg #1B1B1B
          y gradiente en mobile. Texto blanco.
        </p>
        <div class="rounded-lg overflow-hidden border border-[#E0E0E0]">
          <div class="bg-white p-0">
            <${FooterBottom}
              variant="darksite-light"
              copyrightText="Copyright © Avianca ${new Date().getFullYear()}"
            />
          </div>
        </div>
      </section>

      <!-- Default variant (for reference) -->
      <section>
        <h2 class="text-2xl font-bold mb-4 text-[var(--text-normal-primary)]">
          FooterBottom — Default (Dark theme)
        </h2>
        <p class="text-sm text-[var(--text-normal-secondary)] mb-6">
          Variante original con redes sociales, app stores y copyright.
        </p>
        <div class="rounded-lg overflow-hidden">
          <${FooterBottom}
            theme="dark"
            copyrightText="Copyright © Avianca ${new Date().getFullYear()}"
            socialLinks=${[
              { url: '#', title: 'TikTok', iconDark: '', iconLight: '', isExternal: true },
              { url: '#', title: 'Twitter', iconDark: '', iconLight: '', isExternal: true },
              { url: '#', title: 'Instagram', iconDark: '', iconLight: '', isExternal: true },
            ]}
          />
        </div>
      </section>

    </div>
  `;

export default FooterBottomSample;
