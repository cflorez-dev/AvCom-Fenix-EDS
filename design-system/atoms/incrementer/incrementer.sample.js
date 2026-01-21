import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Incrementer } from './incrementer.js';

const html = htm.bind(h);

/**
 * IncrementerSample - Showcase de Incrementer
 */
export const IncrementerSample = () => {
  const [value1, setValue1] = useState(0);
  const [value2, setValue2] = useState(1);
  const [value3, setValue3] = useState(5);

  return html`
    <div class="flex flex-col gap-[var(--spacing-x-x-large)] p-[var(--spacing-x-large)]">
      <!-- Header -->
      <div>
        <h1 class="text-[var(--heading-h600-size)] font-[var(--heading-h600-weight)] text-[var(--text-normal-primary)] mb-[var(--spacing-small)]">
          Incrementer Component
        </h1>
        <p class="text-[var(--paragraph-p300-size)] text-[var(--text-normal-secondary)]">
          Control numérico con botones de incrementar/decrementar
        </p>
      </div>

      <!-- Default Usage -->
      <section>
        <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-medium)] text-[var(--text-normal-primary)]">
          Uso Básico (0-10)
        </h2>
        <div class="flex items-center gap-[var(--spacing-medium)]">
          <${Incrementer}
            value=${value1}
            min=${0}
            max=${10}
            onChange=${setValue1}
            label="Cantidad"
          />
          <span class="text-[var(--paragraph-p200-size)] text-[var(--text-normal-secondary)]">
            Valor actual: <strong>${value1}</strong>
          </span>
        </div>
      </section>

      <!-- With Min 1 -->
      <section>
        <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-medium)] text-[var(--text-normal-primary)]">
          Con Mínimo 1 (Adultos)
        </h2>
        <div class="flex items-center gap-[var(--spacing-medium)]">
          <${Incrementer}
            value=${value2}
            min=${1}
            max=${9}
            onChange=${setValue2}
            label="Adultos"
          />
          <span class="text-[var(--paragraph-p200-size)] text-[var(--text-normal-secondary)]">
            Adultos: <strong>${value2}</strong>
          </span>
        </div>
      </section>

      <!-- Multiple Incrementers -->
      <section>
        <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-medium)] text-[var(--text-normal-primary)]">
          Múltiples Incrementers (Pasajeros)
        </h2>
        <div class="flex flex-col gap-[var(--spacing-medium)] max-w-md">
          <div class="flex justify-between items-center">
            <div class="flex flex-col">
              <span class="text-[var(--paragraph-p300-size)] font-bold">Adultos</span>
              <span class="text-[var(--paragraph-p200-size)] text-[var(--text-normal-secondary)]">12+ años</span>
            </div>
            <${Incrementer}
              value=${1}
              min=${1}
              max=${9}
              onChange=${() => {}}
              label="Adultos"
            />
          </div>

          <div class="flex justify-between items-center">
            <div class="flex flex-col">
              <span class="text-[var(--paragraph-p300-size)] font-bold">Jóvenes</span>
              <span class="text-[var(--paragraph-p200-size)] text-[var(--text-normal-secondary)]">12-17 años</span>
            </div>
            <${Incrementer}
              value=${0}
              min=${0}
              max=${8}
              onChange=${() => {}}
              label="Jóvenes"
            />
          </div>

          <div class="flex justify-between items-center">
            <div class="flex flex-col">
              <span class="text-[var(--paragraph-p300-size)] font-bold">Niños</span>
              <span class="text-[var(--paragraph-p200-size)] text-[var(--text-normal-secondary)]">2-11 años</span>
            </div>
            <${Incrementer}
              value=${0}
              min=${0}
              max=${8}
              onChange=${() => {}}
              label="Niños"
            />
          </div>

          <div class="flex justify-between items-center">
            <div class="flex flex-col">
              <span class="text-[var(--paragraph-p300-size)] font-bold">Infantes</span>
              <span class="text-[var(--paragraph-p200-size)] text-[var(--text-normal-secondary)]">0-2 años</span>
            </div>
            <${Incrementer}
              value=${0}
              min=${0}
              max=${2}
              onChange=${() => {}}
              label="Infantes"
            />
          </div>
        </div>
      </section>
    </div>
  `;
};

export default IncrementerSample;
