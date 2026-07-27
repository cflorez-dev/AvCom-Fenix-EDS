import { h } from '@dropins/tools/preact.js';
import { useState, useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { FullPageLoader } from './full-page-loader.js';
import { Button } from '../../atoms/button/button.js';

const html = htm.bind(h);

/**
 * FullPageLoader Samples - Ejemplos de uso del Full Page Loader
 */
export const FullPageLoaderSample = () => {
  const [isOpen1, setIsOpen1] = useState(false);
  const [isOpen2, setIsOpen2] = useState(false);

  // Auto-close loader after 3 seconds
  useEffect(() => {
    let timer;
    if (isOpen1) {
      timer = setTimeout(() => {
        setIsOpen1(false);
      }, 3000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOpen1]);

  // Auto-close loader after 3 seconds
  useEffect(() => {
    let timer;
    if (isOpen2) {
      timer = setTimeout(() => {
        setIsOpen2(false);
      }, 3000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOpen2]);

  return html`
    <div class="p-8 max-w-4xl mx-auto">
      <h2 class="mb-6 text-2xl font-bold">
        FullPageLoader (Full Page Loader)
      </h2>
      <p class="mb-10 text-gray-600">
        Loader de página completa que se cierra automáticamente después de 3 segundos.
        Como es un componente con position:fixed, se abre en overlay sobre toda la página.
      </p>

      <!-- Example 1: Default label -->
      <section class="mb-10">
        <h3 class="mb-4 text-lg font-semibold">
          Example 1: Default Label
        </h3>
        <p class="mb-4 text-sm text-gray-600">
          Loader de página completa con label por defecto
        </p>
        <${Button} variant="primary" onClick=${() => setIsOpen1(true)}>
          Abrir Loader (se cierra en 3s)
        </${Button}>
        <${FullPageLoader} isOpen=${isOpen1} />
      </section>

      <!-- Example 2: Custom label -->
      <section class="mb-10">
        <h3 class="mb-4 text-lg font-semibold">
          Example 2: Custom Label
        </h3>
        <p class="mb-4 text-sm text-gray-600">
          Loader con label personalizado
        </p>
        <${Button} variant="secondary" onClick=${() => setIsOpen2(true)}>
          Abrir Loader Personalizado (se cierra en 3s)
        </${Button}>
        <${FullPageLoader} isOpen=${isOpen2} label="Procesando tu reserva..." />
      </section>

      <!-- Info: Closed State -->
      <section class="mb-10">
        <h3 class="mb-4 text-lg font-semibold">
          State: isOpen: false
        </h3>
        <p class="text-sm text-gray-600">
          Cuando isOpen=false, el componente retorna null (no renderiza nada)
        </p>
      </section>
    </div>
  `;
};

export default FullPageLoaderSample;
