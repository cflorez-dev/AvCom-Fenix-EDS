import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { SimpleLoader } from './simple-loader.js';

const html = htm.bind(h);

/**
 * SimpleLoader Samples - Ejemplos de uso del Progress Spinner
 */
export const SimpleLoaderSample = () => html`
  <div class="samples-container p-8">
    <h2 class="mb-6 text-2xl font-bold">
      SimpleLoader (Progress Spinner)
    </h2>

    <!-- Small Size -->
    <div class="mb-10">
      <h3 class="mb-4 text-lg font-semibold">
        Size: Small (16px)
      </h3>
      
      <div class="flex gap-12 items-center">
        <!-- Small on Light Background -->
        <div class="text-center">
          <div class="bg-white p-6 rounded-lg border border-gray-200 inline-block">
            <${SimpleLoader} size="small" onDark=${false} />
          </div>
          <p class="mt-2 text-sm text-gray-600">
            onDark=false (fondo claro)
          </p>
        </div>

        <!-- Small on Dark Background -->
        <div class="text-center">
          <div class="bg-gray-900 p-6 rounded-lg inline-block">
            <${SimpleLoader} size="small" onDark=${true} />
          </div>
          <p class="mt-2 text-sm text-gray-600">
            onDark=true (fondo oscuro)
          </p>
        </div>
      </div>
    </div>

    <!-- Medium Size -->
    <div class="mb-10">
      <h3 class="mb-4 text-lg font-semibold">
        Size: Medium (20px)
      </h3>
      
      <div class="flex gap-12 items-center">
        <!-- Medium on Light Background -->
        <div class="text-center">
          <div class="bg-white p-6 rounded-lg border border-gray-200 inline-block">
            <${SimpleLoader} size="medium" onDark=${false} />
          </div>
          <p class="mt-2 text-sm text-gray-600">
            onDark=false (fondo claro)
          </p>
        </div>

        <!-- Medium on Dark Background -->
        <div class="text-center">
          <div class="bg-gray-900 p-6 rounded-lg inline-block">
            <${SimpleLoader} size="medium" onDark=${true} />
          </div>
          <p class="mt-2 text-sm text-gray-600">
            onDark=true (fondo oscuro)
          </p>
        </div>
      </div>
    </div>
  </div>
`;

export default SimpleLoaderSample;
