import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { Cintilla } from './cintilla.js';

const html = htm.bind(h);

/**
 * CintillaSample - Showcase of the Cintilla organism
 * Multiple cases covering defaults, custom colors, single-line, multi-paragraph.
 */
export const CintillaSample = () => html`
  <div class="flex flex-col gap-12 p-8">
    <h2 class="text-2xl font-bold text-gray-800">Cintilla</h2>

    <!-- Case 1: Default colors (Figma) -->
    <section>
      <h3 class="text-lg font-semibold mb-4 text-gray-700">Default Figma (rosa claro / fucsia link)</h3>
      <${Cintilla}
        contentHTML="<p>¿Tienes dudas? Resuélvelas en nuestro <a href='/centro-de-ayuda'>Centro de ayuda</a></p>"
      />
    </section>

    <!-- Case 2: Dark background, light text, cyan link -->
    <section>
      <h3 class="text-lg font-semibold mb-4 text-gray-700">Fondo oscuro custom</h3>
      <${Cintilla}
        contentHTML="<p>Únete a LifeMiles y obtén beneficios exclusivos. <a href='/lifemiles'>Conoce más</a></p>"
        bgColor="#1a1a2e"
        textColor="#ffffff"
        linkColor="#00d9ff"
      />
    </section>

    <!-- Case 3: Single short text, no link -->
    <section>
      <h3 class="text-lg font-semibold mb-4 text-gray-700">Texto corto sin link</h3>
      <${Cintilla}
        contentHTML="<p>Avianca Direct: la mejor experiencia de viaje.</p>"
        bgColor="#e0f2fe"
      />
    </section>

    <!-- Case 4: Long text in single paragraph (should truncate with ellipsis) -->
    <section>
      <h3 class="text-lg font-semibold mb-4 text-gray-700">Texto largo single-paragraph (debe truncarse con …)</h3>
      <${Cintilla}
        contentHTML="<p>Este es un texto extremadamente largo que excede el ancho del contenedor en cualquier viewport razonable y por lo tanto debería truncarse con un ellipsis al final.</p>"
        bgColor="#fef3c7"
      />
    </section>

    <!-- Case 5: Multi-paragraph (author explicit line breaks → respeta) -->
    <section>
      <h3 class="text-lg font-semibold mb-4 text-gray-700">Multi-párrafo (saltos explícitos del autor)</h3>
      <${Cintilla}
        contentHTML="<p>Primera línea con <a href='/x'>un link</a>.</p><p>Segunda línea independiente.</p><p>Tercera línea final.</p>"
        bgColor="#dcfce7"
        linkColor="#16a34a"
      />
    </section>

    <!-- Case 6: Invalid colors (fallback to defaults) -->
    <section>
      <h3 class="text-lg font-semibold mb-4 text-gray-700">Colores inválidos (fallback a defaults)</h3>
      <${Cintilla}
        contentHTML="<p>Si los colores no son hex/rgba válidos, fallback al default rosa.</p>"
        bgColor="red"
        textColor="not-a-color"
        linkColor="invalid"
      />
    </section>
  </div>
`;

export default CintillaSample;
