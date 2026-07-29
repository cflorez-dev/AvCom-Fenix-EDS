import { h } from '@dropins/tools/preact.js';
import htm from 'htm';

const html = htm.bind(h);

/**
 * MembersEliteSkeleton — placeholder de carga de la página "Progreso Elite y
 * beneficios" (1271689), por variante de tab. Es el estado de carga de datos
 * post-auth (decisión T13): la cortina `members-gate-pending` cubre el
 * anti-flash de auth; este skeleton se muestra DENTRO de la página mientras
 * sesión/config/wrappers resuelven.
 *
 * Reglas (contexto-figma §E, nodos Figma 883-*):
 *  - El **header global del sitio y el footer NO se esqueletonizan** (los pinta
 *    el layout de página, fuera de este bloque).
 *  - El MemberHeader de la página SÍ se esqueletoniza por partes (barras para
 *    breadcrumb / saludo / tier), con la **balance box como un único bloque
 *    sólido** (full-width en mobile, a la derecha en desktop).
 *  - El toggle Progreso|Beneficios va **centrado** (todos los mocks).
 *  - El contenido de cada tab replica su layout final con barras grises y
 *    `animate-pulse` (mismo idiom que `members-hero-skeleton`).
 *
 * Variantes:
 *  - `progress` (883:51578/51648): hero + toggle + card [meta-header + título/
 *    sub-selector + 2 filas de progreso] + acordeón colapsado.
 *  - `benefits` (883:51861/52063): hero + toggle + 3 cards (1 expandida + 2
 *    colapsadas en mobile, fila de 3 en desktop) + banner + 2 botones + módulo
 *    cobrand + plancard.
 *
 * ## A11y
 * El consumidor (organism `MembersElite`) envuelve el skeleton con
 * `role="status" aria-live="polite" aria-busy="true"` + texto sr-only con el
 * label de carga. Esta molecule NO repite esos roles (evita anuncios duplicados);
 * solo expone `data-name`/`data-tab` para query/test.
 *
 * ## Props
 * @param {Object} props
 * @param {'progress'|'benefits'} [props.tab='progress'] - variante a esqueletonizar.
 * @param {string} [props.customClassName=''] - clases extra para el root.
 */
export const MembersEliteSkeleton = ({ tab = 'progress', customClassName = '' } = {}) => {
  const sk = (cls = '') => html`
    <span class=${`block bg-[#e9e9e9] animate-pulse ${cls}`} aria-hidden="true"></span>
  `;

  // Hero área = MemberHeader esqueletonizado por partes. Fondo `#d5d5d5` (el
  // header real es un gradiente por tier aún desconocido en cold load). La
  // balance box es UN bloque sólido único (regla §E).
  const heroArea = html`
    <div class="rounded-2xl bg-[#d5d5d5] p-4 md:p-6 lg:p-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div class="flex flex-col gap-4 min-w-0">
        ${sk('h-3 w-[180px] md:w-[240px] rounded-[4px]')}
        ${sk('h-6 w-[160px] md:w-[200px] rounded-[6px]')}
        ${sk('h-4 w-[140px] rounded-[4px]')}
      </div>
      ${/* Balance box: bloque sólido único (no se desglosa). */ ''}
      ${sk('h-[92px] w-full md:w-[300px] rounded-2xl shrink-0')}
    </div>
  `;

  // Toggle Progreso|Beneficios centrado (matchea el SegmentedControl md = 44px).
  const toggle = html`
    <div class="flex justify-center">${sk('h-[44px] w-[240px] rounded-full')}</div>
  `;

  // Progreso: card [meta-header + título/sub-selector + 2 filas] + acordeón.
  const progressContent = html`
    <div class="flex flex-col gap-4">
      <div class="rounded-2xl border border-[#e9e9e9] p-4 md:p-6 flex flex-col gap-6">
        ${/* Meta header: ícono + 2 líneas (Figma 883:51578/51648). */ ''}
        <div class="flex items-start gap-3">
          ${sk('h-8 w-8 rounded-[6px] shrink-0')}
          <div class="flex flex-col gap-2 flex-1">
            ${sk('h-4 w-[60%] rounded-[4px]')}
            ${sk('h-3 w-[85%] rounded-[4px]')}
          </div>
        </div>
        ${/* Título "Progreso elite en {año}" + sub-selector Detalle|Vista completa. */ ''}
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-t border-[#e9e9e9] pt-6">
          ${sk('h-4 w-[160px] rounded-[4px]')}
          ${sk('h-[36px] w-[240px] rounded-full')}
        </div>
        ${/* 2 filas de progreso (texto|barra). */ ''}
        ${[0, 1].map((i) => html`
          <div key=${i} class="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
            <div class="flex flex-col gap-2 md:w-1/2">
              ${sk('h-4 w-[70%] rounded-[4px]')}
              ${sk('h-3 w-[40%] rounded-[4px]')}
            </div>
            ${sk('h-4 w-full md:w-1/2 rounded-full')}
          </div>
        `)}
      </div>
      ${/* Acordeón "Cómo ganar millas" colapsado (una fila + chevron). */ ''}
      <div class="rounded-2xl border border-[#e9e9e9] p-4 md:p-6 flex items-center justify-between">
        ${sk('h-4 w-[220px] rounded-[4px]')}
        ${sk('h-5 w-5 rounded-[4px] shrink-0')}
      </div>
    </div>
  `;

  // Beneficios: 3 cards + banner info + 2 botones + módulo cobrand + plancard.
  const benefitsContent = html`
    <div class="flex flex-col gap-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        ${sk('h-[220px] md:h-[260px] rounded-2xl')}
        ${sk('h-[64px] md:h-[260px] rounded-2xl')}
        ${sk('h-[64px] md:h-[260px] rounded-2xl')}
      </div>
      ${/* Banner info "Tus beneficios pueden estar disponibles…". */ ''}
      ${sk('h-[56px] w-full rounded-2xl')}
      ${/* Botones "Conoce todos los beneficios" / "Términos y condiciones". */ ''}
      <div class="flex flex-col gap-3 md:flex-row">
        ${sk('h-[40px] w-full md:w-[200px] rounded-full')}
        ${sk('h-[40px] w-full md:w-[200px] rounded-full')}
      </div>
      ${/* Módulo cobrand: imagen + paginación + panel de beneficios. */ ''}
      <div class="rounded-2xl border border-[#e9e9e9] p-4 md:p-6 flex flex-col gap-4 md:flex-row md:gap-8">
        <div class="flex flex-col gap-3 md:w-1/3">
          ${sk('h-[120px] w-full rounded-xl')}
          <div class="flex gap-2">
            ${sk('h-3 w-3 rounded-full')}
            ${sk('h-3 w-6 rounded-full')}
            ${sk('h-3 w-3 rounded-full')}
          </div>
        </div>
        <div class="flex flex-col gap-3 flex-1">
          ${[0, 1, 2].map((i) => html`
            <div key=${i} class="flex items-center justify-between gap-4">
              ${sk('h-4 w-[45%] rounded-[4px]')}
              ${sk('h-4 w-[20%] rounded-full')}
            </div>
          `)}
        </div>
      </div>
      ${/* PlanCard Lifemiles Plus. */ ''}
      ${sk('h-[220px] w-full rounded-2xl')}
    </div>
  `;

  return html`
    <div
      class=${`flex flex-col gap-6 lg:gap-8 ${customClassName}`}
      data-name="members-elite-skeleton"
      data-tab=${tab}
    >
      ${heroArea}
      ${toggle}
      ${tab === 'benefits' ? benefitsContent : progressContent}
    </div>
  `;
};

export default MembersEliteSkeleton;
