import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { MembersEliteSkeleton } from './members-elite-skeleton.js';

const html = htm.bind(h);

/**
 * Showcase del skeleton de la página elite, ambas variantes (progress /
 * benefits). Verificar en mobile y desktop (resize): en Progreso la card tiene
 * 2 filas + acordeón; en Beneficios las 3 cards pasan de apiladas (1 expandida +
 * 2 colapsadas) a fila de 3 en desktop. El `animate-pulse` es utilidad de
 * Tailwind (ya compilada en `tw.css`), no requiere `<style>` inline.
 */
export const MembersEliteSkeletonSample = () => html`
  <section class="p-10 max-w-[75rem] mx-auto flex flex-col gap-10">
    <h1 class="text-2xl font-bold">MembersEliteSkeleton</h1>

    <div class="flex flex-col gap-3">
      <h2 class="text-xl font-bold">Variante Progreso</h2>
      <${MembersEliteSkeleton} tab="progress" />
    </div>

    <div class="flex flex-col gap-3">
      <h2 class="text-xl font-bold">Variante Beneficios</h2>
      <${MembersEliteSkeleton} tab="benefits" />
    </div>
  </section>
`;

export default MembersEliteSkeletonSample;
