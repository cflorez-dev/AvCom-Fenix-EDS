import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { Chip } from './chip.js';

const html = htm.bind(h);

/**
 * ChipSample - Chip component showcase
 * Shows all available variants according to Figma design
 */
export const ChipSample = () => html`
    <div class="p-10 max-w-[75rem] mx-auto">
      <h1 class="text-2xl font-bold mb-6">
        Chip Component Examples
      </h1>
      
      <section class="mb-6">
        <h2 class="text-xl font-bold mb-4">
          Variante Lifemiles
        </h2>
        <div class="flex gap-4 flex-wrap items-center">
          <${Chip} variant="lifemiles">
            Acumula millas
          </${Chip}>
          <${Chip} variant="lifemiles" >
            Acumula millas
          </${Chip}>
        </div>
      </section>

      <section class="mb-6">
        <h2 class="text-xl font-bold mb-4">
          Discount Variant
        </h2>
        <div class="flex gap-4 flex-wrap items-center">
          <${Chip} variant="discount">
            -24%
          </${Chip}>
          <${Chip} variant="discount">
            -50%
          </${Chip}>
          <${Chip} variant="discount">
            -15%
          </${Chip}>
        </div>
      </section>

      <section class="mb-6">
        <h2 class="text-xl font-bold mb-4">
          Dark Variant
        </h2>
        <div class="flex gap-4 flex-wrap items-center">
          <${Chip} variant="dark">
            Nuevo
          </${Chip}>
          <${Chip} variant="dark">
            Destacado
          </${Chip}>
          <${Chip} variant="dark">
            Especial
          </${Chip}>
        </div>
      </section>

      <section class="mb-6">
        <h2 class="text-xl font-bold mb-4">
          Alert Variant
        </h2>
        <div class="flex gap-4 flex-wrap items-center">
          <${Chip} variant="alert">
            Urgente
          </${Chip}>
          <${Chip} variant="alert">
            Importante
          </${Chip}>
          <${Chip} variant="alert">
            Alerta
          </${Chip}>
        </div>
      </section>

      <section class="mb-6">
        <h2 class="text-xl font-bold mb-4">
          White Variant
        </h2>
        <div class="flex gap-4 flex-wrap items-center">
          <${Chip} variant="white">
            Oferta
          </${Chip}>
          <${Chip} variant="white">
            Promoción
          </${Chip}>
          <${Chip} variant="white">
            Especial
          </${Chip}>
        </div>
      </section>

      <section class="mb-6">
        <h2 class="text-xl font-bold mb-4">
          Control Variant (Destination Counter)
        </h2>
        <div class="flex gap-4 flex-wrap items-center bg-gray-100 p-4 rounded-lg">
          <${Chip} variant="control">
            24 ciudades
          </${Chip}>
          <${Chip} variant="control">
            14 ciudades
          </${Chip}>
          <${Chip} variant="control">
            8 destinos
          </${Chip}>
        </div>
      </section>

      <section class="mb-6">
        <h2 class="text-xl font-bold mb-4">
          Usage Examples
        </h2>
        <div class="flex gap-4 flex-wrap items-center">
          <${Chip} variant="lifemiles">
            Acumula millas
          </${Chip}>
          <${Chip} variant="discount">
            -24%
          </${Chip}>
          <${Chip} variant="dark">
            Nuevo
          </${Chip}>
          <${Chip} variant="alert">
            Urgente
          </${Chip}>
          <${Chip} variant="white">
            Oferta
          </${Chip}>
          <${Chip} variant="control">
            24 ciudades
          </${Chip}>
        </div>
      </section>
    </div>
  `;

export default ChipSample;
