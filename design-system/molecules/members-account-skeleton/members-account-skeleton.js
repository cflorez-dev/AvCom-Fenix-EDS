import { h } from '@dropins/tools/preact.js';
import htm from 'htm';

const html = htm.bind(h);

/**
 * MembersAccountSkeleton — placeholder de carga de la página "Gestión de mi
 * cuenta" (1279360). Estado de carga post-auth: la cortina `members-gate-pending`
 * cubre el anti-flash de auth; este skeleton se muestra DENTRO de la página
 * mientras sesión/config/i18n resuelven.
 *
 * Reglas (mismas del lote elite, contexto §A): el header global y el footer NO se
 * esqueletonizan; el MemberHeader de la página se esqueletoniza por partes con la
 * **balance box como un único bloque sólido**; el toggle de tabs va **centrado**.
 * No existen skeletons en el diseño (0 hits, §A) → se reusa el patrón elite.
 *
 * Estructura (decisión del plan): franja header (~193px desktop / ~242px mobile)
 * + pill de tabs centrada (44px) + **slot torta** (franja reservada del banner de
 * completitud, respuesta P6 — 1279361 monta el real) + 2 cards de contenido.
 *
 * ## A11y
 * El consumidor (organism `MembersAccount`) envuelve el skeleton con
 * `role="status" aria-live="polite" aria-busy="true"` + texto sr-only. Esta
 * molecule NO repite esos roles; solo expone `data-name` para query/test.
 *
 * ## Props
 * @param {Object} props
 * @param {string} [props.customClassName=''] - clases extra para el root.
 */
export const MembersAccountSkeleton = ({ customClassName = '' } = {}) => {
  const sk = (cls = '') => html`
    <span class=${`block bg-[#e9e9e9] animate-pulse ${cls}`} aria-hidden="true"></span>
  `;

  // Header área = MemberHeader esqueletonizado por partes. Fondo `#d5d5d5` (el
  // header real es un gradiente por tier aún desconocido en cold load). La balance
  // box es UN bloque sólido único (regla §A). Alto ~242px mobile / ~193px desktop.
  const heroArea = html`
    <div class="rounded-2xl bg-[#d5d5d5] p-4 md:p-6 lg:p-8 min-h-[242px] md:min-h-[193px] flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div class="flex flex-col gap-4 min-w-0">
        ${/* Breadcrumb + saludo + línea tier. */ ''}
        ${sk('h-3 w-[200px] md:w-[280px] rounded-[4px]')}
        ${sk('h-6 w-[160px] md:w-[200px] rounded-[6px]')}
        ${sk('h-4 w-[140px] rounded-[4px]')}
      </div>
      ${/* Balance box: bloque sólido único (no se desglosa). */ ''}
      ${sk('h-[92px] w-full md:w-[300px] rounded-2xl shrink-0')}
    </div>
  `;

  // Toggle Datos|Pagos|Ajustes centrado (matchea el SegmentedControl md = 44px).
  const toggle = html`
    <div class="flex justify-center">${sk('h-[44px] w-[280px] rounded-full')}</div>
  `;

  // Slot torta: franja reservada del banner de completitud (respuesta P6). El
  // banner real (donut + checklist) lo monta 1279361; acá solo la reserva de
  // espacio (~131px de alto, ancho del contenedor).
  const donutSlot = html`
    ${sk('h-[131px] w-full rounded-2xl')}
  `;

  // 2 cards de contenido (el panel activo lo llenan 1279361/62/63).
  const contentCards = html`
    <div class="flex flex-col gap-4">
      ${[0, 1].map((i) => html`
        <div key=${i} class="rounded-2xl border border-[#e9e9e9] p-4 md:p-6 flex flex-col gap-4">
          <div class="flex items-center justify-between">
            ${sk('h-4 w-[180px] rounded-[4px]')}
            ${sk('h-5 w-5 rounded-[4px] shrink-0')}
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            ${[0, 1, 2].map((j) => html`
              <div key=${j} class="flex flex-col gap-2">
                ${sk('h-3 w-[60%] rounded-[4px]')}
                ${sk('h-4 w-[80%] rounded-[4px]')}
              </div>
            `)}
          </div>
        </div>
      `)}
    </div>
  `;

  return html`
    <div
      class=${`flex flex-col gap-6 lg:gap-8 ${customClassName}`.trim()}
      data-name="members-account-skeleton"
    >
      ${heroArea}
      ${toggle}
      ${donutSlot}
      ${contentCards}
    </div>
  `;
};

export default MembersAccountSkeleton;
