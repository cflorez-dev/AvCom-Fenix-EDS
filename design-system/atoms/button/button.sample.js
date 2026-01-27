import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Button } from './button.js';


const html = htm.bind(h);

/**
 * ButtonSample - Minimalist showcase of the Button component
 * Shows all available variants and sizes according to Figma design
 */
export const ButtonSample = () => html`
    <div class="p-10 max-w-[1200px] mx-auto">
      
      <!-- Variants -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold mb-6">Variants</h2>
        <div class="flex gap-4 flex-wrap">
          <${Button} variant="primary" size="md">Primary</${Button}>
          <${Button} variant="secondary" size="md">Secondary</${Button}>
          <${Button} variant="tertiary" size="md">Tertiary</${Button}>
          <${Button} variant="danger" size="md">Danger</${Button}>
          <${Button} variant="transparent" size="md">Transparent</${Button}>
        </div>
      </section>

      <!-- Sizes -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold mb-6">Sizes</h2>
        <div class="flex gap-4 items-center flex-wrap">
          <${Button} variant="primary" size="xxs">XXS (24px)</${Button}>
          <${Button} variant="primary" size="xs">Extra Small</${Button}>
          <${Button} variant="primary" size="sm">Small</${Button}>
          <${Button} variant="primary" size="md">Medium</${Button}>
          <${Button} variant="primary" size="lg">Large</${Button}>
        </div>
        <div class="mt-4 flex gap-4 items-center flex-wrap">
          <${Button} variant="secondary" size="xxs">XXS (24px)</${Button}>
          <${Button} variant="secondary" size="xs">Extra Small</${Button}>
          <${Button} variant="secondary" size="sm">Small</${Button}>
          <${Button} variant="secondary" size="md">Medium</${Button}>
          <${Button} variant="secondary" size="lg">Large</${Button}>
        </div>
        <div class="mt-4 flex gap-4 items-center flex-wrap">
          <${Button} variant="transparent" size="xxs">XXS (24px)</${Button}>
          <${Button} variant="transparent" size="xs">Extra Small</${Button}>
          <${Button} variant="transparent" size="sm">Small</${Button}>
          <${Button} variant="transparent" size="md">Medium</${Button}>
          <${Button} variant="transparent" size="lg">Large</${Button}>
        </div>
      </section>

      <!-- With icons (child nodes) -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold mb-6">With icons</h2>
        <div class="flex gap-4 flex-wrap">
          <${Button} variant="primary" size="md">
            <span class="avi-button__icon avi-button__icon--before">→</span>
            Icon before
          </${Button}>
          <${Button} variant="primary" size="md">
            Icon after
            <span class="avi-button__icon avi-button__icon--after">→</span>
          </${Button}>
          <${Button} variant="secondary" size="md">
            <span class="avi-button__icon avi-button__icon--before">✓</span>
            Both sides
            <span class="avi-button__icon avi-button__icon--after">→</span>
          </${Button}>
        </div>
      </section>

      <!-- Icon only mode -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold mb-6">Icon only mode</h2>
        <div class="flex gap-4 items-center flex-wrap">
          <${Button} variant="primary" size="xxs" iconOnly=${true}>
            <span class="avi-button__icon">☰</span>
          </${Button}>
          <${Button} variant="primary" size="md" iconOnly=${true}>
            <span class="avi-button__icon">☰</span>
          </${Button}>
          <${Button} variant="secondary" size="md" iconOnly=${true}>
            <span class="avi-button__icon">+</span>
          </${Button}>
          <${Button} variant="danger" size="md" iconOnly=${true}>
            <span class="avi-button__icon">×</span>
          </${Button}>
          <${Button} variant="primary" size="sm" iconOnly=${true}>
            <span class="avi-button__icon">→</span>
          </${Button}>
          <${Button} variant="transparent" size="md" iconOnly=${true}>
            <span class="avi-button__icon">☰</span>
          </${Button}>
        </div>
      </section>

      <!-- States -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold mb-6">States</h2>
        <div class="flex gap-4 flex-wrap items-center">
          <${Button} variant="primary" size="md">Normal</${Button}>
          <${Button} variant="primary" size="md" disabled=${true}>Disabled</${Button}>
          <${Button} variant="secondary" size="md" disabled=${true}>Disabled Secondary</${Button}>
          <${Button} variant="tertiary" size="md" disabled=${true}>Disabled Tertiary</${Button}>
          <${Button} variant="danger" size="md" disabled=${true}>Disabled Danger</${Button}>
          <${Button} variant="transparent" size="md" disabled=${true}>Disabled Transparent</${Button}>
        </div>
        <div class="mt-4 flex gap-4 flex-wrap items-center">
          <${Button} variant="primary" size="md" loading=${true}>Loading</${Button}>
          <${Button} variant="secondary" size="md" loading=${true}>Loading</${Button}>
          <${Button} variant="tertiary" size="md" loading=${true}>Loading</${Button}>
          <${Button} variant="danger" size="md" loading=${true}>Loading</${Button}>
          <${Button} variant="transparent" size="md" loading=${true}>Loading</${Button}>
        </div>
        <p class="mt-4 text-sm text-gray-500">
          Note: The "Focused" state is activated by clicking or using Tab to navigate with the keyboard
        </p>
      </section>

      <!-- Combinations: Variants and Sizes -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold mb-6">Combinations: Variants and Sizes</h2>
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-4">Primary</h3>
          <div class="flex gap-4 items-center flex-wrap">
            <${Button} variant="primary" size="xxs">XXS</${Button}>
            <${Button} variant="primary" size="xs">XS</${Button}>
            <${Button} variant="primary" size="sm">SM</${Button}>
            <${Button} variant="primary" size="md">MD</${Button}>
            <${Button} variant="primary" size="lg">LG</${Button}>
          </div>
        </div>
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-4">Secondary</h3>
          <div class="flex gap-4 items-center flex-wrap">
            <${Button} variant="secondary" size="xxs">XXS</${Button}>
            <${Button} variant="secondary" size="xs">XS</${Button}>
            <${Button} variant="secondary" size="sm">SM</${Button}>
            <${Button} variant="secondary" size="md">MD</${Button}>
            <${Button} variant="secondary" size="lg">LG</${Button}>
          </div>
        </div>
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-4">Tertiary</h3>
          <div class="flex gap-4 items-center flex-wrap">
            <${Button} variant="tertiary" size="xxs">XXS</${Button}>
            <${Button} variant="tertiary" size="xs">XS</${Button}>
            <${Button} variant="tertiary" size="sm">SM</${Button}>
            <${Button} variant="tertiary" size="md">MD</${Button}>
            <${Button} variant="tertiary" size="lg">LG</${Button}>
          </div>
        </div>
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-4">Danger</h3>
          <div class="flex gap-4 items-center flex-wrap">
            <${Button} variant="danger" size="xxs">XXS</${Button}>
            <${Button} variant="danger" size="xs">XS</${Button}>
            <${Button} variant="danger" size="sm">SM</${Button}>
            <${Button} variant="danger" size="md">MD</${Button}>
            <${Button} variant="danger" size="lg">LG</${Button}>
          </div>
        </div>
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-4">Transparent</h3>
          <div class="flex gap-4 items-center flex-wrap">
            <${Button} variant="transparent" size="xxs">XXS</${Button}>
            <${Button} variant="transparent" size="xs">XS</${Button}>
            <${Button} variant="transparent" size="sm">SM</${Button}>
            <${Button} variant="transparent" size="md">MD</${Button}>
            <${Button} variant="transparent" size="lg">LG</${Button}>
          </div>
        </div>
      </section>

      <!-- Tabs Buttons Variants -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold mb-6">Tabs Buttons Variants</h2>
        <p class="mb-4 text-sm text-gray-600">
          Tab buttons based on Figma design specs. Note: These are styled as navigation tabs, not action buttons.
        </p>

        <!-- Size: Large -->
        <div class="mb-8">
          <h3 class="text-lg font-semibold mb-4">Size: Large</h3>
          
          <!-- States: with secondary label -->
          <div class="mb-4">
            <h4 class="text-md font-medium mb-2 text-gray-700">With Secondary Label (80px)</h4>
            <div class="flex gap-0 border-b border-gray-300">
              <!-- Default -->
              <button
                class="flex flex-col h-[80px] px-[var(--x-x-large,32px)] gap-[var(--tiny,4px)] items-center justify-center shrink-0 relative isolate transition-all duration-200"
                role="tab"
              >
                <div class="flex gap-[4px] items-center justify-center relative w-full z-[5]">
                  <span class="text-[18px] leading-normal overflow-hidden text-ellipsis font-normal text-[var(--text-normal-secondary)]">
                    Default
                  </span>
                </div>
                <span class="text-[14px] font-normal leading-[1.5] overflow-hidden text-ellipsis text-[var(--text-normal-secondary)] z-[4]">
                  Secondary
                </span>
                <div class="absolute bottom-0 left-0 right-0 h-[1px] bg-[var(--border-stroke-default,#d9d9d9)] z-[1]"></div>
              </button>

              <!-- Hover -->
              <button
                class="flex flex-col h-[80px] px-[var(--x-x-large,32px)] gap-[var(--tiny,4px)] items-center justify-center shrink-0 relative isolate transition-all duration-200"
                role="tab"
              >
                <div class="flex gap-[4px] items-center justify-center relative w-full z-[5]">
                  <span class="text-[18px] leading-normal overflow-hidden text-ellipsis font-normal text-[var(--text-normal-primary)]">
                    Hover
                  </span>
                </div>
                <span class="text-[14px] font-normal leading-[1.5] overflow-hidden text-ellipsis text-[var(--text-normal-secondary)] z-[4]">
                  Secondary
                </span>
                <div class="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--border-stroke-darker,#1b1b1b)] z-[2]"></div>
                <div class="absolute bottom-0 left-0 right-0 h-[1px] bg-[var(--border-stroke-default,#d9d9d9)] z-[1]"></div>
              </button>

              <!-- Selected -->
              <button
                class="flex flex-col h-[80px] px-[var(--x-x-large,32px)] gap-[var(--tiny,4px)] items-center justify-center shrink-0 relative isolate transition-all duration-200"
                role="tab"
                aria-selected="true"
              >
                <div class="flex gap-[4px] items-center justify-center relative w-full z-[5]">
                  <span class="text-[18px] leading-normal overflow-hidden text-ellipsis font-bold text-[var(--text-normal-primary)]">
                    Selected
                  </span>
                </div>
                <span class="text-[14px] font-normal leading-[1.5] overflow-hidden text-ellipsis text-[var(--text-normal-secondary)] z-[4]">
                  Secondary
                </span>
                <div class="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--border-accent-positive,#1ea93c)] z-[2]"></div>
                <div class="absolute bottom-0 left-0 right-0 h-[1px] bg-[var(--border-stroke-default,#d9d9d9)] z-[1]"></div>
              </button>
            </div>
          </div>

          <!-- States: without secondary label -->
          <div class="mb-4">
            <h4 class="text-md font-medium mb-2 text-gray-700">Without Secondary Label (48px)</h4>
            <div class="flex gap-0 border-b border-gray-300">
              <!-- Default -->
              <button
                class="flex flex-col h-[48px] px-[var(--x-x-large,32px)] gap-[var(--tiny,4px)] items-center justify-center shrink-0 relative isolate transition-all duration-200"
                role="tab"
              >
                <div class="flex gap-[4px] items-center justify-center relative w-full z-[4]">
                  <span class="text-[18px] leading-normal overflow-hidden text-ellipsis font-normal text-[var(--text-normal-secondary)]">
                    Default
                  </span>
                </div>
                <div class="absolute bottom-0 left-0 right-0 h-[1px] bg-[var(--border-stroke-default,#d9d9d9)] z-[1]"></div>
              </button>

              <!-- Hover -->
              <button
                class="flex flex-col h-[48px] px-[var(--x-x-large,32px)] gap-[var(--tiny,4px)] items-center justify-center shrink-0 relative isolate transition-all duration-200"
                role="tab"
              >
                <div class="flex gap-[4px] items-center justify-center relative w-full z-[4]">
                  <span class="text-[18px] leading-normal overflow-hidden text-ellipsis font-normal text-[var(--text-normal-primary)]">
                    Hover
                  </span>
                </div>
                <div class="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--border-stroke-darker,#1b1b1b)] z-[2]"></div>
                <div class="absolute bottom-0 left-0 right-0 h-[1px] bg-[var(--border-stroke-default,#d9d9d9)] z-[1]"></div>
              </button>

              <!-- Selected -->
              <button
                class="flex flex-col h-[48px] px-[var(--x-x-large,32px)] gap-[var(--tiny,4px)] items-center justify-center shrink-0 relative isolate transition-all duration-200"
                role="tab"
                aria-selected="true"
              >
                <div class="flex gap-[4px] items-center justify-center relative w-full z-[4]">
                  <span class="text-[18px] leading-normal overflow-hidden text-ellipsis font-bold text-[var(--text-normal-primary)]">
                    Selected
                  </span>
                </div>
                <div class="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--border-accent-positive,#1ea93c)] z-[2]"></div>
                <div class="absolute bottom-0 left-0 right-0 h-[1px] bg-[var(--border-stroke-default,#d9d9d9)] z-[1]"></div>
              </button>
            </div>
          </div>
        </div>

        <!-- Size: Small -->
        <div class="mb-8">
          <h3 class="text-lg font-semibold mb-4">Size: Small</h3>
          
          <!-- States: with secondary label -->
          <div class="mb-4">
            <h4 class="text-md font-medium mb-2 text-gray-700">With Secondary Label (64px)</h4>
            <div class="flex gap-0 border-b border-gray-300">
              <!-- Default -->
              <button
                class="flex flex-col h-[64px] px-[var(--x-large,24px)] gap-[var(--tiny,4px)] items-center justify-center shrink-0 relative isolate transition-all duration-200"
                role="tab"
              >
                <div class="flex gap-[4px] items-center justify-center relative w-full z-[5]">
                  <span class="text-[16px] leading-normal overflow-hidden text-ellipsis font-normal text-[var(--text-normal-secondary)]">
                    Default
                  </span>
                </div>
                <span class="text-[14px] font-normal leading-[1.5] overflow-hidden text-ellipsis text-[var(--text-normal-secondary)] z-[4]">
                  Secondary
                </span>
                <div class="absolute bottom-0 left-0 right-0 h-[1px] bg-[var(--border-stroke-default,#d9d9d9)] z-[1]"></div>
              </button>

              <!-- Hover -->
              <button
                class="flex flex-col h-[64px] px-[var(--x-large,24px)] gap-[var(--tiny,4px)] items-center justify-center shrink-0 relative isolate transition-all duration-200"
                role="tab"
              >
                <div class="flex gap-[4px] items-center justify-center relative w-full z-[5]">
                  <span class="text-[16px] leading-normal overflow-hidden text-ellipsis font-normal text-[var(--text-normal-primary)]">
                    Hover
                  </span>
                </div>
                <span class="text-[14px] font-normal leading-[1.5] overflow-hidden text-ellipsis text-[var(--text-normal-secondary)] z-[4]">
                  Secondary
                </span>
                <div class="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--border-stroke-darker,#1b1b1b)] z-[2]"></div>
                <div class="absolute bottom-0 left-0 right-0 h-[1px] bg-[var(--border-stroke-default,#d9d9d9)] z-[1]"></div>
              </button>

              <!-- Selected -->
              <button
                class="flex flex-col h-[64px] px-[var(--x-large,24px)] gap-[var(--tiny,4px)] items-center justify-center shrink-0 relative isolate transition-all duration-200"
                role="tab"
                aria-selected="true"
              >
                <div class="flex gap-[4px] items-center justify-center relative w-full z-[5]">
                  <span class="text-[16px] leading-normal overflow-hidden text-ellipsis font-bold text-[var(--text-normal-primary)]">
                    Selected
                  </span>
                </div>
                <span class="text-[14px] font-normal leading-[1.5] overflow-hidden text-ellipsis text-[var(--text-normal-secondary)] z-[4]">
                  Secondary
                </span>
                <div class="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--border-accent-positive,#1ea93c)] z-[2]"></div>
                <div class="absolute bottom-0 left-0 right-0 h-[1px] bg-[var(--border-stroke-default,#d9d9d9)] z-[1]"></div>
              </button>
            </div>
          </div>

          <!-- States: without secondary label -->
          <div class="mb-4">
            <h4 class="text-md font-medium mb-2 text-gray-700">Without Secondary Label (44px)</h4>
            <div class="flex gap-0 border-b border-gray-300">
              <!-- Default -->
              <button
                class="flex flex-col h-[44px] px-[var(--x-large,24px)] gap-[var(--tiny,4px)] items-center justify-center shrink-0 relative isolate transition-all duration-200"
                role="tab"
              >
                <div class="flex gap-[4px] items-center justify-center relative w-full z-[3]">
                  <span class="text-[16px] leading-normal overflow-hidden text-ellipsis font-normal text-[var(--text-normal-secondary)]">
                    Default
                  </span>
                </div>
                <div class="absolute bottom-0 left-0 right-0 h-[1px] bg-[var(--border-stroke-default,#d9d9d9)] z-[1]"></div>
              </button>

              <!-- Hover -->
              <button
                class="flex flex-col h-[44px] px-[var(--x-large,24px)] gap-[var(--tiny,4px)] items-center justify-center shrink-0 relative isolate transition-all duration-200"
                role="tab"
              >
                <div class="flex gap-[4px] items-center justify-center relative w-full z-[3]">
                  <span class="text-[16px] leading-normal overflow-hidden text-ellipsis font-normal text-[var(--text-normal-primary)]">
                    Hover
                  </span>
                </div>
                <div class="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--border-stroke-darker,#1b1b1b)] z-[2]"></div>
                <div class="absolute bottom-0 left-0 right-0 h-[1px] bg-[var(--border-stroke-default,#d9d9d9)] z-[1]"></div>
              </button>

              <!-- Selected -->
              <button
                class="flex flex-col h-[44px] px-[var(--x-large,24px)] gap-[var(--tiny,4px)] items-center justify-center shrink-0 relative isolate transition-all duration-200"
                role="tab"
                aria-selected="true"
              >
                <div class="flex gap-[4px] items-center justify-center relative w-full z-[3]">
                  <span class="text-[16px] leading-normal overflow-hidden text-ellipsis font-bold text-[var(--text-normal-primary)]">
                    Selected
                  </span>
                </div>
                <div class="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--border-accent-positive,#1ea93c)] z-[2]"></div>
                <div class="absolute bottom-0 left-0 right-0 h-[1px] bg-[var(--border-stroke-default,#d9d9d9)] z-[1]"></div>
              </button>
            </div>
          </div>
        </div>

        <p class="text-sm text-gray-500">
          Tab indicators: Green (#1ea93c) for selected, Black (#1b1b1b) for hover, No indicator for default state.
          <br><strong>Note:</strong> Tab heights vary based on secondary label presence: 
          Large (80px with / 48px without), Small (64px with / 44px without).
        </p>
      </section>

      <!-- Interactive Tabs Example -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold mb-6">Interactive Tabs - Cliente Example</h2>
        <p class="mb-4 text-sm text-gray-600">
          Ejemplo funcional de tabs con contenido de acordeón interactivo.
        </p>
        <${InteractiveTabs} />
      </section>

    </div>
  `;

/**
 * InteractiveTabs - Functional tabs example with accordion content
 */
const InteractiveTabs = () => {
  const [activeTab, setActiveTab] = useState(0);
  
  const tabs = [
    {
      label: 'Información General',
      secondary: 'Cliente',
      content: html`
        <div class="p-6">
          <h3 class="text-lg font-bold mb-4">Información General del Cliente</h3>
          <p class="mb-4 text-gray-700">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>
          <${Accordion} title="Datos Personales">
            <p class="text-gray-600">
              Nombre completo, documento de identidad, fecha de nacimiento, nacionalidad, género, estado civil.
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
            </p>
          </${Accordion}>
          <${Accordion} title="Contacto">
            <p class="text-gray-600">
              Teléfono, email, dirección de residencia, ciudad, país, código postal.
              Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
          </${Accordion}>
        </div>
      `,
    },
    {
      label: 'Historial',
      secondary: 'Vuelos',
      content: html`
        <div class="p-6">
          <h3 class="text-lg font-bold mb-4">Historial de Vuelos</h3>
          <p class="mb-4 text-gray-700">
            Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, 
            totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
          </p>
          <${Accordion} title="Vuelos Nacionales">
            <p class="text-gray-600">
              Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores 
              eos qui ratione voluptatem sequi nesciunt. Total de vuelos: 24 vuelos realizados en el último año.
            </p>
          </${Accordion}>
          <${Accordion} title="Vuelos Internacionales">
            <p class="text-gray-600">
              Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, 
              sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.
            </p>
          </${Accordion}>
        </div>
      `,
    },
    {
      label: 'Preferencias',
      secondary: 'Configuración',
      content: html`
        <div class="p-6">
          <h3 class="text-lg font-bold mb-4">Preferencias del Cliente</h3>
          <p class="mb-4 text-gray-700">
            At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti 
            quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.
          </p>
          <${Accordion} title="Asiento Preferido">
            <p class="text-gray-600">
              Similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. 
              Preferencias: Ventana, pasillo, filas adelante, espacio extra para piernas.
            </p>
          </${Accordion}>
          <${Accordion} title="Servicios Adicionales">
            <p class="text-gray-600">
              Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio 
              cumque nihil impedit quo minus id quod maxime placeat facere possimus. Comidas especiales, equipaje adicional, prioridad de abordaje.
            </p>
          </${Accordion}>
        </div>
      `,
    },
  ];

  return html`
    <div class="border border-gray-200 rounded-lg overflow-hidden">
      <!-- Tabs Navigation -->
      <div class="flex gap-0 border-b border-gray-300 bg-white">
        ${tabs.map((tab, index) => {
          const isActive = activeTab === index;
          return html`
            <button
              class="flex flex-col h-[80px] px-[var(--x-x-large,32px)] gap-[var(--tiny,4px)] items-center justify-center shrink-0 relative isolate transition-all duration-200 hover:bg-gray-50"
              role="tab"
              aria-selected=${isActive}
              onClick=${() => setActiveTab(index)}
            >
              <div class="flex gap-[4px] items-center justify-center relative w-full z-[5]">
                <span class=${`text-[18px] leading-normal overflow-hidden text-ellipsis ${
                  isActive ? 'font-bold text-[var(--text-normal-primary)]' : 'font-normal text-[var(--text-normal-secondary)]'
                }`}>
                  ${tab.label}
                </span>
              </div>
              <span class="text-[14px] font-normal leading-[1.5] overflow-hidden text-ellipsis text-[var(--text-normal-secondary)] z-[4]">
                ${tab.secondary}
              </span>
              ${isActive && html`
                <div class="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--border-accent-positive,#1ea93c)] z-[2]"></div>
              `}
              <div class="absolute bottom-0 left-0 right-0 h-[1px] bg-[var(--border-stroke-default,#d9d9d9)] z-[1]"></div>
            </button>
          `;
        })}
      </div>
      
      <!-- Tab Content -->
      <div class="bg-gray-50">
        ${tabs[activeTab].content}
      </div>
    </div>
  `;
};

/**
 * Accordion - Simple collapsible accordion component
 */
const Accordion = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return html`
    <div class="mb-3 border border-gray-200 rounded-lg bg-white overflow-hidden">
      <button
        class="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
        onClick=${() => setIsOpen(!isOpen)}
      >
        <span class="font-semibold text-gray-900">${title}</span>
        <span class=${`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      ${isOpen && html`
        <div class="p-4 pt-0 border-t border-gray-100">
          ${children}
        </div>
      `}
    </div>
  `;
};

export default ButtonSample;
